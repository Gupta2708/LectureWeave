"""
Dashboard API endpoints
"""
from fastapi import APIRouter, Depends

from app.api.auth import get_current_user
from database.mongodb_connection import get_db
from database.subject_functions import get_user_statistics

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """Get dashboard statistics for current user"""
    db = get_db()
    stats = await get_user_statistics(db, current_user["user_id"])
    
    return {
        "success": True,
        "stats": stats
    }
