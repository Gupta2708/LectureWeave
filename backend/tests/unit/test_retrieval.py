"""Hybrid retrieval behaviour that does not require MongoDB or a model download."""
from __future__ import annotations

import numpy as np
import pytest

from app.schemas.retrieval import RetrievedChunk
from app.services.retrieval.fusion import reciprocal_rank_fusion
from app.services.retrieval import hybrid


def _chunk(chunk_id: str, *, heading: str | None = None) -> RetrievedChunk:
    return RetrievedChunk(chunk_id=chunk_id, document_id="doc", lecture_id="lecture-a", chunk_text=chunk_id, section_heading=heading)


def test_rrf_deduplicates_and_rewards_two_tier_matches():
    results = reciprocal_rank_fusion([_chunk("a"), _chunk("b")], [_chunk("b"), _chunk("c")], k=60, vector_weight=0.6, keyword_weight=0.4)
    assert [item.chunk_id for item in results] == ["b", "a", "c"]
    assert len({item.chunk_id for item in results}) == 3


def test_rrf_applies_heading_boost():
    results = reciprocal_rank_fusion([_chunk("plain"), _chunk("heading", heading="Gradient descent")], [], vector_weight=1, keyword_weight=0, heading_boost=0.1, query="gradient")
    assert results[0].chunk_id == "heading"


@pytest.mark.asyncio
async def test_retrieve_never_queries_when_ownership_resolves_no_lectures(monkeypatch):
    async def no_access(**_kwargs): return []
    monkeypatch.setattr(hybrid, "_resolve_allowed_lecture_ids", no_access)
    assert await hybrid.retrieve("private material", user_id="user-a", lecture_ids=["lecture-b"]) == []


@pytest.mark.asyncio
async def test_retrieve_passes_only_owned_lecture_filter_to_both_tiers(monkeypatch):
    class FakeDb:
        document_embeddings = object()

    captured = []
    async def allowed(**_kwargs): return ["lecture-a"]
    async def vector(_collection, _embedding, metadata_filter, _limit):
        captured.append(metadata_filter)
        return [_chunk("owned")]
    async def keyword(_collection, _query, metadata_filter, _limit):
        captured.append(metadata_filter)
        return [_chunk("owned")]

    monkeypatch.setattr(hybrid, "get_db", lambda: FakeDb())
    monkeypatch.setattr(hybrid, "_resolve_allowed_lecture_ids", allowed)
    monkeypatch.setattr(hybrid, "_embed_query", lambda _query: np.array([1.0]))
    monkeypatch.setattr(hybrid, "_vector_recall", vector)
    monkeypatch.setattr(hybrid, "keyword_recall", keyword)
    results = await hybrid.retrieve("owned", user_id="user-a", lecture_ids=["lecture-a", "lecture-b"], limit=3)

    assert [result.chunk_id for result in results] == ["owned"]
    assert captured == [{"lecture_id": {"$in": ["lecture-a"]}}, {"lecture_id": {"$in": ["lecture-a"]}}]
