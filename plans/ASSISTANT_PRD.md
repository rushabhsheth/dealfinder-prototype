# Sub-PRD — Scout, the Conversational Deal Agent

Companion to `PRDs/DealFinder_PRD.docx` (§4.2 the agent, §6 deal actions). Sibling to
`plans/CORE_FEED_PRD.md` (the assistant surfaces ranked deals) and `plans/ONBOARDING_PRD.md`
(onboarding is the *same* Scout in a scripted flow). This sub-PRD scopes the **standalone
conversational assistant** — the chat where a user can ask Scout to find deals on demand. It
is **not in the original `SCREENS.md`** (which predates it), so this PRD is its primary spec.

It covers both layers:
- **Prototype** (now) — a rule-based mock responder over the mock deal data; no LLM.
- **Real webapp** — a real LLM agent grounded in the user's offers, forward-looking.

> **One agent, two modes.** "Scout" is a single brand/persona. In **onboarding** (`/trial`,
> `ONBOARDING_PRD.md`) Scout runs a scripted flow; in the **assistant** (`/chat`) Scout
> answers free-form deal questions. Same name, avatar, and conversational chrome — keep them
> visually and tonally consistent.

---

## 1. Problem & why now

The product's headline is "an AI savings agent." A static ranked feed proves the *ranking*;
the assistant proves the **agent** — that you can talk to it, ask for what you want, and get a
real, actionable answer ("your best flight deal is X, saving $Y — open it?"). It's a premium
differentiator and a natural home for queries the feed can't anticipate ("anything for a trip
to Denver?", "what's expiring today?").

It's built (`Assistant.tsx` + `lib/agent.ts`) as a polished mock: Scout greets, the user
types or taps suggested follow-ups, and a rule-based responder returns a message plus an
optional tappable **deal chip** into Deal Detail. There's no written contract for intents,
grounding, entitlement, or the path to a real LLM — this PRD provides it.

## 2. Goals & non-goals

**Goals**

- Let a premium user **ask Scout for deals** in natural language and get a concrete,
  deal-linked answer with suggested follow-ups.
- Keep answers **grounded in the user's actual deals/savings/watches** — Scout never invents
  offers (in the prototype it only references mock data; in the real app, only real offers).
- Reuse the onboarding chat's look/feel (bubbles, typing dots, Scout avatar) for one coherent
  agent identity.
- Isolate the responder (`lib/agent.ts`) so a **real LLM drops in** behind the same interface.

**Non-goals**

- No real LLM / backend in the prototype (CLAUDE.md hard rule 1) — `agentReply` is rule-based.
- Not a general chatbot — Scout is scoped to deals, savings, fares, and account help; it
  shouldn't answer off-topic questions as if it were a general assistant.
- Not the onboarding flow — that scripted Scout is `ONBOARDING_PRD.md`.
- No actions-with-side-effects from chat in v1 (Scout *links* to redeem/book; it doesn't
  redeem, unsubscribe, or pay on its own).

## 3. Surface

| Surface | Route | File | Entry | State |
|---|---|---|---|---|
| Scout assistant (chat) | `/chat` | `screens/Assistant.tsx` | AI button (top-right) on main tabs (`AgentButton.tsx`) | Built |
| Responder (intent logic) | — | `lib/agent.ts` | — | Built (rule-based) |

## 4. Functional requirements

P0 = prototype must-have, P1 = fast-follow, P2 = later.

