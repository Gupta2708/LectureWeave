"""Grounded flashcard schemas."""
from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field


class FlashcardCreate(BaseModel):
    question: str = Field(min_length=1, max_length=2_000)
    answer: str = Field(min_length=1, max_length=10_000)
    topic: Optional[str] = None
    citations: list[dict[str, Any]] = Field(min_length=1)


class FlashcardUpdate(BaseModel):
    question: Optional[str] = Field(default=None, min_length=1, max_length=2_000)
    answer: Optional[str] = Field(default=None, min_length=1, max_length=10_000)
    topic: Optional[str] = None

