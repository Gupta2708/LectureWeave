-- LectureWeave Database Schema with pgvector
-- PostgreSQL 16 + pgvector extension

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table (if not using external auth)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lectures table
CREATE TABLE IF NOT EXISTS lectures (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    duration INTEGER DEFAULT 0, -- in seconds
    status VARCHAR(50) DEFAULT 'in_progress', -- in_progress, completed, archived
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Documents table (PDFs, PPTs uploaded for lectures)
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    lecture_id INTEGER REFERENCES lectures(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- pdf, pptx, docx
    file_size INTEGER, -- in bytes
    file_path TEXT NOT NULL,
    content TEXT, -- extracted text content
    metadata JSONB DEFAULT '{}',
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP
);

-- Document chunks with embeddings (pgvector!)
CREATE TABLE IF NOT EXISTS document_chunks (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    lecture_id INTEGER REFERENCES lectures(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    embedding vector(384), -- 384 dimensions for all-MiniLM-L6-v2
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Create index for fast similarity search
    CONSTRAINT unique_document_chunk UNIQUE (document_id, chunk_index)
);

-- Create HNSW index for fast vector similarity search
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx 
ON document_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Transcriptions table (20-second audio chunks)
CREATE TABLE IF NOT EXISTS transcriptions (
    id SERIAL PRIMARY KEY,
    lecture_id INTEGER REFERENCES lectures(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    text TEXT NOT NULL,
    enhanced_notes TEXT, -- AI-enhanced notes
    timestamp VARCHAR(20), -- HH:MM:SS format
    importance FLOAT DEFAULT 0.5,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_lecture_chunk UNIQUE (lecture_id, chunk_index)
);

-- Structured notes table (60-second synthesis)
CREATE TABLE IF NOT EXISTS structured_notes (
    id SERIAL PRIMARY KEY,
    lecture_id INTEGER REFERENCES lectures(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    transcription_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Final comprehensive notes table
CREATE TABLE IF NOT EXISTS final_notes (
    id SERIAL PRIMARY KEY,
    lecture_id INTEGER REFERENCES lectures(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    markdown TEXT NOT NULL,
    sections JSONB DEFAULT '[]',
    glossary JSONB DEFAULT '{}',
    key_takeaways JSONB DEFAULT '[]',
    formulas JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_lecture_final_notes UNIQUE (lecture_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_lectures_user_id ON lectures(user_id);
CREATE INDEX idx_lectures_subject_id ON lectures(subject_id);
CREATE INDEX idx_lectures_status ON lectures(status);
CREATE INDEX idx_documents_lecture_id ON documents(lecture_id);
CREATE INDEX idx_document_chunks_lecture_id ON document_chunks(lecture_id);
CREATE INDEX idx_transcriptions_lecture_id ON transcriptions(lecture_id);
CREATE INDEX idx_structured_notes_lecture_id ON structured_notes(lecture_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lectures_updated_at BEFORE UPDATE ON lectures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to search similar document chunks using pgvector
CREATE OR REPLACE FUNCTION search_similar_chunks(
    query_embedding vector(384),
    p_lecture_id INTEGER,
    top_k INTEGER DEFAULT 10
)
RETURNS TABLE (
    chunk_id INTEGER,
    chunk_text TEXT,
    similarity FLOAT,
    document_filename VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.id,
        dc.chunk_text,
        1 - (dc.embedding <=> query_embedding) AS similarity,
        d.filename
    FROM document_chunks dc
    JOIN documents d ON dc.document_id = d.id
    WHERE dc.lecture_id = p_lecture_id
    ORDER BY dc.embedding <=> query_embedding
    LIMIT top_k;
END;
$$ LANGUAGE plpgsql;

-- Function to get lecture statistics
CREATE OR REPLACE FUNCTION get_lecture_stats(p_lecture_id INTEGER)
RETURNS TABLE (
    transcription_count BIGINT,
    structured_notes_count BIGINT,
    document_count BIGINT,
    chunk_count BIGINT,
    has_final_notes BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM transcriptions WHERE lecture_id = p_lecture_id),
        (SELECT COUNT(*) FROM structured_notes WHERE lecture_id = p_lecture_id),
        (SELECT COUNT(*) FROM documents WHERE lecture_id = p_lecture_id),
        (SELECT COUNT(*) FROM document_chunks WHERE lecture_id = p_lecture_id),
        EXISTS(SELECT 1 FROM final_notes WHERE lecture_id = p_lecture_id);
END;
$$ LANGUAGE plpgsql;

-- Insert sample user for testing
INSERT INTO users (email, username, password_hash) 
VALUES ('test@lectureweave.com', 'testuser', 'hashed_password_here')
ON CONFLICT (email) DO NOTHING;

-- Grant permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO lectureweave_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO lectureweave_user;
