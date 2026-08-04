"""Document schemas."""
from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel


class UploadedDocument(BaseModel):
    filename: str
    status: str
    document_id: Optional[str] = None
    chunk_count: int = 0


class UploadResponse(BaseModel):
    message: str
    lecture_id: str
    files: List[UploadedDocument]
    total_files: int
