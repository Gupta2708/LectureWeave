"""
Subjects API endpoints for LectureWeave backend.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.core.database import get_db
from app.models.models import Subject, User

router = APIRouter()

# Pydantic models for request/response
class SubjectCreate(BaseModel):
    name: str
    code: str = None
    description: str = None

class SubjectResponse(BaseModel):
    id: str
    name: str
    code: str = None
    description: str = None
    created_at: str
    lecture_count: int = 0

    class Config:
        from_attributes = True

# Mock user ID for development (replace with actual auth)
MOCK_USER_ID = "user-123"

@router.get("/", response_model=List[SubjectResponse])
async def get_subjects(db: Session = Depends(get_db)):
    """Get all subjects for the current user."""
    subjects = db.query(Subject).filter(Subject.user_id == MOCK_USER_ID).all()
    
    # Add lecture count to each subject
    result = []
    for subject in subjects:
        subject_dict = {
            "id": subject.id,
            "name": subject.name,
            "code": subject.code,
            "description": subject.description,
            "created_at": subject.created_at.isoformat(),
            "lecture_count": len(subject.lectures)
        }
        result.append(SubjectResponse(**subject_dict))
    
    return result

@router.post("/", response_model=SubjectResponse)
async def create_subject(subject_data: SubjectCreate, db: Session = Depends(get_db)):
    """Create a new subject."""
    # Check if user exists, create if not (for development)
    user = db.query(User).filter(User.id == MOCK_USER_ID).first()
    if not user:
        user = User(
            id=MOCK_USER_ID,
            name="Test User",
            email="test@example.com"
        )
        db.add(user)
        db.commit()
    
    # Create subject
    subject = Subject(
        user_id=MOCK_USER_ID,
        name=subject_data.name,
        code=subject_data.code,
        description=subject_data.description
    )
    
    db.add(subject)
    db.commit()
    db.refresh(subject)
    
    return SubjectResponse(
        id=subject.id,
        name=subject.name,
        code=subject.code,
        description=subject.description,
        created_at=subject.created_at.isoformat(),
        lecture_count=0
    )

@router.get("/{subject_id}", response_model=SubjectResponse)
async def get_subject(subject_id: str, db: Session = Depends(get_db)):
    """Get a specific subject by ID."""
    subject = db.query(Subject).filter(
        Subject.id == subject_id,
        Subject.user_id == MOCK_USER_ID
    ).first()
    
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    return SubjectResponse(
        id=subject.id,
        name=subject.name,
        code=subject.code,
        description=subject.description,
        created_at=subject.created_at.isoformat(),
        lecture_count=len(subject.lectures)
    )

@router.put("/{subject_id}", response_model=SubjectResponse)
async def update_subject(
    subject_id: str, 
    subject_data: SubjectCreate, 
    db: Session = Depends(get_db)
):
    """Update a subject."""
    subject = db.query(Subject).filter(
        Subject.id == subject_id,
        Subject.user_id == MOCK_USER_ID
    ).first()
    
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    subject.name = subject_data.name
    subject.code = subject_data.code
    subject.description = subject_data.description
    
    db.commit()
    db.refresh(subject)
    
    return SubjectResponse(
        id=subject.id,
        name=subject.name,
        code=subject.code,
        description=subject.description,
        created_at=subject.created_at.isoformat(),
        lecture_count=len(subject.lectures)
    )

@router.delete("/{subject_id}")
async def delete_subject(subject_id: str, db: Session = Depends(get_db)):
    """Delete a subject."""
    subject = db.query(Subject).filter(
        Subject.id == subject_id,
        Subject.user_id == MOCK_USER_ID
    ).first()
    
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    db.delete(subject)
    db.commit()
    
    return {"message": "Subject deleted successfully"}
