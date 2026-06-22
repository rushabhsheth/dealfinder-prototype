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

## Live deployment (current)

| | URL | Vercel project |
|---|---|---|
| **Frontend** | https://dealfinder-webapp.vercel.app | `dealfinder-app` |
| **Backend** | https://dealfinder-server.vercel.app | `dealfinder-server` |

Deployed via CLI; production env vars are already set on both projects. What's
live is the committed **Phase 0/1 + auth + Google connect** (see "Deploying while
Phase 2 is uncommitted" below).

> **Frontend domain gotcha.** The bare `dealfinder-app.vercel.app` was already
> taken by another account, so the project's auto domain is a scoped one. Vercel
> **Deployment Protection** 401-gates scoped/preview URLs, so we (a) added a
> public bare alias **`dealfinder-webapp.vercel.app`** and (b) **disabled
> Deployment Protection** on `dealfinder-app` (Project → Settings → Deployment
> Protection) so the production site is publicly reachable. The backend kept its
> public bare alias `dealfinder-server.vercel.app`, so its protection is untouched.

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
  | `GOOGLE_OAUTH_REDIRECT_URI` | `https://dealfinder-server.vercel.app/connections/google/callback` |
  | `APP_BASE_URL` | `https://dealfinder-webapp.vercel.app` |
  | `CORS_ORIGIN` | `https://dealfinder-webapp.vercel.app` |

  On a *fresh* setup you won't know the backend domain until the first deploy —
  deploy once, copy the domain, set `GOOGLE_OAUTH_REDIRECT_URI` / `APP_BASE_URL` /
  `CORS_ORIGIN`, and redeploy. (For this project they're already set to the URLs
  above.)

  > **Token-key note:** if you mint a *new* `TOKEN_ENCRYPTION_KEY` for prod,
  > inbox connections made locally can't be decrypted in prod (different key) —
  > fine, they're separate environments. Just don't change it after users
  > connect, or their stored tokens become unreadable.

- Smoke test after deploy: `curl https://dealfinder-server.vercel.app/health` and `/ready`.

### 2. Frontend — `dealfinder-app`
- Root Directory: **`app`**, Framework Preset: **Vite** (auto: build `npm run
  build`, output `dist`). `app/vercel.json` already handles SPA routing.
- **Environment Variables** (Production):

  | Var | Value |
  |---|---|
  | `VITE_API_BASE` | `https://dealfinder-server.vercel.app` |
  | `VITE_SUPABASE_URL` | `https://ewrfedzrzuhrxsivovzw.supabase.co` |
  | `VITE_SUPABASE_ANON_KEY` | (anon public key) |

  Vite inlines `VITE_*` at build time, so **redeploy after changing them**.

### 3. Production OAuth + Supabase URLs
Once you know both domains:

- **Google Cloud → OAuth client → Authorized redirect URIs** — add the prod ones
  (keep the localhost ones for local dev):
  - `https://dealfinder-server.vercel.app/connections/google/callback`  (Gmail connect)
  - `https://ewrfedzrzuhrxsivovzw.supabase.co/auth/v1/callback`  (already added — Supabase sign-in; unchanged for prod)
- **Supabase → Authentication → URL Configuration:**
  - **Site URL:** `https://dealfinder-webapp.vercel.app`
  - **Redirect URLs → add:** `https://dealfinder-webapp.vercel.app/auth/callback`
- **Supabase → Authentication → Providers → Google** stays enabled with the same
  client ID/secret (one client serves local + prod).

---

## Secrets
Never commit secrets. `.env` files are git-ignored; production values live only
in each Vercel project's Environment Variables. `dotenv/config` no-ops in prod
(no `.env` file) and reads Vercel's injected env.

## Deploying while Phase 2 is uncommitted
The CLI ships **local** files, so it would include any uncommitted in-progress
work. To deploy a clean committed state without disturbing the working tree, deploy
from a throwaway git worktree:

```bash
git worktree add --detach /tmp/df-deploy HEAD
cp -R server/.vercel /tmp/df-deploy/server/.vercel   # reuse the project link
cd /tmp/df-deploy/server && vercel deploy --prod --yes
cp -R /Users/.../app/.vercel /tmp/df-deploy/app/.vercel
cd /tmp/df-deploy/app && vercel deploy --prod --yes
git worktree remove /tmp/df-deploy --force
```

Once Phase 2 is committed (and its `extraction.ts` builds + the `scans` migration
is applied + `ANTHROPIC_API_KEY` is set on the backend project), deploy straight
from `app/` and `server/` — no worktree needed.

## CLI quickstart
```bash
npm i -g vercel && vercel login
cd server && vercel link --yes --project dealfinder-server
# set each env for production (value piped from stdin):
printf '%s' "$VALUE" | vercel env add NAME production
vercel deploy --prod --yes
cd ../app && vercel link --yes --project dealfinder-app   # set VITE_* env, then:
vercel deploy --prod --yes
```
