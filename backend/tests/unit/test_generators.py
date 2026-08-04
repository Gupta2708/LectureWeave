import pytest

from app.schemas.retrieval import RetrievedChunk
from app.services.flashcards import generator as flashcards
from app.services.quizzes import generator as quizzes


@pytest.mark.asyncio
async def test_flashcards_refuse_to_create_without_retrieval(monkeypatch):
    async def empty(*_args, **_kwargs): return []
    monkeypatch.setattr(flashcards, "retrieve", empty)
    assert await flashcards.generate_flashcards(user_id="u", subject_id="s", count=5) == []


@pytest.mark.asyncio
async def test_quizzes_include_grounding_citations(monkeypatch):
    async def chunks(*_args, **_kwargs): return [RetrievedChunk(chunk_id="c", document_id="d", lecture_id="l", chunk_text="A concept is defined here.")]
    monkeypatch.setattr(quizzes, "retrieve", chunks)
    questions = await quizzes.generate_quiz_questions(user_id="u", subject_id="s", count=1, question_types=["mcq"])
    assert questions[0]["citations"][0]["id"] == "C1"
    assert len(questions[0]["options"]) == 4
