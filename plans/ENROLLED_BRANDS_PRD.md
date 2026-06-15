# Sub-PRD — Enrolled Brands

Companion to `PRDs/DealFinder_PRD.docx` (§4.2, §5.4 Auto-enrollment, §5.7 Privacy &
trust). This sub-PRD scopes a single new surface — **Enrolled Brands** — and is written
for the **real webapp**, not the mock prototype. It assumes the real inbox-scanning and
auto-enrollment backend from `WEBAPP_MIGRATION_BUILD_PLAN.md` exists or is being built
alongside it.

> **Name.** Shown to users as **"Enrolled Brands."** It is the answer to "show me every
> brand that's sending me promos through DealFinder." (Considered and rejected:
> "Newsletter Manager" — too inbox-y; "Subscriptions" — collides with the paid plan;
> "Sources" — too vague.)

---

## 1. Problem & why now

Auto-enrollment (PRD §5.4) is one of the three premium pillars, but today the user has
**no place to see the consequence of it.** DealFinder silently subscribes them to
high-value newsletters and silently reads promo senders already in their inbox — and the
only mention of management is one line of copy in Enrollment Consent: *"manage every
subscription in Settings."* That screen doesn't exist.

This is a trust gap. The product's entire brand is *"we work for you, not the brands"* and
*read-only, delete-anytime.* A user who can't answer **"what did you sign me up for, and
how do I stop it?"** will not trust us with their inbox — which is the thing we most need
them to do. Enrolled Brands closes that gap and turns auto-enrollment from a scary
black box into a visible, controllable ledger.

## 2. Goals & non-goals

**Goals**

- Give the user one screen that lists **every brand sending them promos via DealFinder** —
  both auto-enrolled by us and pre-existing promo senders detected during the inbox scan.
- Make **pause** and **real unsubscribe** one tap, always, with no dark patterns.
- Quantify each brand's value (deals surfaced, dollars saved) so the user sees that
  enrollment earned its place — reinforcing payout-blind ranking.
- Be the first feature shipped on the real backend that exercises the full loop:
  OAuth read scope → detect/enroll → extract → surface → manage.

**Non-goals**

- Not a full email client or folder/label manager.
- Not a place to *browse deals* — it links into the existing feed/deal detail, doesn't
  replace them.
- No bulk "unsubscribe from everything in my inbox" inbox-cleaner positioning (that's a
  different product; we only manage promo senders relevant to deals).
- No brand discovery/marketplace ("add a brand") in v1 — enrollment stays driven by the
  agent and the interest survey. (Manual add is a P2 fast-follow, see §9.)

## 3. Where it lives

Entry point: the **hamburger menu** (`HeaderMenu.tsx`), as a new item **"Enrolled Brands"**
above "Settings & Privacy", with a `Mailbox`/`Store` lucide icon. Route: **`/brands`**.
Premium-gated (trial or paid); free/downgraded users see a locked state (§7).

Rationale for the hamburger over a bottom-nav tab: the bottom nav is reserved for the
high-frequency value loop (feed, watches, savings, assistant). Enrolled Brands is a
periodic trust/control surface — checked occasionally, not daily — so it belongs with
Settings-class items in the menu.

## 4. Who's in the list — two sources

Every row is a **brand**, not an individual email. A brand lands in the list one of two ways:

1. **Enrolled** — DealFinder subscribed the user to this brand's newsletter on their behalf
   (auto-enrollment from the interest survey + agent picks). These are the brands the user
   most needs visibility into, because *we* added them.
2. **Detected** — the brand was already emailing the user promos before DealFinder; the
   scan found it and is now extracting its offers. We did not subscribe them; we surface a
   one-tap unsubscribe if they want out.

The distinction is shown explicitly on each row (a `source` badge). This honesty is the
point: never blur "we signed you up" with "you were already on this list."

## 5. Functional requirements

Priority: P0 = v1 must-have, P1 = fast-follow, P2 = later. All rows premium-gated.

### 5.1 List & summary (P0)
- Header summary strip: **N brands · M deals delivered · $X saved** (lifetime, this user).
- Scrollable list of brand rows, default sorted by **value** (dollars saved desc), with
  a sort control: Value · Recently added · Most emails · A–Z.
- Filter chips by status (All · Enrolled · Detected · Paused) and optionally by category
  (travel/retail/dining/tech) reusing `DealCategory`.
- Each **brand row** shows: logo or initials avatar (reuse the `DealCard` initials
  treatment), brand name, `source` badge (Enrolled / Detected), `status` badge
  (Active / Paused / Unsubscribed), category, deals-surfaced count, **$ saved from this
  brand**, last-offer date, and a chevron into a brand detail sheet.

