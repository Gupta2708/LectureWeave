"""Lecture request/response schemas."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field
from app.schemas.notes import NoteTemplate


class LectureCreate(BaseModel):
    """Body accepted by POST /api/lectures/."""

    subject_id: str = Field(..., description="Owning subject id")
    title: str = Field(default="New Lecture", description="Lecture title")
    template: NoteTemplate = NoteTemplate.detailed


class LectureCreated(BaseModel):
    """Response returned by POST /api/lectures/."""

    id: str
    title: str
    subject_id: str
    user_id: str
    status: str = "created"
