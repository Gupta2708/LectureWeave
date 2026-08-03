"""
Documents API endpoints for LectureWeave backend.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from pathlib import Path
import shutil
import os
from datetime import datetime

from app.core.database import get_db
from app.core.config import settings
from app.models.models import Document, Lecture
from app.services.document_processor import build_faiss_for_lecture

router = APIRouter()

@router.post("/lecture/{lecture_id}/upload")
async def upload_documents(
    lecture_id: str,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """Upload documents for a lecture and process them."""
    # Verify lecture exists
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    
    # Create upload directory for this lecture
    upload_dir = Path(settings.UPLOAD_DIR) / lecture_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    uploaded_files = []
    file_paths = []
    
    for file in files:
        # Validate file type
        allowed_extensions = {'.pdf', '.pptx', '.docx', '.doc', '.txt'}
        file_extension = Path(file.filename).suffix.lower()
        
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"File type {file_extension} not supported. Allowed: {allowed_extensions}"
            )
        
        # Save file
        file_path = upload_dir / file.filename
        
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Create database record
            document = Document(
                lecture_id=lecture_id,
                filename=file.filename,
                file_path=str(file_path),
                file_size=file_path.stat().st_size,
                mime_type=file.content_type,
                status="uploaded"
            )
            
            db.add(document)
            file_paths.append(str(file_path))
            uploaded_files.append({
                "filename": file.filename,
                "size": document.file_size,
                "type": file.content_type
            })
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error saving file {file.filename}: {str(e)}")
    
    # Commit all document records
    db.commit()
    
    # Process documents and build FAISS index
    try:
        processing_result = await build_faiss_for_lecture(lecture_id, file_paths)
        
        # Update document status
        documents = db.query(Document).filter(Document.lecture_id == lecture_id).all()
        for document in documents:
            document.status = "processed"
            document.processed_at = datetime.utcnow()
        
        db.commit()
        
        return {
            "message": "Documents uploaded and processed successfully",
            "lecture_id": lecture_id,
            "files_uploaded": len(uploaded_files),
            "files": uploaded_files,
            "processing_result": processing_result
        }
        
    except Exception as e:
        # Update document status to error
        documents = db.query(Document).filter(Document.lecture_id == lecture_id).all()
        for document in documents:
            document.status = "error"
        
        db.commit()
        
        raise HTTPException(status_code=500, detail=f"Error processing documents: {str(e)}")

@router.get("/lecture/{lecture_id}")
async def get_lecture_documents(lecture_id: str, db: Session = Depends(get_db)):
    """Get all documents for a lecture."""
    # Verify lecture exists
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    
    documents = db.query(Document).filter(Document.lecture_id == lecture_id).all()
    
    return {
        "lecture_id": lecture_id,
        "documents_count": len(documents),
        "documents": [
            {
                "id": document.id,
                "filename": document.filename,
                "file_size": document.file_size,
                "mime_type": document.mime_type,
                "status": document.status,
                "processed_at": document.processed_at.isoformat() if document.processed_at else None,
                "created_at": document.created_at.isoformat() if document.created_at else None
            }
            for document in documents
        ]
    }

@router.get("/{document_id}")
async def get_document(document_id: str, db: Session = Depends(get_db)):
    """Get document details."""
    document = db.query(Document).filter(Document.id == document_id).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {
        "id": document.id,
        "lecture_id": document.lecture_id,
        "filename": document.filename,
        "file_path": document.file_path,
        "file_size": document.file_size,
        "mime_type": document.mime_type,
        "status": document.status,
        "processed_at": document.processed_at.isoformat() if document.processed_at else None,
        "created_at": document.created_at.isoformat() if document.created_at else None
    }

@router.delete("/{document_id}")
async def delete_document(document_id: str, db: Session = Depends(get_db)):
    """Delete a document."""
    document = db.query(Document).filter(Document.id == document_id).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete file from filesystem
    try:
        file_path = Path(document.file_path)
        if file_path.exists():
            file_path.unlink()
    except Exception as e:
        print(f"Error deleting file {document.file_path}: {e}")
    
    # Delete from database
    db.delete(document)
    db.commit()
    
    return {"message": "Document deleted successfully"}

@router.get("/lecture/{lecture_id}/processing-status")
async def get_processing_status(lecture_id: str, db: Session = Depends(get_db)):
    """Get document processing status for a lecture."""
    documents = db.query(Document).filter(Document.lecture_id == lecture_id).all()
    
    if not documents:
        return {
            "lecture_id": lecture_id,
            "status": "no_documents",
            "message": "No documents uploaded for this lecture"
        }
    
    status_counts = {}
    for document in documents:
        status = document.status
        status_counts[status] = status_counts.get(status, 0) + 1
    
    # Determine overall status
    if all(doc.status == "processed" for doc in documents):
        overall_status = "completed"
    elif any(doc.status == "processing" for doc in documents):
        overall_status = "processing"
    elif any(doc.status == "error" for doc in documents):
        overall_status = "error"
    else:
        overall_status = "uploaded"
    
    return {
        "lecture_id": lecture_id,
        "overall_status": overall_status,
        "documents_count": len(documents),
        "status_breakdown": status_counts,
        "documents": [
            {
                "id": doc.id,
                "filename": doc.filename,
                "status": doc.status
            }
            for doc in documents
        ]
    }
