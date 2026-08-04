"""
LectureRepository — lecture persistence and ownership checks.
"""
from __future__ import annotations

from database.mongodb_connection import (  # noqa: F401
    create_lecture,
    user_owns_lecture,
    update_lecture_status,
    get_lecture_data,
    get_lecture_stats,
    get_user_lectures,
    get_lecture_with_notes,
)
