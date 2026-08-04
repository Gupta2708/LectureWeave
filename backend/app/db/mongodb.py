"""
MongoDB client accessor.

Thin re-export of the existing `database.mongodb_connection` helpers so the
rest of the app can import from `app.db.mongodb` rather than reaching into the
top-level `database/` package.
"""
from __future__ import annotations

from database.mongodb_connection import (  # noqa: F401
    init_mongodb,
    close_mongodb,
    get_db,
    get_collection,
    setup_indexes,
    create_vector_search_index_config,
)
