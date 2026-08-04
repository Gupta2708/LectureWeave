"""Topic segmentation schemas."""
from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class LectureTopic(BaseModel):
    id: Optional[str] = None
    lecture_id: str
    start_ms: int = Field(ge=0)
    end_ms: int = Field(ge=0)
    title: str
    summary: str
    transcript_segment_ids: list[str] = []