### 5.2 Brand detail sheet (P0)
- Opens on row tap. Shows: when & why enrolled ("Added because you picked *Outdoor gear*"),
  enrollment source, the brand's recent offers (links into existing Deal Detail), lifetime
  saved, email frequency, and the action set (§5.3).

### 5.3 Controls (P0) — no dark patterns
- **Pause** — stop surfacing this brand's deals in the feed without unsubscribing. Reversible.
- **Unsubscribe** — a **real** action: send the brand's `List-Unsubscribe` (one-click /
  mailto per RFC 8058) and/or use the connected mail provider's unsubscribe path; mark the
  brand `Unsubscribed` and stop extraction. Confirm once, plainly; never hide the button,
  never add friction or guilt copy.
- **Re-enroll** — for paused/unsubscribed brands, one tap to opt back in.
- Every control reflects state optimistically and reconciles with the backend result;
  failures surface a plain retry, never a silent no-op.

### 5.4 Trust framing (P0)
- Persistent footer line, consistent with the rest of the app: *"We never rank by payout.
  You control what reaches you."* + read-only reminder.
- Copy is calm and factual — this is a control panel, not a coupon page.

### 5.5 Empty, loading & locked states (P0)
- **Loading**: skeleton rows while the brand ledger loads.
- **Empty (premium, nothing yet)**: "Once your inbox scan finishes, the brands sending you
  deals show up here." with a link to run/await the scan.
- **Locked (free / downgraded)**: explainer + "Start free trial" / "Resubscribe" — mirrors
  the downgrade pattern in `DemoContext` (`tier`, `downgraded`).

### 5.6 Sync with enrollment flow (P1)
- The Enrollment Consent screen's sample list becomes real: brands the user confirms there
  appear here immediately as `Enrolled · Active`.
- Settings "Manage subscriptions" deep-links here (replace the dangling copy).

### 5.7 Notifications hooks (P2)
- Optional: notify when a newly enrolled brand delivers its first qualifying deal.

## 6. Data model (real backend)

New first-class entity. Frontend type to add to `app/src/types.ts`:

```ts
export type BrandSource = "enrolled" | "detected";
export type BrandStatus = "active" | "paused" | "unsubscribed";

export interface EnrolledBrand {
  id: string;
  brand: string;
  brandInitials: string;
  logoUrl: string | null;
  category: DealCategory;
  source: BrandSource;        // we enrolled them vs. already in inbox
  status: BrandStatus;
  enrolledAt: string;         // ISO
  enrolledReason: string | null; // "You picked Outdoor gear"
  senderDomain: string;       // e.g. patagonia.com — the promo sender
  dealsSurfaced: number;
  totalSaved: number;         // USD, lifetime from this brand
  lastOfferAt: string | null;
  emailsPerMonth: number;     // observed frequency
  canOneClickUnsubscribe: boolean; // RFC 8058 List-Unsubscribe present
}
```

Backend responsibilities (see migration plan): persist the brand ledger per user, link
extracted offers → brand, compute `totalSaved`/`dealsSurfaced`, store the unsubscribe
mechanism discovered per sender, and execute pause/unsubscribe/re-enroll against the live
mailbox via the OAuth connection.

## 7. Entitlement & privacy behavior

- Premium-only surface; gated by the entitlement service. On trial expiry without
  conversion, the list locks and extraction pauses (consistent with PRD §4.3 downgrade).
- Read-only scope only — we never send mail *as* the user except the standardized
  unsubscribe action, which is user-initiated and explicitly consented.
- Honors global "disconnect inbox" and "delete my data" from Settings: disconnecting clears
  the ledger; deletion removes stored brand/offer records.
- CASA / restricted-scope note: this feature reads sender metadata and promo content,
  squarely within the justified scopes — list it in the OAuth justification.

## 8. Success metrics

- **Trust proxy**: inbox-connect opt-in rate at trial start (target: improves vs. baseline
  once users can see the management surface exists, ideally surfaced pre-consent).
- Enrolled Brands visited by ≥X% of trial users in week 1.
- Unsubscribe completion works end-to-end (real List-Unsubscribe success rate).
- Low correlation between "visited Enrolled Brands" and churn — i.e. control reduces, not
  triggers, abandonment.
- Median brands with `totalSaved > 0` per active user (proof enrollment pays off).

## 9. Open questions

- Manual "add a brand" — worth a P2, or does it invite low-value enrollment?
- Do we show *Detected* brands we can't extract good deals from, or hide them to keep the
  list signal-rich?
- Unsubscribe UX when a brand has no RFC 8058 header — fall back to provider unsubscribe,
  surface "we can't auto-unsubscribe, here's the link," or hide the action?
- Should pausing a brand also visually reflect in the feed ("X paused"), or stay silent?
