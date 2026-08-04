"""Ownership-safe lecture topic persistence."""
from __future__ import annotations

from datetime import datetime
from typing import Any
from database.mongodb_connection import get_db, user_owns_lecture


async def replace_topics(user_id: str, lecture_id: str, topics: list[dict[str, Any]]) -> bool:
    if not await user_owns_lecture(lecture_id, user_id): return False
    db = get_db()
    await db.lecture_topics.delete_many({"lecture_id": lecture_id})
    if topics:
        await db.lecture_topics.insert_many([{**topic, "lecture_id": lecture_id, "created_at": datetime.utcnow()} for topic in topics])
    return True


async def list_topics(user_id: str, lecture_id: str) -> list[dict]:
    if not await user_owns_lecture(lecture_id, user_id): return []
    return await get_db().lecture_topics.find({"lecture_id": lecture_id}).sort("start_ms", 1).to_list(None)
