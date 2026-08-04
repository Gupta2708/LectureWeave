"""Citation persistence helpers. Citations are embedded in note documents."""
from __future__ import annotations

from typing import Any
from database.mongodb_connection import get_db, user_owns_lecture


async def attach_final_note_citations(user_id: str, lecture_id: str, citations: list[dict[str, Any]]) -> bool:
    if not await user_owns_lecture(lecture_id, user_id): return False
    result = await get_db().final_notes.update_one({"lecture_id": lecture_id}, {"$set": {"citations": citations}})
    return bool(result.matched_count)
