"""Stable source IDs and defensive citation validation."""
from __future__ import annotations

import re
from typing import Any, Iterable

from app.schemas.retrieval import RetrievedChunk

_TAG = re.compile(r"\[(C\d+)\]")


def citation_sources(chunks: Iterable[RetrievedChunk]) -> tuple[list[dict[str, Any]], str]:
    """Assign session-local IDs in retrieval order and render prompt context."""
    sources: list[dict[str, Any]] = []
    lines: list[str] = []
    for index, chunk in enumerate(chunks, start=1):
        source_id = f"C{index}"
        item = {
            "id": source_id,
            "chunk_id": chunk.chunk_id,
            "type": chunk.source_type,
            "document_id": chunk.document_id,
            "lecture_id": chunk.lecture_id,
            "page_number": chunk.page_number,
            "slide_number": chunk.slide_number,
            "start_ms": chunk.start_ms,
            "end_ms": chunk.end_ms,
            "excerpt": chunk.chunk_text[:500],
            "mode": "model",
        }
        sources.append(item)
        if chunk.source_type == "transcript":
            location = f"lecture {chunk.start_ms or 0}-{chunk.end_ms or 0}ms"
        elif chunk.page_number:
            location = f"page {chunk.page_number}"
        elif chunk.slide_number:
            location = f"slide {chunk.slide_number}"
        else:
            location = "document excerpt"
        lines.append(f'[{source_id}] {location} — "{chunk.chunk_text[:350]}"')
    return sources, "\n".join(lines)


def validate_citations(markdown: str, returned: Iterable[dict[str, Any]] | None, sources: Iterable[dict[str, Any]]) -> tuple[str, list[dict[str, Any]]]:
    """Keep only source IDs supplied to this synthesis session and strip invalid tags."""
    source_by_id = {item["id"]: dict(item) for item in sources}
    allowed: list[dict[str, Any]] = []
    seen: set[str] = set()
    for claimed in returned or []:
        source_id = claimed.get("id") if isinstance(claimed, dict) else None
        if source_id in source_by_id and source_id not in seen:
            item = source_by_id[source_id]
            item["mode"] = claimed.get("mode", "model") if isinstance(claimed, dict) else "model"
            allowed.append(item); seen.add(source_id)
    referenced = {match.group(1) for match in _TAG.finditer(markdown)}
    for source_id in referenced:
        if source_id in source_by_id and source_id not in seen:
            allowed.append(source_by_id[source_id]); seen.add(source_id)
    clean = _TAG.sub(lambda match: match.group(0) if match.group(1) in source_by_id else "", markdown)
    return clean, allowed


def attach_auto_citations(markdown: str, sources: list[dict[str, Any]]) -> tuple[str, list[dict[str, Any]]]:
    """Attach an explicit nearest lexical source when a model returned no tags."""
    if not sources or _TAG.search(markdown):
        return validate_citations(markdown, [], sources)
    used: dict[str, dict[str, Any]] = {}
    rendered: list[str] = []
    for line in markdown.splitlines():
        words = {word.casefold() for word in re.findall(r"\w+", line) if len(word) > 3}
        if words and not line.lstrip().startswith("#"):
            best = max(sources, key=lambda source: len(words & {word.casefold() for word in re.findall(r"\w+", source.get("excerpt", ""))}))
            item = dict(best); item["mode"] = "auto"; used[item["id"]] = item
            line = f"{line} [{item['id']}]"
        rendered.append(line)
    return "\n".join(rendered), list(used.values())
