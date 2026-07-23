# HANDOFF — read this first, then re-prompt the creator

> **Ritual (binding):** at SESSION START, read this file INSTEAD of re-deriving history from
> the conversation, memory sprawl, or git log — it is the single warm-start context. Then
> greet the creator with the **"Where we left off"** line below and the recommended next step.
> At SESSION END, rewrite the Snapshot + Where-we-left-off sections (keep this header), commit.
> Keep it under ~80 lines — a handoff, not a chronicle. Deep context lives in the north-star
> docs it links; only follow those when the task actually needs them.

## Operating rules (stable — rarely change)

- **Model economy:** research/recert/fact edits + mechanical builds run on **Sonnet**; **Opus**
  for design sessions and judgment/first-run-triage work. Every grand-plan session below lists
  its own model — remind the creator to `/model`-switch at session start.
- **Never number guides as milestones** — the product is the backbone; a new guide is the
  backbone exercising.
- Ship loop on every change: build → test → `astro preview` :4322 (never `astro dev`) →
  grep `dist/` → commit → push to `main` (the only branch — `verify-live` guards every deploy).
- North stars: `docs/PIPELINE.md` (generation/maintenance) · `docs/MOTION.md`
  (presentation/motion — absorbed VISUAL_COVERS) · `docs/GUIDE_RUBRIC.md` (quality bar) ·
  `docs/COMPETITIVE_LANDSCAPE.md` (market parity reference).

## Snapshot (updated 2026-07-23, session close)

**The ACTIVE execution queue is `docs/PLAN_FIELD_REPORT_FIXES.md`** (E1→E8). E1/E3/E4/E5 are
**DONE**; E2 is **deferred** (no trip planned — resume whenever one exists); next up is **E6**.
`PLAN_TRAVELER_FEATURES.md` holds F1/F2/F4-F7 after this queue; `PLAN_VISUAL_OVERHAUL.md` holds
V5/V6.

- **Creator decisions locked 2026-07-22 (don't re-ask):** route optimizer = tap-to-apply · entry
  cards = US + additional passports (**countries still unnamed — E6's session-start question,
  asked below**).
- **Secret status:** `CLAUDE_CODE_OAUTH_TOKEN` confirmed valid 2026-07-20 — not a blocker
  whenever E2 resumes.
- **CLAUDE.md carries the Clarifying-Questions Doctrine** — binding on every plan/prompt/session.

**Also on `main` (2026-07-22):** the 07-20 review plan fully executed + removed; docs
consolidated ~25%; connector policy asserted (github + Claude Code Remote only). Visual arc
V1–V4 live; V4 contour-visibility still needs a human real-photo eyeball (MOTION.md caveat).

**Housekeeping still open:** creator deletes merged remote branch
`claude/test-coverage-analysis-siftjs` via GitHub UI (sandbox 403s on ref deletion).

## Where we left off

**E1** (`fix(pipeline):`, 3 commits): auto-publish path no longer fails open on a network/API
outage; `PASSED` derives from the real verify exit code.

**E3** (`feat(verify):` + `fix(verify):`, 2 commits): undated-figure detector now blocks on
strict guides, not just informs; found and fixed its own bug mid-session (list-type items can
never carry a per-item date — section-level coverage is the only one possible, code corrected
+ tested). Required sweep of `us.json` found two REAL stale/unconfirmed facts (an unofficial
parking fee, a restaurant's actually-wrong posted hours) — fixed honestly, not just dated.

**E4 + E5** (`research(korea):`, `research(denmark):`, 2 commits): both guides flipped to
`provenance: "strict"`. Korea backfilled mostly from its own rich multi-date `verified` stamp;
Denmark (undated stamp) via fresh re-verification today, per the creator's explicit direction —
never invented dates. Both surfaced real corrections (Korea: MMCA's fee dropped to free, Leeum's
roughly doubled; Denmark: a genuine City Pass 48h price disagreement, recorded not resolved
silently) and both leave personal/dynamic estimates (bookings, spending ranges, demand-priced
fares) honestly `⚠`-flagged rather than falsely dated. Both PASS `npm run verify` offline AND
`--network` (0 dead links, 0 missing photos on either). 715/715 tests, typecheck clean throughout.

**Next up: E6 — dormant `entry` + `phrases` content.** Sonnet, guide-author skill. **Blocked on
one open question the creator hasn't answered yet: which additional passport countries** (beyond
US) need entry rows — a party can mix passports, and this can't be guessed. Ask via
`AskUserQuestion` at session start before any research begins; also confirm any allergies/dietary
needs to prioritize in phrase cards (E6's second clarifier).

**Re-prompt the creator with:** "E1, E3, E4, and E5 are all shipped and pushed — both Korea and
Denmark are now `provenance:\"strict\"`, machine-enforced, not just prose promises. Next up is
E6 (entry + phrase cards, Sonnet, ~2-3h), but it's blocked on one thing only you can answer:
which passport countries besides US need entry rows for the party? And any allergies/dietary
needs for the phrase cards?"
