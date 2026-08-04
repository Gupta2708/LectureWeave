"""
NoteRepository — structured and final note persistence.
"""
from __future__ import annotations

from database.mongodb_connection import (  # noqa: F401
    save_structured_notes,
    save_final_notes,
    get_user_final_notes,
    get_lecture_with_notes,
)
