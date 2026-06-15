# DealFinder — Design System

A one-page visual language for the prototype. Bright, warm, and credible — the look of
a trustworthy agent that works for you, not a noisy coupon site.

## Brand personality
- **Trustworthy first.** Clean layouts, generous whitespace, confident type. The user
  is handing us their inbox — the UI must feel safe and calm.
- **Bright and optimistic, not loud.** Saving money should feel like a small win, not a
  blaring sale. Color is used with intent (one strong accent per screen), not splattered.
- **Concrete.** Always show the number: real dollars saved, real % off, real expiry.

## Color palette — "Sunset Tide"
A beach-at-dusk palette: a deep teal (the sea) leads, a warm apricot (the setting sun)
is the brand pop, and a golden amber signals urgency/expiry — all on a warm sand
surface. Calm, credible, and a little romantic; never a loud coupon site. Savings stays
green by convention (green = money), tuned to a deep teal-green so it sits naturally in
the palette.

| Token | Hex | Use |
|---|---|---|
| `--teal-600` (primary) | `#0E8C8A` | Primary actions, "go", active nav, links |
| `--teal-700` (pressed) | `#0B6F6D` | Pressed/hover state of primary |
| `--teal-50` (tint) | `#D2ECE7` | Primary tints, info backgrounds |
| `--apricot-500` (accent) | `#F5945C` | Brand pop, hero moments, CTAs needing contrast (trial, subscribe) |
| `--apricot-700` (pressed) | `#E07A40` | Pressed/hover state of accent |
| `--apricot-50` (tint) | `#FBE4CC` | Accent backgrounds |
| `--amber-400` (urgency) | `#ECC14E` | Expiry / "ending soon" badges, urgency |
| `--amber-50` (tint) | `#FBE4CC` | Urgency badge fill |
| `--savings-600` (savings) | `#0B6B60` | Savings $ / % text and figures |
| `--savings-50` (tint) | `#D2ECE7` | Savings-badge fill |
| `--ink-900` (text) | `#27302E` | Primary text, headlines (warm near-black) |
| `--ink-500` (muted) | `#7A6E5E` | Secondary text, captions, terms (warm muted) |
| `--surface` (bg) | `#F6EDDC` | App background (warm sand) |
| `--card` | `#FFFFFF` | Cards, sheets |
| `--border` | `#E7D9C2` | Hairlines, dividers, card borders (warm sand edge) |

**Usage rules**
- One dominant accent per screen. Teal is the workhorse; apricot is the spotlight — use it
  sparingly (the trial hero, the subscribe CTA, the "we found you $X" moment).
- Savings numbers always render in `--savings-600`. Urgency/expiry always in amber.
- Cards (`--card`, white) sit on the warm sand `--surface` — keep that contrast; don't
  make screens all-white or the sand identity disappears.
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
- **PrimaryButton** — teal fill (`--teal-600`), white label, 14px radius, full-width in
  flows, 48px tall. `accent` variant uses apricot (`--apricot-500`) for spotlight CTAs
  (subscribe, start trial).
- **DealCard** — image/brand, title (H2), savings line in `--savings-600`, expiry
  caption, optional UrgencyBadge, one-tap action. White card on the sand surface.
- **SavingsBadge** — `--savings-50` fill, `--savings-600` text, shows `$X` or `X% off`.
- **UrgencyBadge** — `--amber-50` fill, amber text, e.g. "Ends in 2 days".
- **BottomNav** — Feed, Watches, Savings, Settings. Active item in `--teal-600`.
- **PermissionSheet** — the plain-language email-connect screen; muted, reassuring,
  bulleted "what we can / can't see". Read-only framing front and center.
- **PaywallSheet** — apricot-accented; leads with cumulative savings recap, then price.

## Imagery & tone
- Real-feeling brand logos/placeholder marks on deal cards (use neutral placeholders in
  the prototype).
- Copy is plain and human: "We'll only ping you when it's worth it." Avoid hype words
  like "INSANE DEAL". Confidence, not shouting.

## Accessibility
- Body text ≥15px; never below 13px.
- Check contrast: apricot and amber on white are for large text/badges, not long body
  copy. Use `--ink-900` for anything dense. Teal (`--teal-600`) and savings
  (`--savings-600`) pass contrast for body-size text on white/sand.
