"""Structure-preserving document chunker tests."""
from __future__ import annotations

from app.services.documents.chunker import chunk_document
from app.services.documents.extractor import ExtractedDocument, ExtractedUnit


def test_pdf_units_keep_page_provenance_and_strip_repeated_headers():
    fixture = ExtractedDocument(
        file_type="pdf",
        units=[
            ExtractedUnit("Course handout\n\nGradient descent moves toward a local minimum.", page_number=1),
            ExtractedUnit("Course handout\n\nThe learning rate controls the size of each update.", page_number=2),
        ],
        page_count=2,
    )

    chunks = chunk_document(fixture, size=200, overlap=0, minimum=1)

    assert [chunk.page_number for chunk in chunks] == [1, 2]
    assert all(chunk.section_heading is None for chunk in chunks)
    assert all("Course handout" not in chunk.text for chunk in chunks)
