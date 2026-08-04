"""Topic segmentation endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.api.auth import get_current_user
from app.db.repositories.topics import list_topics, replace_topics
from app.services.topics import generate_topics
from database.mongodb_connection import get_db, user_owns_lecture

router = APIRouter(tags=["Topics"])


@router.post("/api/lectures/{lecture_id}/topics/generate")
async def create_topics(lecture_id: str, current_user: dict = Depends(get_current_user)):
    if not await user_owns_lecture(lecture_id, current_user["user_id"]): raise HTTPException(status_code=404, detail="Lecture not found")
    segments = await get_db().transcriptions.find({"lecture_id": lecture_id}).sort("seq", 1).to_list(None)
    if not segments: raise HTTPException(status_code=422, detail="No transcript segments available")
    topics = await generate_topics(segments)
    await replace_topics(current_user["user_id"], lecture_id, topics)
    return {"success": True, "topics": topics}


@router.get("/api/lectures/{lecture_id}/topics")
async def get_topics(lecture_id: str, current_user: dict = Depends(get_current_user)):
    if not await user_owns_lecture(lecture_id, current_user["user_id"]): raise HTTPException(status_code=404, detail="Lecture not found")
    topics = await list_topics(current_user["user_id"], lecture_id)
    for topic in topics: topic["_id"] = str(topic["_id"])
    return {"success": True, "topics": topics}
