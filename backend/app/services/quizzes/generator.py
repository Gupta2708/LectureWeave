"""Citation-grounded quiz construction and deterministic scoring."""
from __future__ import annotations

from app.services.retrieval import retrieve
from app.services.synthesis.citations import citation_sources


async def generate_quiz_questions(*, user_id: str, subject_id: str, count: int, question_types: list[str], lecture_id: str | None = None) -> list[dict]:
    chunks = await retrieve("core concepts definitions applications", user_id=user_id, subject_id=subject_id, lecture_ids=[lecture_id] if lecture_id else None, limit=count)
    sources, _ = citation_sources(chunks)
    questions = []
    for index, (chunk, source) in enumerate(zip(chunks, sources), start=1):
        kind = question_types[(index - 1) % len(question_types)] if question_types else "mcq"
        answer = chunk.chunk_text[:240].strip()
        question = {"prompt": f"According to the material, explain {chunk.section_heading or 'this concept'}.", "question_type": kind, "correct_answer": answer, "explanation": answer, "citations": [source]}
        if kind == "mcq":
            question["options"] = [answer, "It is unrelated to the lecture material.", "It has no defined role.", "None of the cited sources discuss it."]
        else: question["options"] = []
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
