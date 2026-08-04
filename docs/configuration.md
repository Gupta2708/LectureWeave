# Configuration

Copy [`backend/.env.example`](../backend/.env.example) to `backend/.env` for
local development. Production values belong in the deployment platform.

## Required production variables

| Variable | Purpose |
| --- | --- |
| `APP_ENV=production` | Enables startup validation of secrets and CORS. |
| `MONGODB_URL` | MongoDB connection string. |
| `JWT_SECRET_KEY` | Access-token signing secret. |
| `GROQ_API_KEY` | Note-generation model access. |
| `CORS_ALLOWED_ORIGINS` | Comma-separated explicit browser origins. |

`MONGODB_DATABASE` defaults to `lectureweave`; set it to isolate environments.
`PORT` defaults to `8000` and is normally supplied by the host.

## Processing and retrieval tuning

`DOCUMENT_CHUNK_SIZE`, `DOCUMENT_CHUNK_OVERLAP`, and
`DOCUMENT_MIN_CHUNK_SIZE` control source chunking. Hybrid retrieval uses
`VECTOR_INDEX_NAME`, `RETRIEVAL_VECTOR_LIMIT`, `RETRIEVAL_KEYWORD_LIMIT`,
`RETRIEVAL_FINAL_LIMIT`, and vector/keyword weights. See
[retrieval.md](retrieval.md) before changing them.

`PROCESSING_MAX_RETRIES`, `CHAT_MAX_HISTORY_MESSAGES`,
`CHAT_MAX_CONTEXT_CHUNKS`, `FLASHCARD_DEFAULT_COUNT`, `QUIZ_DEFAULT_COUNT`,
and topic settings bound work performed per request.

## Frontend variables

Set `VITE_API_BASE_URL` and `VITE_WS_BASE_URL` to the deployed backend URLs.
They are embedded during Vite's build, so changing either requires a rebuild.

Never commit `.env` files or production credentials. Generate a JWT secret with
`python -c "import secrets; print(secrets.token_urlsafe(48))"`.
