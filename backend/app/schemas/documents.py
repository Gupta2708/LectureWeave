"""Document schemas."""
from __future__ import annotations

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel


class DocumentStatus(str, Enum):
    uploaded = "uploaded"
    extracting = "extracting"
    chunking = "chunking"
    embedding = "embedding"
    ready = "ready"
    failed = "failed"


class UploadedDocument(BaseModel):
    filename: str
    status: DocumentStatus | str
    document_id: Optional[str] = None
    chunk_count: int = 0
    error: Optional[str] = None
    retry_count: int = 0
    page_count: Optional[int] = None
    slide_count: Optional[int] = None


class UploadResponse(BaseModel):
    message: str
    lecture_id: str
    files: List[UploadedDocument]
    total_files: int
