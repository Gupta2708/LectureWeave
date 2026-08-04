"""
User notes API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Dict

from app.api.auth import get_current_user
from database.mongodb_connection import (
    get_user_lectures,
    get_user_final_notes,
    get_lecture_with_notes
)
from app.services.exports import export_notes
from app.services.retries import regenerate_notes

router = APIRouter(prefix="/api/notes", tags=["Notes"])


@router.get("/{lecture_id}/export")
async def export_final_notes(lecture_id: str, format: str = Query("md", pattern="^(md|txt|pdf|docx)$"), current_user: dict = Depends(get_current_user)):
    lecture = await get_lecture_with_notes(lecture_id, current_user["user_id"])
    if not lecture or not lecture.get("final_notes"):
        raise HTTPException(status_code=404, detail="Final notes not found")
    try:
        return export_notes(lecture["final_notes"].get("title") or lecture.get("title", "lecture-notes"), lecture["final_notes"].get("markdown", ""), format)
    except RuntimeError:
        raise HTTPException(status_code=503, detail="PDF export is unavailable")


@router.post("/{lecture_id}/regenerate")
async def regenerate_final_notes(lecture_id: str, current_user: dict = Depends(get_current_user)):
    if not await regenerate_notes(current_user["user_id"], lecture_id):
        raise HTTPException(status_code=404, detail="Lecture not found or no structured notes available")
    return {"success": True, "message": "Final notes regenerated"}

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
