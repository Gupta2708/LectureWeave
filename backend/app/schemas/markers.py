"""Lecture marker schemas."""
from __future__ import annotations

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class MarkerType(str, Enum):
    important = "important"
    confusing = "confusing"
    exam_hint = "exam_hint"
    example = "example"
    revisit = "revisit"


class MarkerCreate(BaseModel):
    type: MarkerType
    start_ms: int = Field(ge=0)
    note: Optional[str] = Field(default=None, max_length=2_000)

