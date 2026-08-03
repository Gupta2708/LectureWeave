"""
Live recording API with WebSocket support for real-time note generation.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
import json
import asyncio
import os
import time
from pathlib import Path
from typing import Dict, Any

from app.core.database import get_db
from app.core.config import settings
from app.models.models import Lecture, Transcription, Note
from app.services.transcribe_whisper import transcribe_audio_chunk
from app.services.document_processor import query_documents
from app.services.audio_processor import denoise_audio
from app.services.rag_generator import generate_raw_notes
from app.services.importance_scorer import score_importance

router = APIRouter()

# Store active recording sessions
active_sessions: Dict[str, Dict] = {}

class LiveRecordingManager:
    def __init__(self):
        self.connections: Dict[str, WebSocket] = {}
        self.sessions: Dict[str, Dict] = {}

    async def connect(self, websocket: WebSocket, lecture_id: str):
        await websocket.accept()
        self.connections[lecture_id] = websocket
        print(f"Client connected for lecture {lecture_id}")

    def disconnect(self, lecture_id: str):
        if lecture_id in self.connections:
            del self.connections[lecture_id]
        if lecture_id in self.sessions:
            del self.sessions[lecture_id]
        print(f"Client disconnected from lecture {lecture_id}")

    async def send_update(self, lecture_id: str, data: Dict[str, Any]):
        if lecture_id in self.connections:
            try:
                await self.connections[lecture_id].send_text(json.dumps(data))
            except:
                # Connection broken, remove it
                self.disconnect(lecture_id)

manager = LiveRecordingManager()

@router.websocket("/lecture/{lecture_id}")
async def websocket_live_recording(websocket: WebSocket, lecture_id: str):
    await manager.connect(websocket, lecture_id)
    
    try:
        while True:
            # Receive audio data or commands from client
            message = await websocket.receive_text()
            data = json.loads(message)
            
            if data.get("type") == "start_recording":
                await handle_start_recording(lecture_id, data)
            elif data.get("type") == "stop_recording":
                await handle_stop_recording(lecture_id)
            elif data.get("type") == "audio_chunk":
                await handle_audio_chunk(lecture_id, data)
                
    except WebSocketDisconnect:
        manager.disconnect(lecture_id)

async def handle_start_recording(lecture_id: str, data: Dict):
    """Initialize recording session."""
    session_data = {
        "lecture_id": lecture_id,
        "title": data.get("title", "Untitled Lecture"),
        "start_time": time.time(),
        "chunk_count": 0,
        "audio_dir": Path(settings.AUDIO_DIR) / lecture_id
    }
    
    # Create audio directory
    session_data["audio_dir"].mkdir(parents=True, exist_ok=True)
    
    manager.sessions[lecture_id] = session_data
    
    await manager.send_update(lecture_id, {
        "type": "recording_started",
        "message": "Recording session initialized",
        "session_id": lecture_id
    })

async def handle_stop_recording(lecture_id: str):
    """Stop recording session."""
    if lecture_id in manager.sessions:
        session = manager.sessions[lecture_id]
        session["end_time"] = time.time()
        
        await manager.send_update(lecture_id, {
            "type": "recording_stopped",
            "message": "Recording session ended",
            "duration": session["end_time"] - session["start_time"]
        })

@router.post("/lecture/{lecture_id}/audio-chunk")
async def upload_audio_chunk(
    lecture_id: str,
    audio_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Process uploaded audio chunk and return real-time transcription and notes.
    """
    try:
        # Save audio chunk
        timestamp = int(time.time() * 1000)
        chunk_filename = f"chunk_{timestamp}.wav"
        audio_dir = Path(settings.AUDIO_DIR) / lecture_id
        audio_dir.mkdir(parents=True, exist_ok=True)
        
        chunk_path = audio_dir / chunk_filename
        
        # Save uploaded file
        with open(chunk_path, "wb") as f:
            content = await audio_file.read()
            f.write(content)
        
        # Process audio chunk
        result = await process_audio_chunk(lecture_id, str(chunk_path), db)
        
        # Send real-time update via WebSocket
        await manager.send_update(lecture_id, {
            "type": "live_update",
            "timestamp": timestamp,
            "transcription": result.get("transcription", {}),
            "notes": result.get("notes", {}),
            "importance_score": result.get("importance_score", 0)
        })
        
        return result
        
    except Exception as e:
        print(f"Error processing audio chunk: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def process_audio_chunk(lecture_id: str, audio_path: str, db: Session) -> Dict[str, Any]:
    """
    Complete audio processing pipeline for a single chunk.
    """
    try:
        # 1. Denoise audio (if needed)
        cleaned_path = audio_path.replace(".wav", "_cleaned.wav")
        denoise_result = denoise_audio(audio_path, cleaned_path)
        
        # 2. Transcribe with Whisper
        transcription = await transcribe_audio_chunk(cleaned_path)
        
        if not transcription.get("text", "").strip():
            return {"error": "No speech detected in audio chunk"}
        
        # 3. Score importance
        importance_data = score_importance(transcription)
        
        # 4. Query documents for context
        context_chunks = query_documents(transcription["text"], lecture_id, top_k=3)
        
        # 5. Generate raw notes using RAG
        raw_notes = await generate_raw_notes(
            transcription_text=transcription["text"],
            context_chunks=context_chunks,
            lecture_id=lecture_id
        )
        
        # 6. Save to database
        # Save transcription
        transcription_record = Transcription(
            lecture_id=lecture_id,
            chunk_number=get_next_chunk_number(lecture_id, db),
            timestamp_start=transcription.get("segments", [{}])[0].get("start", 0),
            timestamp_end=transcription.get("segments", [{}])[-1].get("end", 0),
            text=transcription["text"],
            importance_score=importance_data.get("importance", 0)
        )
        db.add(transcription_record)
        
        # Save raw notes
        note_record = Note(
            lecture_id=lecture_id,
            type="raw",
            content={
                "notes": raw_notes,
                "context": context_chunks,
                "transcription": transcription["text"]
            },
            chunk_start=transcription.get("segments", [{}])[0].get("start", 0),
            chunk_end=transcription.get("segments", [{}])[-1].get("end", 0)
        )
        db.add(note_record)
        db.commit()
        
        return {
            "success": True,
            "transcription": transcription,
            "importance_score": importance_data.get("importance", 0),
            "context_chunks": context_chunks,
            "notes": raw_notes,
            "chunk_id": transcription_record.id
        }
        
    except Exception as e:
        print(f"Error in process_audio_chunk: {e}")
        return {"error": str(e)}

def get_next_chunk_number(lecture_id: str, db: Session) -> int:
    """Get the next chunk number for a lecture."""
    last_chunk = db.query(Transcription).filter(
        Transcription.lecture_id == lecture_id
    ).order_by(Transcription.chunk_number.desc()).first()
    
    return (last_chunk.chunk_number + 1) if last_chunk else 1

@router.get("/lecture/{lecture_id}/status")
async def get_recording_status(lecture_id: str):
    """Get current recording status."""
    if lecture_id in manager.sessions:
        session = manager.sessions[lecture_id]
        return {
            "status": "recording",
            "title": session["title"],
            "duration": time.time() - session["start_time"],
            "chunks_processed": session["chunk_count"]
        }
    else:
        return {"status": "not_recording"}

@router.get("/lecture/{lecture_id}/notes/live")
async def get_live_notes(lecture_id: str, db: Session = Depends(get_db)):
    """Get all notes generated so far for a lecture."""
    notes = db.query(Note).filter(
        Note.lecture_id == lecture_id,
        Note.type == "raw"
    ).order_by(Note.created_at).all()
    
    return {
        "lecture_id": lecture_id,
        "notes_count": len(notes),
        "notes": [
            {
                "id": note.id,
                "content": note.content,
                "timestamp": note.created_at.isoformat(),
                "chunk_start": note.chunk_start,
                "chunk_end": note.chunk_end
            }
            for note in notes
        ]
    }
