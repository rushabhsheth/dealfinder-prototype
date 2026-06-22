# Sub-PRD — Settings & Privacy Controls

Companion to `PRDs/DealFinder_PRD.docx` (§5.7 Privacy & trust, §8 Compliance). Sibling to
`plans/USER_PREFERENCES_PRD.md` (the Preferences section lives in Settings),
`plans/ENROLLED_BRANDS_PRD.md` (linked from Privacy), and `plans/MONETIZATION_PRD.md` (plan
controls). This sub-PRD scopes the **trust-control surfaces**: **Settings** (plan,
personalization preferences, notifications) and **Privacy** (inbox connection, scanning,
data deletion) — deliberately split so the deletion intent is never mixed with routine toggles.

It covers both layers:
- **Prototype** (now) — local `DemoContext` state, mock toggles.
- **Real webapp** — real disconnect/revoke, real data deletion, forward-looking.

> **Two screens on purpose.** Settings holds reversible, routine controls (plan, prefs,
> notifications). Privacy isolates the **inbox connection, scanning, and "Delete my data"** so
> a destructive/sensitive action is never one mis-tap away from a notification switch. Keep
> them separate.

---

## 1. Problem & why now

The product asks for the user's inbox; in return it must offer **visible, plain-language
control**. "Disconnect anytime, delete anytime, read-only" is repeated throughout the app —
Settings/Privacy is where those promises become real, tappable actions. If a user can't easily
find "turn this off and delete my data," the trust story is hollow and (for the real app)
compliance fails.

Both screens are built (`Settings.tsx`, `Privacy.tsx`) and already implement the right
split. This sub-PRD documents the contract — what each control does, how it threads
`DemoContext` state, and what becomes *real* (revoke + purge) in the webapp — so Cowork can
harden it and the migration can wire the destructive actions correctly.

## 2. Goals & non-goals

**Goals**

- Give the user **one obvious place** for every trust control: connection, scanning,
  enrolled brands, deletion, plan, notifications, preferences.
- Keep destructive/sensitive actions (**disconnect**, **delete my data**) isolated, plain, and
  honest — "no questions asked," no friction, no guilt.
- Reuse the survey's preference components so editing prefs feels identical to onboarding.
- Structure so the prototype's mock toggles become **real revoke/purge** with no UX rewrite.

**Non-goals**

- Not the preferences *data model* — that's `USER_PREFERENCES_PRD.md`. This PRD renders and
  edits them; it doesn't define the shape.
- Not the Enrolled Brands surface — Privacy only **links** to it (`ENROLLED_BRANDS_PRD.md`).
- Not billing mechanics — plan row routes to paywall/trial (`MONETIZATION_PRD.md`).
- No account/profile management (no real auth in the prototype).

## 3. Surfaces in this PRD

| # | Surface | Route | File | State |
|---|---|---|---|---|
| 15a | Settings (plan, prefs, notifications) | `/settings` | `screens/Settings.tsx` | Built |
| 15b | Privacy (inbox, scanning, delete) | `/privacy` | `screens/Privacy.tsx` | Built |
| — | List primitives | (shared) | `components/SettingsList.tsx` (`Group`, `Row`, `Toggle`) | Built |

Entry: hamburger / header menu (`HeaderMenu.tsx`). Privacy also reachable from Settings-class
navigation; Enrolled Brands sits above Settings in the menu (`ENROLLED_BRANDS_PRD.md` §3).

## 4. Functional requirements

P0 = prototype must-have, P1 = fast-follow.

### 4.1 Settings — Subscription (P0 — built)
- Plan row shows status: "Premium · annual" / "Trial · day X of N" / "Free".
- Action varies by tier: paid → **Cancel** (`downgrade()` + toast "Subscription canceled");
  trial → **Upgrade** → `/paywall`; free → **Subscribe** → `/trial`. (Lifecycle owned by
  `MONETIZATION_PRD.md`.)
- "(Demo) restore premium" shortcut shown only when free — clearly a demo affordance.

### 4.2 Settings — Preferences (P0 — built; data in `USER_PREFERENCES_PRD.md`)
- "What you told us about you — edit anytime." Four editable fields using the **same
  components as the onboarding survey**: category `ChipGroup`, brand `ChipGroup`, home-airport
  input, travel-style `SegmentedControl`.
- Edits write through `setPreferences` immediately (optimistic, localStorage-backed) with a
  light "Saved" toast. Airport upper-cases + caps at 3 chars.

