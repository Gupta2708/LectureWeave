"""Ownership-safe quiz persistence."""
from __future__ import annotations

from datetime import datetime
from typing import Optional
from database.mongodb_connection import get_db, user_owns_subject, user_owns_lecture


async def create_quiz(user_id: str, subject_id: str, questions: list[dict], *, lecture_id: Optional[str] = None, difficulty: str = "medium") -> Optional[str]:
    if not await user_owns_subject(subject_id, user_id): return None
    if lecture_id and not await user_owns_lecture(lecture_id, user_id): return None
    result = await get_db().quizzes.insert_one({"user_id": user_id, "subject_id": subject_id, "lecture_id": lecture_id, "difficulty": difficulty, "created_at": datetime.utcnow()})
    if questions:
        await get_db().quiz_questions.insert_many([{**question, "quiz_id": str(result.inserted_id)} for question in questions])
    return str(result.inserted_id)
