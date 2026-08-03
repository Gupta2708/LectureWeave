"""
User notes API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict

from app.api.auth import get_current_user
from database.mongodb_connection import (
    get_user_lectures,
    get_user_final_notes,
    get_lecture_with_notes
)

router = APIRouter(prefix="/api/notes", tags=["Notes"])

@router.get("/my-lectures")
async def get_my_lectures(current_user: dict = Depends(get_current_user)):
    """Get all lectures for the current user"""
    lectures = await get_user_lectures(current_user["user_id"])
    
    return {
        "success": True,
        "lectures": lectures,
        "count": len(lectures)
    }

@router.get("/my-notes")
async def get_my_notes(current_user: dict = Depends(get_current_user)):
    """Get all final notes for the current user"""
    notes = await get_user_final_notes(current_user["user_id"])
    
    return {
        "success": True,
        "notes": notes,
        "count": len(notes)
    }

@router.get("/lecture/{lecture_id}")
async def get_lecture_details(
    lecture_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get lecture with all its notes"""
    lecture = await get_lecture_with_notes(lecture_id, current_user["user_id"])
    
    if not lecture:
        raise HTTPException(
            status_code=404,
            detail="Lecture not found or you don't have access"
        )
    
    return {
        "success": True,
        "lecture": lecture
    }
