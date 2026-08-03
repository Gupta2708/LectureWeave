# Architecture

## Overview

LectureWeave is a single MongoDB-backed FastAPI service and one React (Vite) client.
The client records microphone audio in the browser and streams it to the backend,
which transcribes, retrieves relevant document context, and generates notes,
pushing live updates back over a WebSocket.

```text
React (Vite) client  <--- HTTP + WebSocket --->  FastAPI (optimized_main.py)
                                                    |
                            +-----------------------+-----------------------+
                            |            |            |           |         |
                      Faster Whisper  Sentence-   MongoDB     Groq LLM   In-memory
                      (transcribe)    Transformers (persist +  (notes)   per-lecture
                                      (embed)      vector search)         queues/state
```

## Components

- **Frontend** (`frontend/src`): React 18 + Tailwind. All networking goes through
  one HTTP client (`api/httpClient.js`) and one WebSocket client
  (`api/websocketClient.js`), both configured from `config/environment.js`.
  Auth/session state lives in `contexts/AuthContext.jsx`. Audio capture is in
  `utils/audioRecorder.js`.
- **Backend** (`backend`): FastAPI app in `optimized_main.py`. It initialises the
  MongoDB connection, includes the auth/subjects/dashboard/notes routers, and
  exposes direct endpoints for lecture creation, document upload, audio chunks,
  and the lecture WebSocket. AI logic lives under `app/services/`.
- **Persistence**: MongoDB (see [database.md](database.md)).

## User journey

```text
Sign up / log in
  -> create or select a subject
  -> give a lecture a title
  -> optionally upload PDF/PPTX/DOCX/TXT reference files
  -> open the live lecture page (WebSocket connects)
  -> browser records ~20-second WAV chunks
  -> backend transcribes, retrieves document context, sends live updates
  -> structured notes synthesised about every 60 seconds
  -> stopping recording produces and stores the final notes
  -> user reviews saved notes from "My Notes"
```

## Processing path

```text
Browser microphone
  -> frontend/src/utils/audioRecorder.js  (Web Audio -> 16 kHz mono WAV, ~20 s)
  -> POST /api/audio/lecture/{lectureId}/chunk  (multipart, field: audio_file)
  -> per-lecture queue in optimized_main.py
  -> app/services/transcribe_whisper.py         (Faster Whisper)
  -> app/services/document_processor_mongodb.py  (embed query, retrieve top-k chunks)
       -> MongoDB Atlas Vector Search, or in-memory cosine fallback
  -> app/services/rag_generator.py               (enhanced per-chunk notes)
  -> WebSocket /ws/lecture/{lectureId}           (transcription message)

Every ~3 chunks / ~60 s (or on a detected topic shift):
  -> app/services/agentic_synthesizer.py
  -> structured_notes collection + WebSocket structured_notes message

On stop:
  -> app/services/final_synthesizer.py
  -> final_notes collection + WebSocket final_notes message
```

The WebSocket accepts `start_recording`, `stop_recording`, and
`request_final_synthesis` messages. The HTTP audio route expects an active
socket for the lecture (the server looks up the connection before queueing).

## Frontend routes

| Route | Page | Purpose |
| --- | --- | --- |
| `/login`, `/signup` | `Login`, `Signup` | JWT authentication |
| `/` | `Dashboard_Professional` | User metrics and recent lectures |
| `/subjects`, `/subjects/new` | `SubjectsManagement` | Subject CRUD |
| `/subjects/:subjectId/setup` | `LectureSetup` | Create lecture, upload files |
| `/subjects/:subjectId/lecture` | `LiveLecture_New` | Recording + real-time notes |
| `/my-notes` | `MyNotes` | User's final notes |
| `/lecture/:lectureId` | `NotesViewer` | Read a lecture and its notes |

> A set of legacy fallback routes (`/old-dashboard`, `/subjects/:subjectId`,
> `/webinar`, `/profile`, `/notes/:id`) still exist in `App.jsx` and are
> scheduled for removal — see [migration-plan.md](migration-plan.md).

## Known architectural constraints

- Per-lecture processing state (queues, partial transcripts, structured-note
  history) lives in server memory, so it is lost on restart and is not shared
  across multiple backend instances.
- One WebSocket per lecture id per process; a reconnect replaces the socket.
- These limits are acceptable for a single-instance deployment; horizontal
  scaling would require shared session state or a worker/queue.
