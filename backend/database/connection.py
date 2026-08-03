"""
PostgreSQL database connection with pgvector support
"""
import psycopg2
from psycopg2.extras import RealDictCursor, Json
from psycopg2.pool import SimpleConnectionPool
from contextlib import contextmanager
import os
from typing import Optional, List, Dict, Any
import numpy as np
from app.core.config import settings

# Connection pool
_pool: Optional[SimpleConnectionPool] = None

def init_db_pool(min_conn: int = 1, max_conn: int = 10):
    """Initialize database connection pool"""
    global _pool
    
    if _pool is None:
        database_url = os.getenv("DATABASE_URL", settings.DATABASE_URL)
        
        _pool = SimpleConnectionPool(
            min_conn,
            max_conn,
            database_url
        )
        print(f"✅ Database connection pool initialized (min={min_conn}, max={max_conn})")
    
    return _pool

def close_db_pool():
    """Close all database connections"""
    global _pool
    if _pool:
        _pool.closeall()
        _pool = None
        print("🔒 Database connection pool closed")

@contextmanager
def get_db_connection():
    """Context manager for database connections"""
    pool = init_db_pool()
    conn = pool.getconn()
    
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        pool.putconn(conn)

@contextmanager
def get_db_cursor(dict_cursor: bool = True):
    """Context manager for database cursor"""
    with get_db_connection() as conn:
        cursor_factory = RealDictCursor if dict_cursor else None
        cursor = conn.cursor(cursor_factory=cursor_factory)
        try:
            yield cursor
        finally:
            cursor.close()

def execute_query(query: str, params: tuple = None, fetch: bool = True) -> Optional[List[Dict]]:
    """Execute a query and return results"""
    with get_db_cursor() as cursor:
        cursor.execute(query, params)
        if fetch:
            return cursor.fetchall()
        return None

def execute_many(query: str, params_list: List[tuple]) -> None:
    """Execute query with multiple parameter sets"""
    with get_db_cursor(dict_cursor=False) as cursor:
        cursor.executemany(query, params_list)

def init_database():
    """Initialize database schema"""
    schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
    
    with open(schema_path, 'r', encoding='utf-8') as f:
        schema_sql = f.read()
    
    with get_db_cursor(dict_cursor=False) as cursor:
        cursor.execute(schema_sql)
    
    print("✅ Database schema initialized")

# Vector operations for pgvector
def numpy_to_pgvector(array: np.ndarray) -> str:
    """Convert numpy array to pgvector format"""
    return '[' + ','.join(map(str, array.tolist())) + ']'

def pgvector_to_numpy(vector_str: str) -> np.ndarray:
    """Convert pgvector string to numpy array"""
    # Remove brackets and split
    values = vector_str.strip('[]').split(',')
    return np.array([float(v) for v in values])

# Helper functions for common operations
def create_lecture(user_id: int, subject_id: int, title: str) -> int:
    """Create a new lecture and return its ID"""
    query = """
        INSERT INTO lectures (user_id, subject_id, title, status)
        VALUES (%s, %s, %s, 'in_progress')
        RETURNING id
    """
    with get_db_cursor() as cursor:
        cursor.execute(query, (user_id, subject_id, title))
        return cursor.fetchone()['id']

def save_document(lecture_id: int, filename: str, file_type: str, 
                  file_path: str, content: str) -> int:
    """Save document metadata"""
    query = """
        INSERT INTO documents (lecture_id, filename, file_type, file_path, content)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id
    """
    with get_db_cursor() as cursor:
        cursor.execute(query, (lecture_id, filename, file_type, file_path, content))
        return cursor.fetchone()['id']

def save_document_chunks(chunks: List[Dict[str, Any]]) -> None:
    """Batch insert document chunks with embeddings"""
    query = """
        INSERT INTO document_chunks 
        (document_id, lecture_id, chunk_text, chunk_index, embedding)
        VALUES (%s, %s, %s, %s, %s::vector)
        ON CONFLICT (document_id, chunk_index) DO NOTHING
    """
    
    params_list = [
        (
            chunk['document_id'],
            chunk['lecture_id'],
            chunk['text'],
            chunk['index'],
            numpy_to_pgvector(chunk['embedding'])
        )
        for chunk in chunks
    ]
    
    execute_many(query, params_list)
    print(f"✅ Saved {len(chunks)} document chunks with embeddings")

