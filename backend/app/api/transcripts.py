"""Editable timestamped transcript endpoints."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.api.auth import get_current_user
from app.schemas.transcriptions import TranscriptSegmentUpdate
from database.mongodb_connection import get_db, user_owns_lecture

router = APIRouter(prefix="/api/transcripts", tags=["Transcripts"])


def _id_filter(value: str) -> dict[str, Any]:
    values: list[Any] = [value]
    try:
        values.append(ObjectId(value))
    except Exception:
        pass
    return {"$in": values}


async def _owned_segment(segment_id: str, user_id: str) -> dict:
    segment = await get_db().transcriptions.find_one({"_id": _id_filter(segment_id)})
    if not segment or not await user_owns_lecture(segment["lecture_id"], user_id):
        raise HTTPException(status_code=404, detail="Transcript segment not found")
    return segment


@router.patch("/{segment_id}")
async def edit_transcript(segment_id: str, payload: TranscriptSegmentUpdate, current_user: dict = Depends(get_current_user)):
    segment = await _owned_segment(segment_id, current_user["user_id"])
    await get_db().transcriptions.update_one(
        {"_id": segment["_id"]},
        {"$set": {"corrected_text": payload.corrected_text, "edited_at": datetime.utcnow(), "edited_by": current_user["user_id"]}},
    )
    return {"success": True, "segment_id": segment_id, "effective_text": payload.corrected_text}


@router.post("/{segment_id}/restore")
async def restore_transcript(segment_id: str, current_user: dict = Depends(get_current_user)):
    segment = await _owned_segment(segment_id, current_user["user_id"])
    await get_db().transcriptions.update_one(
        {"_id": segment["_id"]},
        {"$set": {"corrected_text": None, "edited_at": None, "edited_by": None}},
    )
    return {"success": True, "segment_id": segment_id, "effective_text": segment.get("raw_text") or segment.get("text", "")}
