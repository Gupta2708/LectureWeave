"""Hybrid, ownership-scoped retrieval."""

from app.schemas.retrieval import RetrievedChunk


async def retrieve(*args, **kwargs):
    """Lazy-load the embedding-backed implementation on first retrieval."""
    from .hybrid import retrieve as _retrieve
    return await _retrieve(*args, **kwargs)

__all__ = ["RetrievedChunk", "retrieve"]
