from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import json
import asyncio
from typing import Dict, List
import logging

from app.api import subjects, lectures, documents, live_recording
from app.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="LectureWeave Backend",
    description="AI-powered lecture note generation system",
    version="1.0.0"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for serving uploaded documents
app.mount("/storage", StaticFiles(directory="storage"), name="storage")

# Include API routers
app.include_router(subjects.router, prefix="/api/subjects", tags=["subjects"])
app.include_router(lectures.router, prefix="/api/lectures", tags=["lectures"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(live_recording.router, prefix="/api/live", tags=["live-recording"])

# WebSocket connection manager for live updates
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, lecture_id: str):
        await websocket.accept()
        if lecture_id not in self.active_connections:
            self.active_connections[lecture_id] = []
        self.active_connections[lecture_id].append(websocket)
        logger.info(f"Client connected to lecture {lecture_id}")

    def disconnect(self, websocket: WebSocket, lecture_id: str):
        if lecture_id in self.active_connections:
            self.active_connections[lecture_id].remove(websocket)
            if not self.active_connections[lecture_id]:
                del self.active_connections[lecture_id]
        logger.info(f"Client disconnected from lecture {lecture_id}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast_to_lecture(self, message: dict, lecture_id: str):
        if lecture_id in self.active_connections:
            for connection in self.active_connections[lecture_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except:
                    # Remove broken connections
                    self.active_connections[lecture_id].remove(connection)

manager = ConnectionManager()

@app.websocket("/ws/lecture/{lecture_id}")
async def websocket_endpoint(websocket: WebSocket, lecture_id: str):
    await manager.connect(websocket, lecture_id)
    try:
        while True:
            # Keep connection alive and handle any client messages
            data = await websocket.receive_text()
            # Echo back for now (can be used for client commands)
            await manager.send_personal_message(f"Echo: {data}", websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket, lecture_id)

@app.get("/")
async def root():
    return {
        "message": "LectureWeave Backend API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "lectureweave-backend"}

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
