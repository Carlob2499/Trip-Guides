# The Waypoint Pipeline — end-state architecture & program

The north star for what this repo *is*: **a factory-with-a-maintenance-department for refined,
researched, creator-tailored travel guides — where creating a guide and keeping it fresh are both
nearly toil-free, and human effort is spent only where judgment genuinely lives.**

This doc is **policy**: the target, the stage contracts, the program. How each piece arrived lives
in `docs/archive/INDEX.md → pipeline-history`, a record and never a work order. Read alongside
`docs/standards/guide-rubric.md` (the bar) and the `waypoint-guide-author` skill (the discipline).

---

## The lifecycle (the spine)

A guide is not a document; it is an object with a lifecycle. On the happy path every arrow is
automatic, PUBLISH included: an end-user files one intake and the next thing they see is a live
guide, no approval step in between.

```
   ┌─────────┐   ┌──────────┐   ┌─────────┐   ┌─────────┐   ┌────────┐   ┌─────────┐
   │ INTAKE  │──▶│ GENERATE │──▶│ VERIFY  │──▶│ PUBLISH │──▶│ LEARN  │──▶│ REFRESH │─┐
   └─────────┘   └──────────┘   └─────────┘   └─────────┘   └────────┘   └─────────┘ │
   REFRESH feeds back into VERIFY ─────────────────────────────────────────────────┘
```

**PUBLISH auto-resolves the moment VERIFY PASSes** — no diamond, no label, no human, per the
explicit "input information and see a new guide without other input" goal. It becomes a human
decision only on the failure path: a run that can't reach PASS lands as a draft PR, which a human
fixes or force-graduates via `graduate-guide.yml`. **retire/soft-delete** stays the one always-human
diamond — nothing here ever decides to un-publish a guide.

## The stages, and what each one owes

1. **INTAKE — one typed front door.** `scripts/intake-schema.mjs` (FIELDS + zod) is the source of
   truth; the issue form, scaffold CLI and guide-author skill all derive from it and cannot drift —
   a contract test fails CI if they do. Captures party, anchor, ranked priorities, travel style and
   per-field **certainty** (fixed / target / flexible / unknown / none / assumed).

2. **GENERATE — dual-pass, resumable, auto-chained.** Pass A canonical/verified and Pass B
   local/authentic/crowd-aware are researched independently, then reconciled into one guide with a
   ledger. A git-tracked checkpoint (`guides-intake/<slug>.state.json`, via `scripts/pipeline.mjs`)
   records `scaffold → passA → passB → reconcile → verified`, so an interrupted run resumes at the
   next un-done stage (`npm run pipeline -- --slug <slug> --status`). `new-guide.yml` dispatches the
   research pass itself — filing the issue is the only manual step to start a guide.

3. **VERIFY — one rolled-up gate + scorecard.** `npm run verify` rolls readiness, staleness,
   links/photos, candidate floors, source mix, facts hygiene, risk gates, uncertainty and — under
   `--network` — source drift into ONE verdict plus a rubric-shaped scorecard: AUTO rows the machine
   passes/fails, HUMAN rows a reviewer checks. Schema stays the `npm run build` gate. `--network` is
   required before graduating; both auto-publish paths pass it.

4. **PUBLISH — graduate on evidence, automatically.** `npm run verify --markdown` renders the
   scorecard, and that verdict is the *entire* publish decision: on a full PASS the same job
   graduates the guide and lands it on `main`, live on the next Pages deploy. **No issue, no label,
   no human.** `graduate-guide.yml` remains the manual override for what that can't reach — a draft
   finished by hand, a legacy guide, or one a human fixed after a failed run.

   **The honest tradeoff, stated plainly:** rubric rows #6/#8/#9/#12 (anchor coverage, priority
   depth, party fit, authenticity) are HUMAN-judged and the machine cannot pass/fail them. They are
   printed in every scorecard but do NOT block publication — a guide passing every automated gate
   goes live even if nobody glanced at them. A deliberate choice, traded against the explicit "no
   other input" requirement; the mitigation is that traveler-patterns and the Learnings loop still
   catch a bad party-fit call after the fact, and `modify-guide.yml` fixes it without a re-run.

5. **EDIT — a scoped fix, not a full research pass.** `modify-guide.yml` handles "this one fact is
   wrong" without re-running Pass A/B: the **✎ Request a change** button files the issue, the owner
   applies `modify-approved`, and an agent in the skill's "Edit an existing guide" mode verifies the
   fact, runs the continuity sweep, and lands via `land-branch.sh`. An edit never changes
   draft/published status, and filing alone does nothing — approval runs it.

