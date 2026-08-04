"""
Optimized LectureWeave Backend with Agentic Note Synthesis
- 20-second audio chunks for transcription
- 60-second synthesis for structured notes
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
import time
import tempfile
from pathlib import Path
from typing import Dict, List
import logging
from collections import defaultdict

# Load .env before importing settings so config values pick up local overrides.
from dotenv import load_dotenv
load_dotenv()

from app.core.config import settings

# Configure logging from centralised settings
logging.basicConfig(level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO))
logger = logging.getLogger(__name__)

# Groq key comes from settings; never printed.
GROQ_API_KEY = settings.GROQ_API_KEY

app = FastAPI(title=f"{settings.PROJECT_NAME} - Optimized Agentic Processing")

# CORS middleware — environment-controlled. Wildcard is downgraded to
# credentials=False by settings.cors_allow_credentials_effective (CORS spec
# forbids credentials + wildcard).
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list or ["http://localhost:3000"],
    allow_credentials=settings.cors_allow_credentials_effective,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import services
from app.services.transcribe_whisper import transcribe_local
from app.services.document_processor_mongodb import query_documents, process_document  # MongoDB version!
from app.services.agentic_synthesizer import synthesize_structured_notes, detect_topic_shift
from app.services.importance_scorer import score_importance

# Initialize MongoDB connection
from database.mongodb_connection import (
    init_mongodb,
    save_transcription,
    save_structured_notes,
    save_final_notes,
    create_lecture,
    user_owns_lecture
)

# Initialize MongoDB on startup
init_mongodb()
logger.info("MongoDB initialized for document storage and vector search")

# Import and include authentication routes
from app.api.auth import router as auth_router, get_current_user
from app.services.auth_service import verify_token
from app.api.notes import router as notes_router
from app.api.subjects_new import router as subjects_router
from app.api.dashboard import router as dashboard_router

app.include_router(auth_router)
app.include_router(notes_router)
app.include_router(subjects_router)
app.include_router(dashboard_router)


class OptimizedAudioProcessor:
    """Handles optimized audio processing with agentic synthesis"""
    
    def __init__(self):
        self.temp_dir = Path(tempfile.gettempdir()) / "lectureweave_audio"
        self.temp_dir.mkdir(exist_ok=True)
        
        # Buffers for each lecture
        self.transcription_buffers = defaultdict(list)  # Store transcriptions
        self.last_synthesis_time = defaultdict(float)   # Track synthesis timing
        self.structured_notes_history = defaultdict(list)  # Store generated notes
        
        # Processing queues
        self.audio_queues = defaultdict(asyncio.Queue)
        self.processing_tasks = {}
        
        logger.info("✅ Optimized audio processor initialized")
    
    async def process_audio_chunk(self, lecture_id: str, audio_file: UploadFile, websocket: WebSocket):
        """Process 20-second audio chunk"""
        try:
            # Save audio file with correct extension based on content type
            timestamp = int(time.time() * 1000)
            
            # Detect format from filename or content type
            original_filename = audio_file.filename or "audio.wav"
            extension = original_filename.split('.')[-1] if '.' in original_filename else 'wav'
            
            # Always use WAV for consistency (Web Audio API generates WAV)
            filename = f"chunk_{lecture_id}_{timestamp}.wav"
            file_path = self.temp_dir / filename
            
            with open(file_path, "wb") as f:
                content = await audio_file.read()
                f.write(content)
            
            file_size = len(content)
            logger.info(f"📥 Received audio chunk for {lecture_id}: {file_size} bytes")
            
            # Add to processing queue
            await self.audio_queues[lecture_id].put({
                "file_path": file_path,
                "timestamp": timestamp,
                "websocket": websocket
            })
            
            queue_size = self.audio_queues[lecture_id].qsize()
            logger.info(f"📊 Queue size for {lecture_id}: {queue_size}")
            
            return {"status": "queued", "size": file_size, "queue_size": queue_size}
            
        except Exception as e:
            logger.error(f"Error receiving audio chunk: {e}")
            return {"error": str(e)}
    
    async def process_lecture_audio(self, lecture_id: str):
        """Background task to process audio for a lecture"""
        logger.info(f"🎵 Started audio processing task for {lecture_id}")
        
        try:
            while True:
                # Get next audio chunk from queue
                logger.info(f"⏳ Waiting for audio chunk in queue for {lecture_id}...")
                chunk_data = await self.audio_queues[lecture_id].get()
                logger.info(f"✅ Got audio chunk from queue for {lecture_id}")
                
                file_path = chunk_data["file_path"]
                websocket = chunk_data["websocket"]
                
                # Step 1: Transcribe audio (20-second chunk)
                logger.info(f"🎤 Transcribing: {file_path.name}")
                
                try:
                    transcription_result = transcribe_local(str(file_path))
                    transcription_text = transcription_result.get("text", "").strip()
                    logger.info(f"✅ Transcription complete: {transcription_text[:50]}...")
                except Exception as trans_error:
                    logger.error(f"❌ Transcription error: {trans_error}", exc_info=True)
                    continue
                
                if not transcription_text:
                    logger.warning("⚠️  No speech detected in chunk")
                    continue
                
                # Store transcription in buffer
                transcription_data = {
                    "text": transcription_text,
                    "timestamp": chunk_data["timestamp"],
                    "language": transcription_result.get("language"),
                    "duration": transcription_result.get("duration")
                }
                
                self.transcription_buffers[lecture_id].append(transcription_data)
                
                # Step 1.5: Generate enhanced notes from transcription using RAG
                logger.info(f"📝 Generating enhanced notes with document context...")
                rag_context = await query_documents(transcription_text, lecture_id, top_k=5)
                
                from app.services.rag_generator import generate_raw_notes
                enhanced_notes = await generate_raw_notes(
                    transcription_text=transcription_text,
                    context_chunks=rag_context,
                    lecture_id=lecture_id,
                    previous_notes=[]  # Can track history if needed
                )
                
                # Save transcription to MongoDB
                chunk_index = len(self.transcription_buffers[lecture_id]) - 1
                
                # Score importance (pass dict, not string)
                importance_result = score_importance({
                    "text": transcription_text,
                    "segments": transcription_result.get("segments", [])
                })
                importance = importance_result.get("importance", 0.5)
                
                try:
                    await save_transcription(
                        lecture_id=lecture_id,
                        chunk_index=chunk_index,
                        text=transcription_text,
                        enhanced_notes=enhanced_notes,
                        timestamp=chunk_data["timestamp"],
                        importance=importance
                    )
                    logger.info(f"✅ Saved transcription to MongoDB: chunk {chunk_index}")
                except Exception as db_error:
                    logger.error(f"⚠️  Failed to save transcription to MongoDB: {db_error}")
                
                # Send enhanced notes to frontend immediately
                await websocket.send_json({
                    "type": "transcription",
                    "content": transcription_text,
                    "enhanced_notes": enhanced_notes,  # Add enhanced notes
                    "timestamp": chunk_data["timestamp"],
                    "chunk_number": len(self.transcription_buffers[lecture_id])
                })
                
                logger.info(f"✅ Transcription {len(self.transcription_buffers[lecture_id])}: {transcription_text[:50]}...")
                logger.info(f"📝 Enhanced notes: {enhanced_notes[:80]}...")
                
                # Step 2: Check if it's time to synthesize (every 60 seconds = 3 chunks)
                buffer_size = len(self.transcription_buffers[lecture_id])
                current_time = time.time()
                last_synthesis = self.last_synthesis_time[lecture_id]
                
                # Synthesize if: 3+ chunks AND (60s passed OR topic shift detected)
                should_synthesize = False
                
                if buffer_size >= 3:
                    time_since_last = current_time - last_synthesis
                    
                    if time_since_last >= 60 or last_synthesis == 0:
                        should_synthesize = True
                        logger.info(f"⏰ 60 seconds elapsed, triggering synthesis")
                    else:
                        # Check for topic shift
                        recent_transcriptions = [t["text"] for t in self.transcription_buffers[lecture_id][-3:]]
                        topic_shift = await detect_topic_shift(
                            recent_transcriptions[-1],
                            recent_transcriptions[:-1]
                        )
                        
                        if topic_shift:
                            should_synthesize = True
                            logger.info(f"🔄 Topic shift detected, triggering early synthesis")
                
                if should_synthesize:
                    await self.synthesize_notes(lecture_id, websocket)
                
                # Cleanup old audio file
                try:
                    file_path.unlink()
                except:
                    pass
                
        except asyncio.CancelledError:
            logger.info(f"🛑 Task cancelled for {lecture_id}")
            raise
        except Exception as e:
            logger.error(f"❌ Fatal error in processing task: {e}", exc_info=True)
    
    async def synthesize_notes(self, lecture_id: str, websocket: WebSocket):
        """Synthesize structured notes from accumulated transcriptions"""
        try:
            logger.info(f"🤖 Starting agentic synthesis for {lecture_id}")
            
            # Get transcriptions to synthesize (last 3 chunks = 60 seconds)
            transcriptions = self.transcription_buffers[lecture_id][-3:]
            
            if not transcriptions:
                return
            
            # Get RAG context from all transcriptions
            combined_text = " ".join([t["text"] for t in transcriptions])
            rag_context = await query_documents(combined_text, lecture_id, top_k=5)
            
            # Get previous structured notes for context
            previous_notes = None
            if self.structured_notes_history[lecture_id]:
                previous_notes = self.structured_notes_history[lecture_id][-1]
            
            # Send "processing" message
            await websocket.send_json({
                "type": "synthesis_started",
                "message": "Generating structured notes..."
            })
            
            # Synthesize structured notes
            synthesis_result = await synthesize_structured_notes(
                transcriptions=transcriptions,
                rag_context=rag_context,
                lecture_id=lecture_id,
                previous_structured_notes=previous_notes
            )
            
            if synthesis_result["success"]:
                structured_notes = synthesis_result["structured_notes"]
                
                # Store in history
                self.structured_notes_history[lecture_id].append(structured_notes)
                
                # Save structured notes to MongoDB
                try:
                    await save_structured_notes(
                        lecture_id=lecture_id,
                        content=structured_notes,
                        transcription_count=len(transcriptions)
                    )
                    logger.info(f"✅ Saved structured notes to MongoDB")
                except Exception as db_error:
                    logger.error(f"⚠️  Failed to save structured notes to MongoDB: {db_error}")
                
                # Send to frontend
                await websocket.send_json({
                    "type": "structured_notes",
                    "content": structured_notes,
                    "timestamp": int(time.time() * 1000),
                    "transcription_count": len(transcriptions)
                })
                
                logger.info(f"📝 Structured notes generated and sent")
                
                # Update last synthesis time
                self.last_synthesis_time[lecture_id] = time.time()
                
                # Clear processed transcriptions (keep last one for context)
                self.transcription_buffers[lecture_id] = self.transcription_buffers[lecture_id][-1:]
            
        except Exception as e:
            logger.error(f"Error synthesizing notes: {e}", exc_info=True)
            await websocket.send_json({
                "type": "synthesis_error",
                "error": str(e)
            })
    
    async def final_synthesis(self, lecture_id: str, websocket: WebSocket):
        """Generate final comprehensive notes from all accumulated structured notes"""
        try:
            logger.info(f"🎓 Starting final comprehensive synthesis for {lecture_id}")
            
            # Get all structured notes from history
            all_structured_notes = self.structured_notes_history[lecture_id]
            
            if not all_structured_notes:
                logger.warning(f"No structured notes to synthesize for {lecture_id}")
                return
            
            # Send "processing" message
            await websocket.send_json({
                "type": "final_synthesis_started",
                "message": "Creating comprehensive final notes..."
            })
            
            # Get RAG context from all transcriptions - use MORE context from PDF
            all_transcriptions = " ".join([t["text"] for t in self.transcription_buffers[lecture_id]])
            rag_context = await query_documents(all_transcriptions, lecture_id, top_k=15)  # Increased for more PDF content
            
            # Import and use final synthesizer
            from app.services.final_synthesizer import synthesize_final_notes
            
            final_result = await synthesize_final_notes(
                lecture_id=lecture_id,
                structured_notes_list=all_structured_notes,
                rag_context=rag_context
            )
            
            if final_result["success"]:
                # Save final notes to MongoDB
                try:
                    await save_final_notes(
                        lecture_id=lecture_id,
                        title=final_result["title"],
                        markdown=final_result["markdown"],
                        sections=final_result["sections"],
                        glossary=final_result["glossary"],
                        key_takeaways=final_result["key_takeaways"]
                    )
                    logger.info(f"✅ Saved final notes to MongoDB")
                except Exception as db_error:
                    logger.error(f"⚠️  Failed to save final notes to MongoDB: {db_error}")
                
                # Send final notes to frontend
                await websocket.send_json({
                    "type": "final_notes",
                    "title": final_result["title"],
                    "markdown": final_result["markdown"],
                    "sections": final_result["sections"],
                    "glossary": final_result["glossary"],
                    "key_takeaways": final_result["key_takeaways"],
                    "timestamp": int(time.time() * 1000)
                })
                
                logger.info(f"✅ Final comprehensive notes generated and sent")
            else:
                logger.warning(f"Final synthesis returned no results")
                
        except Exception as e:
            logger.error(f"Error in final synthesis: {e}", exc_info=True)
            await websocket.send_json({
                "type": "final_synthesis_error",
                "error": str(e)
            })


# Global processor instance
processor = OptimizedAudioProcessor()

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, lecture_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[lecture_id] = websocket
        logger.info(f"Client connected to lecture {lecture_id}")
    
    def disconnect(self, lecture_id: str):
        if lecture_id in self.active_connections:
            del self.active_connections[lecture_id]
            logger.info(f"Client disconnected from lecture {lecture_id}")
    
    async def send_message(self, lecture_id: str, message: dict):
        if lecture_id in self.active_connections:
            await self.active_connections[lecture_id].send_json(message)

manager = ConnectionManager()


# API Endpoints
@app.get("/")
async def root():
    return {"message": "LectureWeave Optimized Backend - Agentic Note Synthesis"}


# NOTE: authenticated subject endpoints are provided by app/api/subjects_new.py
# (subjects_router). The previous mock GET /api/subjects/ here was a duplicate
# that returned placeholder data and has been removed.


@app.post("/api/lectures/")
async def create_lecture_endpoint(
    data: dict,
    current_user: dict = Depends(get_current_user),
):
    """Create a new lecture owned by the authenticated user."""
    user_id = current_user["user_id"]

    # Save to MongoDB and get the generated lecture_id
    try:
        lecture_id = await create_lecture(
            user_id=user_id,
            subject_id=data.get("subject_id"),
            title=data.get("title", "New Lecture")
        )
    except Exception as e:
        logger.error(f"Error creating lecture in MongoDB: {e}")
        raise HTTPException(status_code=500, detail="Could not create lecture")

    return {
        "id": lecture_id,
        "title": data.get("title", "New Lecture"),
        "subject_id": data.get("subject_id"),
        "user_id": user_id,
        "status": "created"
    }


@app.post("/api/documents/lecture/{lecture_id}/upload")
async def upload_documents(
    lecture_id: str,
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload documents for a lecture and process them with MongoDB"""
    if not await user_owns_lecture(lecture_id, current_user["user_id"]):
        raise HTTPException(status_code=404, detail="Lecture not found or you don't have access")
    try:
        # Create upload directory
        upload_dir = Path("storage/uploads") / lecture_id
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        processed_files = []
        
        for file in files:
            # Save file
            file_path = upload_dir / file.filename
            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)
            
            logger.info(f"📄 Saved file: {file.filename}")
            
            # Process document and store in MongoDB
            result = await process_document(
                file_path=str(file_path),
                lecture_id=lecture_id,
                filename=file.filename
            )
            
            processed_files.append({
                "filename": file.filename,
                "status": "success" if result.get("success") else "failed",
                "document_id": result.get("document_id"),
                "chunk_count": result.get("chunk_count", 0)
            })
            
            logger.info(f"✅ Processed {file.filename}: {result.get('chunk_count', 0)} chunks stored in MongoDB")
        
        return {
            "message": "Documents uploaded and processed successfully",
            "lecture_id": lecture_id,
            "files": processed_files,
            "total_files": len(files)
        }
        
    except Exception as e:
        logger.error(f"❌ Error uploading documents: {e}")
        return {
            "error": str(e),
            "lecture_id": lecture_id
        }


