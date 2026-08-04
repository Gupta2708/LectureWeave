"""MongoDB $text retrieval plus a portable in-process fallback."""
from __future__ import annotations

import re
from typing import Any

from app.schemas.retrieval import RetrievedChunk


def query_terms(query: str) -> list[str]:
    return list(dict.fromkeys(re.findall(r"[\w'-]+", query.casefold())))


def score_text(text: str, terms: list[str]) -> float:
    if not terms:
        return 0.0
    folded = text.casefold()
    return sum(1 for term in terms if re.search(rf"\b{re.escape(term)}\b", folded)) / len(terms)


def document_chunk(document: dict[str, Any], *, score: float) -> RetrievedChunk:
    return RetrievedChunk(
        chunk_id=str(document["_id"]),
        document_id=str(document.get("document_id")) if document.get("document_id") is not None else None,
        lecture_id=str(document["lecture_id"]),
        chunk_text=document.get("chunk_text", ""),
        section_heading=document.get("section_heading"),
        page_number=document.get("page_number"),
        slide_number=document.get("slide_number"),
        score=float(score),
        embedding_model=document.get("embedding_model"),
    )


async def keyword_recall(collection, query: str, metadata_filter: dict, limit: int) -> list[RetrievedChunk]:
    """Use $text when available; fall back to metadata-filtered term coverage."""
    try:
        cursor = collection.find(
            {**metadata_filter, "$text": {"$search": query}},
            {
                "chunk_text": 1,
                "document_id": 1,
                "lecture_id": 1,
                "section_heading": 1,
                "page_number": 1,
                "slide_number": 1,
                "embedding_model": 1,
                "score": {"$meta": "textScore"},
            },
        ).sort([( "score", {"$meta": "textScore"})]).limit(limit)
        return [document_chunk(document, score=document.get("score", 0.0)) async for document in cursor]
    except Exception:
        terms = query_terms(query)
        cursor = collection.find(metadata_filter)
        matches = []
        async for document in cursor:
            score = score_text(f"{document.get('section_heading', '')}\n{document.get('chunk_text', '')}", terms)
            if score > 0:
                matches.append(document_chunk(document, score=score))
        return sorted(matches, key=lambda result: result.score, reverse=True)[:limit]
