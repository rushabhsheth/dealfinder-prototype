# Supabase (DealFinder)

Version-controlled database for the real webapp. Migrations live in
`migrations/` and are applied with the Supabase CLI. The canonical schema is
`migrations/20260622170000_init.sql` (idempotent — safe to re-run).

## Install the CLI

```bash
brew install supabase/tap/supabase     # macOS
supabase --version
```

## One-time: link this repo to your hosted project

```bash
supabase login                          # opens a browser
supabase link --project-ref <your-project-ref>   # ref is in the project URL / dashboard
```

## Apply the schema

```bash
supabase db push        # applies any unapplied migrations to the linked project
```

If you previously pasted the SQL into the dashboard by hand, `db push` still works:
the migration is idempotent, so re-applying is a no-op for objects that exist.

> **Already hit `trigger ... already exists`?** That was a non-idempotent earlier
> version. Just run the current `migrations/20260622170000_init.sql` again (SQL
> editor or `db push`) — it drops-if-exists before creating, so it completes
> cleanly and fills in whatever was missing.

## Auth settings to verify (dashboard → Authentication)

- **Email** provider enabled.
- For dev, **Confirm email = OFF** so `/auth/signup` returns a session immediately
  (mirrors `config.toml` → `[auth.email] enable_confirmations = false`). Turn it
  ON for production.

## Making schema changes later

```bash
supabase migration new <name>     # creates migrations/<timestamp>_<name>.sql
# edit it, then:
supabase db push
```

Keep new migrations idempotent (drop-if-exists before create) so they can be
safely re-applied. After any change, update `server/src/types/domain.ts` and
`app/src/types.ts` if enums/columns changed, and `server/docs/SCHEMA.md`.

## Local stack (optional)

`supabase start` runs Postgres + Auth + Studio locally on the ports in
`config.toml`. Not required if you develop against the hosted project.

## Where the keys go

Project URL + anon + service-role keys → `server/.env` (never committed; never
shipped to the browser — the frontend talks only to `server/`).
