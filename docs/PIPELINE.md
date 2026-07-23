# The Waypoint Pipeline — end-state architecture & program

The north star for what this repo *is*: **a factory-with-a-maintenance-department for refined,
researched, creator-tailored travel guides — where creating a guide and keeping it fresh are both
nearly toil-free, and human effort is spent only where judgment genuinely lives.**

This doc is the durable plan future sessions execute against (it superseded the Jul-2026
adversarial-review roadmap, now removed — git history has it). It states the target, the gaps,
and the sequenced program
with model/effort per phase. Read it with `docs/GUIDE_RUBRIC.md` (the quality bar) and the
`waypoint-guide-author` skill (the research discipline).

---

## The lifecycle (the spine)

A guide is not a document; it is an object with a lifecycle. On the happy path — the automated
gates actually pass — every arrow is now automatic, PUBLISH included: an end-user files one
intake and the next thing they see is a live, published guide, no approval step in between.

```
   ┌─────────┐   ┌──────────┐   ┌─────────┐   ┌─────────┐   ┌────────┐   ┌─────────┐
   │ INTAKE  │──▶│ GENERATE │──▶│ VERIFY  │──▶│ PUBLISH │──▶│ LEARN  │──▶│ REFRESH │─┐
   └─────────┘   └──────────┘   └─────────┘   └─────────┘   └────────┘   └─────────┘ │
    one typed     dual-pass       one rolled    auto on      trip          scheduled  │
    intake, all   A+B →           -up gate +    verify        feedback →    recert:    │
    surfaces      reconcile       scorecard     PASS —       patterns →    stale facts│
    agree         (resumable)     (this phase)  no human     next intake   re-researched
                                                 on this                  → freshness PR
                                                 path
   REFRESH feeds back into VERIFY ─────────────────────────────────────────────────┘
```

**PUBLISH auto-resolves itself the moment VERIFY PASSes** — no diamond, no label, no human, per
the explicit "an end-user can input information and see a new guide without other input" goal.
It only becomes a human decision on the failure path: a guide that can't reach verify PASS lands
as a draft PR instead, and a human either fixes it or force-graduates it by hand via
`graduate-guide.yml` (the rescue path, see PUBLISH below). **retire/soft-delete** stays the one
diamond that is *always* human — nothing in the pipeline ever decides to un-publish a guide.

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
   The dead-link/photo gate only runs with `--network` (it makes real HTTP requests, so it's
   opt-in for local/offline runs) — both auto-publish paths (`research-pass.yml`'s final scorecard,
   `graduate-guide.yml`'s evidence gate) pass `--network` explicitly so a guide can never
   auto-publish with dead citations and a silent PASS. Budget the extra wall-clock: one HEAD check
   per citation, so a guide with ~40 cited URLs adds roughly 20-40s to that job.

4. **PUBLISH — graduate on evidence, automatically. Shipped (P4), auto-graduated (streamlining
   pass).** `npm run verify --markdown` renders the rubric scorecard (AUTO gates + HUMAN checklist)
   — that verdict is now the *entire* publish decision. The moment `research-pass.yml`'s
   self-correction loop reaches a full verify PASS, the SAME job calls
   `node scripts/graduate-guide.mjs --slug <slug>` to remove `draft: true` right there (no separate
   evidence run — the verify PASS the agent just confirmed **is** the evidence), then merges its
   own branch straight to `main` via `scripts/land-branch.sh` (shared with `modify-guide.yml`
   below). The guide is live on the very next Pages deploy. **No issue, no label, no human — this
   is the arrow the goal asked to make fully autonomous.**

   `graduate-guide.yml` still exists as the **manual override / rescue path**: a draft nominated
   via `graduate-request` + approved via `graduate-approved` (write access required) still gates on
   `npm run build` (schema) + `npm run verify` (research/recency), posts the scorecard to the issue
   either way, and commits only if the gate passes. It's for what auto-graduation can't reach: a
   draft finished/fixed by hand outside the pipeline, a pre-auto-graduation legacy guide, or a
   draft PR a human hand-fixed after a failed run and wants published without a full re-run.

   **The honest tradeoff, stated plainly:** rubric rows #6/#8/#9/#12 (anchor coverage, priority
   depth, party fit, authenticity) are HUMAN-judged rows the machine cannot pass/fail — they are
   still printed in every scorecard for visibility, but they no longer BLOCK publication. A guide
   that passes every automated gate goes live even if a human never glanced at those rows. This is
   a deliberate policy choice (the pipeline previously kept a human gate specifically so a wrong
   anchor date or a generic-AI-shaped guide got caught before featuring it), traded off in favor of
   the explicit "no other input" requirement. The mitigation: `docs/TRAVELER_PATTERNS.md` +
   the Learnings loop still catch a bad party-fit call after the fact, and `modify-guide.yml` fixes
   it without re-running the whole pipeline. A run that can't reach PASS (or hits a merge conflict
   after graduating) falls back to a draft PR for human triage instead of losing the work.

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

