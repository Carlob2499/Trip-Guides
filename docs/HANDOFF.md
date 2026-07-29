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
  (presentation/motion) · `docs/GUIDE_RUBRIC.md` (quality bar) ·
  `docs/COMPETITIVE_LANDSCAPE.md` (market parity reference).

## Snapshot (updated 2026-07-29, session close #16 — Factory v2 P1–P6 ALL SHIPPED)

**Factory v2 complete on `claude/research-trial-results-h32hlk`.** All six phases of
`docs/PLAN_FACTORY_V2.md` shipped, each with build+tests green. The factory now structurally
prevents the classes of error the Japan research trial exposed:

- **P1 (reliability floor):** `pipeline.mjs --checkpoint` refuses out-of-order stages (exit 4);
  `check-run-integrity.mjs` catches void runs + batch/burst commits. Auto-retry once on void,
  then file a stuck issue.
- **P2 (structural research integrity):** Pass B is its own A-blind agent invocation; reserved
  search sub-budgets for phrases/footage; deterministic intake→facet `rank` mapping.
- **P3 (coverage & critic gates):** intake-coverage matrix (`buildCoverageMatrix` →
  `checkCoverage`); fresh-context critic as Agent 4; `budgetTarget` + verdict pill in
  BudgetBlock.
- **P4 (traveler progress page):** question cards (`src/features/intake-questions/` sealed
  silo, BANNED_TERMS enforced); question emitter in research workflow; `modify-guide.yml`
  `absorb-answers` + `date-lock` triggers; ⚠-recheck `expected` field.
- **P5 (venues + fold fixes):** `VenueBlock.astro` (scannable cards with intro field);
  migration across all 4 guides (20 sections); U4 sentence-boundary truncation, U5 prefix
  dedup in subtitles, U6 scroll-edge mask.
- **P6 (voice gate + Japan remediation):** 14 banned patterns in verify-guide.mjs `checkVoice`;
  13 Japan violations + 1 Denmark violation fixed; cover honesty rule R18 in block-types.md;
  amendments logged (Hakodate, Filipino-culture ruling, cover pending sign-off).

**Test count: 980.** Lint 0, build clean. P7 (differentiation surfaces) deferred per Q1.
Japan cover replacement (Q4 — koyo-forward Commons candidates + optional split-cover schema)
awaits creator sign-off next interactive session.

## Left to do

1. **Merge `claude/research-trial-results-h32hlk` to `main`** — creator's word needed.
2. **Japan cover (Q4):** present 2–3 validated Commons koyo candidates + the two-half
   (north/south) split-cover option. Creator signs the final choice.
3. **Rotate `CLAUDE_CODE_OAUTH_TOKEN`** — still blocks M0's end-to-end pipeline proof.
4. **P7 (differentiation surfaces)** — deferred to its own product-focused session.
5. Items 2–6 from the prior "Left to do" still stand (any debt, room codes, etc.).

## Owner tasks (need the creator, not the agent)

1. **Say the word to merge** this branch to main (a11y baselines re-record on CI).
2. **Sign the Japan cover** — Commons candidates will be presented for the koyo replacement.
3. **Rotate `CLAUDE_CODE_OAUTH_TOKEN`** — `claude setup-token` → repo secret → re-run canary.

## Where we left off

**Session #16 (2026-07-29):** Factory v2 P1–P6 all shipped on
`claude/research-trial-results-h32hlk`. The creator commissioned the full arc (QA findings
F1–F14, U1–U7, R1–R20 from `docs/QA_RESEARCH_TRIAL_JAPAN.md`) and approved all four
clarifying questions (Q1–Q4, answers in `docs/PLAN_FACTORY_V2.md`). Executed Opus 5 on High
effort, six phases gate-by-gate: reliability floor → structural research integrity → coverage
& critic gates → traveler progress page → venues + fold fixes → voice gate + Japan
remediation. 980 tests, lint 0, build clean after every phase.

**Re-prompt the creator with:** "Factory v2 is DONE — all six phases shipped on the branch,
980 tests green. The pipeline now enforces its own checkpoint discipline, runs an A-blind
second pass, gates intake coverage, asks the traveler questions without blocking research,
renders food/activity picks as scannable venue cards (all four guides migrated), and rejects
process language in traveler prose. Two things need you: (1) merge the branch to main when
ready (a11y baselines re-record on CI), and (2) the Japan cover — I'll present koyo-forward
Commons candidates + the optional split-cover variant for your sign-off."
