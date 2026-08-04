"""Idempotent retry coordination for document and note processing."""
from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Any

from bson import ObjectId

from app.core.config import settings
from app.db.repositories.jobs import create_job, update_job
from app.services.document_processor_mongodb import process_document
from app.services.final_synthesizer import synthesize_final_notes
from database.mongodb_connection import (
    get_db,
    get_lecture_template,
    mark_document_processed,
    save_final_notes,
    user_owns_lecture,
)


def _id_filter(value: str) -> dict[str, Any]:
    values: list[Any] = [value]
    try: values.append(ObjectId(value))
    except Exception: pass
    return {"$in": values}


async def retry_document(user_id: str, document_id: str) -> bool:
    db = get_db()
    document = await db.documents.find_one({"_id": _id_filter(document_id)})
    if not document or not await user_owns_lecture(document["lecture_id"], user_id): return False
    retries = int(document.get("retry_count", 0))
    if retries >= settings.PROCESSING_MAX_RETRIES: return False
    await db.documents.update_one({"_id": document["_id"]}, {"$set": {"retry_count": retries + 1, "error": None, "status": "uploaded"}})
    job_id = await create_job(user_id, "document", document_id, stage="retrying")

    async def run() -> None:
        try:
            if job_id: await update_job(user_id, job_id, status="running", stage="embedding", ratio=0.1)
            # Reprocess from the original upload. The existing document remains
            # queryable until the new processing succeeds.
            result = await process_document(document["file_path"], document["lecture_id"], document["filename"])
            if job_id: await update_job(user_id, job_id, status="succeeded" if result.get("success") else "failed", stage="complete", ratio=1.0, error=result.get("error"))
        except Exception:
            await mark_document_processed(document_id, status="failed", error="Processing failed")
            if job_id: await update_job(user_id, job_id, status="failed", stage="failed", ratio=1.0, error="Processing failed")
    asyncio.create_task(run())
    return True


async def regenerate_notes(user_id: str, lecture_id: str) -> bool:
    if not await user_owns_lecture(lecture_id, user_id): return False
    db = get_db()
    structured = [item["content"] async for item in db.structured_notes.find({"lecture_id": lecture_id}).sort("created_at", 1)]
    if not structured: return False
    markers = await db.lecture_markers.find({"lecture_id": lecture_id}).sort("start_ms", 1).to_list(None)
    # Preserve the lecture's chosen note template and best-effort RAG context so
    # regenerated notes match what was produced live rather than defaulting.
    template = await get_lecture_template(lecture_id)
    rag_context = [
        chunk["chunk_text"]
        async for chunk in db.document_embeddings.find(
            {"lecture_id": lecture_id}, {"chunk_text": 1}
        ).limit(settings.RETRIEVAL_KEYWORD_LIMIT)
    ]
    result = await synthesize_final_notes(
        lecture_id,
        structured,
        rag_context=rag_context or None,
        template=template,
        author_markers=markers or None,
    )
    if result.get("success"):
        await save_final_notes(lecture_id, result["title"], result["markdown"], result["sections"], result["glossary"], result["key_takeaways"])
        return True
    return False
