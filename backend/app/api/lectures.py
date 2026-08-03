"""
Lectures API endpoints for LectureWeave backend.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.models.models import Lecture, Subject, Note

router = APIRouter()

# Pydantic models
class LectureCreate(BaseModel):
    subject_id: str
    title: str

class LectureResponse(BaseModel):
    id: str
    subject_id: str
    title: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    duration: Optional[int] = None
    status: str
    created_at: str
    notes_count: int = 0

    class Config:
        from_attributes = True

@router.get("/subject/{subject_id}", response_model=List[LectureResponse])
async def get_lectures_by_subject(subject_id: str, db: Session = Depends(get_db)):
    """Get all lectures for a specific subject."""
    # Verify subject exists
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    lectures = db.query(Lecture).filter(Lecture.subject_id == subject_id).all()
    
    result = []
    for lecture in lectures:
        notes_count = db.query(Note).filter(Note.lecture_id == lecture.id).count()
        
        lecture_dict = {
            "id": lecture.id,
            "subject_id": lecture.subject_id,
            "title": lecture.title,
            "start_time": lecture.start_time.isoformat() if lecture.start_time else None,
            "end_time": lecture.end_time.isoformat() if lecture.end_time else None,
            "duration": lecture.duration,
            "status": lecture.status,
            "created_at": lecture.created_at.isoformat(),
            "notes_count": notes_count
        }
        result.append(LectureResponse(**lecture_dict))
    
    return result

@router.post("/", response_model=LectureResponse)
async def create_lecture(lecture_data: LectureCreate, db: Session = Depends(get_db)):
    """Create a new lecture."""
    # Verify subject exists
    subject = db.query(Subject).filter(Subject.id == lecture_data.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    lecture = Lecture(
        subject_id=lecture_data.subject_id,
        title=lecture_data.title,
        status="created"
    )
    
    db.add(lecture)
    db.commit()
    db.refresh(lecture)
    
    return LectureResponse(
        id=lecture.id,
        subject_id=lecture.subject_id,
        title=lecture.title,
        start_time=None,
        end_time=None,
        duration=None,
        status=lecture.status,
        created_at=lecture.created_at.isoformat(),
        notes_count=0
    )

@router.get("/{lecture_id}", response_model=LectureResponse)
async def get_lecture(lecture_id: str, db: Session = Depends(get_db)):
    """Get a specific lecture by ID."""
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    
    notes_count = db.query(Note).filter(Note.lecture_id == lecture.id).count()
    
    return LectureResponse(
        id=lecture.id,
        subject_id=lecture.subject_id,
        title=lecture.title,
        start_time=lecture.start_time.isoformat() if lecture.start_time else None,
        end_time=lecture.end_time.isoformat() if lecture.end_time else None,
        duration=lecture.duration,
        status=lecture.status,
        created_at=lecture.created_at.isoformat(),
        notes_count=notes_count
    )

@router.post("/{lecture_id}/start")
async def start_lecture(lecture_id: str, db: Session = Depends(get_db)):
    """Start a lecture recording session."""
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    
    if lecture.status == "recording":
        raise HTTPException(status_code=400, detail="Lecture is already recording")
    
    lecture.status = "recording"
    lecture.start_time = datetime.utcnow()
    
    db.commit()
    db.refresh(lecture)
    
    return {
        "message": "Lecture recording started",
        "lecture_id": lecture_id,
        "start_time": lecture.start_time.isoformat()
    }

@router.post("/{lecture_id}/stop")
async def stop_lecture(lecture_id: str, db: Session = Depends(get_db)):
    """Stop a lecture recording session."""
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    
    if lecture.status != "recording":
        raise HTTPException(status_code=400, detail="Lecture is not currently recording")
    
    lecture.status = "completed"
    lecture.end_time = datetime.utcnow()
    
    if lecture.start_time:
        duration = (lecture.end_time - lecture.start_time).total_seconds()
        lecture.duration = int(duration)
    
    db.commit()
    db.refresh(lecture)
    
    return {
        "message": "Lecture recording stopped",
        "lecture_id": lecture_id,
        "end_time": lecture.end_time.isoformat(),
        "duration": lecture.duration
    }

@router.get("/{lecture_id}/notes")
async def get_lecture_notes(lecture_id: str, db: Session = Depends(get_db)):
    """Get all notes for a lecture."""
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    
    notes = db.query(Note).filter(Note.lecture_id == lecture_id).order_by(Note.created_at).all()
    
    return {
        "lecture_id": lecture_id,
        "notes_count": len(notes),
        "notes": [
            {
                "id": note.id,
                "type": note.type,
                "content": note.content,
                "chunk_start": note.chunk_start,
                "chunk_end": note.chunk_end,
                "created_at": note.created_at.isoformat()
            }
            for note in notes
        ]
    }

@router.delete("/{lecture_id}")
async def delete_lecture(lecture_id: str, db: Session = Depends(get_db)):
    """Delete a lecture."""
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    
    db.delete(lecture)
    db.commit()
    
    return {"message": "Lecture deleted successfully"}
