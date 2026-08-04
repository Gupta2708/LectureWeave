"""
Backward-compat shim.

The canonical entry point is now `app.main:app`. This module re-exports it so
older deployment configs or ad-hoc launch commands still work while the legacy
files are removed in a follow-up commit.
"""
from __future__ import annotations

from app.main import app  # noqa: F401  (re-exported)


if __name__ == "__main__":
    import uvicorn
    from app.core.config import settings

    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT)
