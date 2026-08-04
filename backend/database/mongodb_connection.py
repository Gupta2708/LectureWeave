"""
MongoDB Atlas connection with Vector Search support
Much simpler than PostgreSQL + pgvector!
"""
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient, ASCENDING, DESCENDING
from bson import ObjectId
from typing import Optional, List, Dict, Any
import numpy as np
from datetime import datetime
import logging
import time
from app.core.config import settings

logger = logging.getLogger(__name__)


def _lecture_id_filter(lecture_id: str):
    """Build an `_id` filter that matches a lecture whether its `_id` is stored
    as an ObjectId (the normal case, from `create_lecture`) or as a plain string
    (the timestamp fallback ids). Avoids ObjectId/str mismatch bugs."""
    ids: List[Any] = [lecture_id]
    try:
        ids.append(ObjectId(lecture_id))
    except Exception:
        pass
    return {"$in": ids}


async def user_owns_lecture(lecture_id: str, user_id: str) -> bool:
    """Return True if the lecture exists and belongs to the given user."""
    if not user_id:
        return False
    db = get_db()
    lecture = await db.lectures.find_one(
        {"_id": _lecture_id_filter(lecture_id), "user_id": user_id},
        {"_id": 1},
    )
    return lecture is not None


async def user_owns_subject(subject_id: str, user_id: str) -> bool:
    """Return True only when the requested subject belongs to ``user_id``."""
    if not user_id:
        return False
    db = get_db()
    subject_ids: List[Any] = [subject_id]
    try:
        subject_ids.append(ObjectId(subject_id))
    except Exception:
        pass
    subject = await db.subjects.find_one(
        {"_id": {"$in": subject_ids}, "user_id": user_id}, {"_id": 1}
    )
    return subject is not None


async def get_lecture_template(lecture_id: str) -> str:
    """Return a lecture's validated template, defaulting safely for old rows."""
    lecture = await get_db().lectures.find_one({"_id": _lecture_id_filter(lecture_id)}, {"template": 1})
    return (lecture or {}).get("template", "detailed")

# Global MongoDB client
_client: Optional[AsyncIOMotorClient] = None
_sync_client: Optional[MongoClient] = None
_db = None

def get_mongodb_url() -> str:
    """Get MongoDB connection URL from centralised settings."""
    return settings.MONGODB_URL

def init_mongodb():
    """Initialize MongoDB connection. Never logs the connection URL — it may
    embed credentials — only that initialisation happened."""
    global _client, _sync_client, _db

    mongodb_url = get_mongodb_url()
    if not mongodb_url:
        raise RuntimeError("MONGODB_URL is not configured")

    # Async client for FastAPI
    _client = AsyncIOMotorClient(mongodb_url)
    _db = _client[settings.MONGODB_DATABASE]

    # Sync client for non-async operations
    _sync_client = MongoClient(mongodb_url)

    logger.info("MongoDB connection initialized (database=%s)", settings.MONGODB_DATABASE)
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
    logger.info("MongoDB connections closed")

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
    await db.documents.create_index([("lecture_id", ASCENDING), ("status", ASCENDING)])
    
    # Document embeddings collection (for vector search)
    await db.document_embeddings.create_index([("lecture_id", ASCENDING)])
    await db.document_embeddings.create_index([("document_id", ASCENDING)])
    await db.document_embeddings.create_index(
        [("lecture_id", ASCENDING), ("document_id", ASCENDING), ("chunk_index", ASCENDING)],
        unique=True,
    )
    # MongoDB text search is supported on Atlas M0 and is the keyword tier of
    # hybrid retrieval. It deliberately excludes ownership from the index:
    # callers must always add their lecture metadata filter.
    await db.document_embeddings.create_index(
        [("chunk_text", "text"), ("section_heading", "text")],
        name="document_embedding_text",
    )
    
    # Transcriptions collection
    await db.transcriptions.create_index([("lecture_id", ASCENDING)])
    await db.transcriptions.create_index([("lecture_id", ASCENDING), ("chunk_index", ASCENDING)], unique=True)
    await db.transcriptions.create_index([("lecture_id", ASCENDING), ("seq", ASCENDING)], unique=True)
    
    # Structured notes collection
    await db.structured_notes.create_index([("lecture_id", ASCENDING)])
    await db.structured_notes.create_index([("created_at", DESCENDING)])
    
    # Final notes collection
    await db.final_notes.create_index([("lecture_id", ASCENDING)], unique=True)

    await db.processing_jobs.create_index([("user_id", ASCENDING), ("status", ASCENDING)])
    await db.processing_jobs.create_index([("target_type", ASCENDING), ("target_id", ASCENDING)])
    await db.lecture_markers.create_index([("lecture_id", ASCENDING), ("start_ms", ASCENDING)])
    await db.lecture_topics.create_index([("lecture_id", ASCENDING), ("start_ms", ASCENDING)])
    await db.chat_sessions.create_index([("user_id", ASCENDING), ("subject_id", ASCENDING), ("updated_at", DESCENDING)])
    await db.chat_messages.create_index([("session_id", ASCENDING), ("created_at", ASCENDING)])
    await db.flashcards.create_index([("user_id", ASCENDING), ("subject_id", ASCENDING), ("topic", ASCENDING)])
    await db.flashcards.create_index([("subject_id", ASCENDING), ("normalised_question", ASCENDING)], unique=True)
    await db.quizzes.create_index([("user_id", ASCENDING), ("subject_id", ASCENDING), ("lecture_id", ASCENDING)])
    
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

