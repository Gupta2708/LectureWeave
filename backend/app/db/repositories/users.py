"""
UserRepository — user persistence.

For now this is a thin re-export of the operations that live in
`app.services.auth_service`. Consolidating them behind a repository interface
lets services import users from a stable location while the auth service is
refactored to hold behaviour only.
"""
from __future__ import annotations

from app.services.auth_service import (  # noqa: F401
    register_user,
    login_user,
    verify_token,
    get_user_by_id,
    hash_password,
    verify_password,
)
