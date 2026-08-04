"""
Lecture creation route (MongoDB, authenticated).

Owning user is resolved from the JWT via `get_current_user`; the request body
never carries auth. Named `lectures_new.py` to sit alongside the legacy
SQLAlchemy `lectures.py` which is scheduled for removal in Commit F.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException

from app.api.auth import get_current_user
from app.db.repositories.lectures import create_lecture
from app.schemas.lectures import LectureCreate, LectureCreated

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/lectures", tags=["Lectures"])


@router.post("/", response_model=LectureCreated)
async def create_lecture_endpoint(
    payload: LectureCreate,
    current_user: dict = Depends(get_current_user),
) -> LectureCreated:
    """Create a new lecture owned by the authenticated user."""
    user_id = current_user["user_id"]
    try:
        lecture_id = await create_lecture(
            user_id=user_id,
            subject_id=payload.subject_id,
            title=payload.title,
        )
    except Exception as e:
        logger.error("Error creating lecture: %s", e)
        raise HTTPException(status_code=500, detail="Could not create lecture")

    return LectureCreated(
        id=lecture_id,
        title=payload.title,
        subject_id=payload.subject_id,
        user_id=user_id,
    )
