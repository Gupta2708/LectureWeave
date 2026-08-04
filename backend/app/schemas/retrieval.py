"""Citation-preserving retrieval result schemas."""
from __future__ import annotations

from typing import Literal, Optional
from pydantic import BaseModel


class RetrievedChunk(BaseModel):
    chunk_id: str
    document_id: Optional[str] = None
    lecture_id: str
    chunk_text: str
    section_heading: Optional[str] = None
    page_number: Optional[int] = None
    slide_number: Optional[int] = None
    start_ms: Optional[int] = None
    end_ms: Optional[int] = None
    score: float = 0.0
    source_type: Literal["document", "transcript"] = "document"
    embedding_model: Optional[str] = None
