"""
Document processing service with MongoDB vector storage.

`sentence_transformers` (and its Torch backend) is imported lazily inside
`get_embedder()` so that anything that only needs `process_document` at import
time — retries, notes, tests — can load without pulling in Torch. The actual
model is still created once and reused thereafter.
"""
import hashlib
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

from app.core.config import settings
from app.services.documents import chunk_document, chunk_text_legacy, extract_document
from database.mongodb_connection import (
    save_document,
    save_document_embeddings,
    mark_document_processed,
    get_db,
    _lecture_id_filter,
)

logger = logging.getLogger(__name__)

# Global embedder (lazy loaded on first use)
_embedder = None


def _file_hash(file_path: str) -> str:
    """SHA-256 of the raw file so re-uploads of identical content dedupe."""
    digest = hashlib.sha256()
    with open(file_path, "rb") as handle:
        for block in iter(lambda: handle.read(65536), b""):
            digest.update(block)
    return digest.hexdigest()


async def create_pending_document(file_path: str, lecture_id: str, filename: str) -> Tuple[str, bool]:
    """Create (or reuse) a document row and return (document_id, already_ready).

    Reuses an existing ready document with identical content in the same lecture
    so uploading the same PDF twice does not re-embed it."""
    file_type = Path(file_path).suffix.lower().lstrip(".")
    content_hash = _file_hash(file_path)
    db = get_db()
    existing = await db.documents.find_one(
        {"lecture_id": lecture_id, "content_hash": content_hash, "status": "ready"},
        {"_id": 1},
    )
    if existing:
        return str(existing["_id"]), True
    document_id = await save_document(
        lecture_id=lecture_id,
        filename=filename,
        file_type=file_type,
        file_path=str(file_path),
        content="",
        content_hash=content_hash,
    )
    return document_id, False


def get_embedder():
    """Get or create the sentence transformer model.

    The heavy import is deferred so that importing this module does not require
    Torch to be installed — matters for local dev on Windows and for tests that
    don't touch retrieval.
    """
    global _embedder
    if _embedder is None:
        from sentence_transformers import SentenceTransformer  # noqa: WPS433 (lazy)

        _embedder = SentenceTransformer(settings.EMBEDDING_MODEL)
    return _embedder

async def process_document(
    file_path: str,
    lecture_id: str,
    filename: str,
    *,
    document_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Process a document and store in MongoDB with embeddings.

    Args:
        file_path: Path to the document file
        lecture_id: ID of the lecture this document belongs to
        filename: Original filename
        document_id: When provided, process an already-created (pending) row so
            the upload endpoint can return immediately and the client can poll
            status. When None, a new document row is created here.

    Returns:
        Dict with document_id, chunk_count, and status
    """
    logger.info("Processing document: %s", filename)

    async def _fail(message: str) -> Dict[str, Any]:
        """Mark the owned row failed (if any) and return a failure result."""
        if document_id:
            try:
                await mark_document_processed(document_id, status="failed", error=message)
            except Exception:  # pragma: no cover — defensive
                logger.exception("Could not mark document %s failed", document_id)
        return {"success": False, "document_id": document_id, "error": message}

    # Extract structural units before creating the document row.
    file_ext = Path(file_path).suffix.lower()
    if document_id:
        await mark_document_processed(document_id, status="extracting")
    try:
        extracted = extract_document(file_path)
    except ValueError:
        return await _fail(f"Unsupported file type: {file_ext}")
    except Exception as exc:
        return await _fail(f"Could not extract document: {exc}")

    text = extracted.text
    file_type = extracted.file_type

    if not text or len(text.strip()) < 50:
        return await _fail("No text extracted or text too short")

    logger.info("Extracted %d characters from %s", len(text), filename)

    # Persist the extracted text. Either create a new row or fill in the
    # pending one created by the upload endpoint.
    if document_id is None:
        document_id = await save_document(
            lecture_id=lecture_id,
            filename=filename,
            file_type=file_type,
            file_path=file_path,
            content=text,
            page_count=extracted.page_count,
            slide_count=extracted.slide_count,
        )
    else:
        await get_db().documents.update_one(
            {"_id": _lecture_id_filter(document_id)},
            {"$set": {
                "content": text,
                "file_type": file_type,
                "page_count": extracted.page_count,
                "slide_count": extracted.slide_count,
            }},
        )

    # Everything from this point owns the document row; any failure must mark it
    # `failed` so the retry endpoint can surface it and the UI does not spin.
    try:
        await mark_document_processed(document_id, status="chunking")
        if settings.DOCUMENT_CHUNKER == "legacy":
            chunks = chunk_text_legacy(text)
            structured_chunks: List[Any] = [None] * len(chunks)
        else:
            structured_chunks = chunk_document(extracted)
            chunks = [chunk.text for chunk in structured_chunks]
        print(f"✅ Created {len(chunks)} chunks")

        await mark_document_processed(document_id, status="embedding")
        embedder = get_embedder()
        embeddings = embedder.encode(chunks, show_progress_bar=False)
        print(f"✅ Generated embeddings: {embeddings.shape}")

        # Prepare data for MongoDB. `embedding_model` is attached to every chunk
        # regardless of chunker mode so retrieval can filter and later re-index
        # workflows can find them.
        embedding_data = [
            {
                'lecture_id': lecture_id,
                'document_id': document_id,
                'chunk_text': chunk,
                'chunk_index': i,
                'embedding': embedding,
                'embedding_model': settings.EMBEDDING_MODEL,
                'metadata': {
                    'filename': filename,
                    'file_type': file_type,
                },
            }
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings))
        ]
        for item, structured_chunk in zip(embedding_data, structured_chunks):
            if structured_chunk is not None:
                item.update(
                    {
                        "page_number": structured_chunk.page_number,
                        "slide_number": structured_chunk.slide_number,
                        "section_heading": structured_chunk.section_heading,
                        "paragraph_index": structured_chunk.paragraph_index,
                    }
                )

        await save_document_embeddings(embedding_data)
        print(f"✅ Saved {len(chunks)} embeddings to MongoDB")

        await mark_document_processed(document_id, status="ready")
    except Exception as exc:
        logger.error("Document %s processing failed: %s", document_id, exc, exc_info=True)
        # Best-effort — never let the failure marker itself crash the caller.
        try:
            await mark_document_processed(document_id, status="failed", error=str(exc))
        except Exception:  # pragma: no cover — defensive
            logger.exception("Could not mark document %s failed", document_id)
        return {
            "success": False,
            "document_id": document_id,
            "error": "Processing failed",
        }

    return {
        "success": True,
        "document_id": document_id,
        "chunk_count": len(chunks),
        "text_length": len(text)
    }

async def query_documents(
    query_text: str,
    lecture_id: str,
    user_id: str,
    top_k: int = 10,
):
    """Return citation-preserving hybrid results for an owned lecture."""
    # Lazy import so this module stays importable without the retrieval stack.
    from app.services.retrieval import retrieve

    return await retrieve(
        query_text,
        user_id=user_id,
        lecture_ids=[lecture_id],
        limit=top_k,
    )

# Backward compatibility: Keep the old function name
async def query_documents_faiss(
    query_text: str, lecture_id: str, user_id: str, top_k: int = 10
) -> List[str]:
    """Deprecated text-only adapter; callers should use ``query_documents``."""
    return [result.chunk_text for result in await query_documents(query_text, lecture_id, user_id, top_k)]
