# Testing

Run the backend suite from `backend/`:

```bash
python -m compileall app database
python -m pytest -q
```

External Whisper, Groq, and embedding calls are isolated behind service helpers
and should be replaced by fakes in tests. Current coverage includes configuration
and JWT checks, chunking, retrieval/RRF isolation, citation validation, topic
boundaries, and grounded generator fallbacks.

Run client checks from `frontend/`:

```bash
npm run lint
npm run test
npm run build
```

Vitest uses jsdom and covers environment URL defaults, JWT injection, WebSocket
URL construction, and citation badge interaction. API feature tests should
always cover unauthenticated, wrong-user, and successful paths against a test
Mongo database or a repository fake.
