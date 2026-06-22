# Gmail connect (Phase 1)

Real, read-only Google OAuth. A signed-in user connects Gmail; we store encrypted
tokens server-side; disconnect revokes the grant and purges derived data.

**Scope: `gmail.readonly` only** (plus `openid email` to identify the account).
No write/send/modify scope is ever requested, and the server *rejects* a grant
that contains one (`assertReadOnlyScopes`).

## Endpoints (`server/src/routes/connections.ts`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/connections` | bearer | List the user's connections (never tokens). |
| `POST` | `/connections/google/start` | bearer | → `{ authorizeUrl }` to send the browser to Google. |
| `GET` | `/connections/google/callback` | state | Google redirects here; we store tokens, then redirect to the app. |
| `POST` | `/connections/:id/disconnect` | bearer | Revoke at Google + purge brands/offers/savings. |

## Flow

```
app/ ConnectEmail        server                         Google
  │                        │                              │
  │ POST /connections/google/start (bearer) ─────────────►│
  │◄──── { authorizeUrl } ─│  state = enc(userId,nonce,ts)│
  │ window.location = authorizeUrl ──────────────────────►│  consent (gmail.readonly)
  │                        │◄─ GET /callback?code&state ──│  (browser redirect)
  │                        │  verify state → userId        │
  │                        │  exchange code ──────────────►│
  │                        │  assertReadOnlyScopes(scope)  │
  │                        │  getAccount (sub,email) ──────►│
  │                        │  encrypt + upsert oauth_connections
  │◄─ 302 /connect/callback?status=success ───────────────│
  │ ConnectCallback → setInboxConnected → /enroll          │
```

The callback is the only unauthenticated route: the user is identified from the
encrypted `state` (CSRF + user binding, 10-min TTL), not a bearer token, because
it's a top-level browser redirect. See `services/oauthState.ts`.

## Disconnect = revoke + purge

`POST /connections/:id/disconnect` → revoke the (refresh) token at Google, then
delete `savings`, `offers`, `brands`, and the `oauth_connections` row for that
user. "Disconnect must actually purge" (CLAUDE.WEBAPP.md §3).

## Frontend wiring (`app/`)

- `lib/api.ts` — the only place that knows the API. `backendEnabled` =
  `Boolean(VITE_API_BASE)`. When unset, screens stay in **pure-demo/mock** mode.
- `ConnectEmail.tsx` — "Connect Gmail" → `startGoogleConnect()` → redirect to
  Google (backend mode), or the original mock handshake (demo mode). Requires a
  signed-in user; detours to `/signin` if none.
- `SignIn.tsx` (`/signin`) — minimal Supabase email/password auth.
- `ConnectCallback.tsx` (`/connect/callback`) — reads `?status`; success →
  mark connected → `/enroll`; error → plain message + retry (no silent failure).

## Testing with real credentials

1. **Google Cloud Console** → create an OAuth 2.0 Client (Web application).
   - Authorized redirect URI: `http://localhost:8787/connections/google/callback`
   - Enable the Gmail API; add the `.../auth/gmail.readonly` scope to the consent
     screen. While unverified, add your account as a **test user**.
2. `server/.env`: set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
   `GOOGLE_OAUTH_REDIRECT_URI`, plus the Supabase + `TOKEN_ENCRYPTION_KEY` values.
3. `app/.env` (or `.env.local`): `VITE_API_BASE=http://localhost:8787`.
4. Run `server` (`npm run dev`) and `app` (`npm run dev`). Visit `/connect`,
   sign in, click **Connect Gmail**, complete Google consent, land back on the
   feed flow. Verify a row in `oauth_connections` (tokens are ciphertext), then
   disconnect and confirm the row + derived data are gone.

Until `GOOGLE_*` is set the connect routes return **503** and the app stays in
demo mode — nothing breaks.
