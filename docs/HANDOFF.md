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

## Snapshot (updated 2026-07-30, session #18b — P7 merged; revise pipeline V1-V6 built)

**Revise pipeline shipped** (spec: `docs/PLAN_REVISE_GUIDE.md`) — the major-revision workflow
between modify-guide's scoped edit and a full research pass:

- **V1** labels: `revision-request/approved/auto-filed`, `needs-decision` in ensure-labels.yml.
- **V2** pure logic (unit-gated): revise issue template, `parse-revise-issue.mjs` (modify-shape
  fallback for escalated issues), `validate-revision-plan.mjs` (exit 0/1/3 routing; nonexistent
  sections + over-cap + blocking forks caught deterministically).
- **V3-V5** `revise-guide.yml`: 4 routed agents — P plan (Fable→Opus fallback), R research
  (Opus→Sonnet), M sweep (Sonnet), C diff-critic + land (Fable→Opus). Fork gate pauses on
  `needs-decision`; plan file is the resume artifact (attempts cap 3); void detection + 1 retry;
  `guide-<slug>` concurrency retro-fitted onto modify-guide too. **Lands DRAFT-only by default**
  (`land` input) until the first live run reads clean.
- **V6** feedback auto-file: `feedback-signals.mjs` (deterministic thresholds: overall ≤3,
  pacing ≤2, ≥3 skips/submission — Q4 pending creator sign-off) → synthesis agent files INERT
  deduped revision-request issues; owner label stays the only gate.
- **Boundary checks still owed** (per plan doc): force the Fable→Opus fallback once (misspell
  the model), trip a test fork gate, race a modify+revise on one slug, hand-plant a signals file.
- **1009 tests green** (29 new), build clean.

## Prior snapshot (session #18 — P7 shipped)

**P7 differentiation surfaces (R11-R14) shipped** on `claude/research-trial-results-h32hlk`:

- **Schema:** `tier` (primary/corroborated/secondary), `agreement` (A+B converged/A only/B only),
  `recheckNote` added to provenance. New `divergences` section type with category enum.
- **Components:** DivergencesBlock.astro (claim/correction cards with category badges),
  provenance dot+popover on VenueBlock (shows checked date, source, evidence tier, research
  agreement), calendar badge on DaysBlock (constraint-driven), "Next self-check" in colophon.
- **Japan data:** 5 divergences (Ippudo tourist-trap, Otaru overcrowded, Takimotokan, Dazaifu
  default-answer, Naruko missing-context), tier/agreement backfilled on ramen, yatai, key sights.
- **Japan cover:** updated to Naruko Gorge koyo (CC BY 4.0, Oct 24 capture, right season).
- **Congruence:** scaffold-guide emits divergences shell, guide-readiness knows the type.
- **980 tests green, build clean.**

**Test count: 980.** Lint 0, build clean. Four guides live: Korea, Denmark, US, Japan.

## Left to do

1. **Merge `claude/research-trial-results-h32hlk` to main** — P7 commit ready, tests green.
2. **Delete remote branches** — creator must do from GitHub UI:
   `claude/website-visual-redesign-upnl05` (fully merged since session #15).
3. **`astro preview` visual check** — P7 components (provenance dot popover, divergences
   cards, calendar badges) need a mobile 375px + desktop + dark-mode visual pass.
4. **A11y baselines** will re-record on CI's first main run — watch for green.
5. **`no-explicit-any` debt** — 118 remaining `any`s behind a 33-path exception list.
6. **Room codes** committed to a public repo. `#room=` fragment override exists.

## Owner tasks (need the creator, not the agent)

1. **Merge P7 branch to main** (or approve a PR).
2. **Delete `claude/website-visual-redesign-upnl05`** from GitHub (fully merged).
3. **Visual sign-off** on P7 surfaces in `astro preview` — provenance dots, divergences
   block, calendar badges, colophon self-check date.

## Where we left off

**Session #18b (2026-07-30):** P7 merged to main. Then planned (orchestrated 6-agent
workflow: 3 context readers → 2 design lenses → synthesis) and BUILT the revise pipeline
V1-V6 per `docs/PLAN_REVISE_GUIDE.md`. 1009 tests green.

**Re-prompt the creator with:** "The revise pipeline is built and pushed. Before first real
use: (1) ensure-labels runs on this push — confirm the 4 new labels exist; (2) confirm the Q4
auto-file thresholds (overall ≤3, pacing ≤2, ≥3 skips/submission); (3) pick the smoke target
(Q6 — recommend a toy dates-shift revision on korea or denmark, filed via the new template)
and run the boundary checks: force the Fable→Opus fallback once, trip a test fork gate. The
`land` input stays 'draft' until that smoke run reads clean — then flip its default to 'auto'."
