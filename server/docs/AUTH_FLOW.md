# Auth flow (Phase 0)

Minimal real accounts via **Supabase Auth** (email + password). This is user
authentication — distinct from the Google OAuth *inbox connection* (Phase 1,
`OAUTH_TOKEN_STORAGE.md`), which is an authorization a logged-in user grants.

## Endpoints (`server/src/auth/routes.ts`)

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/auth/signup` | Create an account. Returns user + session (if no email confirmation). |
| `POST` | `/auth/signin` | Email + password → session (access + refresh token). |
| `GET` | `/auth/me` | Authed user + entitlement. Requires `Authorization: Bearer <accessToken>`. |

Request body for signup/signin: `{ "email": "...", "password": "..." }`
(password ≥ 8 chars, validated with zod).

## How it works

```
Client (app/)                    Server (Fastify)                 Supabase
  │                                   │                              │
  │  POST /auth/signup ──────────────►│                              │
  │                                   │  authClient.auth.signUp ────►│  creates auth.users row
  │                                   │                              │  ── trigger ──►
  │                                   │                              │   public.users + entitlement
  │◄──── { user, session } ───────────│◄──── session ────────────────│
  │                                   │                              │
  │  store accessToken                │                              │
  │                                   │                              │
  │  GET /auth/me                     │                              │
  │  Authorization: Bearer <jwt> ────►│                              │
  │                                   │  authClient.auth.getUser ───►│  verifies JWT
  │                                   │◄──── user ───────────────────│
  │                                   │  adminDb → entitlements      │
  │◄──── { user, entitlement } ───────│                              │
```

## Key decisions

- **Supabase owns password hashing + session issuance.** We don't roll our own
  JWT/session plumbing — fewer ways to get it wrong for a solo MVP.
- **Verification is delegated, not local.** `requireUser`
  (`auth/middleware.ts`) calls `auth.getUser(jwt)` rather than decoding the JWT
  itself, so a revoked session is rejected immediately.
- **The client never sees the service-role key.** The password handshake runs on
  the server with the anon client; privileged reads (entitlement) use the
  service-role client.
- **Provisioning is automatic.** The `on_auth_user_created` DB trigger guarantees
  every authed user has a `public.users` row and a `free` entitlement — the API
  doesn't race to create them.
- **Bearer tokens, not cookies.** The frontend stores the access token and sends
  it as `Authorization: Bearer <token>`. (Refresh-token rotation handled by
  `supabase-js` on the client, or a future `/auth/refresh` endpoint.)

## What's intentionally deferred

- Email confirmation / magic links / OAuth social sign-in (Supabase supports
  these; flip on later).
- A server `/auth/refresh` endpoint (today the client refreshes via supabase-js).
- Password reset flow.