5b. **REVISE — between EDIT and a full re-research.** `revise-guide.yml` (spec:
   `docs/reference/revise-guide.md`) handles changes needing real re-research with whole-guide
   continuity. The owner triages weight at approval (`modify-approved` = scoped edit,
   `revision-approved` = this). Four routed agents — plan, re-research the named groups, sweep
   continuity against the emitted old→new token list, critique the diff fresh-context — then land
   via `land-branch.sh`. A plan carrying blocking forks pauses the run (`needs-decision`) until the
   owner answers: the Clarifying-Questions Doctrine, enforced in CI.

6. **LEARN — the loop closes on the next intake.** Trip feedback → `learnings/<slug>.md` +
   `docs/evidence/traveler-patterns.md`, so each guide starts more personalized than the last. When
   divergence signals trip (`feedback-signals.mjs` — avg overall ≤ 3, pacing ≤ 2, or ≥ 3 skips),
   the synthesis auto-files an INERT `revision-request` issue (aggregates only, zero verbatim
   freeform); the owner's `revision-approved` is the only execution gate.

7. **REFRESH — the maintenance department.** `recert.yml` runs weekly and on demand: a detect job
   lists every stale guide (`npm run recert --json`), then a matrix runs one agent per guide — each
   re-verifies only the flagged facts against primary sources, re-dates or downgrades them, runs the
   continuity sweep and the verify gate, and opens an isolated **freshness PR** (`recert/<slug>`).
   Never auto-merges. This is the missing half of "dynamic": a *published* guide never silently rots
   (the MangoPlate class). Freshness is recorded by `verified_on` dates, not pipeline stages.

**The three senses of "dynamic", all in scope:** (1) self-freshening content — REFRESH above;
(2) dynamic runtime — View Transitions, live-data tiles, offline state machine; (3) dynamic
per-view — Focus Today, what's-open-now, the weather day-swap advisory.

## The program — what remains

Platform stance is settled: **GitHub Pages + Firebase free tier + GitHub Actions as the compute
layer**; native = PWA-first. The P-series (P0–P4) and the W-series are **shipped** — see
`docs/archive/INDEX.md → pipeline-history`. What remains:

| Phase | Deliverable | Serves | Model / effort |
|-------|-------------|--------|----------------|
| **R3 · Dynamic runtime** | View Transitions, live-data tiles, offline/connection state machine | dynamic #2 + #3 | Fable designs; Sonnet implements |
| **R4 · Per-country visual identity** | Build-time country skin (palette from the guide's own imagery), one signature motion set, motion-doctrine doc | goals 8/9 | Fable spec; Sonnet implements |
| **R5 · Tool suite by demand** | Top-3 tools ranked by trip post-mortems; cull below-median | goal 7 | Sonnet / Haiku |
| **R6 · App-ready distribution** | PWA manifest/icons/splash hardening, install prompt, iOS meta; optional TWA | goal 10 | Haiku / Sonnet |

R3/R4 are independent of the pipeline phases and can interleave if a trip deadline appears.
**Per-session rule:** open with the phase's measurables, close with the Ship Loop.

### Model economy — the backbone runs on Claude Pro

Designed on heavy models; *operated* on light ones.

| Work | Model | Why |
|---|---|---|
| Research passes (A + B), recert | **Sonnet** (workflow default, pinned via `claude_args`) | Verification is procedure-driven — the skill + gates carry the judgment |
| Contested reconcile / anchor calls | light **Opus** (explicit dispatch choice) | Rare, bounded judgment moments |
| The fresh-context critic (one per run) | **Opus** (`critic_model` default) | The only judgment agent left, and the last gate before a guide auto-publishes |
| Mechanical sweeps, formatting | Haiku / stay in Sonnet | — |
| Pipeline/skill/design changes | Fable/Opus, **separate sessions** | Design is one-time; operation is forever |

Guides are not numbered milestones — each is the backbone exercising. What makes Pro sufficient:
**plan-mode first**, **checkpoint-often**, and the skill's `references/research-efficiency.md`
budgets — scripts before web, direct-to-primary, batch by entity, scaled by risk, ship/flag/omit.

## What "done" means for the pipeline (exit criteria)

- Filing a trip reaches a corroborated, verify-PASSing guide **merged, published and live** with
  **zero human action** on the happy path. (A run that can't reach PASS lands as a draft PR — the
  toil floor, not the common case.)
- The end-user sees **tangible progress while it runs**, from the same git-tracked checkpoint state
  the pipeline already writes, so nothing is maintained twice.
- A **published** guide cannot silently rot: recert opens a freshness PR before facts mislead, and
  a wrong fact is one issue + one label away from a scoped fix with no full re-run.
- No stage depends on remembering a separate script: one intake, one generate, one verify, one
  auto-graduate, one recert, one modify — each a named command and a workflow, inherited by every
  guide because the machinery lives at the pipeline/skill level.
