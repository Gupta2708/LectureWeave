"""Grounded flashcard generation with a deterministic, citation-only fallback."""
from __future__ import annotations

from app.services.retrieval import retrieve
from app.services.synthesis.citations import citation_sources


async def generate_flashcards(*, user_id: str, subject_id: str, count: int, lecture_ids: list[str] | None = None) -> list[dict]:
    chunks = await retrieve("key definitions concepts explanations", user_id=user_id, subject_id=subject_id, lecture_ids=lecture_ids, limit=count)
    sources, _ = citation_sources(chunks)
    cards = []
    for chunk, source in zip(chunks, sources):
        topic = chunk.section_heading or "Course material"
        cards.append({"question": f"What does the material say about {topic}?", "answer": chunk.chunk_text[:500], "topic": topic, "citations": [source]})
    return cards
