"""
Authentication API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.services.auth_service import (
    register_user,
    login_user,
    verify_token,
    get_user_by_id
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    username: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    user_id: str
    email: str
    username: str
    token: str

async def get_current_user(authorization: Optional[str] = Header(None)):
    """Dependency to get current user from JWT token"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Extract token from "Bearer <token>"
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    # Verify token
    user = await verify_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return user

@router.post("/register")
async def register(request: RegisterRequest):
    """Register a new user"""
    
    # Validate password length
    if len(request.password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 6 characters long"
        )
    
    # Register user
    result = await register_user(
        email=request.email,
        password=request.password,
        username=request.username
    )
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return {
        "success": True,
        "message": "User registered successfully",
        "user": {
            "user_id": result["user_id"],
            "email": result["email"],
            "username": result["username"]
        },
        "token": result["token"]
    }

@router.post("/login")
async def login(request: LoginRequest):
    """Login user"""
    
    result = await login_user(
        email=request.email,
        password=request.password
    )
    
    if not result["success"]:
        raise HTTPException(status_code=401, detail=result["error"])
    
    return {
        "success": True,
        "message": "Login successful",
        "user": {
            "user_id": result["user_id"],
            "email": result["email"],
            "username": result["username"]
        },
        "token": result["token"]
    }

@router.get("/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return {
        "success": True,
        "user": current_user
    }

@router.post("/verify")
async def verify_user_token(authorization: Optional[str] = Header(None)):
    """Verify if token is valid"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    user = await verify_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return {
        "success": True,
        "valid": True,
        "user": user
    }
