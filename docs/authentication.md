# Authentication

LectureWeave uses JWT-based authentication with bcrypt-hashed passwords. There is
no social login, refresh token, email verification, password reset, or role
system — only the behaviour described here.

## Model

- **Token**: JWT signed with `JWT_SECRET_KEY` (HS256). Payload includes
  `user_id` and `email`.
- **Expiry**: 30 days (`ACCESS_TOKEN_EXPIRE_DAYS` in
  `backend/app/services/auth_service.py`).
- **Passwords**: bcrypt-hashed; minimum length 6, checked in
  `backend/app/api/auth.py`.
- **Client storage**: the token and user object are kept in browser
  `localStorage` and restored on load; an invalid token triggers logout. State
  is owned by `frontend/src/contexts/AuthContext.jsx`.
- **Protected requests**: send `Authorization: Bearer <token>`. The frontend
  HTTP client (`frontend/src/api/httpClient.js`) attaches this automatically and
  clears the stored session on a `401`.

## Endpoints

| Method | Path | Auth | Body / result |
| --- | --- | :--: | --- |
| POST | `/api/auth/register` | no | `{email, password, username}` → `{success, user, token}` |
| POST | `/api/auth/login` | no | `{email, password}` → `{success, user, token}` |
| POST | `/api/auth/verify` | token | Verifies the token; returns validity + user |
| GET | `/api/auth/me` | yes | Current user |

Notes retrieval endpoints also require authentication and verify ownership:

- `GET /api/notes/my-lectures`
- `GET /api/notes/my-notes`
- `GET /api/notes/lecture/{lecture_id}` (ownership checked)

## Backend files

- `app/services/auth_service.py` — password hashing/verification, token
  creation/decoding, current-user resolution
- `app/api/auth.py` — register/login/verify/me routes
- `database/mongodb_connection.py` — user persistence

## Known gaps (tracked for repair)

These are documented here and in [migration-plan.md](migration-plan.md); they
are **not** fixed in the documentation cleanup:

- **Lecture ownership on creation**: the active create-lecture handler looks for
  authorization in the JSON request body rather than resolving the authenticated
  user from the `Authorization` header. This can produce lectures with
  `user_id: null`, which then do not appear in per-user note/dashboard queries.
  Lecture creation should depend on the authenticated user and set
  `user_id = authenticated user id`.
- **Ownership checks**: read/update/delete of subjects and lectures, document
  upload, audio upload, WebSocket connection, and note retrieval should all
  verify that the current user owns the related record server-side, not rely on
  the frontend hiding inaccessible ids.
