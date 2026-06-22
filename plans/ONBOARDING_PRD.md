# Sub-PRD — Onboarding & Trust Chain ("Meet Scout")

Companion to `PRDs/DealFinder_PRD.docx` (§4.2 Personalization, §5.3 Connect inbox, §5.4
Auto-enrollment, §5.7 Privacy & trust, §8 Compliance). Sibling to
`plans/USER_PREFERENCES_PRD.md` (which owns *where the survey answers are stored*) and
`plans/GMAIL_KICKOFF.md` (which owns the *real OAuth backend*). This sub-PRD scopes the
**end-to-end onboarding experience** — from "start trial" to landing on the personalized
feed — as the single most trust-critical sequence in the product.

It covers both layers:
- **Prototype** (now) — a mocked, conversational onboarding; no real OAuth.
- **Real webapp** — the same UX wired to real Gmail read-only OAuth + scanning.

> **Naming.** The agent is **"Scout."** Onboarding is framed as *meeting* Scout, not filling
> a form. The chat lives at `/trial` (`TrialIntro.tsx`) and runs the whole pre-scan flow as
> one conversation; standalone `ConnectEmail` / `EnrollmentConsent` screens are kept for
> **reconnecting later from Privacy**, not for the happy-path first run.

---

## 1. Problem & why now

Onboarding is where we ask for the riskiest thing — read access to the user's inbox. If it
feels like a form, a permissions grab, or a black box, the user bails and we never get to
the value moment. The product's whole brand ("we work for you, not the brands";
read-only, delete-anytime) has to be *felt* here, not just stated.

The current build already implements a strong version of this: a conversational
`TrialIntro` where Scout introduces itself, gathers four personalization inputs, then walks
through connecting the inbox and auto-enrolling — all in chat — before kicking off the scan.
But the flow's contract isn't written down anywhere: what each step must do, how state
threads through it, how it differs prototype vs. real, and how the older standalone screens
relate. This sub-PRD makes that explicit so Cowork can finish, harden, and later migrate it.

## 2. Goals & non-goals

**Goals**

- Make connecting an inbox feel **safe, plain-language, and reversible** — the trust moment
  is the product, not a speed bump.
- Capture the four personalization seeds (categories, brands, home airport, travel style)
  conversationally, persisting them via the preferences store (`USER_PREFERENCES_PRD.md`).
- Deliver the **"magic moment"**: a believable scan animation that resolves into a concrete
  savings reveal (`SAVINGS_PRD.md`).
- Keep one happy-path flow, with a separate, consistent **reconnect** path from Privacy.
- Be structured so the **mock OAuth swaps cleanly for real `gmail.readonly` OAuth** with no
  UX rewrite (per `GMAIL_KICKOFF.md`).

**Non-goals**

- No real OAuth, scanning, or enrollment in the prototype (CLAUDE.md hard rule 1).
- Not the storage spec for preferences — that's `USER_PREFERENCES_PRD.md`. This PRD covers
  the *flow and UX*; it calls `setPreferences` but doesn't define the shape.
- Not the backend/scopes/CASA work — that's `GMAIL_KICKOFF.md` / `WEBAPP_MIGRATION_BUILD_PLAN.md`.
  This PRD references compliance only where it shapes the UI.

## 3. The flow (happy path)

```
/ (Value Explainer)
   └─ "Start finding deals"
        ▼
/trial  ── "Meet Scout" conversational onboarding (TrialIntro.tsx)
   1. Greeting + value framing ("free for 14 days")
   2. Categories   (ChipGroup)        → setPreferences
   3. Brands       (ChipGroup)        → setPreferences
   4. Home airport (3-letter input)   → setPreferences
   5. Travel style (SegmentedControl) → setPreferences
   6. Connect inbox (Gmail / Outlook) → mocked handshake, setInboxConnected(true)
   7. Auto-enroll? (yes / not now)
        ▼  (flips tier → "trial")
/scan   ── First Scan animated reveal (FirstScan.tsx)
        ▼
/summary ── "We found you $X" (SavingsSummary.tsx, see SAVINGS_PRD.md)
        ▼
/feed   ── Personalized For You feed (CORE_FEED_PRD.md)
```

