# Local development

Prerequisites are Python 3.11, Node.js 18+, MongoDB, ffmpeg, libsndfile, and a
Groq API key for model-backed note generation.

## Backend

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Set `MONGODB_URL`, `JWT_SECRET_KEY`, and `GROQ_API_KEY` in `backend/.env`.
API documentation is available at `http://localhost:8000/docs`.

## Frontend

```bash
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Vite serves the client on port 3000. Its defaults target HTTP and WebSocket
services on port 8000. Start by creating a subject and lecture, optionally add
a PDF/PPTX/DOCX/TXT source, then record a lecture or use the study tools.

Run the validation commands in [testing.md](testing.md) before opening a pull
request. For local MongoDB without Atlas Vector Search, hybrid retrieval uses
the safe in-memory vector fallback.
