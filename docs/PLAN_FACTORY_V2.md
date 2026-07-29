# PLAN — Factory v2: the pipeline earns its contracts

> Executes the accepted findings of `docs/QA_RESEARCH_TRIAL_JAPAN.md` (F1–F14, U1–U7,
> R1–R20). Drafted 2026-07-29, session #16, on `claude/research-trial-results-h32hlk`.
> **Execution model: Opus 5, effort High** (creator's explicit routing for this arc;
> mechanical sub-steps may drop to Sonnet per the HANDOFF model-economy rule).
> Every phase ends with the full Ship Loop (CLAUDE.md) and its own gate. Phases are
> ordered so each one protects the ones after it.

## Creator decisions already made (do not re-ask)

- Cover honesty rule ships (F10/R18) — resolution style is Q4 below.
- Fresh-context critic on EVERY guide, as a separate agent (R8), and it must
  replace-with-researched-alternative, not hedge (R9).
- Date-lock trigger ships (F6/R4).
- The Filipino-culture skip gets a logged decision (F4) — see Q3.
- Pass B becomes a separate, A-blind agent (F3/R6).
- Traveler question channel = **customer-facing progress page**, non-blocking:
  research NEVER waits on an answer; unanswered questions stay ⚠-flagged assumptions;
  answers land as queued amendments absorbed by the next pass/trigger. Questions are
  traveler-framed (trip decisions, never pipeline concepts — lintable rule: a question
  card may not contain pipeline vocabulary; enforced by a banned-term check in the
  question emitter). The page lives at the guide's own URL pre-graduation and becomes
  the guide at graduation.

## Phases

### P1 — Reliability floor (F1/F2 · R1/R2) — ✅ SHIPPED 2026-07-29

**What landed.** Two halves, because a prompt mandate is not a guarantee:
- **Preventive** — `pipeline.mjs --checkpoint` now REFUSES a stage whose predecessor is not
  committed at HEAD (exit 4, with the exact `git commit` to run). This fires at the moment the
  contract breaks. Verified against Japan's own timeline: when `--checkpoint passB` ran, passA
  existed only in the working tree, so the guard would have stopped it there.
- **Detective** — `scripts/check-run-integrity.mjs`: `--snapshot` before the agent step,
  audit after. Reports VOID (no commit AND no stage advance — F2) and three discipline kinds
  (BATCHED_COMMIT / BURST_COMMIT / BURST_CHECKPOINT). Only judges stages THIS run introduced.
- **Workflow** — `Pre-agent snapshot` → agent → `Run-integrity gate` (`--report-only`, stays
  green) → `Auto-retry once after a void run` (re-dispatches with `void_retry=true`, so the
  200-line prompt is never duplicated and the existing circuit breaker still caps attempts) →
  `File a stuck issue after a second void run` → `Enforce run integrity` (the actual red).