### 4.1 Conversation UX (P0 — built)
- Scout greeting on open, with default follow-up chips ("Find a flight deal", "What's ending
  soon?", "How much have I saved?").
- User can type free text or tap a follow-up chip; messages render as bubbles (user right,
  Scout left with avatar); a **typing indicator** (~750ms) precedes each reply.
- Assistant replies may include a **deal chip** — a compact tappable card (brand mark, title,
  "Save $X") → `/deal/:id` (`CORE_FEED_PRD.md`).
- After each reply, contextual follow-up chips update to suggest next questions.
- Auto-scroll to newest message; input disabled while Scout is "typing."

### 4.2 Intents the mock handles (P0 — built)
- **Travel / flights** → best travel deal + active fare-watch status if alerting.
- **Savings / "how much have I saved"** → cumulative total, count, avg %, top category.
- **Ending soon / urgent** → soonest-expiring deal + open prompt.
- **Dining / food** → best dining deal.
- **Best / top / recommend** → top-ranked deal with its `whyForYou` rationale.
- **Fallback** → summary of N deals worth $X + suggested questions.
- Each intent returns `{ text, dealId?, followups[] }` (`AgentReply`). Keep this shape stable.

### 4.3 Grounding & honesty (P0)
- Scout only references **real mock data** (`personalizedDeals`, `savings`, `watches`) — never
  fabricated offers, prices, or savings. The rule-based responder enforces this by
  construction; preserve that guarantee when the LLM lands (§6).
- Payout-blind framing carries through: Scout recommends by value-to-you, never by payout
  (`CORE_FEED_PRD.md`).

### 4.4 Entitlement (P1)
- Scout's *personalized* answers are a premium capability (`MONETIZATION_PRD.md`). Decide free
  behavior: either gate the chat entirely for free users, or let Scout answer about **public**
  deals only and upsell for personalized ("connect your inbox and I'll find deals just for
  you"). Recommend the latter — it's a soft conversion surface.

### 4.5 Robustness (P1)
- Graceful handling of empty input, very long input, rapid sends (already debounced via the
  typing lock), and unrecognized intents (the fallback covers this).
- Off-topic questions get a brief, friendly redirect to what Scout can help with, not a
  hallucinated answer.

## 5. Data model

Uses existing data only. `AgentReply` (`lib/agent.ts`) is the responder contract:
`{ text: string; dealId?: string; followups?: string[] }`. Messages are local component state
(`Assistant.tsx`); no persistence in the prototype (each chat session starts fresh — fine for
demo).

## 6. Real webapp (forward-looking)

- Replace `agentReply` (rule-based) with a **server-side LLM agent** (Anthropic API,
  server-only per `GMAIL_KICKOFF.md`) behind the **same `AgentReply` interface** — the UI
  doesn't change.
- The agent is **tool-grounded**: it queries the user's real offers/savings/watches (the data
  layer from `CORE_FEED_PRD.md`/`SAVINGS_PRD.md`) and is constrained to surface only real
  deals (retrieval-grounded; no free-form offer generation). This preserves the §4.3 honesty
  guarantee.
- Consider light **agentic actions** later (P2): "open this deal", "set a watch SFO→DEN under
  $300", "how do I unsubscribe from X" — each mapping to an existing, consented action
  (`TRAVEL_WATCH_PRD.md`, `ENROLLED_BRANDS_PRD.md`), never an unconsented side effect.
- Conversation history could persist per user (`/me/chats`) if it proves valuable; not
  required for v1.
- Cost/latency: cache, stream responses, and keep the grounding payload tight (offers, not raw
  email).

## 7. States to build (checklist for Cowork)

- Greeting; user message; Scout typing; Scout reply with/without deal chip; follow-up chips
  update.
- Empty/long/rapid input handling; unrecognized-intent fallback; off-topic redirect.
- (Entitlement) free-user behavior per §4.4.
- (Real) loading/streaming, LLM error/retry, "no matching deals found" honest answer.

## 8. Success metrics

- Assistant open rate (from the AI button) and messages per session.
- Chat → deal-chip tap → redeem funnel (does talking to Scout drive savings?).
- Follow-up chip usage vs. free-text (informs intent coverage).
- (Real) grounded-answer accuracy / hallucination rate (must stay ~zero on offers).
- Assistant usage vs. retention/conversion correlation.

## 9. Open questions

- Free-tier behavior: gate entirely, or answer on public deals + upsell? (Recommend the
  latter.)
- Should the assistant be a bottom-nav tab or stay an entry from the AI button? (Currently the
  button; nav promotes it but competes with the core value loop — `ENROLLED_BRANDS_PRD.md`
  reserves nav for the daily loop.)
- How much should Scout proactively *do* vs. *link* in v1-real (agentic actions vs. pure
  Q&A)? Start link-only to keep trust/consent clean.
- Persist chat history, or always start fresh? (Fresh is simpler and privacy-friendly.)