async def create_lecture(user_id: str, subject_id: str, title: str, template: str = "detailed") -> str:
    """Create a new lecture"""
    db = get_db()
    
    lecture = {
        "user_id": user_id,
        "subject_id": subject_id,
        "title": title,
        "status": "in_progress",
        "duration": 0,
        "template": template,
        "metadata": {},
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.lectures.insert_one(lecture)
    return str(result.inserted_id)

async def save_document(
    lecture_id: str,
    filename: str,
    file_type: str,
    file_path: str,
    content: str,
    *,
    page_count: Optional[int] = None,
    slide_count: Optional[int] = None,
    content_hash: Optional[str] = None,
) -> str:
    """Save document metadata"""
    db = get_db()

    document = {
        "lecture_id": lecture_id,
        "filename": filename,
        "file_type": file_type,
        "file_path": file_path,
        "content": content,
        "file_size": len(content),
        "content_hash": content_hash,
        "metadata": {},
        "upload_date": datetime.utcnow(),
        "processed": False,
        "status": "uploaded",
        "error": None,
        "retry_count": 0,
        "page_count": page_count,
        "slide_count": slide_count,
    }
    
    result = await db.documents.insert_one(document)
    return str(result.inserted_id)

async def save_document_embeddings(embeddings_data: List[Dict[str, Any]]) -> List[str]:
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
            "page_number": item.get("page_number"),
            "slide_number": item.get("slide_number"),
            "section_heading": item.get("section_heading"),
            "paragraph_index": item.get("paragraph_index"),
            "prev_chunk_id": item.get("prev_chunk_id"),
            "next_chunk_id": item.get("next_chunk_id"),
            "embedding_model": item.get("embedding_model", settings.EMBEDDING_MODEL),
            "embedding_model_version": item.get("embedding_model_version"),
            "embedding": item['embedding'].tolist() if isinstance(item['embedding'], np.ndarray) else item['embedding'],
            "metadata": item.get('metadata', {}),
            "created_at": datetime.utcnow()
        }
        documents.append(doc)
    
    if documents:
        result = await db.document_embeddings.insert_many(documents)
        inserted_ids = [str(item_id) for item_id in result.inserted_ids]
        for index, item_id in enumerate(result.inserted_ids):
            await db.document_embeddings.update_one(
                {"_id": item_id},
                {"$set": {
                    "prev_chunk_id": inserted_ids[index - 1] if index else None,
                    "next_chunk_id": inserted_ids[index + 1] if index + 1 < len(inserted_ids) else None,
                }},
            )
        return inserted_ids
    return []

