"""Ownership-safe flashcard persistence."""
from __future__ import annotations

from datetime import datetime
from typing import Optional
from database.mongodb_connection import get_db, user_owns_subject


def normalise_question(value: str) -> str:
    return " ".join(value.casefold().split())


async def create_flashcard(user_id: str, subject_id: str, question: str, answer: str, citations: list[dict], *, topic: Optional[str] = None) -> Optional[str]:
    if not citations or not await user_owns_subject(subject_id, user_id): return None
    result = await get_db().flashcards.insert_one({"user_id": user_id, "subject_id": subject_id, "question": question, "answer": answer, "topic": topic, "citations": citations, "normalised_question": normalise_question(question), "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()})
    return str(result.inserted_id)
