"""
Authentication service with JWT tokens and password hashing
"""
import os
import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from bson import ObjectId

from database.mongodb_connection import get_db

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30  # Remember user for 30 days

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )

def create_access_token(user_id: str, email: str) -> str:
    """Create JWT access token"""
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode = {
        "user_id": user_id,
        "email": email,
        "exp": expire
    }
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

async def register_user(email: str, password: str, username: str) -> Dict[str, Any]:
    """
    Register a new user
    
    Returns:
        Dict with success status, user_id, and token
    """
    db = get_db()
    users_collection = db["users"]
    
    # Check if user already exists
    existing_user = await users_collection.find_one({"email": email})
    if existing_user:
        return {
            "success": False,
            "error": "Email already registered"
        }
    
    # Hash password
    hashed_password = hash_password(password)
    
    # Create user document
    user_doc = {
        "email": email,
        "username": username,
        "password": hashed_password,
        "created_at": datetime.utcnow(),
        "last_login": datetime.utcnow()
    }
    
    # Insert user
    result = await users_collection.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    # Create access token
    token = create_access_token(user_id, email)
    
    return {
        "success": True,
        "user_id": user_id,
        "email": email,
        "username": username,
        "token": token
    }

async def login_user(email: str, password: str) -> Dict[str, Any]:
    """
    Login user with email and password
    
    Returns:
        Dict with success status, user info, and token
    """
    db = get_db()
    users_collection = db["users"]
    
    # Find user by email
    user = await users_collection.find_one({"email": email})
    if not user:
        return {
            "success": False,
            "error": "Invalid email or password"
        }
    
    # Verify password
    if not verify_password(password, user["password"]):
        return {
            "success": False,
            "error": "Invalid email or password"
        }
    
    # Update last login
    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    # Create access token
    user_id = str(user["_id"])
    token = create_access_token(user_id, email)
    
    return {
        "success": True,
        "user_id": user_id,
        "email": user["email"],
        "username": user.get("username", ""),
        "token": token
    }

async def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify JWT token and return user info
    
    Returns:
        User info dict or None if invalid
    """
    payload = decode_access_token(token)
    if not payload:
        return None
    
    db = get_db()
    users_collection = db["users"]
    
    # Get user from database
    try:
        user = await users_collection.find_one({"_id": ObjectId(payload["user_id"])})
        if not user:
            return None
        
        return {
            "user_id": str(user["_id"]),
            "email": user["email"],
            "username": user.get("username", "")
        }
    except:
        return None

async def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Get user by ID"""
    db = get_db()
    users_collection = db["users"]
    
    try:
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            return None
        
        return {
            "user_id": str(user["_id"]),
            "email": user["email"],
            "username": user.get("username", ""),
            "created_at": user.get("created_at")
        }
    except:
        return None
