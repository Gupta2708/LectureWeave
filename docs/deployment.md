# Deployment

The project currently deploys on **Railway** using the NIXPACKS builder. The
backend and frontend are deployed as separate services.

## Backend service

Configuration files (in `backend/`):

- `railway.toml` — `startCommand = "python optimized_main.py"`
- `Procfile` — `web: python optimized_main.py`
- `nixpacks.toml` — installs `python311`, `ffmpeg`, `libsndfile`, creates a venv,
  and installs `requirements-railway.txt`
- `runtime.txt` — `python-3.11.9`

The root `railway.json` selects the NIXPACKS builder and sets
`numReplicas = 1`, restart-on-failure.

Required environment variables (set in the platform, not committed):

- `MONGODB_URL` (a MongoDB Atlas `mongodb+srv://...` string works from any host)
- `GROQ_API_KEY`
- `JWT_SECRET_KEY`
- `PORT` is provided by the platform; the app reads it.

For a production MongoDB Atlas cluster, replace the development
`0.0.0.0/0` network rule with the specific egress IPs of your deployment.

## Frontend service

`frontend/railway.toml`:

- Build: `npm install && npm run build`
- Serve: `npm run preview -- --host 0.0.0.0 --port $PORT`

Set the frontend environment variables to point at the deployed backend:

- `VITE_API_BASE_URL=https://<your-backend-host>`
- `VITE_WS_BASE_URL=wss://<your-backend-host>`

These are build-time variables for Vite, so a rebuild is required after changing
them.

## Notes and planned changes

- The active entry point is `optimized_main.py`. When the backend is
  modularised into `app/main.py`, the start command becomes
  `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, and all deployment files
  above must be updated together. See [migration-plan.md](migration-plan.md).
- CORS must allow only the deployed frontend origin(s) in production; this is
  currently set in `optimized_main.py` and is planned to move to a
  `CORS_ALLOWED_ORIGINS` environment variable.
- Do not place real Atlas credentials in any committed file, including this one.
