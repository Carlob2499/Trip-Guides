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

2. **GENERATE — dual-pass, resumable, auto-chained.** Pass A canonical/verified, Pass B local/
   authentic/crowd-aware, reconciled into one guide with a reconciliation ledger (shipped).
   **Resumability shipped (P2):** a git-tracked checkpoint (`guides-intake/<slug>.state.json`,
   managed by `scripts/pipeline.mjs`) records the stages `scaffold → passA → passB → reconcile →
   verified`; the scaffolder clears `scaffold`, the research agent clears the rest and commits
   after each, and `research-pass.yml` resumes the `research/<slug>` branch — so a run cut off by
   a wall-clock/usage limit picks up at the next un-done stage (`npm run pipeline -- --slug <slug>
   --status`) instead of restarting. **Auto-chained + circuit-broken (streamlining pass):**
   `new-guide.yml` dispatches `research-pass.yml` itself the moment a scaffold commits — filing
   the New-guide issue is the only manual step to start a guide. Each run bumps a persisted
   attempt counter before spending agent tokens; past 5 attempts without reaching `verified`, the
   workflow stops and files a `stuck` issue instead of silently resuming forever. The research
   stages stay judgment work, so the "chainer" is the research-pass Action / an interactive
   session; `pipeline.mjs` is the resumable spine + attempt budget it runs against.

3. **VERIFY — one rolled-up gate + scorecard.** `npm run verify` rolls readiness (research),
   staleness (recency), and the audit suite (links/photos) into ONE verdict plus a
   `GUIDE_RUBRIC`-shaped scorecard: AUTO rows the machine passes/fails, HUMAN rows the graduating
   reviewer checks. **Shipped this phase.** Schema stays the `npm run build` gate, called alongside.

4. **PUBLISH — graduate on evidence. Shipped (P4).** `graduate-guide` flips draft→published (a
   human decision — nomination is open, approval needs write access). `npm run verify --markdown`
   renders the rubric scorecard (AUTO gates + HUMAN checklist); `graduate-guide.yml` now flips in the
   working tree, **gates on `npm run build` (schema) + `npm run verify` (research/recency)**, posts
   the scorecard to the issue either way, and commits only if the gate passes — a failing draft can't
   graduate on a rubber stamp, and the issue stays open with the evidence. The research/recert PRs
   embed the same `--markdown` scorecard, so the reviewer sees the evidence before nominating.
   **The nomination is now filed automatically too (streamlining pass):** when a `research-pass.yml`
   run reaches a full verify PASS, it merges its own branch to `main` (via `scripts/land-branch.sh`,
   shared with the new `modify-guide.yml` edit flow below) and immediately opens the
   `graduate-request` issue itself — the human's only remaining action, if the guide should be
   featured, is applying `graduate-approved`. This is the ONE deliberately-kept manual checkpoint
   in the whole pipeline: the mechanical gates can't judge rubric rows #6/#8/#9/#12 (anchor
   coverage, priority depth, party fit, authenticity), so a confidently-wrong fact still needs a
   human glance before it reaches the curated grid. A run that can't reach PASS (or hits a merge
   conflict) falls back to a draft PR for human triage instead of losing the work.

5. **EDIT — a scoped fix, not a full research pass.** `modify-guide.yml` handles "this one fact is
   wrong" without re-running Pass A/B: file a "Request a change" issue (a **✎ Request a change**
   button lives on every guide page, draft or published, next to the graduation-nomination link on
   drafts), the owner applies `modify-approved`, and an agent in the guide-author skill's "Edit an
   existing guide" mode verifies the specific fact, runs the mandatory continuity sweep, and lands
   via the same `land-branch.sh` script — no graduate-request filing (an edit never changes
   draft/published status). Same public-repo safety shape as graduation: filing does nothing;
   only the owner's approval runs it.

6. **LEARN — the loop closes on the next intake.** Trip feedback → `learnings/<slug>.md` +
   `TRAVELER_PATTERNS.md` (shipped). Target: the post-mortem's party-pattern deltas are what the
   next intake's party selection reads, so each guide starts more personalized than the last.

