"""Grounded-only subject chat; answers are never generated without retrieval."""
from __future__ import annotations

from app.core.config import settings
from app.services.retrieval import retrieve
from app.services.synthesis.citations import citation_sources


async def answer_question(*, user_id: str, subject_id: str, question: str) -> tuple[str, list[dict], dict]:
    chunks = await retrieve(question, user_id=user_id, subject_id=subject_id, limit=settings.CHAT_MAX_CONTEXT_CHUNKS, include_transcripts=True)
    if not chunks or max(chunk.score for chunk in chunks) < settings.RETRIEVAL_MIN_SCORE:
        return "The subject material does not contain enough information to answer that question.", [], {"chunk_count": len(chunks), "grounded": False}
    sources, context = citation_sources(chunks)
    # The deterministic fallback remains grounded and makes the service fully
    # testable without credentials. A configured Groq client can be added here
    # without changing the retrieval or persistence contract.
    excerpt = chunks[0].chunk_text.strip()
    answer = f"Based on the subject material: {excerpt} [C1]"
    return answer, sources, {"chunk_count": len(chunks), "grounded": True, "context": context}
