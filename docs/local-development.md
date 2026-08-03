# Local development

## Prerequisites

- Python 3.11 (the deployment pins 3.11.9)
- Node.js 18+ and npm
- A MongoDB instance:
  - a local MongoDB (`mongodb://localhost:27017`), or
  - a MongoDB Atlas cluster (see [database.md](database.md) for Atlas setup and
    the vector-search index)
- A Groq API key (https://console.groq.com) for note generation
- System libraries for audio: `ffmpeg` and `libsndfile` (the Railway build
  installs these; install them locally if transcription fails to load audio)

## Backend

```bash
cd backend
python -m venv venv
# Windows:        venv\Scripts\activate
# macOS / Linux:  source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `backend/.env` and set at least:

- `MONGODB_URL`
- `GROQ_API_KEY`
- `JWT_SECRET_KEY`

Then run the active server:

```bash
python optimized_main.py
```

- With the provided `.env` (`PORT=8000`) the API serves at `http://localhost:8000`.
- Without a `.env`, the code falls back to port `8001`.
- Interactive API docs are available at `/docs`.

> Note: there are currently three backend dependency files
> (`requirements.txt`, `requirements-railway.txt`, `requirements_mongodb.txt`).
> `requirements-railway.txt` is what the deployment installs. Consolidation into
> a single file is planned — see [migration-plan.md](migration-plan.md).

## Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

- The Vite dev server runs at `http://localhost:3000` (`vite.config.js`).
- `frontend/.env` defaults point the client at `http://localhost:8000` /
  `ws://localhost:8000`. Adjust `VITE_API_BASE_URL` / `VITE_WS_BASE_URL` if your
  backend runs elsewhere.

## Try the flow

1. Open `http://localhost:3000` and sign up.
2. Create a subject.
3. Start a lecture, optionally uploading a PDF/PPTX/DOCX/TXT reference file.
4. Allow microphone access and start recording; watch transcription and notes
   appear live.
5. Stop recording to generate the final notes, then review them under
   **My Notes**.

## Troubleshooting

- **Frontend can't reach the backend:** confirm `VITE_API_BASE_URL` matches the
  backend port, and that the backend is running.
- **Notes never generate:** confirm `GROQ_API_KEY` is set and valid.
- **MongoDB connection errors:** confirm `MONGODB_URL`; for Atlas confirm your IP
  is allowed under Network Access.
- **Microphone not working:** allow the permission in the browser; Chrome is the
  most reliable.
