"""
Audio-chunk upload route.

Accepts one 20-second WAV chunk at a time and hands it to the audio processor.
Requires an active WebSocket for the lecture (the processor pushes live updates
back through it) and ownership of the lecture.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.api.auth import get_current_user
from app.services.recording.manager import manager
from app.services.recording.processor import processor
from database.mongodb_connection import user_owns_lecture

router = APIRouter(prefix="/api/audio", tags=["Recording"])


@router.post("/lecture/{lecture_id}/chunk")
async def receive_audio_chunk(
    lecture_id: str,
    audio_file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Receive a 20-second audio chunk."""
    if not await user_owns_lecture(lecture_id, current_user["user_id"]):
        raise HTTPException(status_code=404, detail="Lecture not found or you don't have access")

    websocket = manager.active_connections.get(lecture_id)
    if not websocket:
        return {"error": "No active WebSocket connection for this lecture"}

    return await processor.process_audio_chunk(
        lecture_id, audio_file, websocket, current_user["user_id"]
    )
