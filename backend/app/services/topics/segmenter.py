"""Embedding-window topic segmentation for a single lecture."""
from __future__ import annotations

import asyncio
from typing import Any
import numpy as np

from app.core.config import settings


def cosine_similarity(left: np.ndarray, right: np.ndarray) -> float:
    denominator = float(np.linalg.norm(left) * np.linalg.norm(right))
    return float(np.dot(left, right) / denominator) if denominator else 1.0


def segment_transcripts(segments: list[dict[str, Any]], embedder, *, threshold: float = settings.TOPIC_SIMILARITY_THRESHOLD, min_duration_seconds: int = settings.TOPIC_MIN_DURATION_SECONDS) -> list[list[dict[str, Any]]]:
    """Group overlapping three-segment windows at semantic discontinuities."""
    if not segments: return []
    windows = [" ".join((item.get("corrected_text") or item.get("raw_text") or item.get("text", "")) for item in segments[max(0, index - 1):index + 2]) for index in range(len(segments))]
    embeddings = np.asarray(embedder.encode(windows, show_progress_bar=False), dtype=float)
    boundaries = {0}
    for index in range(1, len(embeddings)):
        if 1 - cosine_similarity(embeddings[index - 1], embeddings[index]) > threshold:
            boundaries.add(index)
    grouped: list[list[dict[str, Any]]] = []
    for index, segment in enumerate(segments):
        if index in boundaries: grouped.append([])
        grouped[-1].append(segment)
    minimum_ms = min_duration_seconds * 1000
    merged: list[list[dict[str, Any]]] = []
    for group in grouped:
        duration = int(group[-1].get("end_ms", 0)) - int(group[0].get("start_ms", 0))
        if merged and duration < minimum_ms: merged[-1].extend(group)
        else: merged.append(group)
    return merged


def _label(group: list[dict[str, Any]]) -> tuple[str, str]:
    text = " ".join(item.get("corrected_text") or item.get("raw_text") or item.get("text", "") for item in group).strip()
    words = [word for word in text.replace(".", " ").split() if len(word) > 3]
    title = " ".join(words[:5]).title() or "Lecture topic"
    return title, text[:350] or "No transcript content available."


async def _label_group(group: list[dict[str, Any]]) -> tuple[str, str]:
    """Use one optional LLM call per topic; preserve a deterministic fallback."""
    fallback = _label(group)
    if not settings.GROQ_API_KEY:
        return fallback
    try:
        from groq import Groq
        text = " ".join(item.get("corrected_text") or item.get("raw_text") or item.get("text", "") for item in group)[:4000]
        response = await asyncio.to_thread(lambda: Groq(api_key=settings.GROQ_API_KEY).chat.completions.create(model=settings.GROQ_MODEL, messages=[{"role": "user", "content": f"Return JSON {{\"title\": string, \"summary\": string}} for this lecture topic only: {text}"}], temperature=0.1, max_tokens=180))
        import json
        data = json.loads(response.choices[0].message.content.strip().strip("`"))
        return data.get("title") or fallback[0], data.get("summary") or fallback[1]
    except Exception:
        return fallback


async def generate_topics(segments: list[dict[str, Any]]) -> list[dict[str, Any]]:
    from app.services.document_processor_mongodb import get_embedder
    groups = await asyncio.to_thread(segment_transcripts, segments, get_embedder())
    topics = []
    for group in groups:
        title, summary = await _label_group(group)
        topics.append({"start_ms": int(group[0].get("start_ms", 0)), "end_ms": int(group[-1].get("end_ms", 0)), "title": title, "summary": summary, "transcript_segment_ids": [str(item["_id"]) for item in group]})
    return topics
