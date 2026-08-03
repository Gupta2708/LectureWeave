"""
Subject management functions for MongoDB
"""
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional, List, Dict
from datetime import datetime
import time

async def create_subject(db, user_id: str, name: str, code: str, description: str = "") -> Dict:
    """Create a new subject"""
    subject_doc = {
        "_id": f"subject-{int(time.time() * 1000)}",
        "user_id": user_id,
        "name": name,
        "code": code,
        "description": description,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.subjects.insert_one(subject_doc)
    subject_doc["_id"] = str(subject_doc["_id"])
    return subject_doc

async def get_user_subjects(db, user_id: str) -> List[Dict]:
    """Get all subjects for a user"""
    cursor = db.subjects.find({"user_id": user_id}).sort("created_at", -1)
    
    subjects = []
    async for subject in cursor:
        subject["_id"] = str(subject["_id"])
        
        # Count lectures for this subject
        lecture_count = await db.lectures.count_documents({
            "user_id": user_id,
            "subject_id": subject["_id"]
        })
        subject["lecture_count"] = lecture_count
        
        subjects.append(subject)
    
    return subjects

async def get_subject_by_id(db, subject_id: str, user_id: str) -> Optional[Dict]:
    """Get a specific subject (ownership verified)"""
    subject = await db.subjects.find_one({"_id": subject_id, "user_id": user_id})
    if not subject:
        return None
    
    subject["_id"] = str(subject["_id"])
    
    # Get lectures for this subject
    lectures = []
    async for lecture in db.lectures.find({
        "user_id": user_id,
        "subject_id": subject_id
    }).sort("created_at", -1):
        lecture["_id"] = str(lecture["_id"])
        lectures.append(lecture)
    
    subject["lectures"] = lectures
    subject["lecture_count"] = len(lectures)
    
    return subject

async def update_subject(db, subject_id: str, user_id: str, updates: Dict) -> bool:
    """Update a subject"""
    updates["updated_at"] = datetime.utcnow()
    
    result = await db.subjects.update_one(
        {"_id": subject_id, "user_id": user_id},
        {"$set": updates}
    )
    
    return result.modified_count > 0

async def delete_subject(db, subject_id: str, user_id: str) -> bool:
    """Delete a subject"""
    result = await db.subjects.delete_one({"_id": subject_id, "user_id": user_id})
    
    return result.deleted_count > 0

async def get_subject_lectures(db, subject_id: str, user_id: str, limit: int = 50) -> List[Dict]:
    """Get all lectures for a specific subject"""
    cursor = db.lectures.find({
        "user_id": user_id,
        "subject_id": subject_id
    }).sort("created_at", -1).limit(limit)
    
    lectures = []
    async for lecture in cursor:
        lecture["_id"] = str(lecture["_id"])
        
        # Get final notes count
        has_notes = await db.final_notes.count_documents({"lecture_id": lecture["_id"]}) > 0
        lecture["has_notes"] = has_notes
        
        lectures.append(lecture)
    
    return lectures

async def get_user_statistics(db, user_id: str) -> Dict:
    """Get comprehensive statistics for user dashboard"""
    # Count subjects
    subject_count = await db.subjects.count_documents({"user_id": user_id})
    
    # Count lectures
    lecture_count = await db.lectures.count_documents({"user_id": user_id})
    
    # Get lecture IDs for this user
    lecture_ids = []
    async for lecture in db.lectures.find({"user_id": user_id}, {"_id": 1}):
        lecture_ids.append(lecture["_id"])
    
    # Count notes
    notes_count = 0
    if lecture_ids:
        notes_count = await db.final_notes.count_documents({"lecture_id": {"$in": lecture_ids}})
    
    # Count documents
    documents_count = 0
    if lecture_ids:
        documents_count = await db.documents.count_documents({"lecture_id": {"$in": lecture_ids}})
    
    # Get recent activity (last 5 lectures)
    recent_lectures = []
    async for lecture in db.lectures.find({"user_id": user_id}).sort("created_at", -1).limit(5):
        lecture["_id"] = str(lecture["_id"])
        recent_lectures.append(lecture)
    
    return {
        "subject_count": subject_count,
        "lecture_count": lecture_count,
        "notes_count": notes_count,
        "documents_count": documents_count,
        "recent_lectures": recent_lectures
    }
