"""
LectureWeave — canonical FastAPI application entry point.

This module only:
  - creates the FastAPI app
  - applies metadata + middleware
  - registers exception handlers
  - includes API routers
  - registers the lifespan (MongoDB init/close)
  - exposes /health and /health/ready

All request handling, database access, transcription, synthesis, and
WebSocket business logic live in dedicated modules under `app/`.

Run in development:
    uvicorn app.main:app --reload
Run in production:
    uvicorn app.main:app --host 0.0.0.0 --port $PORT
"""
from __future__ import annotations

import logging

from dotenv import load_dotenv

# Load .env before importing settings so pydantic-settings picks up local vars.
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.lifespan import lifespan

logging.basicConfig(level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO))

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan,
)

# CORS — env-driven; CORS spec forbids credentials + wildcard, and
# `cors_allow_credentials_effective` downgrades credentials off in that case.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list or ["http://localhost:3000"],
    allow_credentials=settings.cors_allow_credentials_effective,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routers ------------------------------------------------------------
from app.api.auth import router as auth_router
from app.api.notes import router as notes_router
from app.api.subjects_new import router as subjects_router
from app.api.dashboard import router as dashboard_router
from app.api.lectures_new import router as lectures_router
from app.api.documents_new import router as documents_router
from app.api.recording import router as recording_router
from app.api.websocket import router as websocket_router
from app.api.health import router as health_router

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(subjects_router)
app.include_router(lectures_router)
app.include_router(documents_router)
app.include_router(recording_router)
app.include_router(notes_router)
app.include_router(dashboard_router)
app.include_router(websocket_router)


@app.get("/")
async def root() -> dict:
    return {"message": f"{settings.APP_NAME} backend", "service": settings.APP_NAME}


if __name__ == "__main__":
    import uvicorn as _uvicorn

    _uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.APP_DEBUG,
    )
