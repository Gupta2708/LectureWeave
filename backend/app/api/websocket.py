"""
Lecture WebSocket route.

Authenticates on the handshake (`?token=` query param — browsers cannot set
custom headers on the WS handshake), then owns the per-lecture background
processing task's lifecycle.
"""
from __future__ import annotations

import asyncio
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.auth_service import verify_token
from app.services.recording.manager import manager
from app.services.recording.processor import processor
from database.mongodb_connection import user_owns_lecture

logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/lecture/{lecture_id}")
async def websocket_endpoint(websocket: WebSocket, lecture_id: str) -> None:
    """WebSocket endpoint for real-time updates."""
    token = websocket.query_params.get("token")
    user = await verify_token(token) if token else None
    if not user or not await user_owns_lecture(lecture_id, user["user_id"]):
        await websocket.close(code=4401)
        return

    await manager.connect(lecture_id, websocket)

    # Cancel old task on reconnect
    if lecture_id in processor.processing_tasks:
        logger.info("Cancelling old task for %s (reconnection)", lecture_id)
        old_task = processor.processing_tasks[lecture_id]
        old_task.cancel()
        try:
            await old_task
        except asyncio.CancelledError:
            pass
        processor.audio_queues[lecture_id] = asyncio.Queue()

    task = asyncio.create_task(processor.process_lecture_audio(lecture_id))
    processor.processing_tasks[lecture_id] = task

    try:
        await websocket.send_json(
            {
                "type": "connection_confirmed",
                "message": "WebSocket connected - Ready for audio processing",
            }
        )

        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            msg_type = message.get("type")

            if msg_type == "start_recording":
                await websocket.send_json(
                    {
                        "type": "recording_started",
                        "message": "Recording started - Send 20-second audio chunks via HTTP",
                    }
                )

            elif msg_type == "stop_recording":
                logger.info("Stopping recording for lecture %s", lecture_id)
                await asyncio.sleep(2)  # let any in-flight chunk drain
                if len(processor.transcription_buffers[lecture_id]) > 0:
                    await processor.synthesize_notes(lecture_id, websocket)
                await processor.final_synthesis(lecture_id, websocket)
                await websocket.send_json(
                    {"type": "recording_stopped", "message": "Recording stopped"}
                )

            elif msg_type == "request_final_synthesis":
                await processor.final_synthesis(lecture_id, websocket)

    except WebSocketDisconnect:
        manager.disconnect(lecture_id)
        # Task keeps running so queued audio still processes; it'll be cancelled
        # on the next reconnect.
        logger.info("WebSocket disconnected for lecture %s", lecture_id)
