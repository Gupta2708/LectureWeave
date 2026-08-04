"""
Security primitives: password hashing/verification, JWT creation/decoding.

Thin re-exports of the primitives currently living in
`app.services.auth_service`. Consolidating here lets callers depend on
`app.core.security` for cryptographic primitives while the auth service is
narrowed to registration/login business rules.
"""
from __future__ import annotations

from app.core.config import settings
from app.services.auth_service import (  # noqa: F401
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    verify_token,
)

# Re-export constants so callers can see JWT config without touching env vars.
JWT_SECRET_KEY = settings.JWT_SECRET_KEY
JWT_ALGORITHM = settings.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_DAYS = settings.ACCESS_TOKEN_EXPIRE_DAYS
