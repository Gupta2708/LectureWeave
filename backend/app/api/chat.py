"""Subject-scoped grounded chat routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.api.auth import get_current_user
from app.db.repositories.chat import add_message, create_session, get_owned_session, user_owns_session
from app.schemas.chat import ChatMessageCreate, ChatSessionCreate
from app.services.chat import answer_question
from database.mongodb_connection import get_db, user_owns_subject

router = APIRouter(tags=["Chat"])


@router.post("/api/subjects/{subject_id}/chat/sessions")
async def create_chat_session(subject_id: str, payload: ChatSessionCreate, current_user: dict = Depends(get_current_user)):
    session_id = await create_session(current_user["user_id"], subject_id, payload.title)
    if not session_id: raise HTTPException(status_code=404, detail="Subject not found")
    return {"id": session_id, "subject_id": subject_id}


@router.get("/api/subjects/{subject_id}/chat/sessions")
async def list_chat_sessions(subject_id: str, current_user: dict = Depends(get_current_user)):
    if not await user_owns_subject(subject_id, current_user["user_id"]): raise HTTPException(status_code=404, detail="Subject not found")
    sessions = await get_db().chat_sessions.find({"user_id": current_user["user_id"], "subject_id": subject_id}).sort("updated_at", -1).to_list(None)
    for session in sessions: session["_id"] = str(session["_id"])
    return {"sessions": sessions}


@router.post("/api/chat/sessions/{session_id}/messages")
async def post_chat_message(session_id: str, payload: ChatMessageCreate, current_user: dict = Depends(get_current_user)):
    if not await user_owns_session(session_id, current_user["user_id"]): raise HTTPException(status_code=404, detail="Chat session not found")
    session = await get_owned_session(session_id, current_user["user_id"])
    if not session: raise HTTPException(status_code=404, detail="Chat session not found")
    await add_message(current_user["user_id"], session_id, "user", payload.content)
    answer, sources, meta = await answer_question(user_id=current_user["user_id"], subject_id=session["subject_id"], question=payload.content)
    await add_message(current_user["user_id"], session_id, "assistant", answer, sources=sources)
    return {"answer": answer, "sources": sources, "retrieval_meta": meta}
