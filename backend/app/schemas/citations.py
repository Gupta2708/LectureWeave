"""Validated source-citation schema embedded on generated notes."""
from __future__ import annotations

from enum import Enum
from typing import Optional
from pydantic import BaseModel


class CitationType(str, Enum):
    document = "document"
    transcript = "transcript"


class Citation(BaseModel):
    id: str
    chunk_id: str
    type: CitationType
    document_id: Optional[str] = None
    lecture_id: str
    page_number: Optional[int] = None
    slide_number: Optional[int] = None
    start_ms: Optional[int] = None
    end_ms: Optional[int] = None
    excerpt: Optional[str] = None
    mode: str = "model"

