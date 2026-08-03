from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "LectureWeave Backend"
    
    # Database - MongoDB (the active persistence layer)
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    # For MongoDB Atlas:
    # mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority

    # Legacy PostgreSQL setting, retained only for backward-compatible imports in
    # the not-yet-removed SQLAlchemy code. Not used by the active MongoDB app.
    # No credentials are hard-coded here; provide via env if legacy code is run.
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
    # Storage
    UPLOAD_DIR: str = "storage/uploads"
    AUDIO_DIR: str = "storage/audio"
    PROCESSED_DIR: str = "storage/processed"
    
    # AI/ML Settings
    WHISPER_MODEL_SIZE: str = "small"  # tiny, base, small, medium, large (small is much better!)
    WHISPER_DEVICE: str = "cpu"
    WHISPER_COMPUTE_TYPE: str = "int8"
    
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    
    # LLM Settings
    GROQ_API_KEY: Optional[str] = os.getenv("GROQ_API_KEY")
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    LLM_MODEL: str = "llama-3.1-8b-instant"
    
    # Audio Processing
    AUDIO_SAMPLE_RATE: int = 16000
    CHUNK_DURATION: int = 20  # seconds (optimized for better transcription)
    SYNTHESIS_INTERVAL: int = 60  # seconds (3 chunks for structured notes)
    
    # RAG Settings
    FAISS_TOP_K: int = 3
    IMPORTANCE_THRESHOLD: float = 0.0
    HISTORY_CHUNKS: int = 4
    
    # Security
    # Sourced from JWT_SECRET_KEY (the variable the auth service also reads);
    # falls back to SECRET_KEY, then a clearly-insecure dev default so the app
    # still boots locally. Always set JWT_SECRET_KEY in real environments.
    SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", os.getenv("SECRET_KEY", "dev-insecure-change-me"))
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Load environment variables
settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.AUDIO_DIR, exist_ok=True)
os.makedirs(settings.PROCESSED_DIR, exist_ok=True)