def search_similar_chunks(query_embedding: np.ndarray, lecture_id: int, 
                         top_k: int = 10) -> List[Dict]:
    """Search for similar document chunks using pgvector"""
    query = """
        SELECT * FROM search_similar_chunks(%s::vector, %s, %s)
    """
    
    embedding_str = numpy_to_pgvector(query_embedding)
    
    with get_db_cursor() as cursor:
        cursor.execute(query, (embedding_str, lecture_id, top_k))
        return cursor.fetchall()

def save_transcription(lecture_id: int, chunk_index: int, text: str,
                      enhanced_notes: str, timestamp: str, importance: float) -> int:
    """Save transcription chunk"""
    query = """
        INSERT INTO transcriptions 
        (lecture_id, chunk_index, text, enhanced_notes, timestamp, importance)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (lecture_id, chunk_index) 
        DO UPDATE SET text = EXCLUDED.text, 
                      enhanced_notes = EXCLUDED.enhanced_notes,
                      importance = EXCLUDED.importance
        RETURNING id
    """
    with get_db_cursor() as cursor:
        cursor.execute(query, (lecture_id, chunk_index, text, enhanced_notes, 
                              timestamp, importance))
        return cursor.fetchone()['id']

def save_structured_notes(lecture_id: int, content: str, 
                         transcription_count: int) -> int:
    """Save structured notes"""
    query = """
        INSERT INTO structured_notes (lecture_id, content, transcription_count)
        VALUES (%s, %s, %s)
        RETURNING id
    """
    with get_db_cursor() as cursor:
        cursor.execute(query, (lecture_id, content, transcription_count))
        return cursor.fetchone()['id']

def save_final_notes(lecture_id: int, title: str, markdown: str,
                    sections: List[Dict], glossary: Dict, 
                    key_takeaways: List[str]) -> int:
    """Save final comprehensive notes"""
    query = """
        INSERT INTO final_notes 
        (lecture_id, title, markdown, sections, glossary, key_takeaways)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (lecture_id) 
        DO UPDATE SET title = EXCLUDED.title,
                      markdown = EXCLUDED.markdown,
                      sections = EXCLUDED.sections,
                      glossary = EXCLUDED.glossary,
                      key_takeaways = EXCLUDED.key_takeaways,
                      created_at = CURRENT_TIMESTAMP
        RETURNING id
    """
    with get_db_cursor() as cursor:
        cursor.execute(query, (
            lecture_id, title, markdown,
            Json(sections), Json(glossary), Json(key_takeaways)
        ))
        return cursor.fetchone()['id']

def get_lecture_data(lecture_id: int) -> Dict:
    """Get complete lecture data"""
    query = """
        SELECT 
            l.*,
            (SELECT json_agg(t.*) FROM transcriptions t WHERE t.lecture_id = l.id) as transcriptions,
            (SELECT json_agg(s.*) FROM structured_notes s WHERE s.lecture_id = l.id) as structured_notes,
            (SELECT json_agg(d.*) FROM documents d WHERE d.lecture_id = l.id) as documents,
            (SELECT row_to_json(f.*) FROM final_notes f WHERE f.lecture_id = l.id) as final_notes
        FROM lectures l
        WHERE l.id = %s
    """
    with get_db_cursor() as cursor:
        cursor.execute(query, (lecture_id,))
        return cursor.fetchone()

def mark_document_processed(document_id: int) -> None:
    """Mark document as processed"""
    query = """
        UPDATE documents 
        SET processed = TRUE, processed_at = CURRENT_TIMESTAMP
        WHERE id = %s
    """
    execute_query(query, (document_id,), fetch=False)

def update_lecture_status(lecture_id: int, status: str) -> None:
    """Update lecture status"""
    query = """
        UPDATE lectures 
        SET status = %s, 
            completed_at = CASE WHEN %s = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
        WHERE id = %s
    """
    execute_query(query, (status, status, lecture_id), fetch=False)