7. **REFRESH — the maintenance department. Shipped (P3).** `recert.yml` runs on a weekly schedule
   (and on demand): a detect job lists EVERY currently-stale guide (`npm run recert --json`, built on
   `check-staleness`'s sweep of all non-draft guides), then a **matrix** runs one recert agent per
   stale guide — each re-verifies only the flagged facts against primary sources, re-dates or
   downgrades them, runs the continuity sweep + the verify gate, and opens an isolated **freshness
   PR** (`recert/<slug>`). Never auto-merges; a human reviews each (and may just close it for a
   concluded trip). This is the missing half of "dynamic": a *published* guide never silently rots
   (the MangoPlate class). Recert is separate from the GENERATE checkpoint spine — a published
   guide's freshness is recorded by its facts' `verified_on` dates, not by pipeline stages.

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
| **P1 · Intake unification** ✅ | `scripts/intake-schema.mjs` is the one source of truth (FIELDS + zod); the issue form, parser, and scaffold derive from it; a contract test fails CI on drift | INTAKE | Fable / high (shipped) |
| **P2 · Resumable generate** ✅ | `scripts/pipeline.mjs` checkpoint spine (`<slug>.state.json`, stages scaffold→passA→passB→reconcile→verified); research-pass resumes the branch + commits per stage; `npm run pipeline --status` | GENERATE | Fable / high (shipped) |
| **P3 · Recert / self-freshening** ✅ | `recert.yml` (weekly + on-demand): detect all stale guides → **matrix** → per-guide recert agent re-verifies flagged facts → freshness PR; `npm run recert` builds the work-list; verify gate must PASS | REFRESH · dynamic #1 | Fable / high (shipped) |
| **P4 · Graduate on evidence** ✅ | `npm run verify --markdown` scorecard; `graduate-guide.yml` gates on build + verify + posts it, blocks a failing draft; research/recert PRs embed it | PUBLISH | Fable / high (shipped) |
| **R3 · Dynamic runtime** | View Transitions, live-data tiles, offline/connection state machine, per-view (Focus Today / what's-open-now / weather day-swap) | dynamic #2 + #3 | Fable designs; Sonnet implements |
| **R4 · Per-country visual identity** | Build-time country skin (palette from the guide's own imagery), one signature motion set, motion-doctrine doc | goals 8/9 | Fable spec; Sonnet implements |
| **R5 · Tool suite by demand** | Top-3 tools ranked by telemetry + post-mortems (visa/packing/phrase-cards/spend-export/golden-hour); cull below-median | goal 7 | Sonnet / Haiku |
| **R6 · App-ready distribution** | PWA manifest/icons/splash hardening, install prompt, iOS meta; optional TWA | goal 10 | Haiku / Sonnet |

**Sequencing:** P0→P1→P2→P3→P4 first (that is the "infrastructure and pipelines before Guide #3"
the creator asked for), then R3→R4→R5→R6. R3/R4 are independent of the pipeline phases and can
interleave if a trip deadline appears. Guide #3 is built *after* P0–P4 land, as the first real
end-to-end proof of the finished pipeline.

**Per-session rule:** open with the phase's measurables, close with the Ship Loop.

### Model economy — the backbone runs on Claude Pro

The pipeline was *designed* on heavy models; it is *operated* on light ones. The steady state this
repo must sustain — indefinitely, on a **Claude Pro** plan — is:

| Work | Model | Why |
|---|---|---|
| Research passes (A + B), recert | **Sonnet** (workflow default, pinned via `claude_args`) | Verification is procedure-driven — the skill + gates carry the judgment |
| Contested reconcile / anchor calls | light **Opus** (explicit dispatch choice) | Rare, bounded judgment moments |
| Mechanical sweeps, formatting | Haiku / stay in Sonnet | — |
| Pipeline/skill/design changes | Fable/Opus, **separate sessions** | Design is one-time; operation is forever |

Guides are not numbered milestones — each is just the backbone exercising. What makes Pro
sufficient: **plan-mode first** (plan cheap, execute the plan), **checkpoint-often** (the P2 spine —
any session can stop at a stage and the next resumes, no re-research), and the **search budgets** in
the skill's `references/research-efficiency.md` (scripts before web, direct-to-primary, batch by
venue, two rounds then ship/flag/omit — binding on every research agent, headless or interactive).

---

## What "done" means for the pipeline (exit criteria)

- Filing a trip reaches a corroborated, authentic, verify-PASSing guide **merged and live** in the
  drafts tier with minimal human toil, and the human's remaining job is the rubric's HUMAN rows +
  one label click to graduate — nothing mechanical. (A run that can't reach PASS still lands as a
  draft PR — the toil floor, not the common case.)
- A **published** guide cannot silently rot: recert opens a freshness PR before facts mislead a
  traveler.
- A wrong fact on any guide — draft or published — is one issue + one label away from a scoped fix,
  without re-running the whole research pass.
- No stage depends on remembering to run a separate script: one intake, one generate (now
  self-starting), one verify, one graduate, one recert, one modify — each a named command and a
  workflow.
- Every guide, current and future, inherits all of it, because the machinery lives at the
  pipeline/skill level, not per-guide.
