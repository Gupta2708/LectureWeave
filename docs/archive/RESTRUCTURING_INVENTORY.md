# EduScribe: Restructuring Inventory

> Purpose: repository-level inventory for planning cleanup. Categories mean **likely role based on source inspection**, not automatic deletion approval.

## A. Repository map

```text
EduScribe/
├── frontend/                         React/Vite client
│   ├── src/
│   │   ├── components/                Shared display components
│   │   ├── contexts/                  Authentication state
│   │   ├── lib/                       Small utilities
│   │   ├── pages/                     Current, old, backup, and prototype screens
│   │   └── utils/                     Web Audio recording helper
│   ├── package.json                   Client dependencies/scripts
│   └── railway.toml                   Client Railway build/deploy config
├── backend/                           FastAPI and AI pipeline
│   ├── app/
│   │   ├── api/                       Both active MongoDB and old SQL route modules
│   │   ├── core/                      Settings and old SQLAlchemy setup
│   │   ├── models/                    Old SQLAlchemy entities
│   │   └── services/                  Transcription, RAG, synthesis, auth
│   ├── database/                      MongoDB utilities plus old SQL files
│   ├── storage/uploads/               Committed uploaded PDFs (runtime data)
│   ├── optimized_main.py              Active deployed FastAPI application
│   ├── simple_main.py / real_main.py  Alternative/testing servers
│   └── requirements*.txt              Multiple dependency definitions
├── *.md                               Root-level README, setup, and historical fix notes
├── railway.json                       Root deployment metadata
└── .gitignore
```

## B. Canonical runtime path to retain first

| Layer | Files | Why |
| --- | --- | --- |
| Deployment | `backend/railway.toml`, `backend/Procfile` | Both start `python optimized_main.py` |
| FastAPI application | `backend/optimized_main.py` | Current server, WebSocket, audio pipeline orchestration |
| Authentication | `app/api/auth.py`, `app/services/auth_service.py` | JWT and bcrypt user management |
| MongoDB subject/dashboard/note APIs | `app/api/subjects_new.py`, `dashboard.py`, `notes.py`, `database/subject_functions.py`, `database/mongodb_connection.py` | Authenticated MongoDB feature set |
| AI services | `transcribe_whisper.py`, `document_processor_mongodb.py`, `rag_generator.py`, `agentic_synthesizer.py`, `final_synthesizer.py`, `importance_scorer.py` | Active transcription/RAG/note generation chain |
| Active frontend app | `App.jsx`, `AuthContext.jsx`, `audioRecorder.js` | Routing, auth state, microphone input |
| Active frontend pages | `Dashboard_Professional.jsx`, `SubjectsManagement.jsx`, `LectureSetup.jsx`, `LiveLecture_New.jsx`, `MyNotes.jsx`, `NotesViewer.jsx`, `Login.jsx`, `Signup.jsx` | Pages reachable from current routes |

## C. Backend inventory

### C1. Active/keep-until-replaced

| File | Role |
| --- | --- |
| `backend/optimized_main.py` | Active FastAPI entry; connections, endpoint handlers, queueing, WebSocket and synthesis lifecycle |
| `backend/app/core/config.py` | Settings including MongoDB, AI model, storage, audio interval configuration |
| `backend/app/api/auth.py` | Register, login, token validation, current user |
| `backend/app/api/subjects_new.py` | Authenticated subject CRUD and subject lectures |
| `backend/app/api/dashboard.py` | User dashboard statistics |
| `backend/app/api/notes.py` | Saved notes and lecture-detail retrieval |
| `backend/app/services/auth_service.py` | Password hashing and JWT generation/verification |
| `backend/app/services/transcribe_whisper.py` | Faster Whisper wrapper |
| `backend/app/services/document_processor_mongodb.py` | PDF/PPTX/DOCX/TXT extraction, chunking, embeddings, vector retrieval |
| `backend/app/services/rag_generator.py` | Enhanced per-transcript note generation |
| `backend/app/services/agentic_synthesizer.py` | Periodic structured-note synthesis and fallback |
| `backend/app/services/final_synthesizer.py` | Final-note assembly, outline, sections, glossary, takeaways |
| `backend/app/services/importance_scorer.py` | Transcript importance scoring |
| `backend/database/mongodb_connection.py` | Motor/PyMongo client and collection persistence helpers |
| `backend/database/subject_functions.py` | MongoDB subject and dashboard data functions |

### C2. Legacy SQLAlchemy/PostgreSQL route stack

These files represent an earlier architecture. They should be moved to a quarantine branch/directory only after the active MongoDB stack is covered by tests.

