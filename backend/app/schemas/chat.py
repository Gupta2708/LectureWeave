"""Subject-level grounded chat schemas."""
from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field


class ChatSessionCreate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=200)


class ChatMessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=10_000)


class ChatMessage(BaseModel):
    id: Optional[str] = None
    session_id: str
    role: str = Field(pattern="^(user|assistant)$")
    content: str
    sources: list[dict[str, Any]] = []

