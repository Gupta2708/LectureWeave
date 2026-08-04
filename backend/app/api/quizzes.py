"""Grounded quiz generation and submission routes."""
from __future__ import annotations

from typing import Any
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.api.auth import get_current_user
from app.db.repositories.quizzes import create_quiz
from app.schemas.quizzes import QuizGenerate, QuizSubmission
from app.services.quizzes import generate_quiz_questions, score_attempt
from database.mongodb_connection import get_db, user_owns_subject

router = APIRouter(tags=["Quizzes"])


def _id_filter(value: str) -> dict:
    values: list[Any] = [value]
    try: values.append(ObjectId(value))
    except Exception: pass
    return {"$in": values}


@router.post("/api/subjects/{subject_id}/quizzes/generate")
async def generate_quiz(subject_id: str, payload: QuizGenerate, current_user: dict = Depends(get_current_user)):
    if not await user_owns_subject(subject_id, current_user["user_id"]): raise HTTPException(status_code=404, detail="Subject not found")
    if payload.lecture_id:
        lecture = await get_db().lectures.find_one({"_id": _id_filter(payload.lecture_id), "user_id": current_user["user_id"], "subject_id": subject_id}, {"_id": 1})
        if not lecture: raise HTTPException(status_code=404, detail="Lecture not found")
    questions = await generate_quiz_questions(user_id=current_user["user_id"], subject_id=subject_id, count=payload.count, question_types=[item.value for item in payload.question_types], lecture_id=payload.lecture_id)
    if not questions: raise HTTPException(status_code=422, detail="No grounded material available for a quiz")
    quiz_id = await create_quiz(current_user["user_id"], subject_id, questions, lecture_id=payload.lecture_id, difficulty=payload.difficulty)
    saved = await get_db().quiz_questions.find({"quiz_id": quiz_id}).to_list(None)
    for question in saved: question["_id"] = str(question["_id"])
    return {"id": quiz_id, "questions": [_public_question(question) for question in saved]}


@router.get("/api/quizzes/{quiz_id}")
async def get_quiz(quiz_id: str, current_user: dict = Depends(get_current_user)):
    quiz = await get_db().quizzes.find_one({"_id": _id_filter(quiz_id), "user_id": current_user["user_id"]})
    if not quiz: raise HTTPException(status_code=404, detail="Quiz not found")
    questions = await get_db().quiz_questions.find({"quiz_id": quiz_id}).to_list(None)
    for question in questions: question["_id"] = str(question["_id"])
    return {"id": str(quiz["_id"]), "questions": [_public_question(question) for question in questions]}


@router.post("/api/quizzes/{quiz_id}/submit")
async def submit_quiz(quiz_id: str, payload: QuizSubmission, current_user: dict = Depends(get_current_user)):
    quiz = await get_db().quizzes.find_one({"_id": _id_filter(quiz_id), "user_id": current_user["user_id"]})
    if not quiz: raise HTTPException(status_code=404, detail="Quiz not found")
    questions = await get_db().quiz_questions.find({"quiz_id": quiz_id}).to_list(None)
    score, results = score_attempt(questions, payload.answers)
    await get_db().quiz_attempts.insert_one({"quiz_id": quiz_id, "user_id": current_user["user_id"], "answers": payload.answers, "score": score, "total": len(questions), "results": results})
    return {"score": score, "total": len(questions), "results": results}


def _public_question(question: dict) -> dict:
    question = dict(question)
    question.pop("correct_answer", None)
    return question
