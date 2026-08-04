"""Unit tests for the settings module — no MongoDB required."""
from __future__ import annotations

import importlib
import os


def _reload_settings():
    import app.core.config as cfg

    importlib.reload(cfg)
    return cfg.settings


def test_cors_origins_list_parses_comma_separated(monkeypatch):
    monkeypatch.setenv(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:3000, https://app.example.com , ,",
    )
    s = _reload_settings()
    assert s.cors_origins_list == [
        "http://localhost:3000",
        "https://app.example.com",
    ]


def test_wildcard_disables_credentials(monkeypatch):
    monkeypatch.setenv("CORS_ALLOWED_ORIGINS", "*")
    monkeypatch.setenv("CORS_ALLOW_CREDENTIALS", "true")
    s = _reload_settings()
    assert s.cors_origins_list == ["*"]
    # CORS spec forbids wildcard + credentials → the effective flag must be off.
    assert s.cors_allow_credentials_effective is False


def test_production_rejects_placeholder_secrets(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("JWT_SECRET_KEY", "dev-insecure-change-me")
    monkeypatch.setenv("MONGODB_URL", "mongodb+srv://user:pass@cluster/db")
    monkeypatch.setenv("GROQ_API_KEY", "gsk_placeholder")
    monkeypatch.setenv("CORS_ALLOWED_ORIGINS", "https://app.example.com")
    try:
        _reload_settings()
    except RuntimeError as e:
        assert "JWT_SECRET_KEY" in str(e)
    else:
        raise AssertionError("expected production validation to fail")
    finally:
        # Restore test defaults so later tests keep working.
        monkeypatch.setenv("APP_ENV", "testing")
        monkeypatch.setenv("JWT_SECRET_KEY", "test-only-secret")
        _reload_settings()
