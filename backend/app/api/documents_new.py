"""
Document upload route (MongoDB, ownership-checked).

Named `documents_new.py` to sit alongside the legacy SQLAlchemy `documents.py`
which is scheduled for removal in Commit F.
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import List

from bson import ObjectId
from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile

from app.api.auth import get_current_user
from app.core.config import settings
from app.services.document_processor_mongodb import create_pending_document, process_document
from app.services.retries import retry_document
from database.mongodb_connection import get_db, user_owns_lecture

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/documents", tags=["Documents"])


def _id_filter(value: str) -> dict:
    values = [value]
    try: values.append(ObjectId(value))
    except Exception: pass
    return {"$in": values}


@router.get("/{document_id}")
async def get_document_status(document_id: str, current_user: dict = Depends(get_current_user)):
    document = await get_db().documents.find_one({"_id": _id_filter(document_id)})
    if not document or not await user_owns_lecture(document["lecture_id"], current_user["user_id"]):
        raise HTTPException(status_code=404, detail="Document not found")
    return {"id": str(document["_id"]), "lecture_id": document["lecture_id"], "filename": document["filename"], "status": document.get("status", "uploaded"), "error": document.get("error"), "retry_count": document.get("retry_count", 0), "page_count": document.get("page_count"), "slide_count": document.get("slide_count")}


@router.post("/{document_id}/retry")
async def retry_document_processing(document_id: str, current_user: dict = Depends(get_current_user)):
    if not await retry_document(current_user["user_id"], document_id):
        raise HTTPException(status_code=404, detail="Document not found or retry limit reached")
    return {"success": True, "message": "Document retry queued"}


@router.post("/lecture/{lecture_id}/upload")
async def upload_documents(
    lecture_id: str,
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload documents for a lecture.

    Persists each file and returns immediately with a document id and a
    ``uploaded`` status. Extraction/chunking/embedding run in the background so
    the client can poll GET /api/documents/{id} and show live progress instead
    of blocking on a slow embedding step. Identical re-uploads within the same
    lecture reuse the already-processed document.
    """
    if not await user_owns_lecture(lecture_id, current_user["user_id"]):
        raise HTTPException(status_code=404, detail="Lecture not found or you don't have access")

    try:
        upload_dir = Path(settings.UPLOAD_DIR) / lecture_id
        upload_dir.mkdir(parents=True, exist_ok=True)

        queued_files = []
        for file in files:
            file_path = upload_dir / file.filename
            content = await file.read()
            with open(file_path, "wb") as f:
                f.write(content)

            document_id, already_ready = await create_pending_document(
                str(file_path), lecture_id, file.filename
            )
            if not already_ready:
                background_tasks.add_task(
                    process_document, str(file_path), lecture_id, file.filename, document_id=document_id
                )

            queued_files.append(
                {
                    "filename": file.filename,
                    "status": "ready" if already_ready else "uploaded",
                    "document_id": document_id,
                }
            )

        return {
            "message": "Documents received; processing in the background",
            "lecture_id": lecture_id,
            "files": queued_files,
            "total_files": len(files),
        }

    except Exception as e:
        logger.error("Error uploading documents: %s", e)
        return {"error": str(e), "lecture_id": lecture_id}
