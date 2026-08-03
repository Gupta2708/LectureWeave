"""
MongoDB Atlas connection with Vector Search support
Much simpler than PostgreSQL + pgvector!
"""
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient, ASCENDING, DESCENDING
from typing import Optional, List, Dict, Any
import numpy as np
from datetime import datetime
import os
import time
from app.core.config import settings

# Global MongoDB client
_client: Optional[AsyncIOMotorClient] = None
_sync_client: Optional[MongoClient] = None
_db = None

def get_mongodb_url() -> str:
    """Get MongoDB connection URL from environment"""
    # print(settings.MONGODB_URL)
    return os.getenv("MONGODB_URL", settings.MONGODB_URL)

def init_mongodb():
    """Initialize MongoDB connection"""
    global _client, _sync_client, _db
    
    mongodb_url = get_mongodb_url()
    if mongodb_url:
        print("hai")
    else: print("nhi")
    print(f"🔗 Connecting to: {mongodb_url[:50]}...")  # Debug: show connection URL
    
    # Async client for FastAPI
    _client = AsyncIOMotorClient(mongodb_url)
    _db = _client.lectureweave
    
    # Sync client for non-async operations
    _sync_client = MongoClient(mongodb_url)
    
    print("✅ MongoDB Atlas connected successfully!")
    return _db

def get_db():
    """Get database instance"""
    global _db
    if _db is None:
        init_mongodb()
    return _db

def close_mongodb():
    """Close MongoDB connections"""
    global _client, _sync_client
    if _client:
        _client.close()
    if _sync_client:
        _sync_client.close()
    print("🔒 MongoDB connections closed")

# Collection helpers
def get_collection(name: str):
    """Get collection by name"""
    db = get_db()
    return db[name]

# Initialize collections and indexes
async def setup_indexes():
    """Create indexes for better query performance"""
    db = get_db()
    
    # Users collection
    await db.users.create_index([("email", ASCENDING)], unique=True)
    await db.users.create_index([("username", ASCENDING)], unique=True)
    
    # Lectures collection
    await db.lectures.create_index([("user_id", ASCENDING)])
    await db.lectures.create_index([("subject_id", ASCENDING)])
    await db.lectures.create_index([("status", ASCENDING)])
    await db.lectures.create_index([("created_at", DESCENDING)])
    
    # Documents collection
    await db.documents.create_index([("lecture_id", ASCENDING)])
    
    # Document embeddings collection (for vector search)
    await db.document_embeddings.create_index([("lecture_id", ASCENDING)])
    await db.document_embeddings.create_index([("document_id", ASCENDING)])
    
    # Transcriptions collection
    await db.transcriptions.create_index([("lecture_id", ASCENDING)])
    await db.transcriptions.create_index([("lecture_id", ASCENDING), ("chunk_index", ASCENDING)], unique=True)
    
    # Structured notes collection
    await db.structured_notes.create_index([("lecture_id", ASCENDING)])
    await db.structured_notes.create_index([("created_at", DESCENDING)])
    
    # Final notes collection
    await db.final_notes.create_index([("lecture_id", ASCENDING)], unique=True)
    
    print("✅ MongoDB indexes created successfully!")

# Vector Search Setup (Atlas Search Index)
def create_vector_search_index_config():
    """
    Configuration for MongoDB Atlas Vector Search Index
    
    TO CREATE THIS INDEX:
    1. Go to MongoDB Atlas Dashboard
    2. Click on your cluster → "Search" tab
    3. Click "Create Search Index"
    4. Choose "JSON Editor"
    5. Paste the configuration below
    6. Index name: "vector_search"
    7. Collection: "document_embeddings"
    """
    return {
        "mappings": {
            "dynamic": True,
            "fields": {
                "embedding": {
                    "type": "knnVector",
                    "dimensions": 384,  # all-MiniLM-L6-v2 dimensions
                    "similarity": "cosine"
                },
                "lecture_id": {
                    "type": "string"
                },
                "document_id": {
                    "type": "string"
                }
            }
        }
    }

# CRUD Operations

