"""Structure-aware chunking for uploaded documents."""
from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
import re
from typing import Optional

from app.core.config import settings
from .extractor import ExtractedDocument, ExtractedUnit


@dataclass(frozen=True)
class DocumentChunk:
    text: str
    page_number: Optional[int] = None
    slide_number: Optional[int] = None
    section_heading: Optional[str] = None
    paragraph_index: Optional[int] = None


def chunk_text_legacy(text: str, chunk_size: int = 300) -> list[str]:
    """The legacy word-based splitter retained for an immediate rollback."""
    words = text.split()
    return [" ".join(words[i:i + chunk_size]) for i in range(0, len(words), chunk_size) if words[i:i + chunk_size]]


def _without_repeated_page_lines(units: list[ExtractedUnit]) -> list[ExtractedUnit]:
    pages = [unit for unit in units if unit.page_number is not None]
    if len(pages) < 2:
        return units
    lines = Counter(
        line.strip()
        for unit in pages
        for line in unit.text.splitlines()
        if line.strip() and len(line.strip()) < 160
    )
    # A line must occur on at least two pages; otherwise a two-page document
    # would incorrectly treat every unique line as a repeated header/footer.
    repeated = {line for line, count in lines.items() if count >= 2 and count / len(pages) >= 0.5}
    return [
        ExtractedUnit(
            text="\n".join(line for line in unit.text.splitlines() if line.strip() not in repeated).strip(),
            page_number=unit.page_number,
            slide_number=unit.slide_number,
            section_heading=unit.section_heading,
        )
        for unit in units
    ]


def _paragraphs(text: str) -> list[str]:
    return [part.strip() for part in re.split(r"\n\s*\n|\r\n\s*\r\n", text) if part.strip()]


def _split_long(text: str, size: int) -> list[str]:
    if len(text) <= size:
        return [text]
    result: list[str] = []
    remainder = text
    while len(remainder) > size:
        boundary = remainder.rfind(" ", 0, size)
        boundary = boundary if boundary > size // 2 else size
        result.append(remainder[:boundary].strip())
        remainder = remainder[boundary:].strip()
    if remainder:
        result.append(remainder)
    return result


def _merge_unit(unit: ExtractedUnit, size: int, overlap: int, minimum: int) -> list[DocumentChunk]:
    paragraphs = _paragraphs(unit.text)
    chunks: list[DocumentChunk] = []
    current = ""
    paragraph_index = 0
    for index, paragraph in enumerate(paragraphs):
        for piece in _split_long(paragraph, size):
            candidate = f"{current}\n\n{piece}".strip() if current else piece
            if current and len(candidate) > size:
                chunks.append(DocumentChunk(current, unit.page_number, unit.slide_number, unit.section_heading, paragraph_index))
                prefix = current[-overlap:].lstrip() if overlap else ""
                current = f"{prefix}\n\n{piece}".strip()
                paragraph_index = index
            else:
                current = candidate
    if current and (len(current) >= minimum or not chunks):
        chunks.append(DocumentChunk(current, unit.page_number, unit.slide_number, unit.section_heading, paragraph_index))
    elif current and chunks:
        previous = chunks[-1]
        chunks[-1] = DocumentChunk(f"{previous.text}\n\n{current}", previous.page_number, previous.slide_number, previous.section_heading, previous.paragraph_index)
    return chunks


def chunk_document(document: ExtractedDocument, *, size: Optional[int] = None, overlap: Optional[int] = None, minimum: Optional[int] = None) -> list[DocumentChunk]:
    """Create chunks while retaining page/slide/heading provenance."""
    size = size or settings.DOCUMENT_CHUNK_SIZE
    overlap = settings.DOCUMENT_CHUNK_OVERLAP if overlap is None else overlap
    minimum = settings.DOCUMENT_MIN_CHUNK_SIZE if minimum is None else minimum
    units = _without_repeated_page_lines(document.units) if document.file_type == "pdf" else document.units
    chunks: list[DocumentChunk] = []
    for unit in units:
        if unit.text.strip():
            chunks.extend(_merge_unit(unit, size, overlap, minimum))
    return chunks
