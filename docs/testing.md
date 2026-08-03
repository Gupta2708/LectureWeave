# Testing

## Current state

There is **no automated test suite yet**. What exists today:

- The backend contains manual investigation scripts (`backend/test_*.py`,
  `backend/test_*.html`) that were used for ad-hoc debugging. These are not a
  test system and are scheduled to be moved to `scripts/debug/` or removed — see
  [migration-plan.md](migration-plan.md).
- The frontend has a `lint` npm script, but the repository currently has **no
  ESLint configuration file**, so `npm run lint` fails for everyone until a
  config is added.

The current usable static gate is the frontend build:

```bash
cd frontend
npm run build
```

And byte-compiling backend Python:

```bash
cd backend
python -m compileall app
```

## Planned test coverage

When the test suite is introduced, the minimum flow to protect is:

```text
Register -> Login -> Get current user -> Create subject -> List subjects
  -> Create lecture -> Upload supported document -> Process/mock an audio chunk
  -> Store transcription -> Generate structured notes -> Generate final notes
  -> Retrieve lecture notes
```

### Backend (pytest)

- **Auth**: successful/duplicate registration, successful/invalid login,
  protected route without/with invalid token, current-user retrieval.
- **Ownership**: a user cannot read/modify another user's subject, create a
  lecture under another user's subject, upload to another user's lecture,
  retrieve another user's notes, or connect to another user's lecture socket.
- **Subjects/Lectures**: CRUD and status transitions; reject invalid subject.
- **Documents**: upload each supported format (PDF/PPTX/DOCX/TXT), reject
  unsupported formats, parse a fixture, store extracted text, create embeddings,
  query document context.
- **Audio/notes**: accept a valid WAV chunk, reject invalid audio, store
  transcription, create periodic and final notes, retrieve final notes.

Costly external AI calls (Whisper, Groq, embeddings) should be mocked in unit
tests, with a small number of integration tests exercising the real interfaces.

### Frontend

- Login state and protected-route behaviour
- HTTP client token injection and URL construction
- Subject creation form, lecture setup, upload request
- Recording start/stop state, note display

### End-to-end

One smoke test covering the main workflow above.

## Fixtures

Document-processing tests should use small, safe fixtures — one per supported
format — kept under `backend/tests/fixtures/`. See [../assets/README.md](../assets/README.md).
