"""Grounded flashcard generation and CRUD routes."""
from __future__ import annotations

from typing import Any
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.api.auth import get_current_user
from app.db.repositories.flashcards import create_flashcard, normalise_question
from app.schemas.flashcards import FlashcardUpdate
from app.services.flashcards import generate_flashcards
from database.mongodb_connection import get_db, user_owns_subject

router = APIRouter(tags=["Flashcards"])


def _ids(value: str) -> list[Any]:
    result: list[Any] = [value]
    try: result.append(ObjectId(value))
    except Exception: pass
    return result


@router.post("/api/subjects/{subject_id}/flashcards/generate")
async def generate_subject_flashcards(subject_id: str, payload: dict[str, Any] | None = None, current_user: dict = Depends(get_current_user)):
    if not await user_owns_subject(subject_id, current_user["user_id"]): raise HTTPException(status_code=404, detail="Subject not found")
    payload = payload or {}; cards = await generate_flashcards(user_id=current_user["user_id"], subject_id=subject_id, count=min(int(payload.get("count", 10)), 50), lecture_ids=payload.get("lecture_ids"))
    created = []
    for card in cards:
        try:
            card_id = await create_flashcard(current_user["user_id"], subject_id, **card)
            if card_id: created.append({"id": card_id, **card})
        except Exception: pass  # duplicate fingerprint: omit rather than create an ungrounded duplicate
    return {"flashcards": created}


@router.post("/api/flashcards/regenerate")
async def regenerate_flashcards(payload: dict[str, Any], current_user: dict = Depends(get_current_user)):
    subject_id = payload.get("subject_id")
    if not subject_id or not await user_owns_subject(subject_id, current_user["user_id"]): raise HTTPException(status_code=404, detail="Subject not found")
    cards = await generate_flashcards(user_id=current_user["user_id"], subject_id=subject_id, count=min(int(payload.get("count", 10)), 50), lecture_ids=payload.get("lecture_ids"))
    return {"flashcards": cards}


@router.get("/api/subjects/{subject_id}/flashcards")
async def list_flashcards(subject_id: str, current_user: dict = Depends(get_current_user)):
    if not await user_owns_subject(subject_id, current_user["user_id"]): raise HTTPException(status_code=404, detail="Subject not found")
    cards = await get_db().flashcards.find({"user_id": current_user["user_id"], "subject_id": subject_id}).sort("created_at", -1).to_list(None)
    for card in cards: card["_id"] = str(card["_id"])
    return {"flashcards": cards}


@router.patch("/api/flashcards/{card_id}")
async def update_flashcard(card_id: str, payload: FlashcardUpdate, current_user: dict = Depends(get_current_user)):
    updates = payload.model_dump(exclude_none=True)
    if "question" in updates: updates["normalised_question"] = normalise_question(updates["question"])
    result = await get_db().flashcards.update_one({"_id": {"$in": _ids(card_id)}, "user_id": current_user["user_id"]}, {"$set": updates})
    if not result.matched_count: raise HTTPException(status_code=404, detail="Flashcard not found")
    return {"success": True}


@router.delete("/api/flashcards/{card_id}")
async def delete_flashcard(card_id: str, current_user: dict = Depends(get_current_user)):
    result = await get_db().flashcards.delete_one({"_id": {"$in": _ids(card_id)}, "user_id": current_user["user_id"]})
    if not result.deleted_count: raise HTTPException(status_code=404, detail="Flashcard not found")
    return {"success": True}
