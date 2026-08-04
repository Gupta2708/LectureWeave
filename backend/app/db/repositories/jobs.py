"""Ownership-safe persistence for processing jobs."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from bson import ObjectId

from database.mongodb_connection import get_db, user_owns_lecture


async def _document_owned(document_id: str, user_id: str) -> bool:
    """Return True when the document's owning lecture belongs to `user_id`."""
    ids: list[Any] = [document_id]
    try:
        ids.append(ObjectId(document_id))
    except Exception:
        pass
    document = await get_db().documents.find_one({"_id": {"$in": ids}}, {"lecture_id": 1})
    if not document:
        return False
    return await user_owns_lecture(document["lecture_id"], user_id)


async def create_job(user_id: str, target_type: str, target_id: str, *, stage: str = "queued") -> Optional[str]:
    if target_type == "lecture" and not await user_owns_lecture(target_id, user_id):
        return None
    # A document target's ownership is only verifiable through its parent
    # lecture — skipping this check let any authenticated user schedule a
    # retry against another user's document.
    if target_type == "document" and not await _document_owned(target_id, user_id):
        return None
    result = await get_db().processing_jobs.insert_one({
        "user_id": user_id, "target_type": target_type, "target_id": target_id,
        "status": "queued", "stage": stage, "ratio": 0.0, "retry_count": 0,
        "error": None, "created_at": datetime.utcnow(), "updated_at": datetime.utcnow(),
    })
    return str(result.inserted_id)


async def update_job(user_id: str, job_id: str, **updates: Any) -> bool:
    updates["updated_at"] = datetime.utcnow()
    result = await get_db().processing_jobs.update_one({"_id": _id_filter(job_id), "user_id": user_id}, {"$set": updates})
    return bool(result.matched_count)


def _id_filter(value: str) -> dict:
    from bson import ObjectId
    ids: list[Any] = [value]
    try: ids.append(ObjectId(value))
    except Exception: pass
    return {"$in": ids}
