"""Auth request/response schemas."""
from __future__ import annotations

from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    username: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    user_id: str
    email: str
    username: str


class AuthResponse(BaseModel):
    success: bool
    message: str | None = None
    user: UserPublic
    token: str
