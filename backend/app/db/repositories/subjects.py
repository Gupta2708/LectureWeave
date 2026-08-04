"""
SubjectRepository — subject persistence.

Thin re-export of the existing subject helpers.
"""
from __future__ import annotations

from database.subject_functions import (  # noqa: F401
    create_subject,
    get_user_subjects,
    get_subject_by_id,
    update_subject,
    delete_subject,
    get_subject_lectures,
)
