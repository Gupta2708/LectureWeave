# EduScribe: Project Context

> Purpose: a factual handoff document for rebuilding, restructuring, or cleaning EduScribe. It describes the repository as inspected on 3 August 2026. It does not claim that every legacy file is exercised by the deployed application.

## 1. Product in one paragraph

EduScribe is a web application for turning a live lecture into study material. A student creates a subject, creates a lecture under that subject, optionally uploads reference files, records from the browser microphone, and receives:

- a transcript and short enhanced notes for each audio chunk;
- structured Markdown notes about every minute; and
- final comprehensive notes with sections, a glossary, and takeaways when recording stops.

The central product idea is **RAG-assisted lecture note generation**: use the student's uploaded study material to correct and enrich speech-to-text output rather than generating notes from audio alone.

## 2. Intended active stack

| Area | Technology | Role |
| --- | --- | --- |
| Client | React 18, Vite, Tailwind CSS | Browser UI and routing |
| Recording | Web Audio API | Captures mono microphone audio and emits WAV chunks |
| API | Python FastAPI | HTTP APIs, WebSocket, orchestration |
| Speech-to-text | Faster Whisper | Transcribes each WAV chunk locally/on the server |
| Document retrieval | Sentence Transformers + MongoDB Atlas Vector Search | Embeds uploaded document chunks and retrieves relevant context |
| Generation | Groq, `llama-3.1-8b-instant` | Cleans transcript text and creates notes |
| Persistence | MongoDB via Motor/PyMongo | Users, subjects, lectures, documents, embeddings, transcripts, and notes |
| Hosting | Railway configuration + an ngrok URL hard-coded in the frontend | Backend is configured to launch the optimized server |

The current production/deployment entry point is **`backend/optimized_main.py`**. Both `backend/railway.toml` and `backend/Procfile` launch it.

## 3. User journey

```text
Sign up / log in
  -> create or select a subject
  -> give a lecture a title
  -> optionally upload PDF/PPTX/DOCX/TXT reference files
  -> open live lecture page and connect WebSocket
  -> browser records WAV chunks approximately every 20 seconds
  -> API transcribes, retrieves source context, and sends live updates
  -> AI synthesizes structured notes about every 60 seconds
  -> stopping produces and stores the final notes
  -> user reviews saved notes from My Notes
```

### Detailed processing path

```text
Browser microphone
  -> frontend/src/utils/audioRecorder.js
  -> POST /api/audio/lecture/{lectureId}/chunk (multipart WAV)
  -> optimized_main.OptimizedAudioProcessor queue
  -> app/services/transcribe_whisper.py (Faster Whisper)
  -> app/services/document_processor_mongodb.py.query_documents
  -> MongoDB Vector Search, or in-process cosine-similarity fallback
  -> app/services/rag_generator.py (enhanced chunk notes)
  -> WebSocket /ws/lecture/{lectureId} (transcription message)

After three chunks / roughly 60 seconds, or a detected topic shift:
  -> app/services/agentic_synthesizer.py
  -> structured_notes collection + WebSocket structured_notes message

When recording stops:
  -> app/services/final_synthesizer.py
  -> final_notes collection + WebSocket final_notes message
```

## 4. Current frontend

The active application routes are in `frontend/src/App.jsx`:

| Route | Page | Role |
| --- | --- | --- |
| `/login`, `/signup` | `Login`, `Signup` | JWT authentication |
| `/` | `Dashboard_Professional` | User metrics and recent lectures |
| `/subjects`, `/subjects/new` | `SubjectsManagement` | Subject CRUD |
| `/subjects/:subjectId/setup` | `LectureSetup` | Create lecture and upload files |
| `/subjects/:subjectId/lecture` | `LiveLecture_New` | Recording and real-time notes |
| `/my-notes` | `MyNotes` | User's final notes |
| `/lecture/:lectureId` | `NotesViewer` | Read a lecture and its notes |

`AuthContext.jsx` owns the token/user state in `localStorage` and provides the Authorization header used by protected requests. The frontend currently repeats an ngrok API base URL in several page components rather than reading a Vite environment variable. Its server config uses port `3000` in `vite.config.js`.

The recorder uses a `ScriptProcessorNode`, converts samples to 16-bit PCM, resamples to 16 kHz, wraps output in a WAV header, and delivers 20-second blobs. This was introduced to avoid inconsistent MediaRecorder/WebM behavior.

