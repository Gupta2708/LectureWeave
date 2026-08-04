"""Grounded quiz schemas."""
from __future__ import annotations

from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, Field


class QuestionType(str, Enum):
    mcq = "mcq"
    short_answer = "short_answer"
    conceptual = "conceptual"
    application = "application"


class QuizGenerate(BaseModel):
    question_types: list[QuestionType] = [QuestionType.mcq]
    count: int = Field(default=10, ge=1, le=50)
    difficulty: str = Field(default="medium", pattern="^(easy|medium|hard)$")
    lecture_id: Optional[str] = None


class QuizQuestion(BaseModel):
    prompt: str
    question_type: QuestionType
    options: list[str] = []
    correct_answer: str
    explanation: str
    citations: list[dict[str, Any]] = Field(min_length=1)


class QuizSubmission(BaseModel):
    answers: dict[str, str]
