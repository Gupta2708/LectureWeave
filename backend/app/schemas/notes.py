"""Notes response schemas."""
from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class NoteTemplate(str, Enum):
    concise = "concise"
    detailed = "detailed"
    bullet = "bullet"
    revision = "revision"
    summary = "summary"


class MyNotesResponse(BaseModel):
    success: bool
    notes: List[Dict[str, Any]]
    count: int


class MyLecturesResponse(BaseModel):
    success: bool
    lectures: List[Dict[str, Any]]
    count: int


class LectureDetailResponse(BaseModel):
    success: bool
    lecture: Optional[Dict[str, Any]]
