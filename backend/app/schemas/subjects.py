"""Subject request/response schemas."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class SubjectCreate(BaseModel):
    name: str
    code: Optional[str] = None
    description: Optional[str] = None


class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