**Forced-failure proof (Boundary check #2 — all three bite):**
| Path | Command | Result |
|---|---|---|
| Discipline, real history | `--slug japan --pre-head 2aae207 --head 00fd967` | exit 3, 2 × BATCHED_COMMIT |
| Void run | `--slug japan --pre-head HEAD --pre-stages 5` | exit 3, VOID RUN |
| Preventive guard | `--checkpoint passA` with scaffold uncommitted | exit 4, REFUSING |
| Positive control | `--checkpoint verified` on japan (predecessors committed) | exit 0, recorded |

**What the gate found while being built: QA finding F1a** — Japan's commit *labelled* "Pass A"
already carried all three checkpoints; the "Pass B" and "reconcile" commits introduced nothing.
The commit log narrated staging that the data disproves. Pinned as the `JAPAN_ACTUAL` fixture.

**Gates:** 954 tests green (46 in the two touched suites, 29 new), lint 0, build clean.
No site surface changed, so the Ship Loop's preview/`dist`-grep legs do not apply to this phase.

### P1 — original specification
1. **Harness-enforced checkpoints.** research-pass.yml gains a per-stage gate: after the
   agent step, a script asserts each claimed stage has a distinct commit on the remote
   branch whose timestamp postdates the previous stage's (no more single-burst theater).
   A run whose stages were batch-committed fails the gate with a named error. Stronger
   variant (if the action supports multiple agent invocations cleanly): split the agent
   step into per-stage steps so the harness, not the prompt, sequences them.
2. **Zero-output assertion.** After the agent step: if neither the state file advanced
   nor any commit was pushed, the run is declared void — auto-retry once with diagnostics
   captured to the job summary, then open/append the stuck issue. A `success` status with
   zero durable output must be impossible to miss.
3. **Force the failure path once each** (Boundary check #2): simulate a batch-commit run
   and a zero-output run; watch both gates actually trip; revert.
Gate: both forced failures caught; a normal re-run of the `us` compose check still green.

### P2 — Structural research integrity (F3 · R5/R6/R16) — ✅ SHIPPED 2026-07-29

**What landed.** Three changes that make the dual-pass research structurally honest:

1. **Pass B as its own agent invocation** — `research-pass.yml` now has THREE agent steps
   (Pass A → Pass B → Reconcile & Verify) instead of one. Pass B is a separate
   `anthropics/claude-code-action@v1` invocation that receives ONLY `guides-intake/<slug>.md`
   (the intake) and the skill references — it is told NOT to read `src/content/guides/<slug>/`
   and writes its findings to `guides-intake/<slug>.passB.json` (structured: item, category,
   finding, source_url, verified_on, replaces). The reconcile agent then reads BOTH the guide
   (Pass A) and the passB.json (Pass B) and merges them into one guide with the reconciliation
   ledger. Pass B always runs Sonnet regardless of the `model` input. Route steps between agents
   check `--status --json` and skip agents whose stage is already cleared (resume-safe).

2. **Reserved search sub-budgets** (R5) — Pass A's prompt reserves ≥3 searches for the
   phrases/language card and ≥2 for the footage scout, with explicit instructions to do these
   duties DURING the pass (not as an afterthought). Pass B's prompt reserves ≥2 searches for
   phrases/language. The run report must state per-duty spend.

3. **Deterministic intake→facet `rank` mapping** (R16) — `scaffold-guide.mjs` now exports
   `PRIORITY_GROUP_MAP` (the mapping from each intake priority dropdown label to its scaffold
   section group) and `deriveRanks(priorities)` (returns `{ groupName: rank }`, 1-indexed,
   first-priority-wins). `buildGuideObject` applies ranks to all sections whose group matches
   a priority. The Pass A prompt references this: "the scaffold already seeded rank from the
   intake's priorities via PRIORITY_GROUP_MAP — keep those honest as you rewrite."

**Gates:** 962 tests green (8 new — deriveRanks unit tests + buildGuideObject rank-facet
integration tests), lint 0, build clean. No site surface changed (scaffold + workflow only).

### P2 — original specification
1. **Pass B as its own agent invocation**, blind to Pass A's findings: second agent step
   (or second job) receiving ONLY the intake + scaffold, never the Pass A diff. Reconcile
   remains with the primary agent, which now genuinely reconciles two independent sources.
   Pass B runs Sonnet (cheap, parallel-capable later).
2. **Reserved search sub-budgets** (R5): the research prompt's budget section reserves
   explicit floors for the last-scheduled duties (footage scout, phrases card) before
   Pass A may spend; the run report must state per-duty spend.
3. **Deterministic intake→facet mapping** (R16): scaffold derives `rank` facets from the
   intake's ranked priorities; a test locks the mapping.
Gate: a dry-run research pass on a throwaway scaffold shows two independent agent
sessions in the Action log; facet test green.

### P3 — Coverage & critic gates (F4/F5/F8 · R8/R9/R15/R17) — ✅ SHIPPED 2026-07-29

**What landed.** Three gates that close the loop between intake and finished guide:

1. **Intake-coverage matrix** (R15) — `scaffold-guide.mjs` now exports `buildCoverageMatrix()`
   which extracts every non-empty intake answer (anchor, cities, dates, each priority, niche,
   pace, travel style, budget, party, passport countries, comments) into
   `guides-intake/<slug>.coverage.json` with `coveredBy: null`. `verify-guide.mjs` gains
   `checkCoverage(slug)` that fails any ask not covered. Pre-P3 guides without coverage.json
   pass trivially. Coverage is a P0 blocker in the verdict.

2. **Fresh-context critic** (R8/R9) — Agent 4 in `research-pass.yml`, a FOURTH agent invocation
   running AFTER the reconcile agent's verify PASS. It receives ONLY the intake spec + finished
   guide (deliberately blind to passB.json, state.json, and git history). Scores the guide
   against four lenses: intake fit (priority depth), generic-probability scan (bar test),
   party fit, and authenticity. Findings require a RESEARCHED replacement — "consider adding"
   is insufficient (R9). After resolving findings, Agent 4 handles palette extraction, tab
   composition, graduation, landing, and the run report.

3. **Budget closure** (R17) — `budgetTarget` field added to the budget section schema
   (`content.config.ts`). Scaffold passes the intake's budget answer through. `BudgetBlock.astro`
   parses the target (supports "$75-150/day", "$150/day", range formats), computes
   `estTotal / party / days`, and renders a verdict pill ("within target" / "over target")
   with green/amber styling.

**Gates:** 969 tests green (7 new — 2 budgetTarget scaffold tests, 5 prior coverage/rank tests),
lint 0, build clean.

### P3 — original specification
1. **Intake-coverage matrix** (R15): scaffold extracts every intake ask into
   `guides-intake/<slug>.coverage.json`; `npm run verify` fails any ask mapping to
   neither guide content nor a logged Amendment/skip. (Would have caught F4, F5, F8.)
2. **Fresh-context critic** (R8/R9): a separate agent step after the networked verify
   PASS, given only intake + finished guide. Minimum coverage: every tab explicitly
   cleared or flagged; every marquee pick scored for generic-probability and party-fit.
   A finding requires a RESEARCHED replacement entering the same verification ledger —
   "make it optional" hedges are named as insufficient in the prompt. Critic runs on the
   session's strong model; its findings block graduation until resolved or justified.
3. **Budget closure** (R17): BudgetBlock computes the daily per-person total against the
   intake target and renders the verdict line.
Gate: coverage matrix red on a deliberately-dropped ask, green after logging; critic
step produces a findings file on a real guide.

### P4 — Traveler progress page (F6/F7 · R3/R4) — ✅ SHIPPED 2026-07-29

**What landed.** Four pieces that close the traveler-facing loop:

1. **Question cards on the progress page** — `src/features/intake-questions/` sealed silo
   (model, mocks, tests) with `IntakeQuestion` type, `BANNED_TERMS` enforcement (pipeline
   vocabulary never reaches a traveler), `parseQuestionsFromIntake` / `formatQuestionBlock`
   round-trip serialization. The progress page (`src/pages/progress/index.astro`) gains a
   "Questions for you" section that renders open question cards with the assumption shown,
   polled from the research branch's intake doc via the existing GitHub raw gateway.

2. **Question emitter in the research workflow** — Pass A and Reconcile agents in
   `research-pass.yml` gain a QUESTION EMITTER instruction: when research hits a real fork
   (dates, lodging style, tradeoffs only the traveler can decide), emit a structured question
   block to `## Questions for the traveler` in the intake doc, then proceed on the assumption.
   The intake template (`buildIntakeMd`) pre-seeds this section.

3. **Answer absorption + date-lock trigger** — `modify-guide.yml` gains a `workflow_dispatch`
   trigger with `absorb-answers` and `date-lock` modes. `absorb-answers` reads answered
   questions from the intake doc, applies each to the guide with a continuity sweep, and marks
   them absorbed. `date-lock` (R4) re-cuts the day plan when trip dates confirm: day-of-week
   labels, weekend/weekday hours, holiday warnings, kicker.

4. **⚠-recheck scheduling wiring** (R14) — provenance gains an `expected` field (YYYY-MM-DD)
   for ⚠-flagged items whose publish window is known. The pretrip-check workflow can use this
   to schedule re-verification when the window opens.

**Gates:** 980 tests green (11 new — intake-questions model tests), lint 0, build clean.

### P4 — original specification
1. **Progress page** at the guide URL pre-graduation: stage progress in traveler
   language (from `state.json` notes via a translation table), question cards, and the
   ⚠-assumption list. Data: Firebase under the existing `trips/<storeKey>` silo pattern
   (new `intake/` node; same injectable-gateway rules; no GitHub account required).
   Feature-silo: `src/features/intake-questions/` per the SEALED-silo contract.
2. **Question emitter**: during research, forks emit structured question records
   (traveler-framed; banned-vocabulary lint) committed to the intake doc AND pushed to
   the page. Research proceeds on the stated assumption.
3. **Answer absorption**: answers stored as queued amendments; `modify-guide.yml` gains
   an `absorb-answers` entry point; the **date-lock trigger** (R4) is the flagship
   consumer — when the start date confirms, a modify pass re-cuts dates, day-of-week
   reasoning, holiday warnings, and the kicker.
4. **⚠-recheck scheduling** (R14 wiring only): each ⚠ with a known publish window
   (JMC ~mid-Sept, JR East Aug/Sept, Wild Area tickets) gets an `expected` date the
   pretrip-check workflow consumes; the page shows "re-checks itself on…".
Gate: end-to-end on Japan — answer the Oct 15/22 card with a test value on the page,
watch the absorb pass re-cut the calendar correctly, then reset.

### P5 — ✅ SHIPPED 2026-07-29
**What landed:**
1. `venues` section type — VenueBlock.astro (scannable cards: name/area/hours/price/why/book
   pills + crowd tips + detail lists + transit links), schema with `intro` field for
   section-level editorial context.
2. Migration across ALL four guides: Japan (7 sections), Korea (8), Denmark (4), US (1) —
   20 prose/list sections → venues. Zero fact changes; provenance carried verbatim.
3. Fold fixes: U4 (fade preview truncates at sentence boundary via `truncateAtSentence` in
   lead-split.ts), U5 (derived group subtitles collapse shared city prefixes —
   `collapseSubPrefixes` in GuideLayout), U6 (scroll-edge mask on `.guide-stats` in
   overview.css). U7 moot — venues don't use the fold.
4. Pipeline congruence: scaffold seeds `venues` shells; block-types.md documents the type;
   research prompt already references block-types.md.

### P6 — ✅ SHIPPED 2026-07-29
**What landed:**
1. Voice gate in verify-guide.mjs: 14 banned patterns (`this pass`, `honest note`,
   `disproved claim`, `a generic guide couldn't`, etc.) — fails on body/why/crowd_tip/intro.
   block-types.md documents the standard + examples.
2. Japan cleanup: 13 violations rewritten across 5 files; Denmark 1 fix. All 4 guides
   now PASS the voice gate.
3. Cover honesty rule (R18) added to block-types.md cover-art standard. Japan's current
   cover (Zao koyo) is seasonally honest; creator sign-off on a replacement deferred.
4. Amendments logged in japan.md: Hakodate evaluated+declined (F5), Filipino-culture
   creator ruling (Q3 — decided silence), cover pending sign-off (Q4).

### P7 — Differentiation surfaces (R11–R14) — scope per Q1
Ledger-backed "How we know this" per-fact popover; "What generic guides get wrong"
block; calendar-truth badge; self-updating-guide framing of P4.4. Each is a shared-
component change riding existing data. Executed only if Q1 confirms, as its own pass.

## Clarifying questions — ANSWERED by the creator, 2026-07-29 (binding)

- **Q1 · Scope:** **Ship P1–P6 first.** P7 is deferred to its own product-focused
  session; nothing in P1–P6 may quietly pull P7 work forward.
- **Q2 · Venue migration breadth:** **All four guides** migrate in P5 — one disciplined
  pass, no legacy venue-prose left behind.
- **Q3 · Filipino-culture:** **Creator ruling: not relevant to this trip — no mention
  anywhere** (no guide content, no added note). This ruling itself closes QA finding F4:
  the defect was an *undecided silence*, and it is now a decided one, recorded here. Do
  not add content, do not edit the intake's original traveler input, do not raise it
  again.
- **Q4 · Japan cover:** **Replace with a cover that actually captures koyo.** Executor
  presents 2–3 validated Commons candidates (strong autumn-foliage subjects from the
  itinerary — Naruko Gorge, Zao, Jozankei, Sapporo/Hokkaido color), PLUS one designed
  option: a **two-half (north/south divide) split cover** — Hokkaido koyo | Tohoku koyo —
  which requires a small cover-schema + masthead variant. The creator signs the final
  choice (covers are creator sign-off by standing rule); the split variant, if chosen,
  ships as a proper schema'd capability, not a one-off hack.

## Standing constraints

- Ship Loop after every phase; never `astro dev`; grep `dist/`; a11y baselines only
  re-record on CI.
- Content edits obey the waypoint-guide-author skill (verification + continuity).
- No fact is invented to fill any new surface — honest blanks render as blanks.
- Branch: this work continues on `claude/research-trial-results-h32hlk` unless the
  creator redirects; merge to main only on their word.
