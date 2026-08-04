"""Ownership-safe lecture marker persistence."""
from __future__ import annotations

from datetime import datetime
from typing import Optional
from database.mongodb_connection import get_db, user_owns_lecture


async def create_marker(user_id: str, lecture_id: str, marker_type: str, start_ms: int, note: Optional[str] = None) -> Optional[str]:
    if not await user_owns_lecture(lecture_id, user_id): return None
    result = await get_db().lecture_markers.insert_one({"lecture_id": lecture_id, "type": marker_type, "start_ms": start_ms, "note": note, "created_at": datetime.utcnow()})
    return str(result.inserted_id)


async def list_markers(user_id: str, lecture_id: str) -> list[dict]:
    if not await user_owns_lecture(lecture_id, user_id): return []
    return await get_db().lecture_markers.find({"lecture_id": lecture_id}).sort("start_ms", 1).to_list(None)
