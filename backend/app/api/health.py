"""
Health endpoints.

`GET /health` returns a cheap process-status.
`GET /health/ready` verifies MongoDB connectivity without exposing credentials
or booting expensive models (Whisper/Groq).
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from app.core.config import settings
from database.mongodb_connection import get_db

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health() -> dict:
    """Lightweight liveness probe."""
    return {"status": "ok", "service": settings.APP_NAME}


@router.get("/health/ready")
async def health_ready() -> dict:
    """Readiness probe: ping MongoDB. Never returns credentials or the URI."""
    try:
        db = get_db()
        # `ping` is the standard MongoDB liveness command.
        await db.command("ping")
        return {"status": "ready", "mongodb": "up"}
    except Exception as e:
        # Log details server-side; return a generic message to the client.
        logger.error("Readiness check failed: %s", e)
        raise HTTPException(status_code=503, detail="Service not ready")