### 4.3 Settings — Notifications (P0 — built)
- Toggles: **Fare-drop alerts** ("Only when below target") and **Deal expiry reminders**
  ("Ending-soon nudges"). Local state in the prototype.
- These gate the corresponding real notifications later (fare alerts ↔ `TRAVEL_WATCH_PRD.md`).
- Footer trust line: "Ranking is never influenced by payout."

### 4.4 Privacy — Inbox (P0 — built)
- **Email connection** row: shows "Gmail · read-only" when connected; a toggle **disconnects**
  (`setInboxConnected(false)`, also stops scanning, toast "Inbox disconnected"). When
  disconnected, a **Connect** action routes to `/connect` with `connectFlow: true` (returns to
  Privacy — see `ONBOARDING_PRD.md` §5.6).
- **Inbox scanning** row: pause/resume scanning; disabled with a hint when no inbox connected
  ("Connect inbox first").

### 4.5 Privacy — What we surface (P0 — built)
- A row linking to **Enrolled Brands** (`/brands`): "See and manage every brand sending you
  deals." This replaces the dangling "manage subscriptions in Settings" copy
  (`ENROLLED_BRANDS_PRD.md` §5.6).

### 4.6 Privacy — Your data (P0 — built)
- **Delete my data** — isolated in its own group, accent-colored, "Remove everything we've
  scanned — no questions asked." Prototype: toast "Data deletion requested." No confirmation
  friction beyond a single clear action; **no guilt/retention copy**.
- Footer: "Read-only access. We never send mail as you except a one-tap unsubscribe you ask
  for." (Consistent trust line across the app.)

### 4.7 Consistency (P0)
- Reuse `SettingsList` primitives (`Group`, `Row`, `Toggle`) across both screens for visual
  consistency. Plain language everywhere; no jargon.

## 5. Data model

Reads/writes existing `DemoContext` state: `tier`, `downgrade`/`goPremium`, `preferences`/
`setPreferences`, `inboxConnected`/`setInboxConnected`. Notification toggles are local
component state in the prototype (lift to context + persistence if they need to survive reload
— see open questions). No new types.

## 6. Real webapp (forward-looking)

- **Disconnect becomes real**: revoke the Google OAuth grant **and purge** stored tokens +
  scanned data (`GMAIL_KICKOFF.md` Phase 1 "disconnect revokes + purges"). The toggle's effect
  must be a real, verifiable revocation, not a flag flip.
- **Delete my data becomes real**: a genuine deletion of stored brand/offer/savings records
  and tokens (PRD §8 data-deletion tooling; required for CASA/restricted-scope verification).
  Consider an explicit confirm for the *real* destructive action (the prototype's frictionless
  toast is fine for demo; real deletion should confirm once, plainly).
- **Scanning pause** maps to actually pausing the background worker for that user.
- **Notification toggles** become real per-user notification preferences (`/me/notifications`),
  gating fare-drop alerts, expiry reminders, and (later) new-brand-first-deal pings.
- Preferences persist via `/me/preferences` (`USER_PREFERENCES_PRD.md` §3.2).
- Disconnecting clears the Enrolled Brands ledger; deletion removes all stored records
  (`ENROLLED_BRANDS_PRD.md` §7) — keep these surfaces consistent.

## 7. States to build (checklist for Cowork)

- Settings: each tier's plan action; preferences edit + "Saved" toast; notification toggles;
  demo-restore visible only when free.
- Privacy: inbox connected vs disconnected (with Connect CTA); scanning active/paused/disabled;
  Enrolled Brands link; delete action; (real) confirm dialog + success/error for revoke &
  delete.
- Round-trip: disconnect → reconnect from Privacy returns to Privacy (not the scan).

## 8. Success metrics

- Settings/Privacy reachability — users can find disconnect & delete (usability).
- Low correlation between *visiting* trust controls and churn (control should reassure, not
  trigger abandonment — same hypothesis as `ENROLLED_BRANDS_PRD.md`).
- (Real) disconnect/delete success rate (must be 100% reliable for compliance).
- Notification opt-out rates (signal on over-messaging).

## 9. Open questions

- Should notification toggles persist (localStorage / `DemoContext`) like other state, or is
  in-component state fine for the prototype? (They reset on reload today.)
- Does "Delete my data" need a confirm step even in the prototype, to teach the real flow, or
  keep it frictionless for the demo? (Recommend: frictionless prototype, confirm in real app.)
- Should plan/billing management get its own screen in the real app (invoices, payment method)
  rather than a single Settings row?
- Where should "Sign out" live once real auth exists — Settings, Privacy, or the menu?
