"""Citation-grounded quiz construction and deterministic scoring.

Groq authors question stems + MCQ distractors when `GROQ_API_KEY` is
configured; otherwise falls back to templated prompts with generic distractors
so tests and no-key setups still return valid, grounded questions.
"""
from __future__ import annotations

import asyncio
import json
import logging

from app.core.config import settings
from app.services.retrieval import retrieve
from app.services.synthesis.citations import citation_sources

logger = logging.getLogger(__name__)

# Deterministic distractors used when the model returns none. Kept generic so
# they are obviously-wrong for any real course topic; grounded MCQs from Groq
# replace them when a key is present.
_FALLBACK_DISTRACTORS = [
    "It is unrelated to the lecture material.",
    "It has no defined role.",
    "None of the cited sources discuss it.",
]


def _template_question(chunk, source, kind: str) -> dict:
    answer = chunk.chunk_text[:240].strip()
    question = {
        "prompt": f"According to the material, explain {chunk.section_heading or 'this concept'}.",
        "question_type": kind,
        "correct_answer": answer,
        "explanation": answer,
        "citations": [source],
    }
    question["options"] = [answer, *_FALLBACK_DISTRACTORS] if kind == "mcq" else []
    return question


async def _groq_question(chunk, source, kind: str) -> dict | None:
    """Author a grounded quiz question with Groq; returns None on any failure."""
    if not settings.GROQ_API_KEY:
        return None
    excerpt = chunk.chunk_text[:1500]
    topic = chunk.section_heading or "the concept"
    if kind == "mcq":
        instruction = (
            "Write ONE multiple-choice question grounded strictly in the excerpt. "
            "Return valid JSON with keys \"prompt\", \"correct_answer\", "
            "\"distractors\" (list of exactly 3 plausible-but-wrong strings), "
            "and \"explanation\" (one sentence). No answer key hints in "
            "distractors. No duplicates.\n\n"
            f"Topic: {topic}\n\nExcerpt:\n{excerpt}"
        )
    else:
        instruction = (
            "Write ONE short-answer question grounded strictly in the excerpt. "
            "Return valid JSON with keys \"prompt\", \"correct_answer\", and "
            "\"explanation\" (one sentence).\n\n"
            f"Topic: {topic}\n\nExcerpt:\n{excerpt}"
        )
    try:
        from groq import Groq

        response = await asyncio.to_thread(
            lambda: Groq(api_key=settings.GROQ_API_KEY).chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[{"role": "user", "content": instruction}],
                temperature=0.2,
                max_tokens=350,
            )
        )
        content = (response.choices[0].message.content or "").strip().strip("`")
        if content.startswith("json"):
            content = content[4:].strip()
        data = json.loads(content)

        prompt = str(data.get("prompt", "")).strip()
        correct = str(data.get("correct_answer", "")).strip()
        if not prompt or not correct:
            return None

        question: dict = {
            "prompt": prompt,
            "question_type": kind,
            "correct_answer": correct,
            "explanation": str(data.get("explanation", correct)).strip() or correct,
            "citations": [source],
        }
        if kind == "mcq":
            distractors = [str(item).strip() for item in data.get("distractors", []) if str(item).strip()]
            # Dedup while preserving order + guard against the model repeating
            # the correct answer as a distractor.
            unique: list[str] = []
            for item in distractors:
                if item != correct and item not in unique:
                    unique.append(item)
            if len(unique) < 3:
                unique = (unique + _FALLBACK_DISTRACTORS)[:3]
            question["options"] = [correct, *unique[:3]]
        else:
            question["options"] = []
        return question
    except Exception as e:  # noqa: BLE001
        logger.warning("Quiz Groq call failed (%s question): %s", kind, e)
        return None


async def generate_quiz_questions(*, user_id: str, subject_id: str, count: int, question_types: list[str], lecture_id: str | None = None) -> list[dict]:
    chunks = await retrieve(
        "core concepts definitions applications",
        user_id=user_id,
        subject_id=subject_id,
        lecture_ids=[lecture_id] if lecture_id else None,
        limit=count,
    )
    sources, _ = citation_sources(chunks)
    questions: list[dict] = []
    for index, (chunk, source) in enumerate(zip(chunks, sources), start=1):
        kind = question_types[(index - 1) % len(question_types)] if question_types else "mcq"
        question = await _groq_question(chunk, source, kind)
        if question is None:
            question = _template_question(chunk, source, kind)
        questions.append(question)
    return questions


def score_attempt(questions: list[dict], answers: dict[str, str]) -> tuple[int, list[dict]]:
    results = []
    score = 0
    for question in questions:
        correct = question.get("correct_answer", "").strip().casefold()
        supplied = answers.get(str(question["_id"]), "").strip().casefold()
        is_correct = supplied == correct if question.get("question_type") == "mcq" else bool(supplied and (supplied in correct or correct[:30] in supplied))
        score += int(is_correct)
        results.append({"question_id": str(question["_id"]), "correct": is_correct, "explanation": question.get("explanation"), "citations": question.get("citations", [])})
    return score, results
