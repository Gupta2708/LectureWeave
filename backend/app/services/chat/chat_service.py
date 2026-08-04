"""Grounded-only subject chat; answers are never generated without retrieval."""
from __future__ import annotations

import asyncio
import json
import logging

from app.core.config import settings
from app.services.retrieval import retrieve
from app.services.synthesis.citations import citation_sources, validate_citations

logger = logging.getLogger(__name__)


def _deterministic_answer(chunks) -> str:
    """Fallback used when no Groq key is configured or the model call fails.

    Grounded on the top-ranked chunk so the answer stays defensible even
    without an LLM."""
    excerpt = chunks[0].chunk_text.strip()
    return f"Based on the subject material: {excerpt} [C1]"


async def _groq_answer(question: str, context: str) -> str | None:
    """Call Groq to synthesise a cited answer; returns None on any failure."""
    if not settings.GROQ_API_KEY:
        return None
    try:
        from groq import Groq

        prompt = (
            "You are a study assistant. Answer using ONLY the sources below. "
            "Every claim must end with a [C#] tag referring to the source it "
            "came from. If the sources are insufficient, say so briefly. "
            "Keep the answer under 200 words.\n\n"
            f"Sources:\n{context}\n\nQuestion: {question}"
        )
        response = await asyncio.to_thread(
            lambda: Groq(api_key=settings.GROQ_API_KEY).chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=400,
            )
        )
        return (response.choices[0].message.content or "").strip() or None
    except Exception as e:  # noqa: BLE001 — never surface Groq errors to callers
        logger.warning("Chat Groq call failed, using deterministic fallback: %s", e)
        return None


async def answer_question(*, user_id: str, subject_id: str, question: str) -> tuple[str, list[dict], dict]:
    chunks = await retrieve(question, user_id=user_id, subject_id=subject_id, limit=settings.CHAT_MAX_CONTEXT_CHUNKS, include_transcripts=True)
    if not chunks or max(chunk.score for chunk in chunks) < settings.RETRIEVAL_MIN_SCORE:
        return "The subject material does not contain enough information to answer that question.", [], {"chunk_count": len(chunks), "grounded": False}
    sources, context = citation_sources(chunks)

    # Groq when configured, deterministic template otherwise. Both go through the
    # citation validator so hallucinated [C#] tags are stripped before storage.
    raw_answer = await _groq_answer(question, context)
    if raw_answer is None:
        raw_answer = _deterministic_answer(chunks)
    answer, allowed = validate_citations(raw_answer, [], sources)

    return answer, allowed or sources[:1], {"chunk_count": len(chunks), "grounded": True, "context": context}
