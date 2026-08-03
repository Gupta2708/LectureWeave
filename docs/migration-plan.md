# Migration plan

This is the working plan for restructuring LectureWeave (formerly EduScribe)
into a single, clean, MongoDB-based application. It records what has been done
and what remains, so cleanup can proceed in small, reviewable steps without
losing working behaviour.

Work proceeds on branch `refactor/lectureweave`. The pre-refactor baseline is
the initial commit on `main` (`origin/main`).

## Done

- **Configuration & secrets**: rewrote `backend/.env.example` and
  `frontend/.env.example` around the MongoDB stack (placeholders only);
  standardised the API port on 8000; removed the credential-shaped PostgreSQL
  default and hard-coded JWT placeholder from `config.py`; broadened `.gitignore`
  for runtime storage and `.env` files.
- **Frontend networking**: added `config/environment.js`, one `httpClient.js`,
  one `websocketClient.js`, and per-feature endpoint modules; migrated
  AuthContext and all active pages off inline ngrok URLs. No ngrok host literal
  remains in source.
- **Documentation**: consolidated ~35 historical Markdown files into this
  canonical `docs/` set plus `README.md`, `SECURITY.md`, and `assets/README.md`.
- **Rename to LectureWeave**: renamed everything — branding, package names,
  metadata, code comments, docs, the MongoDB database name, and the browser
  storage keys. No compatibility shims were needed (no live data/sessions). Only
  `docs/archive/` retains the old name, as historical evidence. See
  [decisions.md](decisions.md) D5.

## Remaining work

### Backend modularisation
- Extract `optimized_main.py` into `app/main.py` (app setup, middleware,
  exception handlers, router includes, lifespan, health endpoints) plus
  route/repository/service modules.
- Single canonical start command: `uvicorn app.main:app`. Update `railway.toml`,
  `Procfile`, and `nixpacks.toml` together.
- Add `GET /health` and `GET /health/ready`.

### Authentication & ownership (behaviour repair)
- Resolve the authenticated user from the `Authorization` header on lecture
  creation; never create a lecture with `user_id: null`.
- Enforce server-side ownership on subject/lecture read/update/delete, document
  upload, audio upload, WebSocket connect, and note retrieval.
- Remove the duplicate mock `GET /api/subjects/` declared in `optimized_main.py`
  (keep the authenticated MongoDB implementation in `subjects_new.py`).

### Legacy removal (after tests pass)
- PostgreSQL/SQLAlchemy/FAISS stack: `app/main.py`, `app/core/database.py`,
  `app/models/models.py`, `app/api/{subjects,lectures,documents,live_recording}.py`,
  `app/services/{document_processor,audio_processor}.py`,
  `database/{connection.py,schema.sql}`, `init_db.py`, `start.py`.
- Alternate servers: `simple_main.py`, `real_main.py`, `start_optimized.py`.
- Legacy frontend pages/routes: `Dashboard*.jsx` (old/new/backup), `Subjects.jsx`,
  `SubjectDetail.jsx`, `LiveLecture.jsx`, `DocumentUpload.jsx`, `NotesHistory.jsx`,
  `Profile.jsx`, `Webinar.jsx`, `TestDashboard.jsx`, `components/Layout.jsx`, and
  their fallback routes in `App.jsx`.
- Manual test scripts: move useful ones to `scripts/debug/`, convert others into
  real tests, remove the rest.

### Dependencies
- Consolidate `requirements.txt`, `requirements-railway.txt`, and
  `requirements_mongodb.txt` into one canonical file; drop SQLAlchemy /
  PostgreSQL drivers / unused FAISS.

### Secrets / logging
- Stop printing any portion of the MongoDB URI at startup in `optimized_main.py`.
- Add a secret-scanning step to CI.

### Assets / data
- Classify and relocate the committed sample PDFs under `backend/storage/uploads/`
  (runtime uploads are now gitignored). See [../assets/README.md](../assets/README.md).

## Data migration notes

Do not discard existing MongoDB data. Before any schema change: inspect
collections, document field shapes, back up, write a migration script, dry-run,
validate record counts, and run against a copy first.

**Lecture ownership repair:** find lectures where `user_id` is null. Do not guess
owners. Produce a report (lecture id, subject id, possible subject owner, title,
created-at, recommended action) and only attach an owner automatically when it is
unambiguous from a linked subject; log ambiguous records for manual review.

## Source inventory (evidence)

The detailed active-vs-legacy inventory and project context captured during
inspection are retained under [archive/](archive/) as migration evidence:
`PROJECT_CONTEXT.md` and `RESTRUCTURING_INVENTORY.md`.