async def vector_search(
    query_embedding: np.ndarray,
    lecture_id: Optional[str] = None,
    top_k: int = 10,
    *,
    metadata_filter: Optional[Dict[str, Any]] = None,
) -> List[Dict]:
    """
    Perform vector similarity search using MongoDB Atlas Vector Search
    
    NOTE: Requires Atlas Search Index to be created first!
    See create_vector_search_index_config() for setup instructions.
    """
    db = get_db()
    
    # Convert numpy array to list
    query_vector = query_embedding.tolist() if isinstance(query_embedding, np.ndarray) else query_embedding
    
    search_filter = metadata_filter or {"lecture_id": lecture_id}
    # MongoDB Atlas Vector Search aggregation pipeline
    pipeline = [
        {
            "$search": {
                "index": settings.VECTOR_INDEX_NAME,
                "knnBeta": {
                    "vector": query_vector,
                    "path": "embedding",
                    "k": top_k,
                    "filter": search_filter
                }
            }
        },
        {
            "$project": {
                "_id": 1,
                "chunk_text": 1,
                "document_id": 1,
                "lecture_id": 1,
                "chunk_index": 1,
                "section_heading": 1,
                "page_number": 1,
                "slide_number": 1,
                "embedding_model": 1,
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
            "document_id": doc["document_id"],
            "lecture_id": doc.get("lecture_id"),
            "section_heading": doc.get("section_heading"),
            "page_number": doc.get("page_number"),
            "slide_number": doc.get("slide_number"),
            "embedding_model": doc.get("embedding_model"),
        })
    
    return results

# Fallback: Simple cosine similarity (if Atlas Search not available)
async def simple_vector_search(
    query_embedding: np.ndarray,
    lecture_id: Optional[str] = None,
    top_k: int = 10,
    *,
    metadata_filter: Optional[Dict[str, Any]] = None,
) -> List[Dict]:
    """
    Fallback vector search using simple cosine similarity
    Use this if Atlas Search index is not set up yet
    """
    db = get_db()
    
    # Get all embeddings for this lecture
    cursor = db.document_embeddings.find(metadata_filter or {"lecture_id": lecture_id})
    
    results = []
    async for doc in cursor:
        # Calculate cosine similarity
        doc_embedding = np.array(doc['embedding'])
        denominator = np.linalg.norm(query_embedding) * np.linalg.norm(doc_embedding)
        if not denominator:
            continue
        similarity = np.dot(query_embedding, doc_embedding) / denominator
        
        results.append({
            "chunk_id": str(doc["_id"]),
            "chunk_text": doc["chunk_text"],
            "similarity": float(similarity),
            "document_id": doc["document_id"],
            "lecture_id": doc.get("lecture_id"),
            "section_heading": doc.get("section_heading"),
            "page_number": doc.get("page_number"),
            "slide_number": doc.get("slide_number"),
            "embedding_model": doc.get("embedding_model"),
        })
    
    # Sort by similarity and return top_k
    results.sort(key=lambda x: x['similarity'], reverse=True)
    return results[:top_k]

async def get_lecture_data(lecture_id: str) -> Dict:
    """Get complete lecture with all related data"""
    db = get_db()
    
    # Get lecture. `_lecture_id_filter` matches either ObjectId or plain-string
    # ids so the lookup works regardless of how the lecture was inserted.
    lecture = await db.lectures.find_one({"_id": _lecture_id_filter(lecture_id)})
    if not lecture:
        return None
    
    # Get related data
    lecture["transcriptions"] = await db.transcriptions.find(
        {"lecture_id": lecture_id}
    ).to_list(length=None)
    for transcription in lecture["transcriptions"]:
        transcription["effective_text"] = effective_transcription_text(transcription)
    
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

async def mark_document_processed(
    document_id: str, status: str = "ready", error: Optional[str] = None
) -> None:
    """Apply a document state transition while retaining the legacy flag."""
    if status not in {"uploaded", "extracting", "chunking", "embedding", "ready", "failed"}:
        raise ValueError(f"Unknown document status: {status}")
    db = get_db()
    
    await db.documents.update_one(
        {"_id": _lecture_id_filter(document_id)},
        {"$set": {
            "processed": status == "ready",
            "status": status,
            "error": error,
            "processed_at": datetime.utcnow() if status == "ready" else None,
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
    lecture = await db.lectures.find_one({"_id": _lecture_id_filter(lecture_id), "user_id": user_id})
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
        trans["effective_text"] = effective_transcription_text(trans)
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

async def save_transcription(
    lecture_id: str,
    chunk_index: int,
    text: str,
    enhanced_notes: str,
    timestamp: str | int,
    importance: float,
    *,
    start_ms: Optional[int] = None,
    end_ms: Optional[int] = None,
    seq: Optional[int] = None,
    citation_ids: Optional[List[str]] = None,
) -> str:
    """Idempotently save a transcript segment with editable effective text."""
    db = get_db()
    sequence = chunk_index if seq is None else seq
    transcription = {
        "lecture_id": lecture_id,
        "chunk_index": chunk_index,
        # ``text`` remains for backwards-compatible readers.
        "text": text,
        "raw_text": text,
        "start_ms": start_ms,
        "end_ms": end_ms,
        "seq": sequence,
        "citation_ids": citation_ids or [],
        "enhanced_notes": enhanced_notes,
        "timestamp": timestamp,
        "importance": importance,
        "metadata": {},
        "created_at": datetime.utcnow()
    }
    
    # Upsert (update if exists, insert if not)
    result = await db.transcriptions.update_one(
        {"lecture_id": lecture_id, "seq": sequence},
        {"$set": transcription, "$setOnInsert": {"corrected_text": None, "edited_at": None, "edited_by": None}},
        upsert=True
    )
    
    if result.upserted_id:
        return str(result.upserted_id)
    saved = await db.transcriptions.find_one({"lecture_id": lecture_id, "seq": sequence}, {"_id": 1})
    return str(saved["_id"]) if saved else "updated"


def effective_transcription_text(transcription: Dict[str, Any]) -> str:
    """Return the learner-corrected transcript where one exists."""
    return transcription.get("corrected_text") or transcription.get("raw_text") or transcription.get("text", "")

async def save_structured_notes(lecture_id: str, content: str,
                               transcription_count: int, citations: Optional[List[Dict]] = None) -> str:
    """Save structured notes"""
    db = get_db()
    
    note = {
        "lecture_id": lecture_id,
        "content": content,
        "transcription_count": transcription_count,
        "citations": citations or [],
        "metadata": {},
        "created_at": datetime.utcnow()
    }
    
    result = await db.structured_notes.insert_one(note)
    return str(result.inserted_id)

async def save_final_notes(lecture_id: str, title: str, markdown: str,
                          sections: List[Dict], glossary: Dict, 
                          key_takeaways: List[str], citations: Optional[List[Dict]] = None) -> str:
    """Save final comprehensive notes"""
    db = get_db()
    
    final_note = {
        "lecture_id": lecture_id,
        "title": title,
        "markdown": markdown,
        "sections": sections,
        "glossary": glossary,
        "key_takeaways": key_takeaways,
        "citations": citations or [],
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
