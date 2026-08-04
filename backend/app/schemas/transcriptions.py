"""Schemas for timestamped, editable transcript segments."""
from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class TranscriptSegmentUpdate(BaseModel):
    corrected_text: str = Field(min_length=1, max_length=20_000)


class TranscriptSegment(BaseModel):
    id: str
    lecture_id: str
    raw_text: str
    corrected_text: Optional[str] = None
    start_ms: Optional[int] = None
    end_ms: Optional[int] = None
    seq: int