@app.post("/api/audio/lecture/{lecture_id}/chunk")
async def receive_audio_chunk(
    lecture_id: str,
    audio_file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Receive 20-second audio chunk"""
    if not await user_owns_lecture(lecture_id, current_user["user_id"]):
        raise HTTPException(status_code=404, detail="Lecture not found or you don't have access")

    # Get websocket for this lecture
    websocket = manager.active_connections.get(lecture_id)
    
    if not websocket:
        return {"error": "No active WebSocket connection for this lecture"}
    
    result = await processor.process_audio_chunk(lecture_id, audio_file, websocket)
    return result


@app.websocket("/ws/lecture/{lecture_id}")
async def websocket_endpoint(websocket: WebSocket, lecture_id: str):
    """WebSocket endpoint for real-time updates"""
    # Browsers cannot set headers on the WS handshake, so the JWT is passed as a
    # `?token=` query param. Verify it and the lecture ownership before accepting.
    token = websocket.query_params.get("token")
    user = await verify_token(token) if token else None
    if not user or not await user_owns_lecture(lecture_id, user["user_id"]):
        await websocket.close(code=4401)
        return

    await manager.connect(lecture_id, websocket)
    
    # Cancel old task if exists (reconnection scenario)
    if lecture_id in processor.processing_tasks:
        logger.info(f"🔄 Cancelling old task for {lecture_id} (reconnection)")
        old_task = processor.processing_tasks[lecture_id]
        old_task.cancel()
        try:
            await old_task
        except asyncio.CancelledError:
            pass
        # Clear the old queue
        processor.audio_queues[lecture_id] = asyncio.Queue()
        logger.info(f"✅ Old task cancelled and queue cleared")
    
    # Start new processing task
    logger.info(f"🚀 Creating background processing task for {lecture_id}")
    task = asyncio.create_task(processor.process_lecture_audio(lecture_id))
    processor.processing_tasks[lecture_id] = task
    logger.info(f"✅ Background task created and started for {lecture_id}")
    
    try:
        # Send connection confirmation
        await websocket.send_json({
            "type": "connection_confirmed",
            "message": "WebSocket connected - Ready for optimized audio processing"
        })
        
        # Keep connection alive and handle JSON messages only
        while True:
            # Receive text message (JSON commands)
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "start_recording":
                logger.info(f"Starting recording for lecture {lecture_id}")
                await websocket.send_json({
                    "type": "recording_started",
                    "message": "Recording started - Send 20-second audio chunks via HTTP"
                })
            
            elif message.get("type") == "stop_recording":
                logger.info(f"Stopping recording for lecture {lecture_id}")
                
                # Wait a moment for final processing
                await asyncio.sleep(2)
                
                # Final synthesis if there are remaining transcriptions
                if len(processor.transcription_buffers[lecture_id]) > 0:
                    await processor.synthesize_notes(lecture_id, websocket)
                
                # FINAL COMPREHENSIVE SYNTHESIS
                logger.info(f"🎓 Starting final comprehensive synthesis for {lecture_id}")
                await processor.final_synthesis(lecture_id, websocket)
                
                await websocket.send_json({
                    "type": "recording_stopped",
                    "message": "Recording stopped"
                })
                
            elif message.get("type") == "request_final_synthesis":
                logger.info(f"Manual final synthesis requested for {lecture_id}")
                await processor.final_synthesis(lecture_id, websocket)
            
    except WebSocketDisconnect:
        manager.disconnect(lecture_id)
        
        # Don't stop task on disconnect - it will be cancelled on reconnect
        # This allows the task to continue processing queued audio
        
        logger.info(f"WebSocket disconnected for lecture {lecture_id}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.HOST, port=settings.PORT)
