"""
Test configuration.

Sets safe test defaults for the settings module before it is imported by the
application under test. Individual tests can still monkeypatch settings.
"""
from __future__ import annotations

import os

os.environ.setdefault("APP_ENV", "testing")
os.environ.setdefault("JWT_SECRET_KEY", "test-only-secret")
os.environ.setdefault("MONGODB_URL", "mongodb://localhost:27017")
os.environ.setdefault("MONGODB_DATABASE", "lectureweave_test")
os.environ.setdefault("CORS_ALLOWED_ORIGINS", "http://localhost:3000")
