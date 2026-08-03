# LectureWeave

LectureWeave turns a live lecture into structured study notes. A student records
from the browser microphone while the backend transcribes the audio, retrieves
relevant passages from the student's own uploaded course material, and generates
notes that grow in real time and are finalised when recording stops.

The core idea is **RAG-assisted lecture note generation**: uploaded study
material is used to correct and enrich the notes produced from speech, rather
than generating notes from audio alone.

## Current capabilities

Only currently-implemented behaviour is listed here:

- Registration and login (JWT sessions)
- Subject creation, listing, editing, deletion
- Lecture creation under a subject
- Reference document upload (PDF, PPTX, DOCX, TXT)
- Browser microphone recording to WAV chunks
- Speech-to-text transcription (Faster Whisper)
- Retrieval of relevant passages from uploaded documents
- Periodic structured notes during recording
- Final comprehensive notes when recording stops
- Saved-note viewing

## Architecture at a glance

| Layer | Technology |
| --- | --- |
| Frontend | React 18 + Vite + Tailwind CSS |
| Recording | Browser Web Audio API → WAV chunks |
| Backend | Python + FastAPI (+ WebSocket) |
| Transcription | Faster Whisper |
| Embeddings | Sentence Transformers (`all-MiniLM-L6-v2`, 384-dim) |
| Retrieval | MongoDB Atlas Vector Search (cosine), in-memory cosine fallback |
| Generation | Groq (`llama-3.1-8b-instant`) |
| Persistence | MongoDB (Motor / PyMongo) |
| Live updates | WebSocket per lecture |

The active backend entry point is `backend/optimized_main.py`. See
[docs/architecture.md](docs/architecture.md) for the full request and
processing flow.

## Local setup

Prerequisites: Python 3.11, Node.js 18+, and a MongoDB instance (local or a
MongoDB Atlas cluster). A Groq API key is required for note generation.

```bash
# Backend
cd backend
python -m venv venv
# Windows: venv\Scripts\activate    macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env         # then edit: set MONGODB_URL, GROQ_API_KEY, JWT_SECRET_KEY
python optimized_main.py     # serves on http://localhost:8000 (PORT)
```

```bash
# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env         # defaults point at http://localhost:8000
npm run dev                  # serves on http://localhost:3000
```

Full walkthrough: [docs/local-development.md](docs/local-development.md).

## Environment configuration

Copy the templates and fill in real values — never commit a real `.env`:

- Backend: [`backend/.env.example`](backend/.env.example)
- Frontend: [`frontend/.env.example`](frontend/.env.example)

Every variable is documented in [docs/configuration.md](docs/configuration.md).

## Testing

An automated test suite is not yet in place; the current state and plan are in
[docs/testing.md](docs/testing.md). The frontend build is the current static
gate:

```bash
cd frontend
npm run build
```

## Repository structure

```text
lectureweave/
├── frontend/                 React + Vite client
│   └── src/
│       ├── api/              One HTTP client, one WebSocket client, endpoint modules
│       ├── config/           environment.js (reads Vite env vars)
│       ├── contexts/         AuthContext (JWT session state)
│       ├── pages/            Route-backed screens
│       └── utils/            audioRecorder.js (Web Audio -> WAV)
├── backend/                  FastAPI app + AI pipeline
│   ├── app/
│   │   ├── api/              Active MongoDB routers (+ legacy SQL routers, pending removal)
│   │   ├── core/             Settings
│   │   └── services/         Transcription, documents, retrieval, synthesis, auth
│   ├── database/             MongoDB connection + data functions
│   ├── storage/uploads/      Runtime uploads (gitignored; not source)
│   └── optimized_main.py     Active FastAPI entry point
├── docs/                     Canonical documentation (this set)
├── assets/                   Retained sample material and fixtures
└── README.md
```

> This tree reflects the target shape. Some legacy backend and frontend modules
> still exist and are scheduled for removal; see
> [docs/migration-plan.md](docs/migration-plan.md).

## Deployment

Currently deploys on Railway (NIXPACKS). See [docs/deployment.md](docs/deployment.md).

## Security

Secret-handling policy and reporting: [SECURITY.md](SECURITY.md).
