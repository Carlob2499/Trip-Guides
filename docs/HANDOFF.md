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

**The ACTIVE execution queue is `docs/PLAN_FIELD_REPORT_FIXES.md`** (E1→E8), built from the
2026-07-22 Field Report (`docs/FIELD_REPORT_2026-07-22.md` — evidence base, reference-only:
106-agent deep-research pass + three same-day codebase audits). It absorbs F0/F3/F8 from
`PLAN_TRAVELER_FEATURES.md` (marked "moved" there); F1/F2/F4/F5/F6/F7 remain there, sequenced
after it. `PLAN_VISUAL_OVERHAUL.md` still holds V5 (morph continuity) + V6 (QA/perf).

- **E1 and E3 are DONE.** E2 remains deferred. See "Where we left off" below for E3.
- **E2 is DEFERRED (creator's call, 2026-07-23) — no trip planned yet.** Not dropped: resume
  it the moment a real destination/party/dates exist to plan (file that guide's New-guide issue,
  then pick this plan back up at E2). The active sequence is now **E4 → E5 → E6 → E7 → E8**.
- **Creator decisions locked 2026-07-22 (don't re-ask):** Korea AND Denmark both backfill
  provenance and flip strict (Denmark via fresh re-verification dated today — never invented
  backdates) · route optimizer = tap-to-apply (localStorage per-device, never edits guide
  JSON) · entry cards = US + additional passports (countries named at E6 session start).
- **Secret status corrected:** `CLAUDE_CODE_OAUTH_TOKEN` IS in place — confirmed valid
  2026-07-20 (commits `e11dd7b`→`389b229`). Whenever E2 resumes, the secret is not a blocker.
- **CLAUDE.md gained the Clarifying-Questions Doctrine** — binding on every plan/prompt/
  session: plans carry per-session clarifier blocks; sessions open with `AskUserQuestion`.

**Also on `main` (earlier 2026-07-22 sessions):** the 07-20 review execution plan was fully
executed and removed (security floor, pipeline unblocking, schema widening, runtime/UX fixes,
arch cleanup, test coverage — see git log `78fb1df`…`672855d`); docs consolidated ~25%
(VISUAL_COVERS→MOTION, SILO_ROADMAP→ARCHITECTURE, critic plan→F7, honest SECURITY.md);
connector policy asserted in CLAUDE.md (github + Claude Code Remote only). Visual arc V1–V4
live; the V4 contour-visibility retune still needs a human real-photo eyeball (MOTION.md
caveat; also E8 item 5).

**Housekeeping still open:** creator deletes merged remote branch
`claude/test-coverage-analysis-siftjs` via GitHub UI (sandbox 403s on ref deletion).

## Where we left off

**E1** (3 commits): `verify-guide.mjs` gained an `unverifiable` content state so a Commons/
network outage blocks instead of reading as a clean pass; `research-pass.yml` gained a final
networked gate before auto-graduation and derives `PASSED` from the real verify exit code, not
the checkpoint alone. `graduate-guide.yml` inherited the fix for free (already gated on exit
code). Ship loop clean, 707/707 tests.

**E2 deferred** — no trip planned. Stays in the plan, unscheduled; resume the moment one exists.

**E3** (1 commit): `check-research.mjs`'s undated-figure detector is now conditional on
`guide.provenance === "strict"` — non-strict guides unchanged (info-only); a strict guide gets a
blocking `warn`, closing the gap where the schema gate only ever caught an undated `≈`, never a
confidently bare figure. `⚠` stays exempt (matches the schema's own ≈/⚠ distinction); `≈` is
NOT exempt for item-level facts (outside the schema's DATED_TYPES). 6 new tests, all 6 existing
D2 tests pass unchanged.

**The required same-session sweep of `us.json`** (the only strict+published guide) found real
issues, verified live rather than guessed: the Airport Mesa "$3 upper lot" fee has no official
source (only travel-blog/forum agreement — T2, not enough) → `⚠`-flagged instead of dated.
Wildcraft Cafe's "open daily 8am–3pm" conflicted with current listings (weekend hours differ) →
the specific wrong claim was removed, not just flagged. US tipping figures are genuinely-varying
convention → `⚠`-flagged. `verified` stamp got an honest addendum. `us` now PASSes
(0 blocking, 3 advisory); mexico/portugal's pre-existing NEEDS WORK (empty scaffolds) is
unrelated, as the plan anticipated. Full ship loop clean, 713/713 tests.

**Next up: E4 — Korea provenance backfill → `provenance:"strict"`.** Sonnet, guide-author
skill. Its clarifier (value corrections vs. dates-only when today's re-check disagrees with a
shipped figure) needs `AskUserQuestion` before starting — read the session block in the plan.

**Re-prompt the creator with:** "E1 and E3 are shipped and pushed (E3 also found and honestly
fixed two real stale/unconfirmed facts in the us guide during its required sweep — not just a
gate change). E2 stays deferred. Next up is E4 — the Korea provenance backfill to strict
(Sonnet, guide-author skill, ~3-4h): one clarifier first (apply value corrections when today's
re-check disagrees with the shipped figure, or dates-only?). Start E4?"
