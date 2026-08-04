"""Ownership-checked important-moment markers."""
from __future__ import annotations

from typing import Any

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.api.auth import get_current_user
from app.db.repositories.markers import create_marker, list_markers
from app.schemas.markers import MarkerCreate
from database.mongodb_connection import get_db, user_owns_lecture

router = APIRouter(tags=["Markers"])


@router.post("/api/lectures/{lecture_id}/markers")
async def add_marker(lecture_id: str, payload: MarkerCreate, current_user: dict = Depends(get_current_user)):
    marker_id = await create_marker(current_user["user_id"], lecture_id, payload.type.value, payload.start_ms, payload.note)
    if not marker_id:
        raise HTTPException(status_code=404, detail="Lecture not found")
    return {"success": True, "marker_id": marker_id}


@router.get("/api/lectures/{lecture_id}/markers")
async def get_markers(lecture_id: str, current_user: dict = Depends(get_current_user)):
    if not await user_owns_lecture(lecture_id, current_user["user_id"]):
        raise HTTPException(status_code=404, detail="Lecture not found")
    markers = await list_markers(current_user["user_id"], lecture_id)
    for marker in markers:
        marker["_id"] = str(marker["_id"])
    return {"success": True, "markers": markers}


@router.delete("/api/markers/{marker_id}")
async def delete_marker(marker_id: str, current_user: dict = Depends(get_current_user)):
    values: list[Any] = [marker_id]
    try: values.append(ObjectId(marker_id))
    except Exception: pass
    marker = await get_db().lecture_markers.find_one({"_id": {"$in": values}})
    if not marker or not await user_owns_lecture(marker["lecture_id"], current_user["user_id"]):
        raise HTTPException(status_code=404, detail="Marker not found")
    await get_db().lecture_markers.delete_one({"_id": marker["_id"]})
    return {"success": True}
