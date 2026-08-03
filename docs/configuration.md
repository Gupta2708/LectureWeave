# Configuration

All configuration is supplied through environment variables. Copy the tracked
templates to real files and fill in values — never commit a real `.env`.

- Backend template: [`backend/.env.example`](../backend/.env.example)
- Frontend template: [`frontend/.env.example`](../frontend/.env.example)

The backend `.env` must live in `backend/` (it is loaded relative to the backend
working directory), not at the repository root.

## Backend variables

| Variable | Required | Dev example | Purpose | Secret |
| --- | :--: | --- | --- | :--: |
| `PORT` | no | `8000` | Port the API listens on (code fallback is `8001`) | no |
| `MONGODB_URL` | yes | `mongodb://localhost:27017` | MongoDB connection string (local or Atlas `mongodb+srv://...`) | yes |
| `GROQ_API_KEY` | yes | `gsk_...` | Groq LLM key for note generation | yes |
| `JWT_SECRET_KEY` | yes | long random string | Signing key for JWT access tokens | yes |
| `LLM_MODEL` | no | `llama-3.1-8b-instant` | Groq model id | no |
| `WHISPER_MODEL_SIZE` | no | `small` | Faster Whisper model (`tiny`/`base`/`small`/`medium`/`large`) | no |
| `WHISPER_DEVICE` | no | `cpu` | Whisper device | no |
| `WHISPER_COMPUTE_TYPE` | no | `int8` | Whisper compute type | no |
| `EMBEDDING_MODEL` | no | `all-MiniLM-L6-v2` | Sentence-transformers model (384-dim) | no |

Generate a strong JWT secret:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

## Frontend variables

Read through `frontend/src/config/environment.js`. Trailing slashes are stripped
safely; missing values fall back to localhost with a development warning.

| Variable | Required | Dev example | Purpose |
| --- | :--: | --- | --- |
| `VITE_APP_NAME` | no | `LectureWeave` | Display name |
| `VITE_API_BASE_URL` | recommended | `http://localhost:8000` | Backend HTTP base URL |
| `VITE_WS_BASE_URL` | recommended | `ws://localhost:8000` | Backend WebSocket base URL |

## Values that are not yet environment-driven

These are known and tracked in [migration-plan.md](migration-plan.md):

- **CORS origins** are currently configured inside `optimized_main.py` rather
  than via a `CORS_ALLOWED_ORIGINS` variable.
- **Token expiry** (`ACCESS_TOKEN_EXPIRE_DAYS = 30`) is a constant in
  `backend/app/services/auth_service.py`.
- **Password minimum length** (6) is checked in `backend/app/api/auth.py`.
- **Database name** is not yet parameterised via `MONGODB_DATABASE`.

## Common configuration mistakes

- `.env` placed at the repo root instead of `backend/`.
- Extra spaces around a value, or a Groq key not prefixed with `gsk_`.
- `python-dotenv` not installed (the backend loads `.env` via `load_dotenv()`).
