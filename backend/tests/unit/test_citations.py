from app.schemas.retrieval import RetrievedChunk
from app.services.synthesis.citations import attach_auto_citations, citation_sources, validate_citations


def _sources():
    return citation_sources([RetrievedChunk(chunk_id="chunk-1", document_id="doc-1", lecture_id="lecture-1", chunk_text="Gradient descent uses a learning rate.", page_number=17)])[0]


def test_validator_drops_hallucinated_ids_and_strips_tags():
    markdown, citations = validate_citations("A supported claim [C1]. Fake claim [C99].", [{"id": "C1"}, {"id": "C99"}], _sources())
    assert "[C1]" in markdown
    assert "[C99]" not in markdown
    assert [citation["id"] for citation in citations] == ["C1"]


def test_auto_citation_marks_uncited_markdown():
    markdown, citations = attach_auto_citations("- Learning rate controls updates.", _sources())
    assert "[C1]" in markdown
    assert citations[0]["mode"] == "auto"
