# Security Policy

## Secret handling

- **Never commit real secrets.** `MONGODB_URL`, `GROQ_API_KEY`, and
  `JWT_SECRET_KEY` are provided at runtime through environment variables.
- Only `*.env.example` templates are tracked; real `.env` files are ignored by
  [`.gitignore`](.gitignore).
- All configuration is documented in [docs/configuration.md](docs/configuration.md).
- The application must not log secret material. In particular it must not print
  any portion of the MongoDB connection URI (it may embed credentials), and must
  not return secrets in API responses or error messages.

## Current state of this repository

As of the configuration cleanup:

- No real credentials were found in the tracked working tree. The Mongo/JWT
  strings that existed were placeholders (`user:pass`, `your-secret-key-change-in-production`).
- The credential-shaped PostgreSQL default and the hard-coded JWT placeholder
  were removed from `backend/app/core/config.py`; the JWT secret is now sourced
  from `JWT_SECRET_KEY`.
- Hard-coded backend URLs (ngrok tunnels) were removed from the frontend and
  replaced with environment-driven configuration.

### Known items still to address

- `backend/optimized_main.py` historically printed part of the MongoDB URL at
  startup. This must not print connection strings — tracked in
  [docs/migration-plan.md](docs/migration-plan.md).
- Lecture ownership is not yet consistently enforced server-side; see
  [docs/authentication.md](docs/authentication.md).
- A secret-scanning step in CI is planned but not yet configured.

## If a secret was ever committed

Removing a secret from the latest commit does **not** make it safe — it remains
in git history. Any credential that was ever committed must be **rotated**
(regenerated) at its provider, not merely deleted.

## Reporting a vulnerability

Report suspected vulnerabilities privately to the project maintainers rather
than opening a public issue. Include reproduction steps and impact.
