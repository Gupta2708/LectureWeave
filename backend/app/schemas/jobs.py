"""Processing job schemas."""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class JobStatus(str, Enum):
    queued = "queued"
    running = "running"
    succeeded = "succeeded"
    failed = "failed"


class ProcessingJobCreate(BaseModel):
    target_type: str = Field(pattern="^(lecture|document)$")
    target_id: str
    stage: str = "queued"


class ProcessingJob(BaseModel):
    id: str
    target_type: str
    target_id: str
    status: JobStatus
    stage: str
    ratio: float = Field(ge=0, le=1)
    retry_count: int = 0
    error: Optional[str] = None
    created_at: datetime

