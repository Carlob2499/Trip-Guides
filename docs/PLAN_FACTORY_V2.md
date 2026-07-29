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

### P1 — Reliability floor (F1/F2 · R1/R2)
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

### P2 — Structural research integrity (F3 · R5/R6/R16)
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

### P3 — Coverage & critic gates (F4/F5/F8 · R8/R9/R15/R17)
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

### P4 — Traveler progress page (F6/F7 · R3/R4)
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

### P5 — Readability: the venue block (U-series · R20)
1. **`venues` section type**: items = name / area / address / phone / hours /
   closed / book (url|walk-in|call) / how / price band / crowd-tip / why (one line,
   voice-standard-compliant) + provenance. Rendered as scannable cards (mobile: single
   column; desktop: 2-up), consistent with sights.css patterns.
2. **Migrate** food + gaming (and other venue-carrying prose) across ALL four guides —
   content restructuring only, zero fact changes, every provenance field carried over
   verbatim; a diff-audit script asserts no fact string was lost or altered.
3. **Fold fixes**: U4 (fade ends at a sentence/paragraph boundary), U7 becomes moot for
   venues; U5 derived-subtitle prefix dedup at the derivation layer; U6 scroll-edge fade
   affordance on `.guide-stats`.
4. **Pipeline congruence**: scaffold seeds `venues` shells for food/shopping groups;
   research prompt + guide-author skill (block-types.md) teach emission; generator
   template updated. (CLAUDE.md: new guides inherit everything.)
Gate: Ship Loop with screenshots at 375/1280, light+dark, reduced-motion; the
fact-preservation diff-audit green; a11y green.

### P6 — Voice gate + Japan remediation (F9/F10/F14 · R10/R18 + Q3/Q4)
1. **Voice standard addition** (block-types.md): banned in traveler-facing prose —
   "this pass", "this research", "honest note/call-out" as a framing device,
   self-referential quality claims ("a generic guide couldn't…"). Provenance lives in
   flags/fields only. Enforced by a verify grep gate.
2. **Japan cleanup pass** under the new gate: rewrite the 22 offending strings; facts
   untouched; ⚠/verified_on carry the provenance the prose used to narrate.
3. **Cover honesty rule** (R18) in the cover-art standard + apply to Japan per Q4.
4. **Log the Filipino-culture decision** per Q3; evaluate Hakodate per Q2's answer,
   as an Amendment either way.
Gate: voice grep green repo-wide; Japan recert-level verify PASS after edits.

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