| File(s) | Legacy role |
| --- | --- |
| `backend/app/main.py` | Earlier FastAPI entry point using router prefixes and SQLAlchemy dependencies |
| `backend/app/core/database.py` | SQLAlchemy engine/session dependency |
| `backend/app/models/models.py` | SQLAlchemy models: users, subjects, lectures, documents, transcriptions, notes |
| `backend/app/api/subjects.py` | SQLAlchemy subject CRUD |
| `backend/app/api/lectures.py` | SQLAlchemy lecture CRUD/status/notes |
| `backend/app/api/documents.py` | SQLAlchemy document operations |
| `backend/app/api/live_recording.py` | Earlier WebSocket/audio API |
| `backend/app/services/document_processor.py` | Earlier document/FAISS processing implementation |
| `backend/app/services/audio_processor.py` | Earlier audio processing helper |
| `backend/database/connection.py` | Old database connection code |
| `backend/database/schema.sql` | PostgreSQL schema |
| `backend/init_db.py` | SQL database initialization |
| `backend/start.py` | Starts `app.main:app`, so does not start the deployed optimized server |

### C3. Alternate servers and manual tests

| File | Classification |
| --- | --- |
| `backend/simple_main.py` | Mock/demo FastAPI service with simulated notes |
| `backend/real_main.py` | Alternate server variant; inspect before removal if it was used manually |
| `backend/start_optimized.py` | Alternate optimized launcher |
| `backend/test_db.py` | Manual database test |
| `backend/test_mongodb.py` | Manual MongoDB test |
| `backend/test_query_fix.py` | Manual query investigation |
| `backend/test_queue.py` | Manual queue test |
| `backend/test_real_audio.html` | Manual browser audio test page |
| `backend/test_websocket.html` | Manual WebSocket test page |

### C4. Dependencies and deployment files

| File | Status / action |
| --- | --- |
| `backend/requirements.txt` | Broad mixed dependency list; includes PostgreSQL, FAISS, MongoDB and development packages |
| `backend/requirements-railway.txt` | More focused deployment dependency list; likely closest to active optimized deployment |
| `backend/requirements_mongodb.txt` | Small MongoDB add-on list; redundant if a unified requirements file is created |
| `backend/railway.toml` | Current backend deployment command; retain |
| `backend/Procfile` | Duplicates backend start command; retain only if platform needs it |
| `backend/nixpacks.toml` | Inspect platform use before removing |
| `backend/runtime.txt` | Python version declaration; retain if Railway uses it |
| `backend/README.md` | Older backend documentation; reconcile with active architecture |

### C5. Runtime data in the repository

`backend/storage/uploads/` contains twelve uploaded PDFs, including repeated machine-learning material. They are generated/user-uploaded runtime data, not application source.

```text
690b74974d7937ae2c98103f/9_Linear Regression- Gradient Descent Method.pdf
690b765e74c7d60df998bdfe/9_Linear Regression- Gradient Descent Method.pdf
690b78075d4facffdd17dc8c/9_Linear Regression- Gradient Descent Method.pdf
690b79875d9c7eea13d68fba/9_Linear Regression- Gradient Descent Method.pdf
690b7b0e9a7078ad8ee938b5/9_Linear Regression- Gradient Descent Method.pdf
690b7ccd8572b92d284ecbd8/9_Linear Regression- Gradient Descent Method.pdf
690b7fd70317ce7739634794/Classification- Introduction , Logistic Regression.pdf
690b83608924e22c5bc9ff79/Classification- Introduction , Logistic Regression.pdf
lecture-1762348786/Classification- Introduction , Logistic Regression.pdf
lecture-1762349863/Classification- Introduction , Logistic Regression.pdf
lecture-1762352150/16. K- Nearest Neighbor.pdf
lecture-1762358115/9_Linear Regression- Gradient Descent Method.pdf
```

Recommended eventual action: move any intentional fixtures to `backend/tests/fixtures/`, add `backend/storage/` to `.gitignore`, and remove historical uploads in a deliberate data-cleanup commit.

## D. Frontend inventory

### D1. Application foundations

| File | Role |
| --- | --- |
| `frontend/src/main.jsx` | React bootstrapping |
| `frontend/src/App.jsx` | Router and route selection |
| `frontend/src/contexts/AuthContext.jsx` | JWT persistence, verification, login/logout and API defaults |
| `frontend/src/index.css` | Global styles |
| `frontend/src/lib/utils.js` | UI utility functions |
| `frontend/src/utils/audioRecorder.js` | Web Audio API → WAV chunks |
| `frontend/src/components/FinalNotesDocument.jsx` | Final-notes rendering component |

### D2. Current route-backed pages

| File | Current route/use |
| --- | --- |
| `Dashboard_Professional.jsx` | `/` |
| `SubjectsManagement.jsx` | `/subjects`, `/subjects/new` |
| `LectureSetup.jsx` | `/subjects/:subjectId/setup` |
| `LiveLecture_New.jsx` | `/subjects/:subjectId/lecture` |
| `MyNotes.jsx` | `/my-notes` |
| `NotesViewer.jsx` | `/lecture/:lectureId` and old fallback note route |
| `Login.jsx` | `/login` |
| `Signup.jsx` | `/signup` |

### D3. Old or optional routes/components