## 5. Current backend

### `backend/optimized_main.py`: active server

This is the active application and has three responsibilities:

1. Initialises the MongoDB connection and includes the new auth, subject, dashboard, and notes routers.
2. Exposes direct endpoints for lecture creation, document upload, audio chunks, and a lecture WebSocket.
3. Holds per-lecture in-memory queues/buffers and orchestrates transcription and note synthesis.

Active endpoints exposed by this server include:

| Endpoint | Purpose |
| --- | --- |
| `POST /api/auth/register`, `/login`, `/verify`, `GET /me` | Authentication |
| `GET/POST/PUT/DELETE /api/subjects/...` | Per-user subject management |
| `GET /api/dashboard/stats` | Dashboard statistics |
| `GET /api/notes/my-notes`, `/my-lectures`, `/lecture/{id}` | Saved-note retrieval |
| `POST /api/lectures/` | Creates a MongoDB lecture |
| `POST /api/documents/lecture/{id}/upload` | Saves and indexes uploaded files |
| `POST /api/audio/lecture/{id}/chunk` | Queues a WAV chunk |
| `WS /ws/lecture/{id}` | Commands and streamed real-time updates |

The WebSocket accepts `start_recording`, `stop_recording`, and `request_final_synthesis` messages. The HTTP audio route requires an active socket because it retrieves the socket from the in-memory connection manager before queueing audio.

### MongoDB data model

The actual MongoDB collection layout is implemented in `backend/database/mongodb_connection.py` and `backend/database/subject_functions.py`.

| Collection | Main contents |
| --- | --- |
| `users` | email, username, bcrypt password hash, timestamps |
| `subjects` | user ID, name, code, description |
| `lectures` | user ID, subject ID, title, status, duration, timestamps |
| `documents` | uploaded-file metadata and extracted source text |
| `document_embeddings` | document chunks and 384-dimensional embeddings |
| `transcriptions` | per-chunk transcript plus enhanced notes and importance |
| `structured_notes` | periodic synthesized Markdown |
| `final_notes` | one final-note object per lecture |

The intended Atlas vector index is named `vector_search` on `document_embeddings.embedding`. If Atlas Vector Search fails or has not been set up, the code fetches all embeddings for the lecture and computes cosine similarity in application memory.

## 6. Configuration and operational requirements

Required runtime configuration:

```dotenv
MONGODB_URL=mongodb+srv://...
GROQ_API_KEY=...
JWT_SECRET_KEY=a-long-random-secret
```

Useful optional values are `WHISPER_MODEL_SIZE`, `WHISPER_DEVICE`, `WHISPER_COMPUTE_TYPE`, `EMBEDDING_MODEL`, and `LLM_MODEL`. The committed configuration defaults to MongoDB localhost and a placeholder PostgreSQL URL, but the active path uses MongoDB.

Expected local commands, after the cleanup work has made configuration consistent:

```powershell
cd backend
pip install -r requirements-railway.txt
python optimized_main.py

cd ../frontend
npm install
npm run dev
```

The frontend currently points to a remote ngrok backend, so simply starting these two local processes does **not** make the local frontend call the local backend without changing the API/WS base URLs.

## 7. What is new/current versus legacy

### Preserve as the primary implementation

- `backend/optimized_main.py`
- `backend/app/api/auth.py`, `dashboard.py`, `notes.py`, `subjects_new.py`
- `backend/app/services/auth_service.py`, `agentic_synthesizer.py`, `final_synthesizer.py`, `rag_generator.py`, `transcribe_whisper.py`, `importance_scorer.py`, `document_processor_mongodb.py`
- `backend/database/mongodb_connection.py`, `subject_functions.py`
- `frontend/src/App.jsx`, `contexts/AuthContext.jsx`, `utils/audioRecorder.js`
- `frontend/src/pages/Dashboard_Professional.jsx`, `SubjectsManagement.jsx`, `LectureSetup.jsx`, `LiveLecture_New.jsx`, `MyNotes.jsx`, `NotesViewer.jsx`, `Login.jsx`, `Signup.jsx`

### Superseded implementation candidates

These belong to an earlier SQLAlchemy/PostgreSQL/FAISS design and are not imported by the active optimized entry point:

- `backend/app/main.py`, `app/core/database.py`, `app/models/models.py`
- `backend/app/api/subjects.py`, `lectures.py`, `documents.py`, `live_recording.py`
- `backend/app/services/document_processor.py`, `audio_processor.py`
- `backend/database/connection.py`, `schema.sql`, `init_db.py`, `start.py`

