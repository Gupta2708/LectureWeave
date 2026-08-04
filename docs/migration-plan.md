# Migration and cleanup status

LectureWeave now runs through `app.main:app` on MongoDB. The deployment files
use one canonical Uvicorn command, configuration is read from
`app.core.config`, and active client pages use shared HTTP and WebSocket clients.

## Completed product-enhancement phases

1. Data foundations: ownership-aware records, indexes, structured document
   chunks, processing state, and configurable runtime limits.
2. Retrieval: owned-lecture filtering, Atlas vector recall with M0-safe cosine
   fallback, keyword recall, and reciprocal-rank fusion.
3. Workflow: transcript corrections, markers, retries, exports, templates, and
   processing-status events.
4. Trust: validated source citations with source excerpts in generated notes.
5. Study features: topic segments, grounded subject chat, flashcards, and
   quizzes.
6. Quality: backend/frontend automated tests and operational documentation.

## Remaining cleanup

- Consolidate the historical Python dependency files and remove unused
  PostgreSQL/SQLAlchemy/FAISS packages after an import audit.
- Remove unused alternate servers and legacy frontend pages only after their
  replacement paths have end-to-end coverage.
- Move process-local recording queues and WebSocket state to shared services
  before enabling more than one backend replica.
- Add a secret-scanning CI job and an integration environment backed by a test
  MongoDB instance.

## Data migration rule

Never discard existing MongoDB data during cleanup. Back up the target, inspect
field shapes, write a dry-run migration, validate counts on a copy, then apply
the reviewed migration. For lectures lacking `user_id`, report candidates and
only repair an owner when a linked subject makes it unambiguous.
