"""Ownership-scoped hybrid retrieval with Atlas/M0 fallbacks."""
from __future__ import annotations

from typing import Any, Optional

import numpy as np
from bson import ObjectId

from app.core.config import settings
from app.schemas.retrieval import RetrievedChunk
from app.services.retrieval.fusion import reciprocal_rank_fusion
from app.services.retrieval.keyword import keyword_recall, query_terms, score_text
from database.mongodb_connection import get_db, simple_vector_search, user_owns_subject, vector_search


def _id_values(values: list[str]) -> list[Any]:
    result: list[Any] = []
    for value in values:
        result.append(value)
        try:
            result.append(ObjectId(value))
        except Exception:
            pass
    return result


async def _resolve_allowed_lecture_ids(
    *, user_id: str, subject_id: Optional[str], lecture_ids: Optional[list[str]]
) -> list[str]:
    """Resolve only lectures owned by the requester; deny by default."""
    if not user_id:
        return []
    db = get_db()
    filters: dict[str, Any] = {"user_id": user_id}
    if lecture_ids:
        filters["_id"] = {"$in": _id_values(lecture_ids)}
    elif subject_id:
        if not await user_owns_subject(subject_id, user_id):
            return []
        filters["subject_id"] = subject_id
    else:
        return []
    return [str(lecture["_id"]) async for lecture in db.lectures.find(filters, {"_id": 1})]


def _metadata_filter(lecture_ids: list[str], document_ids: Optional[list[str]]) -> dict[str, Any]:
    query: dict[str, Any] = {"lecture_id": {"$in": lecture_ids}}
    if document_ids:
        query["document_id"] = {"$in": document_ids}
    return query


async def _atlas_vector_recall(
    collection, query_embedding: np.ndarray, metadata_filter: dict[str, Any], limit: int
) -> list[RetrievedChunk]:
    results = await vector_search(query_embedding, top_k=limit, metadata_filter=metadata_filter)
    return [
        RetrievedChunk(
            chunk_id=result["chunk_id"], document_id=result.get("document_id"),
            lecture_id=str(result["lecture_id"]), chunk_text=result["chunk_text"],
            section_heading=result.get("section_heading"), page_number=result.get("page_number"),
            slide_number=result.get("slide_number"), score=result.get("similarity", 0.0),
            embedding_model=result.get("embedding_model"),
        )
        for result in results
    ]


async def _cosine_vector_recall(
    collection, query_embedding: np.ndarray, metadata_filter: dict[str, Any], limit: int
) -> list[RetrievedChunk]:
    """M0-safe vector fallback. The Mongo filter is applied before loading vectors."""
    results = await simple_vector_search(query_embedding, top_k=limit, metadata_filter=metadata_filter)
    return [
        RetrievedChunk(
            chunk_id=result["chunk_id"], document_id=result.get("document_id"),
            lecture_id=str(result["lecture_id"]), chunk_text=result["chunk_text"],
            section_heading=result.get("section_heading"), page_number=result.get("page_number"),
            slide_number=result.get("slide_number"), score=result.get("similarity", 0.0),
            embedding_model=result.get("embedding_model"),
        )
        for result in results
    ]


async def _vector_recall(
    collection, query_embedding: np.ndarray, metadata_filter: dict[str, Any], limit: int
) -> list[RetrievedChunk]:
    try:
        return await _atlas_vector_recall(collection, query_embedding, metadata_filter, limit)
    except Exception:
        return await _cosine_vector_recall(collection, query_embedding, metadata_filter, limit)


async def _transcript_keyword_recall(db, query: str, allowed_lecture_ids: list[str], limit: int) -> list[RetrievedChunk]:
    """Temporary lazy transcript tier; it reads corrected text without storing a second embedding copy."""
    terms = query_terms(query)
    matches: list[RetrievedChunk] = []
    async for segment in db.transcriptions.find({"lecture_id": {"$in": allowed_lecture_ids}}):
        text = segment.get("corrected_text") or segment.get("raw_text") or segment.get("text", "")
        score = score_text(text, terms)
        if score:
            matches.append(RetrievedChunk(
                chunk_id=str(segment["_id"]), lecture_id=str(segment["lecture_id"]), chunk_text=text,
                start_ms=segment.get("start_ms"), end_ms=segment.get("end_ms"), score=score,
                source_type="transcript", embedding_model=settings.EMBEDDING_MODEL,
            ))
    return sorted(matches, key=lambda item: item.score, reverse=True)[:limit]


def _embed_query(query: str) -> np.ndarray:
    """Embed on demand so tests can replace this without loading Torch."""
    from app.services.document_processor_mongodb import get_embedder
    return np.asarray(get_embedder().encode(query, show_progress_bar=False), dtype=float)


async def retrieve(
    query: str,
    *,
    user_id: str,
    subject_id: Optional[str] = None,
    lecture_ids: Optional[list[str]] = None,
    document_ids: Optional[list[str]] = None,
    limit: Optional[int] = None,
    include_transcripts: bool = False,
) -> list[RetrievedChunk]:
    """Return hybrid-ranked chunks from resources the caller owns, never others."""
    allowed_lecture_ids = await _resolve_allowed_lecture_ids(
        user_id=user_id, subject_id=subject_id, lecture_ids=lecture_ids
    )
    if not query.strip() or not allowed_lecture_ids:
        return []

    db = get_db()
    metadata_filter = _metadata_filter(allowed_lecture_ids, document_ids)
    requested_limit = limit or settings.RETRIEVAL_FINAL_LIMIT
    vector_limit = max(settings.RETRIEVAL_VECTOR_LIMIT, requested_limit)
    keyword_limit = max(settings.RETRIEVAL_KEYWORD_LIMIT, requested_limit)
    query_embedding = _embed_query(query)

    vector_results = await _vector_recall(db.document_embeddings, query_embedding, metadata_filter, vector_limit)
    keyword_results = await keyword_recall(db.document_embeddings, query, metadata_filter, keyword_limit)
    if include_transcripts:
        keyword_results.extend(await _transcript_keyword_recall(db, query, allowed_lecture_ids, keyword_limit))
    fused = reciprocal_rank_fusion(vector_results, keyword_results, query=query)
    return [result for result in fused if result.score >= settings.RETRIEVAL_MIN_SCORE][:requested_limit]
