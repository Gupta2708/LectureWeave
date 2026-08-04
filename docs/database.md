# Database

LectureWeave uses MongoDB through Motor/PyMongo. The database and storage
directories are configured in `app.core.config`.

Core collections are `users`, `subjects`, `lectures`, `documents`,
`document_embeddings`, `transcriptions`, `structured_notes`, and `final_notes`.
Enhancement collections are `processing_jobs`, `lecture_markers`, `topics`,
`chat_threads`, `flashcard_sets`, and `quiz_attempts`.

Every user-visible record is tied to a user directly or through an owned
subject/lecture. Repository helpers must resolve that ownership before a read,
update, or delete.

## Embeddings and indexes

`document_embeddings` stores `lecture_id`, `document_id`, chunk text, section
metadata, an embedding, and a content hash. Startup creates the regular MongoDB
indexes, including a text index used by keyword retrieval.

Atlas Vector Search is optional. If its `VECTOR_INDEX_NAME` index is available,
the service performs filtered vector recall. Local and M0 deployments use the
same ownership filter with in-memory cosine scoring. See
[retrieval.md](retrieval.md).

Before a manual migration, back up the target database and run against a copied
environment first. No schema operation should silently remove existing user
content.
