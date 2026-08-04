"""Rank fusion primitives kept independent of MongoDB for deterministic tests."""
from __future__ import annotations

from collections.abc import Sequence

from app.core.config import settings
from app.schemas.retrieval import RetrievedChunk


def reciprocal_rank_fusion(
    vector_results: Sequence[RetrievedChunk],
    keyword_results: Sequence[RetrievedChunk],
    *,
    k: int = 60,
    vector_weight: float | None = None,
    keyword_weight: float | None = None,
    heading_boost: float | None = None,
    query: str = "",
) -> list[RetrievedChunk]:
    """Fuse two ranked lists, deduplicating by stable chunk id."""
    vector_weight = settings.RETRIEVAL_VECTOR_WEIGHT if vector_weight is None else vector_weight
    keyword_weight = settings.RETRIEVAL_KEYWORD_WEIGHT if keyword_weight is None else keyword_weight
    heading_boost = settings.RETRIEVAL_HEADING_BOOST if heading_boost is None else heading_boost
    merged: dict[str, RetrievedChunk] = {}
    scores: dict[str, float] = {}

    for weight, results in ((vector_weight, vector_results), (keyword_weight, keyword_results)):
        for rank, result in enumerate(results, start=1):
            if result.chunk_id not in merged:
                merged[result.chunk_id] = result.model_copy(deep=True)
                scores[result.chunk_id] = 0.0
            scores[result.chunk_id] += weight / (k + rank)

    query_terms = {term.casefold() for term in query.split() if len(term) > 2}
    for chunk_id, result in merged.items():
        heading_terms = set((result.section_heading or "").casefold().split())
        if query_terms and query_terms & heading_terms:
            scores[chunk_id] += heading_boost
        # Exact source-text matches get a smaller nudge than heading matches;
        # this keeps rank fusion dominant while rewarding direct evidence.
        chunk_terms = set(result.chunk_text.casefold().split())
        if query_terms and query_terms & chunk_terms:
            scores[chunk_id] += heading_boost / 2
        result.score = scores[chunk_id]
    return sorted(merged.values(), key=lambda result: result.score, reverse=True)
