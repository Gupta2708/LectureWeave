# Deployment

LectureWeave deploys the frontend and FastAPI backend as separate Railway
services. The backend command is already configured in `backend/railway.toml`,
`backend/Procfile`, and `backend/nixpacks.toml`:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Keep the backend at one replica. Live recording queues and WebSocket sessions
are process-local; scaling needs a shared queue and connection/session layer.

## Backend configuration

Set these variables in Railway, never in source control:

- `APP_ENV=production`
- `MONGODB_URL` and, optionally, `MONGODB_DATABASE`
- `JWT_SECRET_KEY` (a long random value)
- `GROQ_API_KEY`
- `CORS_ALLOWED_ORIGINS=https://<frontend-host>`

`PORT` is supplied by Railway. Optional tuning variables include
`VECTOR_INDEX_NAME`, retrieval limits and weights, `PROCESSING_MAX_RETRIES`,
and `CHAT_MAX_*`; see [configuration.md](configuration.md).

Railway installs `requirements-railway.txt`. It includes ffmpeg/system audio
packages through Nixpacks; PDF export additionally uses WeasyPrint's platform
libraries, so validate exports in the deployed image after dependency changes.

## Frontend configuration

The frontend builds with Vite. Set these build-time variables, then rebuild:

- `VITE_API_BASE_URL=https://<backend-host>`
- `VITE_WS_BASE_URL=wss://<backend-host>`

Restrict Atlas network access to Railway's documented egress range where
possible. Do not use an unrestricted production database allow-list.