| File | Evidence |
| --- | --- |
| `Dashboard_new.jsx` | Served only at `/old-dashboard` |
| `Subjects.jsx`, `SubjectDetail.jsx` | Older subject UI; only `SubjectDetail` has an old fallback route |
| `LiveLecture.jsx` | Earlier recording UI; current app uses `LiveLecture_New` |
| `Dashboard.jsx`, `Dashboard.backup.jsx` | Older/backup dashboards |
| `DocumentUpload.jsx` | Stand-alone older upload flow |
| `NotesHistory.jsx` | Not routed by current `App.jsx` |
| `Profile.jsx`, `Webinar.jsx` | Old fallback routes |
| `TestDashboard.jsx` | Test/prototype page |
| `components/Layout.jsx` | Used only by old fallback routes |

### D4. Client tooling

| File | Role |
| --- | --- |
| `frontend/package.json` | React/Vite scripts and dependencies |
| `frontend/package-lock.json` | Exact npm dependency lock; retain |
| `frontend/vite.config.js` | Vite config, dev port 3000, sourcemaps |
| `frontend/tailwind.config.js` | Tailwind content/theme config |
| `frontend/postcss.config.js` | PostCSS config |
| `frontend/railway.toml` | Builds and previews the Vite client |
| `frontend/index.html` | Vite document shell |
| `frontend/INSTALL_DEPENDENCIES.md` | Installation note; consolidate into main setup documentation |

## E. Root-document inventory

The root has both the canonical entry documents and a large set of historical implementation/fix reports.

### E1. Keep/rewrite into canonical docs

- `README.md`
- `QUICK_START.md`
- `DEPLOYMENT_GUIDE.md`
- `WORKFLOW_OVERVIEW.md`
- `DOCUMENT_WORKFLOW.md`
- `AUTHENTICATION_GUIDE.md`
- `MONGODB_SETUP_GUIDE.md`
- `SETUP_API_KEY.md`

### E2. Historical reports to archive, merge, or remove after their contents are captured

- `ALL_FIXES_COMPLETE.md`
- `ASYNC_FIX_COMPLETE.md`
- `AUDIO_PROCESSING_FIX.md`
- `AUTHENTICATION_COMPLETE.md`
- `COMPLETE_FIX_GUIDE.md`
- `COMPLETE_IMPLEMENTATION_GUIDE.md`
- `CRITICAL_FIX_APPLIED.md`
- `DATABASE_COMPARISON.md`
- `ENHANCED_NOTE_GENERATION.md`
- `FINAL_FIX_WEB_AUDIO_API.md`
- `FINAL_NOTES_FEATURE.md`
- `FINAL_NOTES_IMPROVEMENTS.md`
- `FINAL_STATUS.md`
- `FINAL_SYNTHESIS_FEATURE.md`
- `FINAL_WORKING_SOLUTION.md`
- `FIX_API_KEY_NOW.md`
- `FRONTEND_FIXES_COMPLETE.md`
- `IMPLEMENTATION_SUMMARY.md`
- `INTEGRATION_COMPLETE.md`
- `LATEST_IMPROVEMENTS.md`
- `MONGODB_INTEGRATION_COMPLETE.md`
- `NAVIGATION_UPDATE.md`
- `OPTIMIZATION_FIXES.md`
- `OPTIMIZED_SYSTEM.md`
- `POSTGRESQL_SETUP_GUIDE.md`
- `README_AGENTIC.md`
- `RESTART_INSTRUCTIONS.md`
- `project-structure.md`
- `setup-project-structure.md`

Other root files: `.gitignore`, `railway.json`, and `commit_message.txt`. `commit_message.txt` is a historical artifact and does not belong in a cleaned product repository.

## F. Recommended target structure

```text
eduscribe/
├── frontend/
│   ├── src/
│   │   ├── api/                One configured HTTP/WebSocket client
│   │   ├── components/
│   │   ├── features/           auth, subjects, lectures, notes
│   │   ├── pages/
│   │   └── utils/
│   ├── .env.example
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── api/                auth, subjects, lectures, documents, recording, notes, dashboard
│   │   ├── core/               configuration, logging, lifespan
│   │   ├── db/                 MongoDB client and repositories
│   │   ├── services/           transcription, documents, retrieval, synthesis
│   │   ├── schemas/            Pydantic request/response models
│   │   └── main.py             Single FastAPI app entry
│   ├── tests/
│   ├── .env.example
│   └── requirements.txt        One dependency source of truth
├── docs/
│   ├── architecture.md
│   ├── local-development.md
│   ├── deployment.md
│   └── decisions.md
├── .gitignore
└── README.md
```

## G. Suggested cleanup sequence (non-destructive first)

1. Make a testable baseline of the active flow: register → subject → lecture → upload → notes retrieval.
2. Centralize backend and frontend configuration; eliminate hard-coded ngrok URLs.
3. Fix lecture ownership and audit access control for all lecture-dependent operations.
4. Extract active handlers from `optimized_main.py` into dedicated route/service modules.
5. Consolidate to one dependency file and one app start command.
6. Mark all old modules as legacy, update imports/routes, and run the test baseline.
7. Move legacy files and historical documentation into an archive branch or `legacy/` directory first; do not delete until the baseline passes.
8. Remove committed upload data only after confirming it is not required for demos or evaluation.
9. Collapse documentation into the small `docs/` set and make README link to it.
