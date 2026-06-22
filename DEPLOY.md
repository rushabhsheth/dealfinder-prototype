# Deploying DealFinder to Vercel

Two Vercel projects from this one repo:

| Project | Root dir | What | Framework preset |
|---|---|---|---|
| `dealfinder-app` | `app/` | Vite SPA frontend | Vite |
| `dealfinder-server` | `server/` | Fastify backend as serverless functions | Other |

The backend runs as a single serverless function: `server/api/index.ts` hands
each request to Fastify, and `server/vercel.json` rewrites every path to it.

> **Phase 2 caveat.** The background **scan worker** (mailbox scanning + LLM
> extraction) is long-running and does NOT fit a serverless function's timeout.
> When Phase 2 lands, run it via **Vercel Cron + a queue** or a separate worker
> host. Phase 0/1 (auth, Gmail connect, disconnect) are all request/response and
> deploy fine as functions.

---

## Deploy order

Deploy the **backend first** (so you know its URL), then the frontend, then
update the OAuth/Supabase production URLs. Use the Vercel dashboard ("Add New →
Project → import this repo, set Root Directory") or the CLI (`vercel` in each
folder).

### 1. Backend — `dealfinder-server`
- Root Directory: **`server`**, Framework Preset: **Other**. No build command needed.
- **Environment Variables** (Production):

  | Var | Value |
  |---|---|
  | `SUPABASE_URL` | `https://ewrfedzrzuhrxsivovzw.supabase.co` |
  | `SUPABASE_ANON_KEY` | (anon public key) |
  | `SUPABASE_SERVICE_ROLE_KEY` | (service_role secret) |
  | `TOKEN_ENCRYPTION_KEY` | (32-byte base64 — `npm run gen:key`; can reuse local or mint a new one) |
  | `GOOGLE_CLIENT_ID` | (same Google OAuth client) |
  | `GOOGLE_CLIENT_SECRET` | (same) |
  | `GOOGLE_OAUTH_REDIRECT_URI` | `https://<backend-domain>/connections/google/callback` |
  | `APP_BASE_URL` | `https://<frontend-domain>` |
  | `CORS_ORIGIN` | `https://<frontend-domain>` |

  `<backend-domain>` is this project's URL (e.g. `dealfinder-server.vercel.app`).
  You won't know it until the first deploy — deploy once, copy the domain, set
  `GOOGLE_OAUTH_REDIRECT_URI`, and redeploy.

  > **Token-key note:** if you mint a *new* `TOKEN_ENCRYPTION_KEY` for prod,
  > inbox connections made locally can't be decrypted in prod (different key) —
  > fine, they're separate environments. Just don't change it after users
  > connect, or their stored tokens become unreadable.

- Smoke test after deploy: `curl https://<backend-domain>/health` and `/ready`.

### 2. Frontend — `dealfinder-app`
- Root Directory: **`app`**, Framework Preset: **Vite** (auto: build `npm run
  build`, output `dist`). `app/vercel.json` already handles SPA routing.
- **Environment Variables** (Production):

  | Var | Value |
  |---|---|
  | `VITE_API_BASE` | `https://<backend-domain>` |
  | `VITE_SUPABASE_URL` | `https://ewrfedzrzuhrxsivovzw.supabase.co` |
  | `VITE_SUPABASE_ANON_KEY` | (anon public key) |

  Vite inlines `VITE_*` at build time, so **redeploy after changing them**.

### 3. Production OAuth + Supabase URLs
Once you know both domains:

- **Google Cloud → OAuth client → Authorized redirect URIs** — add the prod ones
  (keep the localhost ones for local dev):
  - `https://<backend-domain>/connections/google/callback`  (Gmail connect)
  - `https://ewrfedzrzuhrxsivovzw.supabase.co/auth/v1/callback`  (already added — Supabase sign-in; unchanged for prod)
- **Supabase → Authentication → URL Configuration:**
  - **Site URL:** `https://<frontend-domain>`
  - **Redirect URLs → add:** `https://<frontend-domain>/auth/callback`
- **Supabase → Authentication → Providers → Google** stays enabled with the same
  client ID/secret (one client serves local + prod).

---

## Secrets
Never commit secrets. `.env` files are git-ignored; production values live only
in each Vercel project's Environment Variables. `dotenv/config` no-ops in prod
(no `.env` file) and reads Vercel's injected env.

## CLI quickstart (optional)
```bash
npm i -g vercel
cd server && vercel        # link/create dealfinder-server, set env, deploy
cd ../app && vercel        # link/create dealfinder-app, set env, deploy
# promote to production:
vercel --prod              # from each folder
```
