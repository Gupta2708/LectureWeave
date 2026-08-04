"""Repositories for grounded subject chat sessions and messages."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional
from bson import ObjectId
from database.mongodb_connection import get_db, user_owns_subject


def _id(value: str) -> dict:
    values: list[Any] = [value]
    try: values.append(ObjectId(value))
    except Exception: pass
    return {"$in": values}


async def create_session(user_id: str, subject_id: str, title: Optional[str] = None) -> Optional[str]:
    if not await user_owns_subject(subject_id, user_id): return None
    now = datetime.utcnow()
    result = await get_db().chat_sessions.insert_one({"user_id": user_id, "subject_id": subject_id, "title": title or "New chat", "created_at": now, "updated_at": now})
    return str(result.inserted_id)


async def user_owns_session(session_id: str, user_id: str) -> bool:
    return await get_db().chat_sessions.find_one({"_id": _id(session_id), "user_id": user_id}, {"_id": 1}) is not None


async def get_owned_session(session_id: str, user_id: str) -> Optional[dict]:
    return await get_db().chat_sessions.find_one({"_id": _id(session_id), "user_id": user_id})


async def add_message(user_id: str, session_id: str, role: str, content: str, *, sources: Optional[list[dict]] = None) -> Optional[str]:
    if not await user_owns_session(session_id, user_id): return None
    now = datetime.utcnow()
    result = await get_db().chat_messages.insert_one({"session_id": session_id, "role": role, "content": content, "sources": sources or [], "created_at": now})
    await get_db().chat_sessions.update_one({"_id": _id(session_id)}, {"$set": {"updated_at": now}})
    return str(result.inserted_id)
