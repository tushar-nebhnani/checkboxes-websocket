# Checkboxes WebSocket

A grid of 1008 checkboxes synchronized in real time across all connected clients via Socket.IO, with state fanned out through Redis/Valkey pub/sub.

## Structure

```
backend/
  index.js                      Core: Express app, Socket.IO, checkbox state, Redis pub/sub
  redis-connection.js
  db/                           Postgres (Neon) connection pool + schema
  email/                        Nodemailer transport + verification/reset email senders
  middleware/validate.js        Generic Zod DTO-validation middleware
  auth/
    utils.js                    Stateless helpers: JWT sign/verify, opaque token gen/hash, cookie helpers
    token.service.js            DB-backed refresh, password-reset & email-verification token issue/rotate/revoke/consume
    auth.schemas.js             Zod DTOs for auth request bodies
    auth.service.js             Auth business logic
    auth.middleware.js          requireAuth (reads access token cookie)
    auth.routes.js               register, login, refresh, logout, me, forgot/reset-password, verify-email, resend-verification
frontend/                       Vite + React client
```

Auth is kept independent of the checkbox core: `db/` and `auth/` are only
imported to mount `/auth/*` routes, and a missing/broken `DATABASE_URL` logs a
warning at startup instead of crashing the server — the checkbox grid keeps
working even if auth is unconfigured.

## Prerequisites

- Node.js 20+
- Docker (for Redis/Valkey)
- A Neon Postgres database (for auth)

## Setup

1. Start Redis/Valkey:

   ```bash
   docker compose up -d
   ```

2. Install and run the backend (http://localhost:8080):

   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. Install and run the frontend (http://localhost:5173):

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Open http://localhost:5173 — the Vite dev server proxies `/checkboxes`, `/health`, and `/socket.io` to the backend, so no CORS setup is needed in development.

## Environment variables

`backend/.env`:

| Variable                   | Default                  | Description                                          |
| -------------------------- | ------------------------- | ----------------------------------------------------- |
| `PORT`                     | `8000`                    | Backend HTTP/WebSocket port                            |
| `REDIS_URI`                | `redis://localhost:6379`  | Redis/Valkey connection string                         |
| `CLIENT_ORIGIN`            | `http://localhost:5173`   | Allowed origin for Socket.IO CORS                      |
| `DATABASE_URL`             | —                          | Neon Postgres connection string (used by auth)         |
| `JWT_SECRET`               | —                          | Secret used to sign access tokens — set a real value   |
| `ACCESS_TOKEN_EXPIRES_IN`  | `15m`                      | Access token (JWT) expiry                               |
| `REFRESH_TOKEN_TTL_DAYS`   | `30`                       | Refresh token lifetime, in days                         |
| `RESET_TOKEN_TTL_MINUTES`  | `30`                       | Password reset token lifetime, in minutes               |
| `EMAIL_VERIFICATION_TTL_HOURS` | `24`                   | Email verification token lifetime, in hours              |
| `SMTP_HOST`                | —                          | SMTP host. Leave blank to log emails to the console instead of sending |
| `SMTP_PORT`                | `587`                      | SMTP port                                                |
| `SMTP_SECURE`              | `false`                    | Use implicit TLS (`true` for port 465)                   |
| `SMTP_USER` / `SMTP_PASS`  | —                          | SMTP credentials                                         |
| `EMAIL_FROM`               | `Checkboxes <no-reply@checkboxes.local>` | `From` header for outgoing mail             |

The `users`, `refresh_tokens`, `password_reset_tokens`, and
`email_verification_tokens` tables (plus `users.email_verified_at`) are
created/migrated automatically on startup if they don't exist.

## Auth API

All DTOs are validated with Zod (`auth/auth.schemas.js`); invalid bodies get a
`400` with per-field error details. Tokens are delivered as `httpOnly` cookies,
never in the response body:

- `access_token` — short-lived JWT, cookie path `/`, sent on every request.
- `refresh_token` — opaque token, cookie path `/auth`, only sent to auth
  routes. It's DB-backed (`refresh_tokens` table) so it can be revoked, and is
  single-use — every `/auth/refresh` call rotates it (old one revoked, new one
  issued).

| Method | Path                       | Auth cookie      | Body                          |
| ------ | --------------------------- | ----------------- | ------------------------------ |
| POST   | `/auth/register`            | —                  | `{ "email", "password" }`     |
| POST   | `/auth/login`               | —                  | `{ "email", "password" }`     |
| POST   | `/auth/refresh`             | `refresh_token`   | —                               |
| POST   | `/auth/logout`              | `refresh_token`   | —                               |
| GET    | `/auth/me`                  | `access_token`    | —                               |
| POST   | `/auth/forgot-password`     | —                  | `{ "email" }`                  |
| POST   | `/auth/reset-password`      | —                  | `{ "token", "password" }`      |
| POST   | `/auth/verify-email`        | —                  | `{ "token" }`                  |
| POST   | `/auth/resend-verification` | —                  | `{ "email" }`                  |

`forgot-password` and `resend-verification` always return the same generic
message whether or not the email is registered, to avoid leaking which emails
have accounts.

### Email

`email/index.js` sends via SMTP (Nodemailer) if `SMTP_HOST` is set; otherwise
it logs the email (including the verification/reset link) to the server
console — same graceful-degradation pattern as the DB connection, so nothing
crashes if SMTP isn't configured.

Registration creates the user, issues an email-verification token
(`email_verification_tokens`, expires after `EMAIL_VERIFICATION_TTL_HOURS`),
and emails a link to `${CLIENT_ORIGIN}/verify-email?token=...`. Login is
**not** blocked on verification — `emailVerified` is exposed on the user
object (`/me`, register/login responses) so the frontend can decide whether to
nag or restrict. `forgot-password` now emails the reset link the same way,
instead of only logging it.
