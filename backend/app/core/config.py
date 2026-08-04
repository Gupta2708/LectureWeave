"""
Canonical application settings.

All runtime configuration is read here through pydantic-settings.
No other module should call `os.getenv()`/`os.environ` for application config.
"""
from pydantic_settings import BaseSettings
from typing import List, Optional
import os


class Settings(BaseSettings):
    # ---- Application ----
    APP_NAME: str = "LectureWeave"
    APP_ENV: str = "development"  # development | testing | production
    APP_DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "LectureWeave Backend"
    LOG_LEVEL: str = "INFO"

    # ---- Server ----
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # ---- CORS ----
    # Comma-separated origins, e.g. "http://localhost:3000,https://app.example.com"
    # A single "*" enables wildcard (development only; incompatible with credentials).
    CORS_ALLOWED_ORIGINS: str = "http://localhost:3000"
    CORS_ALLOW_CREDENTIALS: bool = True

    # ---- Database (MongoDB) ----
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DATABASE: str = "lectureweave"

    # ---- Storage ----
    STORAGE_DIRECTORY: str = "storage/uploads"
    UPLOAD_DIR: str = "storage/uploads"
    AUDIO_DIR: str = "storage/audio"
    PROCESSED_DIR: str = "storage/processed"

    # ---- Speech-to-text (Faster Whisper) ----
    WHISPER_MODEL_SIZE: str = "small"
    WHISPER_DEVICE: str = "cpu"
    WHISPER_COMPUTE_TYPE: str = "int8"

    # ---- Embeddings ----
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    VECTOR_INDEX_NAME: str = "vector_search"

    # ---- Document processing and retrieval ----
    DOCUMENT_CHUNKER: str = "structure"  # structure | legacy
    DOCUMENT_CHUNK_SIZE: int = 1200
    DOCUMENT_CHUNK_OVERLAP: int = 150
    DOCUMENT_MIN_CHUNK_SIZE: int = 200
    RETRIEVAL_VECTOR_LIMIT: int = 10
    RETRIEVAL_KEYWORD_LIMIT: int = 10
    RETRIEVAL_FINAL_LIMIT: int = 5
    RETRIEVAL_MIN_SCORE: float = 0.0
    RETRIEVAL_VECTOR_WEIGHT: float = 0.6
    RETRIEVAL_KEYWORD_WEIGHT: float = 0.4
    RETRIEVAL_HEADING_BOOST: float = 0.1
    PROCESSING_MAX_RETRIES: int = 3
    CHAT_MAX_HISTORY_MESSAGES: int = 6
    CHAT_MAX_CONTEXT_CHUNKS: int = 8
    FLASHCARD_DEFAULT_COUNT: int = 10
    QUIZ_DEFAULT_COUNT: int = 10
    TOPIC_MIN_DURATION_SECONDS: int = 90
    TOPIC_SIMILARITY_THRESHOLD: float = 0.35

    # ---- LLM (Groq) ----
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "llama-3.1-8b-instant"
    LLM_MODEL: str = "llama-3.1-8b-instant"  # legacy alias, kept for compat

    # ---- Audio processing ----
    AUDIO_SAMPLE_RATE: int = 16000
    CHUNK_DURATION: int = 20  # seconds
    SYNTHESIS_INTERVAL: int = 60  # seconds

    # ---- RAG ----
    FAISS_TOP_K: int = 3
    IMPORTANCE_THRESHOLD: float = 0.0
    HISTORY_CHUNKS: int = 4

    # ---- Security / JWT ----
    JWT_SECRET_KEY: str = "dev-insecure-change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ACCESS_TOKEN_EXPIRE_DAYS: int = 30

    # ---- Legacy (unused by active app; retained only for imports in files
    # scheduled for removal). No credentials are baked in. ----
    DATABASE_URL: str = ""
    OPENAI_API_KEY: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True
        # Don't crash the app when a .env or the shell contains a variable we
        # don't recognise (e.g. legacy names, deployment-injected vars).
        extra = "ignore"

    # ---- Convenience accessors ----
    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() == "production"

    @property
    def cors_origins_list(self) -> List[str]:
        raw = (self.CORS_ALLOWED_ORIGINS or "").strip()
        if not raw:
            return []
        return [o.strip() for o in raw.split(",") if o.strip()]

    @property
    def cors_allow_credentials_effective(self) -> bool:
        """CORS spec forbids credentials + wildcard; downgrade credentials off
        when the origin list is a wildcard so misconfiguration fails safely."""
        if self.cors_origins_list == ["*"]:
            return False
        return self.CORS_ALLOW_CREDENTIALS

    # Back-compat: the auth service historically read `SECRET_KEY`.
    @property
    def SECRET_KEY(self) -> str:
        return self.JWT_SECRET_KEY

    @property
    def ALGORITHM(self) -> str:
        return self.JWT_ALGORITHM


def _validate(s: "Settings") -> None:
    """Fail loudly in production when required secrets are still placeholders."""
    if not s.is_production:
        return
    problems: List[str] = []
    if s.JWT_SECRET_KEY in ("", "dev-insecure-change-me", "your-secret-key-change-in-production"):
        problems.append("JWT_SECRET_KEY is missing or a placeholder")
    if not s.MONGODB_URL or s.MONGODB_URL == "mongodb://localhost:27017":
        problems.append("MONGODB_URL is missing or points at localhost")
    if not s.GROQ_API_KEY:
        problems.append("GROQ_API_KEY is missing")
    if s.cors_origins_list == ["*"]:
        problems.append("CORS_ALLOWED_ORIGINS is a wildcard; specify explicit origins")
    if problems:
        raise RuntimeError(
            "Invalid production configuration:\n  - " + "\n  - ".join(problems)
        )


settings = Settings()
_validate(settings)

# Ensure runtime directories exist. Directory creation is safe and stays here
# because it is a side-effect of configuration, not application logic.
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.AUDIO_DIR, exist_ok=True)
os.makedirs(settings.PROCESSED_DIR, exist_ok=True)
