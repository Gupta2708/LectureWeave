"""Unit tests for password hashing and JWT round-trips."""
from __future__ import annotations

import time

from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_password_hash_round_trip():
    hashed = hash_password("hunter2")
    assert hashed != "hunter2"
    assert verify_password("hunter2", hashed) is True
    assert verify_password("wrong", hashed) is False


def test_jwt_round_trip():
    token = create_access_token(user_id="abc", email="a@b.c")
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["user_id"] == "abc"
    assert payload["email"] == "a@b.c"
    assert payload["exp"] > time.time()


def test_jwt_rejects_tampered_token():
    token = create_access_token(user_id="abc", email="a@b.c")
    # Flip a byte in the middle of the token.
    tampered = token[:-2] + ("A" if token[-1] != "A" else "B") * 2
    assert decode_access_token(tampered) is None
