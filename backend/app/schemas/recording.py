"""Recording (WebSocket + audio chunk) schemas."""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel


class RecordingCommand(BaseModel):
    """One JSON message on the lecture WebSocket."""

    type: Literal["start_recording", "stop_recording", "request_final_synthesis"]
    lecture_id: Optional[str] = None