## Shipped since — the W-series (2026-07-23)

A skill-loop optimization arc that closed the remaining manual seams. Each ends the arc's own Ship
Loop (build + test + typecheck green); all inert-until-configured pieces degrade gracefully.

- **INTAKE — zero-click option (W5).** A Cloudflare Worker (`worker/`, deployed by
  `deploy-worker.yml`, config-gated by `src/features/hub/intake-proxy-config.js`) files the
  `new-guide` issue FOR an anonymous visitor — no GitHub account, no click — validating with the
  same intake schema and rate-limiting anonymous submissions (Turnstile + per-IP cap). The site
  stays on Pages; the wizard falls back to the prefilled-issue path when the proxy is off. Booking
  upload now also parses **PDFs** client-side (W4, `pdf-text.ts`), still never uploading the file.
- **LEARN — automated (W2).** `feedback-export.yml` + `scripts/export-feedback.mjs` read new trip
  feedback via a read-only service account and draft the synthesis (`learnings/<slug>.md` + the
  public `learnings` block + party-scoped `TRAVELER_PATTERNS.md` deltas) as a **review PR** — the
  maker edits, no longer types. Freeform stays summarized-only, never verbatim; the sync marker
  (`learnings/.sync.json`) advances only on merge.
- **REFRESH — pre-trip auto-dispatch (W1).** `pretrip-check.ts` now dispatches `recert.yml` for any
  T-7 guide with real stale facts (deduped, `AUTO_DISPATCH`-gated) — the daily granularity recert's
  weekly sweep lacked, so a guide can't reach departure on facts that went stale between Mondays.
  recert still opens a human-reviewed freshness PR.
- **IMPROVE — the self-improvement loop (W3).** Every research/recert run appends a report to a
  pinned **run-ledger** issue (`append-run-report.mjs`); a monthly **skill-retro** agent proposes
  evidence-cited skill edits as a review PR; and **`skill-evals.yml`** runs the skill's evals on any
  `.claude/skills/**` PR (`run-skill-evals.mjs` — deterministic gate + Haiku judge), so a skill edit
  can't regress the guide-authoring quality unnoticed.
- **Hardening (W0).** Token-expiry canary (`token-canary.yml` — the agent pipeline's silent SPOF),
  modify-guide `section`-field injection sanitization, and the flaky screenshot-diff gate removed in
  favor of a slim reliable a11y gate (`a11y.yml`).

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
| **P4 · Graduate on evidence, auto** ✅ | `npm run verify --markdown` scorecard; `research-pass.yml` auto-graduates (`graduate-guide.mjs --slug`) the moment verify PASSes — no human step on the happy path; `graduate-guide.yml` demoted to a manual-override/rescue path, still gates on build + verify + blocks a failing draft | PUBLISH | Fable / high (shipped) |
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

- Filing a trip reaches a corroborated, authentic, verify-PASSing guide **merged, published, and
  live** with **zero human action** on the happy path — no label, no approval, no remaining job.
  (A run that can't reach PASS still lands as a draft PR for a human to fix or force-graduate — the
  toil floor, not the common case.)
- The end-user sees **tangible progress while it runs**: a live progress view (elapsed timer +
  per-stage checklist — scaffold → Pass A → Pass B → reconcile → verify → published) sourced from
  the same git-tracked checkpoint state the pipeline already writes, so there is nothing to build
  or maintain twice.
- A **published** guide cannot silently rot: recert opens a freshness PR before facts mislead a
  traveler.
- A wrong fact on any guide — draft or published — is one issue + one label away from a scoped fix,
  without re-running the whole research pass.
- No stage depends on remembering to run a separate script: one intake, one generate (now
  self-starting), one verify, one auto-graduate (manual `graduate-guide.yml` only as a rescue
  path), one recert, one modify — each a named command and a workflow.
- Every guide, current and future, inherits all of it, because the machinery lives at the
  pipeline/skill level, not per-guide.
