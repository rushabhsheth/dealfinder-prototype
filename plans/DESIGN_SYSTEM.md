# DealFinder — Design System

A one-page visual language for the prototype. Bright, fresh, and credible — the look of
a trustworthy agent that works for you, not a noisy coupon site.

## Brand personality
- **Trustworthy first.** Clean layouts, generous whitespace, confident type. The user
  is handing us their inbox — the UI must feel safe and calm.
- **Bright and optimistic, not loud.** Saving money should feel like a small win, not a
  blaring sale. Color is used with intent (one strong accent per screen), not splattered.
- **Concrete.** Always show the number: real dollars saved, real % off, real expiry.

## Color palette — "Fresh Coast"
A bright, peppy palette inspired by Going: a **deep forest green** leads (the workhorse —
nav, links, primary actions), a **bright lime** is the pop (spotlight CTAs, highlight
pills), and a **light sky blue** gives sections their own color blocks. A warm amber
signals urgency/expiry and a warm red carries errors — both chosen to pop against the
greens. Everything sits on a cool off-white surface. Color is used in confident blocks,
not splattered; still calm and credible, never a loud coupon site. Savings stays green by
convention (green = money).

| Token | Hex | Use |
|---|---|---|
| `--forest-600` (primary) | `#0C7048` | Primary actions, "go", active nav, links; white text passes |
| `--forest-700` (pressed) | `#0A5638` | Pressed/hover state of primary; deep section bands |
| `--forest-50` (tint) | `#D9F2E4` | Primary tints, info backgrounds |
| `--lime-400` (accent) | `#C4ED4E` | The pop: spotlight CTAs (trial, subscribe), highlight pills — **always dark ink text** |
| `--lime-500` (pressed) | `#AED93A` | Pressed/hover state of accent (fill only — too light for text) |
| `--lime-50` (tint) | `#EEF9C9` | Accent backgrounds, pale-lime section bands |
| `--sky-500` (sky) | `#2FA8E0` | Secondary accent, links-on-band, icon highlights |
| `--sky-600` (pressed) | `#1E8FC4` | Readable sky text on tint |
| `--sky-50` (tint) | `#E1F2FC` | Light-blue section bands, info backgrounds |
| `--amber-400` (urgency) | `#F2A52A` | Expiry / "ending soon" badges, urgency |
| `--amber-50` (tint) | `#FBEBCD` | Urgency badge fill |
| `--danger-600` (danger) | `#D8472B` | Errors, destructive actions ("delete my data"), "what we can't see" |
| `--danger-50` (tint) | `#FBE6E0` | Danger badge / icon fill |
| `--savings-600` (savings) | `#0B7A4D` | Savings $ / % text and figures |
| `--savings-50` (tint) | `#DCF3E7` | Savings-badge fill |
| `--ink-900` (text) | `#16241D` | Primary text, headlines (green near-black); text on lime fills |
| `--ink-500` (muted) | `#5C6B62` | Secondary text, captions, terms |
| `--surface` (bg) | `#F3F7F3` | App background (cool off-white) |
| `--card` | `#FFFFFF` | Cards, sheets |
| `--border` | `#E2EAE3` | Hairlines, dividers, card borders |

**Usage rules**
- **Forest green is the workhorse** (nav, links, default buttons). **Lime is the spotlight**
  — use it sparingly (the trial CTA, subscribe, the "we found you $X" moment) and **always
  with dark ink text** (lime is too light for white text). **Sky** colors section bands and
  acts as a calm secondary accent.
- **Section color blocks (the Going move):** give marketing/long sections their own tinted
  band — e.g. a sky-tint hero, a neutral surface section, a pale-lime band, and a deep
  forest band for a strong finish. Alternate; don't tint every section the same.
- Savings numbers always render in `--savings-600`. Urgency/expiry always in amber. Errors
  and destructive actions always in `--danger-600` — never lime (lime reads as success).
- Cards (`--card`, white) sit on the cool `--surface` — keep that contrast.
- Per-category brand marks use four distinct hues (travel→sky, retail→lime, dining→amber,
  tech→forest) so the feed feels colorful — never to imply a deal is sponsored or boosted.
- Never use color to imply a deal is sponsored or boosted. Ranking is payout-blind.

## Typography
- **Type family:** `Inter` (system-ui fallback). Clean, neutral, highly legible at small
  sizes.
- **Numerals:** use tabular figures for prices and savings so columns align.

| Style | Size / Weight | Use |
|---|---|---|
| Display | 28px / 700 | Hero moments ("We found you $214") |
| H1 | 22px / 700 | Screen titles |
| H2 | 18px / 600 | Section headers, deal titles |
| Body | 15px / 400 | Default text |
| Caption | 13px / 400 | Terms, expiry, metadata |
| Label | 13px / 600 | Buttons, badges, nav |

## Spacing & layout
- 4px base grid; common steps 8 / 12 / 16 / 24.
- Screen padding: 16px horizontal.
- Cards: 16px internal padding, 16px radius, 1px `--border`, subtle shadow
  (`0 1px 2px rgba(21,23,26,0.06)`).
- Mobile-first viewport: design at **390px** wide. On desktop, render inside a
  `PhoneFrame` (centered ~390×844 with device chrome).

## Core components
- **PrimaryButton** — forest fill (`--forest-600`), white label, 14px radius, full-width in
  flows, 48px tall. `accent` variant uses lime (`--lime-400`) with **dark ink label** for
  spotlight CTAs (subscribe, start trial).
- **DealCard** — image/brand, title (H2), savings line in `--savings-600`, expiry
  caption, optional UrgencyBadge, one-tap action. White card on the cool surface. Brand
  marks are category-tinted (sky / lime / amber / forest).
- **SavingsBadge** — `--savings-50` fill, `--savings-600` text, shows `$X` or `X% off`.
- **UrgencyBadge** — `--amber-50` fill, deep-amber text, e.g. "Ends in 2 days".
- **BottomNav** — Feed, Watches, Savings, Settings. Active item in `--forest-600`.
- **PermissionSheet** — the plain-language email-connect screen; muted, reassuring,
  "what we can / can't see" — can-see rows in savings green, can't-see in `--danger-600`.
- **PaywallSheet** — forest-banded hero with a lime CTA; leads with cumulative savings
  recap, then price.

## Imagery & tone
- Real-feeling brand logos/placeholder marks on deal cards (use neutral placeholders in
  the prototype).
- Copy is plain and human: "We'll only ping you when it's worth it." Avoid hype words
  like "INSANE DEAL". Confidence, not shouting.

## Accessibility
- Body text ≥15px; never below 13px.
- Check contrast: lime and amber are for fills/large text/badges, not long body copy, and
  lime always takes dark ink text (never white). Use `--ink-900` for anything dense.
  Forest (`--forest-600`), savings (`--savings-600`), sky-pressed (`--sky-600`) and danger
  (`--danger-600`) pass contrast for body-size text on white/surface.
