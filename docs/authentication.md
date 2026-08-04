# Authentication and access control

LectureWeave uses bcrypt password hashes and JWT access tokens signed with
`JWT_SECRET_KEY` using HS256. Tokens include the user identity and expire using
the configured access-token lifetime.

The client keeps its current token in local storage, sends it as
`Authorization: Bearer <token>`, and clears its session after a `401` response.
The shared HTTP client performs that attachment for authenticated requests.

All subject, lecture, document, recording, transcript, note, citation, and
study-feature operations resolve the authenticated user first. The API checks
ownership directly or derives it through the owning subject/lecture; the client
UI is not an authorization boundary.

There are no refresh tokens, email verification, password reset, social login,
or role system. Use a strong unique production `JWT_SECRET_KEY`, HTTPS, and
explicit CORS origins.