### Old UI/test/prototype candidates

- `frontend/src/pages/Dashboard.jsx`, `Dashboard_new.jsx`, `Dashboard.backup.jsx`
- `Subjects.jsx`, `SubjectDetail.jsx`, `LiveLecture.jsx`, `DocumentUpload.jsx`, `NotesHistory.jsx`, `Profile.jsx`, `Webinar.jsx`, `TestDashboard.jsx`
- `frontend/src/components/Layout.jsx`
- `backend/simple_main.py`, `real_main.py`, `start_optimized.py`
- `backend/test_*.py`, `test_real_audio.html`, `test_websocket.html`

These should not be deleted blindly. First identify imports, routes, manual test use, and whether they are intentionally retained as fallbacks.

## 8. Known restructuring and correctness risks

These are findings from source inspection, not runtime test results.

1. **Two incompatible backend architectures coexist.** SQLAlchemy/PostgreSQL and MongoDB implementations duplicate subjects, lectures, documents, notes, and WebSocket behavior. This is the primary source of complexity.
2. **Duplicate subject GET route declarations exist in the active server.** `subjects_new.py` is included first and provides authenticated MongoDB subjects; `optimized_main.py` later declares a mock `GET /api/subjects/`. Retain only the authenticated implementation.
3. **Frontend networking is hard-coded.** Multiple components embed an ngrok URL and WebSocket URL. This prevents normal local configuration and makes production promotion fragile.
4. **Lecture ownership is not reliably attached.** The active create-lecture handler looks for authorization inside the JSON body, while the frontend sends JWT in the HTTP header. That can create `lectures` with `user_id: null`, which will not appear in per-user note/dashboard queries.
5. **The client supports only one WebSocket per lecture ID on a process.** A reconnect replaces the existing socket. This is unsuitable for multiple viewers and will not work across multiple backend instances without shared state.
6. **Per-lecture processing state is in server memory.** Queues, partial transcripts, and structured-note history disappear on restart and are not shared between processes.
7. **Sensitive data may be logged.** MongoDB setup prints the first 50 characters of the connection URL. Remove this before deployment because a URI may include credentials.
8. **There is no environment-template file in the repository.** Documentation asks for `.env.example`, but it is not present in the file inventory.
9. **Current live-lecture pause code is inconsistent.** `LiveLecture_New.jsx` contains pause logic referring to `mediaRecorderRef`, but this component records through `AudioRecorder`; audit/remove or implement pause before relying on it.
10. **Uploaded sample PDFs are committed under `backend/storage/uploads`.** They are runtime/generated data and should normally be excluded from the source repository or moved to fixture storage.
11. **Documentation is heavily duplicated and historical.** Many root Markdown files describe one-off fixes and have overlapping or stale guidance.

## 9. Safe cleanup direction

The recommended target is a single MongoDB-based FastAPI service and one React UI path.

1. Add `frontend/.env.example` and `backend/.env.example`; move all URLs, secrets, model choices, and CORS origins into configuration.
2. Create an explicit API client in the frontend, then replace all component-local Axios configuration and hard-coded URLs.
3. Move `optimized_main.py` into `backend/app/main.py` or a clearly named application module; make one canonical start command.
4. Move the active HTTP endpoints into route modules (`auth`, `subjects`, `lectures`, `documents`, `recording`, `notes`, `dashboard`); remove duplicate route declarations.
5. Make lecture creation authenticated with `Depends(get_current_user)` and require ownership checks for document/audio/note operations.
6. Separate service orchestration from FastAPI handlers. Persist session state or use a queue/worker if reliability and horizontal scaling matter.
7. Move SQLAlchemy/PostgreSQL code and unused UI experiments into a temporary `legacy/` quarantine directory, run regression tests, then delete it in a later commit.
8. Replace the root collection of status/fix Markdown files with a small `docs/` structure: `architecture.md`, `setup.md`, `deployment.md`, `decision-log.md`, and `migration-plan.md`.
9. Add automated tests for auth, ownership, document indexing, audio-command flow, and final-note retrieval before destructive cleanup.

## 10. Definition of a clean end state

A cleaned repository should have one startup command, one persistence system, one source of truth per endpoint, configured rather than hard-coded URLs, no committed runtime uploads, and documentation that describes the code actually launched in development and production.