async def create_lecture(user_id: str, subject_id: str, title: str) -> str:
    """Create a new lecture"""
    db = get_db()
    
    lecture = {
        "user_id": user_id,
        "subject_id": subject_id,
        "title": title,
        "status": "in_progress",
        "duration": 0,
        "metadata": {},
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.lectures.insert_one(lecture)
    return str(result.inserted_id)

async def save_document(lecture_id: str, filename: str, file_type: str, 
                       file_path: str, content: str) -> str:
    """Save document metadata"""
    db = get_db()
    
    document = {
        "lecture_id": lecture_id,
        "filename": filename,
        "file_type": file_type,
        "file_path": file_path,
        "content": content,
        "file_size": len(content),
        "metadata": {},
        "upload_date": datetime.utcnow(),
        "processed": False
    }
    
    result = await db.documents.insert_one(document)
    return str(result.inserted_id)

async def save_document_embeddings(embeddings_data: List[Dict[str, Any]]) -> None:
    """
    Save document chunks with embeddings for vector search
    
    embeddings_data format:
    [
        {
            'lecture_id': '...',
            'document_id': '...',
            'chunk_text': 'text content',
            'chunk_index': 0,
            'embedding': np.array([...])  # 384-dim vector
        },
        ...
    ]
    """
    db = get_db()
    
    # Convert numpy arrays to lists for MongoDB
    documents = []
    for item in embeddings_data:
        doc = {
            "lecture_id": item['lecture_id'],
            "document_id": item['document_id'],
            "chunk_text": item['chunk_text'],
            "chunk_index": item['chunk_index'],
            "embedding": item['embedding'].tolist() if isinstance(item['embedding'], np.ndarray) else item['embedding'],
            "metadata": item.get('metadata', {}),
            "created_at": datetime.utcnow()
        }
        documents.append(doc)
    
    if documents:
        await db.document_embeddings.insert_many(documents)
        print(f"✅ Saved {len(documents)} document embeddings")

async def vector_search(query_embedding: np.ndarray, lecture_id: str, 
                       top_k: int = 10) -> List[Dict]:
    """
    Perform vector similarity search using MongoDB Atlas Vector Search
    
    NOTE: Requires Atlas Search Index to be created first!
    See create_vector_search_index_config() for setup instructions.
    """
    db = get_db()
    
    # Convert numpy array to list
    query_vector = query_embedding.tolist() if isinstance(query_embedding, np.ndarray) else query_embedding
    
    # MongoDB Atlas Vector Search aggregation pipeline
    pipeline = [
        {
            "$search": {
                "index": "vector_search",  # Name of your Atlas Search index
                "knnBeta": {
                    "vector": query_vector,
                    "path": "embedding",
                    "k": top_k,
                    "filter": {
                        "lecture_id": lecture_id
                    }
                }
            }
        },
        {
            "$project": {
                "_id": 1,
                "chunk_text": 1,
                "document_id": 1,
                "chunk_index": 1,
                "score": {"$meta": "searchScore"}
            }
        },
        {
            "$limit": top_k
        }
    ]
    
    results = []
    async for doc in db.document_embeddings.aggregate(pipeline):
        results.append({
            "chunk_id": str(doc["_id"]),
            "chunk_text": doc["chunk_text"],
            "similarity": doc["score"],
            "document_id": doc["document_id"]
        })
    
    return results

# Fallback: Simple cosine similarity (if Atlas Search not available)
async def simple_vector_search(query_embedding: np.ndarray, lecture_id: str, 
                              top_k: int = 10) -> List[Dict]:
    """
    Fallback vector search using simple cosine similarity
    Use this if Atlas Search index is not set up yet
    """
    db = get_db()
    
    # Get all embeddings for this lecture
    cursor = db.document_embeddings.find({"lecture_id": lecture_id})
    
    results = []
    async for doc in cursor:
        # Calculate cosine similarity
        doc_embedding = np.array(doc['embedding'])
        similarity = np.dot(query_embedding, doc_embedding) / (
            np.linalg.norm(query_embedding) * np.linalg.norm(doc_embedding)
        )
        
        results.append({
            "chunk_id": str(doc["_id"]),
            "chunk_text": doc["chunk_text"],
            "similarity": float(similarity),
            "document_id": doc["document_id"]
        })
    
    # Sort by similarity and return top_k
    results.sort(key=lambda x: x['similarity'], reverse=True)
    return results[:top_k]

async def save_transcription(lecture_id: str, chunk_index: int, text: str,
                            enhanced_notes: str, timestamp: str, 
                            importance: float) -> str:
    """Save transcription chunk"""
    db = get_db()
    
    transcription = {
        "lecture_id": lecture_id,
        "chunk_index": chunk_index,
        "text": text,
        "enhanced_notes": enhanced_notes,
        "timestamp": timestamp,
        "importance": importance,
        "metadata": {},
        "created_at": datetime.utcnow()
    }
    
    # Upsert (update if exists, insert if not)
    result = await db.transcriptions.update_one(
        {"lecture_id": lecture_id, "chunk_index": chunk_index},
        {"$set": transcription},
        upsert=True
    )
    
    return str(result.upserted_id) if result.upserted_id else "updated"

async def save_structured_notes(lecture_id: str, content: str, 
                               transcription_count: int) -> str:
    """Save structured notes"""
    db = get_db()
    
    note = {
        "lecture_id": lecture_id,
        "content": content,
        "transcription_count": transcription_count,
        "metadata": {},
        "created_at": datetime.utcnow()
    }
    
    result = await db.structured_notes.insert_one(note)
    return str(result.inserted_id)

async def save_final_notes(lecture_id: str, title: str, markdown: str,
                          sections: List[Dict], glossary: Dict, 
                          key_takeaways: List[str]) -> str:
    """Save final comprehensive notes"""
    db = get_db()
    
    final_note = {
        "lecture_id": lecture_id,
        "title": title,
        "markdown": markdown,
        "sections": sections,
        "glossary": glossary,
        "key_takeaways": key_takeaways,
        "metadata": {},
        "created_at": datetime.utcnow()
    }
    
    # Upsert (one final note per lecture)
    result = await db.final_notes.update_one(
        {"lecture_id": lecture_id},
        {"$set": final_note},
        upsert=True
    )
    
    return str(result.upserted_id) if result.upserted_id else "updated"

async def get_lecture_data(lecture_id: str) -> Dict:
    """Get complete lecture with all related data"""
    db = get_db()
    
    # Get lecture
    lecture = await db.lectures.find_one({"_id": lecture_id})
    if not lecture:
        return None
    
    # Get related data
    lecture["transcriptions"] = await db.transcriptions.find(
        {"lecture_id": lecture_id}
    ).to_list(length=None)
    
    lecture["structured_notes"] = await db.structured_notes.find(
        {"lecture_id": lecture_id}
    ).to_list(length=None)
    
    lecture["documents"] = await db.documents.find(
        {"lecture_id": lecture_id}
    ).to_list(length=None)
    
    lecture["final_notes"] = await db.final_notes.find_one(
        {"lecture_id": lecture_id}
    )
    
    return lecture

async def update_lecture_status(lecture_id: str, status: str) -> None:
    """Update lecture status"""
    db = get_db()
    
    update_data = {
        "status": status,
        "updated_at": datetime.utcnow()
    }
    
    if status == "completed":
        update_data["completed_at"] = datetime.utcnow()
    
    await db.lectures.update_one(
        {"_id": lecture_id},
        {"$set": update_data}
    )

async def mark_document_processed(document_id: str) -> None:
    """Mark document as processed"""
    db = get_db()
    
    await db.documents.update_one(
        {"_id": document_id},
        {"$set": {
            "processed": True,
            "processed_at": datetime.utcnow()
        }}
    )

# Statistics and analytics
async def get_lecture_stats(lecture_id: str) -> Dict:
    """Get lecture statistics"""
    db = get_db()
    
    stats = {
        "transcription_count": await db.transcriptions.count_documents({"lecture_id": lecture_id}),
        "structured_notes_count": await db.structured_notes.count_documents({"lecture_id": lecture_id}),
        "document_count": await db.documents.count_documents({"lecture_id": lecture_id}),
        "embedding_count": await db.document_embeddings.count_documents({"lecture_id": lecture_id}),
        "has_final_notes": await db.final_notes.count_documents({"lecture_id": lecture_id}) > 0
    }
    
    return stats

# ============================================================================
# USER-SPECIFIC FUNCTIONS
# ============================================================================

async def get_user_lectures(user_id: str, limit: int = 50) -> List[Dict]:
    """Get all lectures for a specific user"""
    db = get_db()
    
    cursor = db.lectures.find(
        {"user_id": user_id}
    ).sort("created_at", -1).limit(limit)
    
    lectures = []
    async for lecture in cursor:
        lecture["_id"] = str(lecture["_id"])
        lectures.append(lecture)
    
    return lectures

async def get_user_final_notes(user_id: str, limit: int = 50) -> List[Dict]:
    """Get all final notes for a specific user"""
    db = get_db()
    
    # Get lectures for this user
    lectures = await get_user_lectures(user_id, limit=limit)
    lecture_ids = [lecture["_id"] for lecture in lectures]
    
    if not lecture_ids:
        return []
    
    # Get final notes for these lectures
    cursor = db.final_notes.find(
        {"lecture_id": {"$in": lecture_ids}}
    ).sort("created_at", -1)
    
    notes = []
    async for note in cursor:
        note["_id"] = str(note["_id"])
        
        # Add lecture info
        lecture = next((l for l in lectures if l["_id"] == note["lecture_id"]), None)
        if lecture:
            note["lecture_title"] = lecture.get("title", "Untitled")
            note["subject_id"] = lecture.get("subject_id")
        
        notes.append(note)
    
    return notes

async def get_lecture_with_notes(lecture_id: str, user_id: str) -> Optional[Dict]:
    """Get lecture with all its notes (ownership verified)"""
    db = get_db()
    
    # Get lecture and verify ownership
    lecture = await db.lectures.find_one({"_id": lecture_id, "user_id": user_id})
    if not lecture:
        return None
    
    # Get all related data
    lecture["_id"] = str(lecture["_id"])
    lecture["transcriptions"] = []
    lecture["structured_notes"] = []
    lecture["final_notes"] = None
    lecture["documents"] = []
    
    # Fetch transcriptions
    async for trans in db.transcriptions.find({"lecture_id": lecture_id}).sort("chunk_index", 1):
        trans["_id"] = str(trans["_id"])
        lecture["transcriptions"].append(trans)
    
    # Fetch structured notes
    async for note in db.structured_notes.find({"lecture_id": lecture_id}).sort("created_at", 1):
        note["_id"] = str(note["_id"])
        lecture["structured_notes"].append(note)
    
    # Fetch final notes
    final = await db.final_notes.find_one({"lecture_id": lecture_id})
    if final:
        final["_id"] = str(final["_id"])
        lecture["final_notes"] = final
    
    # Fetch documents
    async for doc in db.documents.find({"lecture_id": lecture_id}):
        doc["_id"] = str(doc["_id"])
        lecture["documents"].append(doc)
    
    return lecture

async def save_transcription(lecture_id: str, chunk_index: int, text: str,
                            enhanced_notes: str, timestamp: str, 
                            importance: float) -> str:
    """Save transcription chunk"""
    db = get_db()
    
    transcription = {
        "lecture_id": lecture_id,
        "chunk_index": chunk_index,
        "text": text,
        "enhanced_notes": enhanced_notes,
        "timestamp": timestamp,
        "importance": importance,
        "metadata": {},
        "created_at": datetime.utcnow()
    }
    
    # Upsert (update if exists, insert if not)
    result = await db.transcriptions.update_one(
        {"lecture_id": lecture_id, "chunk_index": chunk_index},
        {"$set": transcription},
        upsert=True
    )
    
    return str(result.upserted_id) if result.upserted_id else "updated"

async def save_structured_notes(lecture_id: str, content: str, 
                               transcription_count: int) -> str:
    """Save structured notes"""
    db = get_db()
    
    note = {
        "lecture_id": lecture_id,
        "content": content,
        "transcription_count": transcription_count,
        "metadata": {},
        "created_at": datetime.utcnow()
    }
    
    result = await db.structured_notes.insert_one(note)
    return str(result.inserted_id)

async def save_final_notes(lecture_id: str, title: str, markdown: str,
                          sections: List[Dict], glossary: Dict, 
                          key_takeaways: List[str]) -> str:
    """Save final comprehensive notes"""
    db = get_db()
    
    final_note = {
        "lecture_id": lecture_id,
        "title": title,
        "markdown": markdown,
        "sections": sections,
        "glossary": glossary,
        "key_takeaways": key_takeaways,
        "metadata": {},
        "created_at": datetime.utcnow()
    }
    
    # Upsert (one final note per lecture)
    result = await db.final_notes.update_one(
        {"lecture_id": lecture_id},
        {"$set": final_note},
        upsert=True
    )
    
    return str(result.upserted_id) if result.upserted_id else "updated"
