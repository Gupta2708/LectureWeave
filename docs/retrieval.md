# Hybrid retrieval

`app.services.retrieval.retrieve()` is the sole retrieval interface for new
features. It first resolves lectures owned by the JWT user, then applies that
metadata filter before reading embeddings or text.

1. Atlas vector search is attempted using `VECTOR_INDEX_NAME`.
2. M0/local deployments fall back to filtered in-memory cosine similarity.
3. MongoDB `$text` search recalls keyword matches; a term-coverage fallback is
   used if the text index is unavailable.
4. Reciprocal Rank Fusion combines results using `RETRIEVAL_VECTOR_WEIGHT` and
   `RETRIEVAL_KEYWORD_WEIGHT`, with heading/exact-term boosts.

Create the `document_embedding_text` index through application startup, or
manually create a MongoDB text index on `chunk_text` and `section_heading`.
Atlas vector search is optional: the M0-safe fallback is expected to handle a
few thousand owned chunks per lecture.
