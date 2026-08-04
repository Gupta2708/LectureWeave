"""
Lecture creation route (MongoDB, authenticated).

Owning user is resolved from the JWT via `get_current_user`; the request body
never carries auth. Named `lectures_new.py` to sit alongside the legacy
SQLAlchemy `lectures.py` which is scheduled for removal in Commit F.
"""
from __future__ import annotations

import logging

from bson import ObjectId

from fastapi import APIRouter, Depends, HTTPException

from app.api.auth import get_current_user
from app.db.repositories.lectures import create_lecture
from app.schemas.lectures import LectureCreate, LectureCreated
from app.schemas.notes import NoteTemplate
from database.mongodb_connection import get_db, user_owns_lecture

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
            template=payload.template.value,
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


@router.patch("/{lecture_id}/template")
async def update_template(lecture_id: str, template: NoteTemplate, current_user: dict = Depends(get_current_user)):
    if not await user_owns_lecture(lecture_id, current_user["user_id"]):
        raise HTTPException(status_code=404, detail="Lecture not found")
    identifiers = [lecture_id]
    try: identifiers.append(ObjectId(lecture_id))
    except Exception: pass
    await get_db().lectures.update_one({"_id": {"$in": identifiers}}, {"$set": {"template": template.value}})
    return {"success": True, "template": template.value}
