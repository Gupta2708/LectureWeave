"""Grounded flashcard generation.

Uses Groq to author question/answer pairs when `GROQ_API_KEY` is configured;
otherwise falls back to a deterministic template so every card still carries a
citation. Never emits an ungrounded card.
"""
from __future__ import annotations

import asyncio
import json
import logging

from app.core.config import settings
from app.services.retrieval import retrieve
from app.services.synthesis.citations import citation_sources

logger = logging.getLogger(__name__)


def _template_card(chunk, source) -> dict:
    topic = chunk.section_heading or "Course material"
    return {
        "question": f"What does the material say about {topic}?",
        "answer": chunk.chunk_text[:500],
        "topic": topic,
        "citations": [source],
    }


async def _groq_card(chunk, source) -> dict | None:
    """Return a Groq-authored card or None on any failure."""
    if not settings.GROQ_API_KEY:
        return None
    topic = chunk.section_heading or "Course material"
    excerpt = chunk.chunk_text[:1500]
    prompt = (
        "Write ONE study flashcard grounded strictly in the excerpt below. "
        "Return valid JSON with keys \"question\" and \"answer\" only. "
        "Keep the question specific and concise; keep the answer under 60 "
        "words. Do not invent facts.\n\n"
        f"Topic: {topic}\n\nExcerpt:\n{excerpt}"
    )
    try:
        from groq import Groq

        response = await asyncio.to_thread(
            lambda: Groq(api_key=settings.GROQ_API_KEY).chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=220,
            )
        )
        content = (response.choices[0].message.content or "").strip().strip("`")
        # Some models wrap JSON in "```json ... ```" fences; strip the leading tag.
        if content.startswith("json"):
            content = content[4:].strip()
        data = json.loads(content)
        question = str(data.get("question", "")).strip()
        answer = str(data.get("answer", "")).strip()
        if not question or not answer:
            return None
        return {"question": question, "answer": answer, "topic": topic, "citations": [source]}
    except Exception as e:  # noqa: BLE001
        logger.warning("Flashcard Groq call failed for topic %s: %s", topic, e)
        return None


async def generate_flashcards(*, user_id: str, subject_id: str, count: int, lecture_ids: list[str] | None = None) -> list[dict]:
    chunks = await retrieve(
        "key definitions concepts explanations",
        user_id=user_id,
        subject_id=subject_id,
        lecture_ids=lecture_ids,
        limit=count,
    )
    sources, _ = citation_sources(chunks)
    cards: list[dict] = []
    for chunk, source in zip(chunks, sources):
        card = await _groq_card(chunk, source)
        if card is None:
            card = _template_card(chunk, source)
        cards.append(card)
    return cards
