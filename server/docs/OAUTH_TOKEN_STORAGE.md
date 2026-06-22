# OAuth token storage design

How Google OAuth tokens are stored — the design the kickoff asked to lock before
wiring any Gmail calls. Governing rule (`CLAUDE.WEBAPP.md` §2): *no tokens in the
repo or client code; tokens stored server-side, encrypted at rest; all inbox
access on the backend.*

## What we store, and where

Tokens live in **`public.oauth_connections`**, one row per connected account:

| Column | Holds |
|---|---|
| `access_token_ciphertext` | Google access token — **AES-256-GCM ciphertext**, never plaintext |
| `refresh_token_ciphertext` | Google refresh token — **AES-256-GCM ciphertext**, never plaintext |
| `access_token_expires_at` | When the access token expires (drives refresh) |
| `scopes[]` | Granted scopes — asserted to be read-only (`gmail.readonly`) |
| `provider_account_id` / `provider_account_email` | Google `sub` / connected address |
| `status`, `revoked_at` | `active` until disconnect, then `revoked` |

Plaintext tokens exist only **transiently in server memory** during a request,
never on disk, never in logs (the Fastify logger redacts `authorization`).

## Encryption

- **Algorithm:** AES-256-GCM (authenticated encryption — detects tampering).
- **Implementation:** `server/src/crypto/tokens.ts` (`encryptSecret` /
  `decryptSecret`).
- **Envelope written to the column** (single text value):
  `v1.<iv_b64>.<authTag_b64>.<ciphertext_b64>`
  - random 12-byte IV per encryption, 16-byte GCM auth tag, `v1` version prefix
    to allow scheme/key rotation later.
- **Key:** 32 random bytes, base64, in env var `TOKEN_ENCRYPTION_KEY`. Generate
  with `npm run gen:key`.

## Where the key lives (and doesn't)

- **In dev:** `server/.env` (git-ignored; only `.env.example` is committed).
- **In prod:** the host's secret store (Vercel/Render/Fly env vars).
- **Never:** in the repo, in the database, in client code, or in logs.

The key is the only thing protecting tokens if the database is exfiltrated — DB
dump alone is useless without it. Because it's separate from the data,
encryption-at-rest is meaningful (not just "the DB provider encrypts disks").

## Lifecycle

1. **Connect (Phase 1):** OAuth `code` → exchange server-side for tokens →
   `encryptSecret(access)`, `encryptSecret(refresh)` → insert `oauth_connections`
   row with `status='active'`.
2. **Use:** scan worker reads the row, `decryptSecret(...)` in memory, calls the
   Gmail API, discards plaintext.
3. **Refresh:** when `access_token_expires_at` passes, use the refresh token to
   mint a new access token, re-encrypt, update the row.
4. **Disconnect / delete:** call Google's token-revocation endpoint, then set
   `status='revoked'` (or hard-delete the row) **and purge** derived
   brands/offers/savings. Disconnect must actually revoke + purge (PRD §8).

## Key rotation

The `v1` prefix allows a future `v2` (e.g. envelope encryption / KMS data keys).
Rotating `TOKEN_ENCRYPTION_KEY` means: decrypt-with-old → encrypt-with-new across
all rows in a migration. Until then, treat the key as long-lived and high-value.

## Hard guarantees

- Tokens are **never** returned by any API response (`InboxConnection` in
  `domain.ts` has no token field).
- `oauth_connections` has **no anon RLS policy** → unreachable with the anon key.
- Only read-only scopes are ever requested; `scopes[]` is validated on connect.
