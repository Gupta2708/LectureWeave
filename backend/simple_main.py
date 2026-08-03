"""
Simple FastAPI backend for testing frontend integration.
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
from typing import Dict, List

app = FastAPI(title="LectureWeave Backend - Simple")

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock data
mock_subjects = [
    {
        "id": "1",
        "name": "Machine Learning",
        "code": "CS-401",
        "description": "Introduction to machine learning algorithms and applications",
        "created_at": "2024-10-19T10:00:00Z",
        "lecture_count": 8
    },
    {
        "id": "2", 
        "name": "Data Structures",
        "code": "CS-301",
        "description": "Fundamental data structures and algorithms",
        "created_at": "2024-10-18T10:00:00Z",
        "lecture_count": 12
    },
    {
        "id": "3",
        "name": "Database Systems", 
        "code": "CS-302",
        "description": "Database design and management systems",
        "created_at": "2024-10-17T10:00:00Z",
        "lecture_count": 6
    }
]

mock_lectures = {
    "1": [
        {
            "id": "lecture-1",
            "subject_id": "1",
            "title": "Introduction to Machine Learning",
            "start_time": "2024-10-19T09:00:00Z",
            "end_time": "2024-10-19T10:30:00Z",
            "duration": 5400,
            "status": "completed",
            "created_at": "2024-10-19T09:00:00Z",
            "notes_count": 15
        }
    ]
}

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.recording_sessions: Dict[str, bool] = {}

    async def connect(self, websocket: WebSocket, lecture_id: str):
        await websocket.accept()
        self.active_connections[lecture_id] = websocket
        self.recording_sessions[lecture_id] = False
        print(f"Client connected to lecture {lecture_id}")

    def disconnect(self, lecture_id: str):
        if lecture_id in self.active_connections:
            del self.active_connections[lecture_id]
        if lecture_id in self.recording_sessions:
            del self.recording_sessions[lecture_id]
        print(f"Client disconnected from lecture {lecture_id}")

    async def send_message(self, message: dict, lecture_id: str):
        if lecture_id in self.active_connections:
            try:
                await self.active_connections[lecture_id].send_text(json.dumps(message))
            except Exception as e:
                print(f"Error sending message to {lecture_id}: {e}")
                self.disconnect(lecture_id)
    
    def start_recording(self, lecture_id: str):
        self.recording_sessions[lecture_id] = True
        
    def stop_recording(self, lecture_id: str):
        self.recording_sessions[lecture_id] = False
        
    def is_recording(self, lecture_id: str) -> bool:
        return self.recording_sessions.get(lecture_id, False)

manager = ConnectionManager()

@app.get("/")
async def root():
    return {"message": "LectureWeave Backend API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "lectureweave-backend"}

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
        "created_at": "2024-10-19T11:00:00Z",
        "notes_count": 0
    }
    
    if lecture_data["subject_id"] not in mock_lectures:
        mock_lectures[lecture_data["subject_id"]] = []
    mock_lectures[lecture_data["subject_id"]].append(new_lecture)
    
    return new_lecture

# Documents API
@app.post("/api/documents/lecture/{lecture_id}/upload")
async def upload_documents(lecture_id: str):
    # Simulate document processing
    await asyncio.sleep(2)  # Simulate processing time
    
    return {
        "message": "Documents uploaded and processed successfully",
        "lecture_id": lecture_id,
        "files_uploaded": 2,
        "processing_result": {
            "success": True,
            "chunks_count": 45,
            "documents_processed": 2
        }
    }

# WebSocket for live recording
@app.websocket("/ws/lecture/{lecture_id}")
async def websocket_endpoint(websocket: WebSocket, lecture_id: str):
    await manager.connect(websocket, lecture_id)
    
    try:
        while True:
            # Receive messages from client
            data = await websocket.receive_text()
            message = json.loads(data)
            print(f"Received WebSocket message: {message}")
            
            if message.get("type") == "connection_established":
                await manager.send_message({
                    "type": "connection_confirmed",
                    "message": "WebSocket connection established successfully"
                }, lecture_id)
                
            elif message.get("type") == "start_recording":
                print(f"Starting recording for lecture {lecture_id}")
                manager.start_recording(lecture_id)
                # Start live note generation
                asyncio.create_task(simulate_live_notes(lecture_id))
                await manager.send_message({
                    "type": "recording_started",
                    "message": "Live note generation started"
                }, lecture_id)
                
            elif message.get("type") == "stop_recording":
                print(f"Stopping recording for lecture {lecture_id}")
                manager.stop_recording(lecture_id)
                await manager.send_message({
                    "type": "recording_stopped", 
                    "message": "Live note generation stopped"
                }, lecture_id)
            
    except WebSocketDisconnect:
        print(f"WebSocket disconnected for lecture {lecture_id}")
        manager.disconnect(lecture_id)

async def simulate_live_notes(lecture_id: str):
    """Simulate real-time note generation."""
    sample_notes = [
        "- Introduction to machine learning concepts",
        "- Supervised vs unsupervised learning", 
        "- Linear regression fundamentals",
        "- Training and validation datasets",
        "- Model evaluation metrics",
        "- Cross-validation techniques",
        "- Feature engineering methods",
        "- Overfitting and underfitting",
        "- Gradient descent optimization",
        "- Neural network basics"
    ]
    
    print(f"Starting live note simulation for lecture {lecture_id}")
    
    for i, note in enumerate(sample_notes):
        # Check if still recording
        if not manager.is_recording(lecture_id):
            print(f"Recording stopped for {lecture_id}, ending note generation")
            break
            
        # Check if connection still exists
        if lecture_id not in manager.active_connections:
            print(f"Connection lost for {lecture_id}, ending note generation")
            break
            
        await asyncio.sleep(5)  # Wait 5 seconds between notes
        
        print(f"Sending note {i+1} to lecture {lecture_id}: {note}")
        
        await manager.send_message({
            "type": "live_update",
            "timestamp": f"00:{i+1:02d}:00",
            "transcription": {
                "text": f"This is sample audio transcription for segment {i+1}. The speaker is discussing important concepts.",
                "confidence": 0.95
            },
            "notes": note,
            "importance_score": 0.7 + (i % 3) * 0.1  # Vary importance between 0.7-0.9
        }, lecture_id)
    
    print(f"Finished live note simulation for lecture {lecture_id}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
