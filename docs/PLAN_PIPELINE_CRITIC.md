# Grand Plan — The Critic (the pipeline's judgment layer)

The staged execution plan for the "third iteration" debated 2026-07-20. The debate's verdict,
preserved as this plan's law: **the pipeline verifies facts but never judges the guide** — yet a
third *gathering* pass would re-tread A/B's source space for nothing. The value lives only in a
**critique-and-repair lens** that reads the merged guide as the traveler and attacks exactly the
rubric rows the machine currently can't grade (anchor quality, party fit, authenticity — the
rows auto-publish stopped enforcing). And it must *earn* stage-hood on evidence, not be built on
faith: the pipeline is still 0-for-real-runs until Session F0 lands.

**Why this matters competitively** (see `docs/COMPETITIVE_LANDSCAPE.md`): every AI planner ships
fluent, generic, unverified itineraries. The critic is the anti-generic weapon — it's how a
Waypoint guide provably escapes the "any AI could have written this" convergence they all share.

## Guardrails (binding at every stage)

1. **Critic ≠ editor.** It flags, justifies, re-researches, or replaces — and every change
   re-enters the verification ledger like any amendment (`source_url` + `verified_on`; the
   guide-author skill's continuity sweep applies). A rewrite that orphans a citation is a defect.
2. **Honest-blank survives critique.** The critic never fills a gap to feel complete; an
   admitted blank stays a feature.
3. **The bar test is the instrument:** "Would this item appear in ANY generic AI guide to this
   destination? If yes: replace it, or justify it against THIS traveler's ranked priorities."
4. **Findings are logged, always** — scorecard entries, even when zero. Silence is
   indistinguishable from not-run; that ambiguity is what the audit punished.

## The session ritual

Identical to the other grand plans (read `docs/HANDOFF.md` → session block → `AskUserQuestion`
clarifiers → explicit go → build → ship loop → **rewrite HANDOFF naming the next session** →
commit → push `main`).

---

## Session C1 — The critic as a lens (prompt-only; no new stage)

**Prereq:** none to *build*; F0 (a working pipeline) to *fire for real*.
**Clarifying questions:** (a) confirm prompt-only scope; (b) should the critic's findings also
render into the guide's scorecard file for the creator to read post-run?
**Do:** edit `research-pass.yml`'s verify self-correction loop + the `waypoint-guide-author`
skill's done gate: before verify may declare PASS, run the bar test (guardrail #3) across the
merged guide — list findings (item → generic-or-justified → action taken), fix what it flags
under guardrail #1, and write the findings block into the scorecard above the verify table.
Also add the same checklist to the skill so *interactive* content passes (like Sedona's) run it
too. NO `STAGE_ORDER` change, NO schema change, NO new checkpoint.
**Exit:** the checklist is live in both places; a dry-run on an existing guide (re-run the done
gate against Korea or Sedona) produces a real findings block. HANDOFF names C2 and its trigger
condition (below).

## Session C2 — The evidence gate (evaluation, not construction)

**Trigger, not schedule:** runs only after **two real research passes** have executed C1's
checklist end-to-end (F0's run counts as the first).
**Clarifying questions:** none up front — this session *produces* the questions.
**Do:** read both runs' scorecard findings blocks and answer, with receipts: (a) did the critic
catch real blandness/misfit the mechanical verify missed? (b) did its repairs survive
verification (no orphaned citations, no honesty regressions)? (c) what did it cost (wall-clock,
rounds, tokens)? Write the verdict into this file under a dated **Evidence** heading, then put
the promotion decision to the creator via `AskUserQuestion`: promote to a full stage (C3), stay
prompt-only, or drop.
**Exit:** a recorded decision with evidence attached. HANDOFF reflects it.

## Session C3 — Promotion to a true Pass C stage (only if C2 says so)

**Prereq:** C2 verdict = promote, creator-confirmed.
**Clarifying questions:** (a) budget ceiling per run (+30–50% agent time is the estimate —
confirm acceptable); (b) should C run on recert passes too, or only new guides?
**Do:** the full ripple, in one session, continuity-swept: add `critique` to `STAGE_ORDER`
between `reconcile` and `verified` (`scripts/pipeline.mjs` + tests); progress feature
(`src/features/pipeline-progress/model/progress.ts` STAGE_ORDER/STAGE_LABEL + tests + mocks —
the live tracker gains a "Judging it like a reader" step); `research-pass.yml` stage
instructions (the C1 checklist becomes the stage's charter, guardrails verbatim); scorecard +
`docs/PIPELINE.md` + `docs/GUIDE_RUBRIC.md` updated so the docs describe what now exists;
attempt-cap/budget wiring so a wedged critic checkpoints cleanly like every other stage.
**Exit:** ship loop green; one real pipeline run completes with the new stage visible on
`/progress/` and `/health/`; HANDOFF closes the plan with the honest cost/benefit numbers from
that run.

---
*Escalation logic: C1 costs a prompt and can't hurt (the verify loop already iterates). C2 costs
one reading session and prevents building on vibes. C3 is real construction, paid for only with
C2's evidence — the same run-it-before-you-build-more lesson the workflow audit taught.*
