"""
Real LectureWeave Backend with Audio Processing
This version processes actual audio input instead of simulation
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
import os
import time
import tempfile
from pathlib import Path
from typing import Dict, List
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

HF_TOKEN = os.getenv("HF_TOKEN", "your_huggingface_token_here")  # HuggingFace token for private models
GROQ_API_KEY = os.getenv("GROQ_API_KEY")  # Groq API key from environment

app = FastAPI(title="LectureWeave Backend - Real Audio Processing")

# CORS middleware - More permissive for WebSocket connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock data for subjects and lectures
mock_subjects = [
    {"id": "1", "name": "Machine Learning", "code": "CS-401", "description": "ML course", "created_at": "2024-10-19T10:00:00Z", "lecture_count": 8},
    {"id": "2", "name": "Data Structures", "code": "CS-301", "description": "DS course", "created_at": "2024-10-18T10:00:00Z", "lecture_count": 12},
    {"id": "3", "name": "Database Systems", "code": "CS-302", "description": "DB course", "created_at": "2024-10-17T10:00:00Z", "lecture_count": 6}
]

mock_lectures = {"1": [{"id": "lecture-1", "subject_id": "1", "title": "Introduction to ML", "status": "completed", "created_at": "2024-10-19T09:00:00Z", "notes_count": 15}]}

class AudioProcessor:
    """Handles real audio processing pipeline using your existing services"""
    
    def __init__(self):
        self.temp_dir = Path(tempfile.gettempdir()) / "lectureweave_audio"
        self.temp_dir.mkdir(exist_ok=True)
        
        # Import your existing services
        import sys
        sys.path.append(str(Path(__file__).parent))
        
        try:
            from app.services.transcribe_whisper import transcribe_audio_chunk
            from app.services.importance_scorer import score_importance
            from app.services.rag_generator import generate_raw_notes
            
            self.transcribe_audio_chunk = transcribe_audio_chunk
            self.score_importance = score_importance
            self.generate_raw_notes = generate_raw_notes
            self.services_available = True
            logger.info("✅ Audio processing services loaded successfully")
            
        except Exception as e:
            logger.warning(f"⚠️ Could not load audio services: {e}")
            logger.info("📝 Using fallback processing (install dependencies for full functionality)")
            self.services_available = False
        
    async def process_audio_chunk(self, audio_data: bytes, lecture_id: str) -> dict:
        """Process audio chunk and return transcription + notes"""
        try:
            # Save audio chunk to temporary file
            timestamp = int(time.time() * 1000)
            webm_file = self.temp_dir / f"chunk_{lecture_id}_{timestamp}.webm"
            wav_file = self.temp_dir / f"chunk_{lecture_id}_{timestamp}.wav"
            
            with open(webm_file, "wb") as f:
                f.write(audio_data)
            
            logger.info(f"🎵 Processing audio chunk: {webm_file} ({len(audio_data)} bytes)")
            
            if self.services_available:
                # Use your real audio processing pipeline
                try:
                    # Step 1: Convert audio to WAV for Whisper
                    logger.info("🔄 Converting audio to WAV...")
                    await self._convert_audio(webm_file, wav_file)
                    
                    # Step 2: Transcribe with Whisper
                    logger.info("🎤 Transcribing audio with Whisper...")
                    transcription_result = await self.transcribe_audio_chunk(str(wav_file))
                    
                    # Step 3: Score importance
                    logger.info("📊 Scoring importance...")
                    importance_result = self.score_importance(transcription_result)
                    
                    # Step 4: Generate notes using Groq API (now that we have the key)
                    logger.info("🤖 Generating AI notes...")
                    transcription_text = transcription_result.get("text", "").strip()
                    
                    if transcription_text:
                        # Query documents for context
                        from app.services.document_processor import query_documents
                        context_chunks = query_documents(transcription_text, lecture_id, top_k=5)
                        
                        # Use enhanced RAG notes generation with document context
                        notes = await self.generate_raw_notes(
                            transcription_text=transcription_text,
                            context_chunks=context_chunks,
                            lecture_id=lecture_id,
                            previous_notes=[]  # Can add history tracking later
                        )
                        logger.info(f"📝 Generated enhanced notes from transcription: '{transcription_text[:30]}...'")
                    else:
                        notes = "- No clear speech detected in this audio segment"
                    
                    # Cleanup temporary files
                    try:
                        webm_file.unlink(missing_ok=True)
                        wav_file.unlink(missing_ok=True)
                    except:
                        pass
                    
                    logger.info(f"✅ Audio processing complete: '{transcription_text[:50]}...'")
                    
                    return {
                        "transcription": {
                            "text": transcription_text,
                            "confidence": 0.95,  # Whisper doesn't provide confidence directly
                            "language": transcription_result.get("language", "en"),
                            "segments": transcription_result.get("segments", [])
                        },
                        "importance_score": importance_result.get("importance", 0.5),
                        "notes": notes,
                        "processing_time": 2.0,
                        "audio_file": str(wav_file),
                        "word_count": importance_result.get("word_count", 0),
                        "duration": importance_result.get("duration", 0)
                    }
                    
                except Exception as processing_error:
                    logger.error(f"❌ Error in audio processing pipeline: {processing_error}")
                    # Fall back to basic processing
                    return await self._fallback_processing(webm_file, lecture_id, len(audio_data))
            else:
                # Use fallback processing
                return await self._fallback_processing(webm_file, lecture_id, len(audio_data))
            
        except Exception as e:
            logger.error(f"❌ Error processing audio chunk: {e}")
            return {
                "error": str(e),
                "transcription": {"text": "Error processing audio", "confidence": 0.0},
                "importance_score": 0.0,
                "notes": "- Error: Could not process audio chunk"
            }
    
    async def _convert_audio(self, input_file: Path, wav_file: Path):
        """Convert audio file (WebM/WAV) to WAV format for Whisper with robust error handling"""
        try:
            # Check file size
            if input_file.stat().st_size < 500:
                raise Exception("Audio file too small")
            
            # If it's already a WAV file, just copy it
            if input_file.suffix.lower() == '.wav':
                logger.info("✅ Input is already WAV, copying...")
                import shutil
                shutil.copy2(input_file, wav_file)
                return
            
            from pydub import AudioSegment
            
            # Try multiple approaches for audio conversion
            audio = None
            
            # Approach 1: Try ffmpeg with more robust options
            try:
                import subprocess
                # More robust ffmpeg command for corrupted WebM files
                result = subprocess.run([
                    'ffmpeg', '-err_detect', 'ignore_err', '-i', str(input_file), 
                    '-ar', '16000', '-ac', '1', '-acodec', 'pcm_s16le',
                    '-f', 'wav', str(wav_file), '-y'
                ], capture_output=True, text=True, timeout=20)
                
                if result.returncode == 0 and wav_file.exists() and wav_file.stat().st_size > 1000:
                    logger.info("✅ Audio converted using robust ffmpeg")
                    return
                else:
                    logger.warning(f"Robust FFmpeg failed: {result.stderr[:200]}")
                    
                    # Try with even more error tolerance
                    result2 = subprocess.run([
                        'ffmpeg', '-f', 'webm', '-err_detect', 'ignore_err', 
                        '-fflags', '+igndts+ignidx', '-i', str(input_file), 
                        '-ar', '16000', '-ac', '1', '-acodec', 'pcm_s16le',
                        '-f', 'wav', str(wav_file), '-y'
                    ], capture_output=True, text=True, timeout=20)
                    
                    if result2.returncode == 0 and wav_file.exists() and wav_file.stat().st_size > 1000:
                        logger.info("✅ Audio converted using ultra-robust ffmpeg")
                        return
                    else:
                        logger.warning(f"Ultra-robust FFmpeg also failed: {result2.stderr[:200]}")
                    
            except Exception as e1:
                logger.warning(f"FFmpeg conversion failed: {e1}")
            
            # Approach 2: Direct audio loading with pydub
            try:
                # Determine format from file extension
                file_format = input_file.suffix.lower().replace('.', '')
                if file_format == 'webm':
                    audio = AudioSegment.from_file(str(input_file), format="webm")
                else:
                    audio = AudioSegment.from_file(str(input_file))
                logger.info(f"✅ Audio loaded directly with pydub ({file_format})")
            except Exception as e2:
                logger.warning(f"Direct audio loading failed: {e2}")
                
                # Approach 3: Try as raw audio
                try:
                    audio = AudioSegment.from_file(str(input_file))
                    logger.info("✅ Audio loaded as raw audio")
                except Exception as e3:
                    logger.warning(f"Raw audio loading failed: {e3}")
                    raise Exception("All conversion methods failed")
            
            if audio:
                # Convert to Whisper-friendly format
                audio = audio.set_frame_rate(16000).set_channels(1)
                
                # Check if audio has content
                if len(audio) < 100:  # Less than 100ms
                    raise Exception("Audio too short or empty")
                
                audio.export(str(wav_file), format="wav")
                logger.info(f"✅ Audio converted: {len(audio)}ms duration")
            
        except Exception as e:
            logger.error(f"❌ Audio conversion error: {e}")
            raise e  # Re-raise to trigger fallback processing
    
    
    def _generate_simple_notes(self, transcription_text: str, importance_result: dict) -> str:
        """Generate simple notes without using Groq API"""
        import re
        
        # Extract key phrases and concepts
        sentences = re.split(r'[.!?]+', transcription_text)
        notes = []
        
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) > 10:  # Skip very short fragments
                # Add bullet point for each meaningful sentence
                if any(keyword in sentence.lower() for keyword in ['important', 'key', 'remember', 'note', 'concept', 'definition']):
                    notes.append(f"🔑 {sentence}")
                elif any(keyword in sentence.lower() for keyword in ['algorithm', 'method', 'approach', 'technique']):
                    notes.append(f"⚙️ {sentence}")
                elif any(keyword in sentence.lower() for keyword in ['example', 'instance', 'case']):
                    notes.append(f"💡 {sentence}")
                else:
                    notes.append(f"- {sentence}")
        
        if not notes:
            # Fallback: just break into bullet points
            words = transcription_text.split()
            if len(words) > 5:
                notes.append(f"- {transcription_text}")
            else:
                notes.append("- Brief audio segment processed")
        
        # Add importance indicator
        importance_score = importance_result.get("importance", 0.5)
        if importance_score > 0.7:
            notes.insert(0, "🔥 HIGH IMPORTANCE")
        elif importance_score > 0.4:
            notes.insert(0, "⚡ MEDIUM IMPORTANCE")
        
        return "\n".join(notes[:5])  # Limit to 5 bullet points
    
    async def _fallback_processing(self, audio_file: Path, lecture_id: str, audio_size: int) -> dict:
        """Fallback processing when full pipeline is not available"""
        await asyncio.sleep(1)  # Simulate processing time
        
        return {
            "transcription": {
                "text": f"[Fallback] Audio chunk received and saved. Install Whisper dependencies for real transcription. File: {audio_file.name}",
                "confidence": 0.0,
                "language": "en"
            },
            "importance_score": 0.5,
            "notes": f"- Audio chunk processed at {time.strftime('%H:%M:%S')}\n- File size: {audio_size} bytes\n- Install dependencies for real transcription",
            "processing_time": 1.0,
            "audio_file": str(audio_file)
        }

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.recording_sessions: Dict[str, bool] = {}
        self.audio_processor = AudioProcessor()
        self.processing_queues: Dict[str, asyncio.Queue] = {}  # Per-lecture processing queue
        self.processing_tasks: Dict[str, asyncio.Task] = {}   # Background processing tasks

    async def connect(self, websocket: WebSocket, lecture_id: str):
        await websocket.accept()
        self.active_connections[lecture_id] = websocket
        self.recording_sessions[lecture_id] = False
        logger.info(f"Client connected to lecture {lecture_id}")

    def disconnect(self, lecture_id: str):
        if lecture_id in self.active_connections:
            del self.active_connections[lecture_id]
        if lecture_id in self.recording_sessions:
            del self.recording_sessions[lecture_id]
        logger.info(f"Client disconnected from lecture {lecture_id}")

    async def send_message(self, message: dict, lecture_id: str):
        if lecture_id in self.active_connections:
            try:
                await self.active_connections[lecture_id].send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error sending message to {lecture_id}: {e}")
                self.disconnect(lecture_id)
    
    def start_recording(self, lecture_id: str):
        self.recording_sessions[lecture_id] = True
        
    def stop_recording(self, lecture_id: str):
        self.recording_sessions[lecture_id] = False
        
    def is_recording(self, lecture_id: str) -> bool:
        return self.recording_sessions.get(lecture_id, False)
    
    async def process_audio_data(self, audio_data: bytes, lecture_id: str):
        """Queue audio data for processing to avoid conflicts"""
        if not self.is_recording(lecture_id):
            return
        
        # Create processing queue for this lecture if it doesn't exist
        if lecture_id not in self.processing_queues:
            self.processing_queues[lecture_id] = asyncio.Queue()
            # Start background processing task
            self.processing_tasks[lecture_id] = asyncio.create_task(
                self._process_audio_queue(lecture_id)
            )
        
        # Add audio data to queue (non-blocking)
        try:
            self.processing_queues[lecture_id].put_nowait((audio_data, time.time()))
            logger.info(f"📥 Audio queued for lecture {lecture_id} (queue size: {self.processing_queues[lecture_id].qsize()})")
        except asyncio.QueueFull:
            logger.warning(f"⚠️ Processing queue full for lecture {lecture_id}, dropping audio chunk")
    
    async def _process_audio_queue(self, lecture_id: str):
        """Background task to process audio queue sequentially"""
        queue = self.processing_queues[lecture_id]
        
        while self.is_recording(lecture_id) or not queue.empty():
            try:
                # Wait for audio data with timeout
                audio_data, timestamp = await asyncio.wait_for(queue.get(), timeout=5.0)
                
                # Skip old audio chunks (older than 30 seconds)
                if time.time() - timestamp > 30:
                    logger.warning(f"⏰ Skipping old audio chunk for lecture {lecture_id}")
                    continue
                
                logger.info(f"🎵 Processing queued audio for lecture {lecture_id}")
                
                # Process the audio chunk
                result = await self.audio_processor.process_audio_chunk(audio_data, lecture_id)
                
                # Send live update
                await self.send_message({
                    "type": "live_update",
                    "timestamp": time.strftime("%H:%M:%S"),
                    "transcription": result["transcription"],
                    "notes": result["notes"],
                    "importance_score": result["importance_score"],
                    "processing_time": result.get("processing_time", 0)
                }, lecture_id)
                
                # Small delay to prevent overwhelming
                await asyncio.sleep(1)
                
            except asyncio.TimeoutError:
                # No new audio data, continue waiting
                continue
            except Exception as e:
                logger.error(f"❌ Error in audio processing queue for {lecture_id}: {e}")
                continue
        
        # Cleanup when done
        if lecture_id in self.processing_queues:
            del self.processing_queues[lecture_id]
        if lecture_id in self.processing_tasks:
            del self.processing_tasks[lecture_id]
        
        logger.info(f"🏁 Audio processing queue finished for lecture {lecture_id}")

manager = ConnectionManager()

@app.get("/")
async def root():
    return {"message": "LectureWeave Backend - Real Audio Processing", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "lectureweave-backend-real"}

# Subjects API
@app.get("/api/subjects/")
async def get_subjects():
    return mock_subjects

@app.get("/api/subjects/{subject_id}")
async def get_subject(subject_id: str):
    subject = next((s for s in mock_subjects if s["id"] == subject_id), None)
    if not subject:
        return {"error": "Subject not found"}, 404
    return subject

# Lectures API
@app.get("/api/lectures/subject/{subject_id}")
async def get_lectures_by_subject(subject_id: str):
    return mock_lectures.get(subject_id, [])

@app.post("/api/lectures/")
async def create_lecture(lecture_data: dict):
    lecture_id = f"lecture-{len(mock_lectures) + 1}"
    new_lecture = {
        "id": lecture_id,
        "subject_id": lecture_data["subject_id"],
        "title": lecture_data["title"],
        "status": "created",
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "notes_count": 0
    }
    
    if lecture_data["subject_id"] not in mock_lectures:
        mock_lectures[lecture_data["subject_id"]] = []
    mock_lectures[lecture_data["subject_id"]].append(new_lecture)
    
    return new_lecture

# Documents API
@app.post("/api/documents/lecture/{lecture_id}/upload")
async def upload_documents(lecture_id: str):
    await asyncio.sleep(2)  # Simulate processing
    return {
        "message": "Documents uploaded and processed successfully",
        "lecture_id": lecture_id,
        "files_uploaded": 2,
        "processing_result": {"success": True, "chunks_count": 45, "documents_processed": 2}
    }

# Audio upload endpoint for real audio processing
@app.post("/api/audio/lecture/{lecture_id}/chunk")
async def upload_audio_chunk(lecture_id: str, audio_file: UploadFile = File(...)):
    """Handle real audio chunk upload"""
    try:
        # Read audio data
        audio_data = await audio_file.read()
        logger.info(f"Received audio chunk for lecture {lecture_id}: {len(audio_data)} bytes")
        
        # Process the audio
        await manager.process_audio_data(audio_data, lecture_id)
        
        return {
            "success": True,
            "message": "Audio chunk processed",
            "lecture_id": lecture_id,
            "chunk_size": len(audio_data)
        }
        
    except Exception as e:
        logger.error(f"Error processing audio chunk: {e}")
        return {"error": str(e)}, 500

# WebSocket for live recording
@app.websocket("/ws/lecture/{lecture_id}")
async def websocket_endpoint(websocket: WebSocket, lecture_id: str):
    await manager.connect(websocket, lecture_id)
    
    try:
        while True:
            # Handle both text and binary messages
            try:
                # Try to receive text message first
                data = await websocket.receive_text()
                message = json.loads(data)
                logger.info(f"Received WebSocket text message: {message}")
                
                if message.get("type") == "connection_established":
                    await manager.send_message({
                        "type": "connection_confirmed",
                        "message": "WebSocket connection established - ready for real audio processing"
                    }, lecture_id)
                    
                elif message.get("type") == "start_recording":
                    logger.info(f"Starting real audio recording for lecture {lecture_id}")
                    manager.start_recording(lecture_id)
                    await manager.send_message({
                        "type": "recording_started",
                        "message": "Real audio processing started - send audio chunks via /api/audio/lecture/{lecture_id}/chunk"
                    }, lecture_id)
                    
                elif message.get("type") == "stop_recording":
                    logger.info(f"Stopping recording for lecture {lecture_id}")
                    manager.stop_recording(lecture_id)
                    await manager.send_message({
                        "type": "recording_stopped", 
                        "message": "Audio processing stopped"
                    }, lecture_id)
                    
            except Exception as text_error:
                # If text message fails, try binary (for audio data)
                try:
                    audio_data = await websocket.receive_bytes()
                    logger.info(f"Received audio data via WebSocket: {len(audio_data)} bytes")
                    await manager.process_audio_data(audio_data, lecture_id)
                except Exception as binary_error:
                    logger.error(f"Error processing WebSocket message: text={text_error}, binary={binary_error}")
            
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for lecture {lecture_id}")
        manager.disconnect(lecture_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
