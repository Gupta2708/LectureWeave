"""
Subject API endpoints with MongoDB and Authentication
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict
from pydantic import BaseModel

from app.api.auth import get_current_user
from database.mongodb_connection import get_db
from database.subject_functions import (
    create_subject,
    get_user_subjects,
    get_subject_by_id,
    update_subject,
    delete_subject,
    get_subject_lectures
)

router = APIRouter(prefix="/api/subjects", tags=["Subjects"])

# Pydantic models
class SubjectCreate(BaseModel):
    name: str
    code: str
    description: str = ""

class SubjectUpdate(BaseModel):
    name: str = None
    code: str = None
    description: str = None

@router.post("/")
async def create_subject_endpoint(
    data: SubjectCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new subject"""
    try:
        db = get_db()
        subject = await create_subject(
            db=db,
            user_id=current_user["user_id"],
            name=data.name,
            code=data.code,
            description=data.description
        )
        
        return {
            "success": True,
            "subject": subject
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def get_subjects(current_user: dict = Depends(get_current_user)):
    """Get all subjects for current user"""
    db = get_db()
    subjects = await get_user_subjects(db, current_user["user_id"])
    
    return {
        "success": True,
        "subjects": subjects,
        "count": len(subjects)
    }

@router.get("/{subject_id}")
async def get_subject(
    subject_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific subject with its lectures"""
    db = get_db()
    subject = await get_subject_by_id(db, subject_id, current_user["user_id"])
    
    if not subject:
        raise HTTPException(
            status_code=404,
            detail="Subject not found or you don't have access"
        )
    
    return {
        "success": True,
        "subject": subject
    }

@router.put("/{subject_id}")
async def update_subject_endpoint(
    subject_id: str,
    data: SubjectUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a subject"""
    updates = {}
    if data.name is not None:
        updates["name"] = data.name
    if data.code is not None:
        updates["code"] = data.code
    if data.description is not None:
        updates["description"] = data.description
    
    if not updates:
        raise HTTPException(status_code=400, detail="No updates provided")
    
    db = get_db()
    success = await update_subject(db, subject_id, current_user["user_id"], updates)
    
    if not success:
        raise HTTPException(
            status_code=404,
            detail="Subject not found or you don't have access"
        )
    
    return {
        "success": True,
        "message": "Subject updated successfully"
    }

@router.delete("/{subject_id}")
async def delete_subject_endpoint(
    subject_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a subject"""
    db = get_db()
    success = await delete_subject(db, subject_id, current_user["user_id"])
    
    if not success:
        raise HTTPException(
            status_code=404,
            detail="Subject not found or you don't have access"
        )
    
    return {
        "success": True,
        "message": "Subject deleted successfully"
    }

@router.get("/{subject_id}/lectures")
async def get_subject_lectures_endpoint(
    subject_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all lectures for a subject"""
    db = get_db()
    lectures = await get_subject_lectures(db, subject_id, current_user["user_id"])
    
    return {
        "success": True,
        "lectures": lectures,
        "count": len(lectures)
    }
