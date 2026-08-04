"""
Health endpoint tests.

Uses FastAPI's TestClient to call GET /health without booting MongoDB. The
ready probe (`/health/ready`) requires MongoDB and is exercised separately in
integration tests.
"""
from __future__ import annotations

from fastapi.testclient import TestClient


def test_health_returns_ok():
    from app.api.health import router
    from fastapi import FastAPI

    app = FastAPI()
    app.include_router(router)
    client = TestClient(app)

    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert "service" in body
