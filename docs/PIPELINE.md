# The Waypoint Pipeline — end-state architecture & program

The north star for what this repo *is*: **a factory-with-a-maintenance-department for refined,
researched, creator-tailored travel guides — where creating a guide and keeping it fresh are both
nearly toil-free, and human effort is spent only where judgment genuinely lives.**

This doc is the durable plan future sessions execute against (like `REVIEW_AND_ROADMAP_2026-07.md`,
which it supersedes for *pipeline* scope). It states the target, the gaps, and the sequenced program
with model/effort per phase. Read it with `docs/GUIDE_RUBRIC.md` (the quality bar) and the
`waypoint-guide-author` skill (the research discipline).

---

## The lifecycle (the spine)

A guide is not a document; it is an object with a lifecycle. The pipeline automates every arrow
except the two diamonds, which are human decisions by design.

```
   ┌─────────┐   ┌──────────┐   ┌─────────┐   ◆────────◆   ┌────────┐   ┌─────────┐
   │ INTAKE  │──▶│ GENERATE │──▶│ VERIFY  │──▶│ PUBLISH │──▶│ LEARN  │──▶│ REFRESH │─┐
   └─────────┘   └──────────┘   └─────────┘   ◆────────◆   └────────┘   └─────────┘ │
    one typed     dual-pass       one rolled    human       trip          scheduled  │
    intake, all   A+B →           -up gate +    graduates   feedback →    recert:    │
    surfaces      reconcile       scorecard     on the      patterns →    stale facts│
    agree         (resumable)     (this phase)  scorecard   next intake   re-researched
                                                                          → freshness PR
   REFRESH feeds back into VERIFY ─────────────────────────────────────────────────┘
```

Two diamonds — **graduate draft→published** and **retire/soft-delete** — stay human. Everything
else is a gate a machine can run: research quality, schema, links, photos, recency.

---

## Target state, stage by stage

1. **INTAKE — one typed front door.** A single zod-typed intake schema is the source of truth;
   the GitHub issue form, the scaffold CLI, and the guide-author skill all derive from it, so they
   can never drift. Fillable in a few taps from a phone. Captures party + anchor + ranked
   priorities + travel style (all shipped as fields; the *unification* is the remaining work).

2. **GENERATE — dual-pass, resumable.** Pass A canonical/verified, Pass B local/authentic/
   crowd-aware, reconciled into one guide with a reconciliation ledger (shipped). Target adds:
   one-command orchestration (scaffold→research chained, not hand-stitched) and **checkpointing**
   so a headless run cut off by a wall-clock/usage limit resumes at the last pass instead of
   restarting.

3. **VERIFY — one rolled-up gate + scorecard.** `npm run verify` rolls readiness (research),
   staleness (recency), and the audit suite (links/photos) into ONE verdict plus a
   `GUIDE_RUBRIC`-shaped scorecard: AUTO rows the machine passes/fails, HUMAN rows the graduating
   reviewer checks. **Shipped this phase.** Schema stays the `npm run build` gate, called alongside.

4. **PUBLISH — graduate on evidence.** `graduate-guide` flips draft→published (human decision,
   already a script+workflow+issue-form). Target: the verify scorecard is posted on the research
   PR, so graduation is a judgment against evidence, not vibes.

5. **LEARN — the loop closes on the next intake.** Trip feedback → `learnings/<slug>.md` +
   `TRAVELER_PATTERNS.md` (shipped). Target: the post-mortem's party-pattern deltas are what the
   next intake's party selection reads, so each guide starts more personalized than the last.

6. **REFRESH — the maintenance department.** A scheduled Action runs `check-staleness`, and for
   each fact past its shelf life re-researches it under the same verification discipline and opens
   a **freshness PR**. This is the missing half of "dynamic": a *published* guide never silently
   rots (the MangoPlate class of failure). Reuses the dual-pass skill + the verify gate.

---

## The three senses of "dynamic" (all three are in scope)

| Sense | Meaning | Where it's built |
|-------|---------|------------------|
| **Self-freshening** | Published guides re-verify stale facts automatically → freshness PR | REFRESH stage (recert workflow), on top of the verify gate |
| **Alive at runtime** | View Transitions hub⇄guide, live weather/currency tiles, explicit offline/connection state machine | R3 runtime phase |
| **Adapts per-view** | Focus Today, what's-open-now, weather-driven day swaps — the guide reshapes to the moment | R3 runtime phase (per-view layer) |

---

## The program (sequenced, model/effort per phase)

Platform stance is unchanged and settled: **GitHub Pages + Firebase free tier + GitHub Actions as
the compute layer** (issue-ops for on-demand generation). Native = PWA-first.

| Phase | Deliverable | Serves | Model / effort |
|-------|-------------|--------|----------------|
| **P0 · Verify roll-up** ✅ | `npm run verify` — one verdict + rubric scorecard over readiness+staleness+audit; the gate every later stage reuses | VERIFY | Fable / high (shipped) |
| **P1 · Intake unification** | One zod intake schema → issue form + scaffold + skill derive from it; no drift; phone-simple | INTAKE | Fable / high (schema is load-bearing) |
| **P2 · Orchestration + resumable generate** | One command chains scaffold→dual-pass→verify; checkpoint after A / B / reconcile so a cut-off headless run resumes | GENERATE | Fable / high (control flow + failure modes) |
| **P3 · Recert / self-freshening** | Scheduled Action: stale facts → dual-pass re-research → freshness PR; verify gate blocks merge | REFRESH · dynamic #1 | Fable / high |
| **P4 · PR scorecard + graduate-on-evidence** | verify `--json` rendered as a PR comment; graduate gate consumes it | PUBLISH | Sonnet / medium |
| **R3 · Dynamic runtime** | View Transitions, live-data tiles, offline/connection state machine, per-view (Focus Today / what's-open-now / weather day-swap) | dynamic #2 + #3 | Fable designs; Sonnet implements |
| **R4 · Per-country visual identity** | Build-time country skin (palette from the guide's own imagery), one signature motion set, motion-doctrine doc | goals 8/9 | Fable spec; Sonnet implements |
| **R5 · Tool suite by demand** | Top-3 tools ranked by telemetry + post-mortems (visa/packing/phrase-cards/spend-export/golden-hour); cull below-median | goal 7 | Sonnet / Haiku |
| **R6 · App-ready distribution** | PWA manifest/icons/splash hardening, install prompt, iOS meta; optional TWA | goal 10 | Haiku / Sonnet |

**Sequencing:** P0→P1→P2→P3→P4 first (that is the "infrastructure and pipelines before Guide #3"
the creator asked for), then R3→R4→R5→R6. R3/R4 are independent of the pipeline phases and can
interleave if a trip deadline appears. Guide #3 is built *after* P0–P4 land, as the first real
end-to-end proof of the finished pipeline.

**Per-session rule:** open with the phase's measurables, close with the Ship Loop. Use Fable/high
where judgment concentrates (schema design, control flow, recert); Sonnet as the default executor;
Haiku for sweeps and assets.

---

## What "done" means for the pipeline (exit criteria)

- Filing a trip reaches a corroborated, authentic, verify-PASSing **draft PR** with minimal human
  toil, and the human's remaining job is the rubric's HUMAN rows + graduation — nothing mechanical.
- A **published** guide cannot silently rot: recert opens a freshness PR before facts mislead a
  traveler.
- No stage depends on remembering to run a separate script: one intake, one generate, one verify,
  one graduate, one recert — each a named command and a workflow.
- Every guide, current and future, inherits all of it, because the machinery lives at the
  pipeline/skill level, not per-guide.
