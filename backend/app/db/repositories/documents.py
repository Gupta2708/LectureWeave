"""
DocumentRepository — uploaded document persistence.
"""
from __future__ import annotations

from database.mongodb_connection import (  # noqa: F401
    save_document,
    save_document_embeddings,
    mark_document_processed,
    vector_search,
    simple_vector_search,
)