The conversational chrome (typing dots, message bubbles, Scout avatar) is shared visual
language with the **Scout assistant** (`ASSISTANT_PRD.md`) — keep them consistent.

## 4. Surfaces in this PRD

| # | Surface | Route | File | Role |
|---|---|---|---|---|
| 3 | Meet Scout (onboarding chat) | `/trial` | `screens/TrialIntro.tsx` | Happy-path onboarding |
| 5 | Connect Email (standalone) | `/connect` | `screens/ConnectEmail.tsx` | Reconnect from Privacy + real OAuth entry |
| — | OAuth callback | `/connect/callback` | `screens/ConnectCallback.tsx` | Real OAuth return (backend mode) |
| — | Sign in | `/signin` | `screens/SignIn.tsx` | Real auth gate before OAuth (backend mode) |
| 6 | Enrollment Consent (standalone) | `/enroll` | `screens/EnrollmentConsent.tsx` | Reconnect-flow enrollment |
| 7 | First Scan (reveal) | `/scan` | `screens/FirstScan.tsx` | The magic moment |

## 5. Functional requirements

P0 = prototype must-have, P1 = fast-follow, P2 = later.

### 5.1 Conversational onboarding — `/trial` (P0 — built)
- Scout greets, states the value + "free for {trial.lengthDays} days", then asks the four
  questions in sequence with a typing beat between each (the rhythm that sells "agent").
- Each answer is echoed as a user bubble and written through `setPreferences` immediately,
  initialized from existing `preferences` (so re-entry shows prior picks).
- Inputs reuse shared components: `ChipGroup` (categories, brands), 3-letter airport input,
  `SegmentedControl` (travel style) — the **same components as Settings → Preferences**.
