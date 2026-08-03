from sqlalchemy import Column, Integer, String, DateTime, Text, Float, ForeignKey, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    subjects = relationship("Subject", back_populates="user")

class Subject(Base):
    __tablename__ = "subjects"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    code = Column(String(50))
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="subjects")
    lectures = relationship("Lecture", back_populates="subject")

class Lecture(Base):
    __tablename__ = "lectures"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    subject_id = Column(String, ForeignKey("subjects.id"), nullable=False)
    title = Column(String(255), nullable=False)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    duration = Column(Integer)  # in seconds
    status = Column(String(50), default="created")  # created, recording, processing, completed
    audio_file_path = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    subject = relationship("Subject", back_populates="lectures")
    documents = relationship("Document", back_populates="lecture")
    transcriptions = relationship("Transcription", back_populates="lecture")
    notes = relationship("Note", back_populates="lecture")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    lecture_id = Column(String, ForeignKey("lectures.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer)
    mime_type = Column(String(100))
    processed_at = Column(DateTime)
    status = Column(String(50), default="uploaded")  # uploaded, processing, processed, error
    
    # Relationships
    lecture = relationship("Lecture", back_populates="documents")

class Transcription(Base):
    __tablename__ = "transcriptions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    lecture_id = Column(String, ForeignKey("lectures.id"), nullable=False)
    chunk_number = Column(Integer, nullable=False)
    timestamp_start = Column(Float, nullable=False)
    timestamp_end = Column(Float, nullable=False)
    text = Column(Text, nullable=False)
    importance_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    lecture = relationship("Lecture", back_populates="transcriptions")

class Note(Base):
    __tablename__ = "notes"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    lecture_id = Column(String, ForeignKey("lectures.id"), nullable=False)
    type = Column(String(50), nullable=False)  # raw, structured
    content = Column(JSON)  # Store as JSON for flexibility
    chunk_start = Column(Float)  # For raw notes
    chunk_end = Column(Float)    # For raw notes
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    lecture = relationship("Lecture", back_populates="notes")
