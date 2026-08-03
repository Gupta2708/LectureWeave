# Decision log

Short records of the significant technical decisions behind the current system.

## D1. MongoDB (Atlas) over PostgreSQL + pgvector

**Decision:** use MongoDB Atlas as the single database, including for vector
search. An earlier PostgreSQL + SQLAlchemy + FAISS implementation was superseded.

**Rationale:**

- **Setup**: Atlas is cloud-hosted with no local install; setup is minutes
  rather than a local PostgreSQL + pgvector install.
- **Vector search**: built into Atlas; PostgreSQL requires the `pgvector`
  extension.
- **Data-model fit**: notes are naturally document-shaped (nested sections,
  glossary, arrays, formulas), which maps cleanly to BSON documents instead of a
  relational schema with JSONB and many joined tables.
- **Schema flexibility**: the note/lecture shapes evolve without migrations.
- **Deployment**: a single connection string works across Railway/Vercel/Netlify.
- **Cost**: the free M0 tier (512 MB) is sufficient for development.

**Consequence:** FAISS file-based indexes (`storage/faiss_indexes/*`) were
replaced by the `document_embeddings` collection plus the Atlas `vector_search`
index. The legacy relational/FAISS code remains in the tree only until it is
removed (see [migration-plan.md](migration-plan.md)).

## D2. Single canonical backend entry point (in progress)

**Decision:** the application must have exactly one FastAPI entry point. Today
that is `backend/optimized_main.py`; the target is `backend/app/main.py` with
routes/repositories/services extracted from the current monolith. Alternate
servers (`simple_main.py`, `real_main.py`, `start.py`, `start_optimized.py`)
are to be removed.

**Status:** not yet executed; tracked in [migration-plan.md](migration-plan.md).

## D3. Browser Web Audio API instead of MediaRecorder

**Decision:** capture audio with the Web Audio API and emit fixed ~20-second
16 kHz mono WAV chunks (`frontend/src/utils/audioRecorder.js`), rather than
using `MediaRecorder`/WebM.

**Rationale:** consistent, backend-friendly WAV chunks avoid the container/codec
variability of `MediaRecorder` output and simplify Whisper transcription.

## D4. Centralised frontend networking

**Decision:** all HTTP and WebSocket calls go through a single configured client
(`api/httpClient.js`, `api/websocketClient.js`) driven by
`config/environment.js`. Components must not hard-code hosts or create their own
axios instances.

**Rationale:** hard-coded ngrok URLs were duplicated across many components,
which prevented normal local configuration and made promotion to production
fragile.