- Each question is skippable with a graceful default answer ("Surprise me", "No favorites
  yet", "Not sure yet") — nothing is mandatory.
- Connect step shows Gmail + Outlook; the **mocked handshake** is a short spinner, then
  `setInboxConnected(true)` and advance. Read-only reassurance copy is inline in the chat.
- Enroll step: "Yes, auto-enroll" / "Not now"; either advances to `/scan`.
- Back arrow returns to `/` (Value Explainer).

### 5.2 Trust framing in-flow (P0)
- The connect message states plainly: read-only; only promos/receipts/travel; never personal
  or work email; never send mail as you. (Matches `ConnectEmail`'s "what we can / can't see"
  contract — see §5.4.)
- The enroll message promises one-tap unsubscribe and points to **Enrolled Brands** as the
  control surface (`ENROLLED_BRANDS_PRD.md`).
- Tone is calm and human, never a permissions hard-sell.

### 5.3 Tier transition (P0 — built)
- Starting the scan (`FirstScan` mount) calls `goPremium("trial")` — the demo flips to the
  trial tier so the resulting feed is the personalized For You view.
- This is the single point where free → trial happens in the happy path. (Restarting/
  resubscribing is owned by `MONETIZATION_PRD.md`.)

### 5.4 Connect Email standalone — `/connect` (P0 — built; dual-mode)
- Two modes, switched by `lib/api.ts` `backendEnabled`:
  - **Pure-demo** (no `VITE_API_BASE`): mocked handshake → `setInboxConnected(true)` →
    `/enroll`, carrying a `connectFlow` flag so enrollment returns to Privacy.
  - **Backend** (real): require sign-in (`/signin` with `next`/`connectFlow` state), then
    request the server's consent URL and redirect the browser to Google
    (`gmail.readonly` only). Google returns to `/connect/callback`.
- "What we can see" (promos, receipts, travel) vs "what we can't" (personal/work email,
  anything not deal-related, never send as you) panels are mandatory and identical across
  modes — this copy is the trust contract; do not water it down.
- Outlook is **"coming soon" (disabled)** in backend mode, live (mock) in demo mode — matches
  the Gmail-first decision in `GMAIL_KICKOFF.md`.
- Sticky footer reassurance: "Delete my data anytime · no questions asked."

### 5.5 First Scan reveal — `/scan` (P0 — built)
- Pulsing scanner, animated message counter (`scanned of firstScan.scannedMessages`),
  progress bar, and a 4-step checklist ("Reading your inbox… → Ranking your best deals…").
- ~3.2s animation, then auto-navigate to `/summary`. Driven by mock `savings.firstScan` now;
  by real extraction output in the real app.
- Must feel like *work happening*, not a fake loading spinner — the steps and counter are
  what make it credible.

### 5.6 Reconnect path (P1 — built)
- From **Privacy → Email connection → Connect**, route to `/connect` with
  `state: { connectFlow: true }`. After connect + enroll, return to **`/privacy`** (not the
  scan), since this is a re-connection, not first-run onboarding.
- Keep this path consistent with §5.4 so there's one Connect screen, two entry contexts.

### 5.7 Real OAuth states (P1 — real app, partially scaffolded)
- `/signin` (`SignIn.tsx`) and `/connect/callback` (`ConnectCallback.tsx`) exist as the real
  auth + OAuth-return scaffolding. Required states: signing in, consent redirecting,
  callback success → continue to enroll/scan, callback error → plain retry.
- Disconnect (from Privacy) must **revoke + purge** in the real app, not just flip a flag.

## 6. Data & dependencies

- Writes: `preferences` (via `setPreferences`), `inboxConnected`, `tier` (`goPremium`) on
  `DemoContext`. Reads: `savings.trial`, `savings.firstScan`, `lib/preferences` option lists.
- Real auth/OAuth seam: `lib/api.ts` (`backendEnabled`, `isSignedIn`, `startGoogleConnect`).
- Cross-refs: `USER_PREFERENCES_PRD.md` (storage), `SAVINGS_PRD.md` (the reveal),
  `ENROLLED_BRANDS_PRD.md` (enrollment consequence), `GMAIL_KICKOFF.md` (backend).

## 7. Real webapp (forward-looking)

- Replace both mocked handshakes (in `/trial` and `/connect`) with the real Google OAuth
  flow from `GMAIL_KICKOFF.md` — **`gmail.readonly` only, never write/send/modify.**
- The connect step in the conversational `/trial` flow should, in backend mode, route through
  `/signin` → Google consent → `/connect/callback` and resume the conversation (or hand off
  to `/scan`) on return. Preserve the chat UX; only the handshake becomes real.
- `/scan` and `/summary` are driven by the real scanning/extraction pipeline (Phase 2 of the
  migration plan): pull promos → classify → LLM structured extraction → write offers.
- **Compliance shapes the UI**: least-scope consent, explicit in-app "what we can/can't see,"
  real disconnect-and-purge, minimal retention — all already reflected in the copy; keep them
  through the migration (PRD §8; Google restricted-scope verification + CASA).
- Personalization seeds collected here feed both ranking (`CORE_FEED_PRD.md`) and
  auto-enrollment (`ENROLLED_BRANDS_PRD.md`).

## 8. States to build (checklist for Cowork)

- Each onboarding question: unanswered, answered/echoed, skipped-with-default.
- Connect: idle, connecting (spinner), (backend) needs-signin redirect, error/retry.
- Enroll: enabled / not-now; reconnect-flow vs first-run CTA labels.
- First Scan: animating, complete → auto-advance; (real) scan-failed fallback.
- Reconnect: returns to `/privacy`; first-run: continues to `/scan`.

## 9. Success metrics

- **Inbox-connect opt-in rate** at trial start (the headline trust metric).
- Onboarding completion rate (greeting → scan) and per-step drop-off.
- Scan → summary → feed continuation rate.
- Reconnect success rate from Privacy.
- (Real) OAuth grant success vs. abandon at Google's consent screen.

## 10. Open questions

- In backend mode, should sign-in happen up front (before the conversation) or lazily at the
  connect step (current design)? Lazy keeps the chat friction-free but adds a mid-flow detour.
- Do we keep Outlook visibly "coming soon" during onboarding, or hide it entirely until it
  ships, to avoid advertising an unavailable option?
- Should personalization questions be answerable *after* the scan too (edit in Settings is
  enough), or is in-flow capture sufficient?
- How much of the scan animation timing should reflect *real* scan duration vs. a fixed
  reassuring minimum, once scanning is real (it can take much longer than 3.2s)?
