# HANDOFF — current operational state

> This file is the human-readable handoff. Only the bounded block between the warm-start
> markers is auto-injected by `scripts/handoff-head.mjs`; deeper history is read on demand.

<!-- WARM_START_BEGIN -->
WAYPOINT / Trip-Guides — CURRENT STATE
Pipeline V2's reliability repair is MERGED (PR #75 → main `253607a`) and CI-green, but the repaired V2 research/recovery RUNTIME has not yet been exercised by a live Pipeline V2 research canary. Canary #4 is that proof and has not started.
Standing hazard: Claude's embedded browser can crash on login/CAPTCHA/Cloudflare verification — never attempt one; interactive Remote Control can lose the local bridge (`computer_unreachable`).
Canaries: Malta RED; Luxembourg RED; Portugal CANARY_RED (#74, run portugal-20260822-7c041e) — preserve all three as evidence. DO NOT resume Portugal; Canary #4 is a FRESH slug.
Merged repair: agent exit integrity (no `| tee` masking); partial output cannot enter the success path; failure classes name a plane (`finish-stage` never says `agent-failure`); retry eligibility reads durable run.v2.json; a stopped run escalates visibly. Caps unchanged (5 attempts, 1 auto-retry).
Safety: keep V1 intact; V2 selector still OFF (`WAYPOINT_RESEARCH_ENGINE` unset) — Canary #4 runs as a manual dispatch, which is always landMode=pr; do not delete evidence branches.
Next: start Canary #4 on a fresh slug and watch the four boundaries listed under "Before Canary #4" below.
Deep context: `CONTEXT.md`, `docs/reference/pipeline.md`, `docs/pipeline v2/IMPLEMENTATION_STATE.md`.
<!-- WARM_START_END -->

## Where we left off

The V2 reliability repair is **merged and closed out**. PR #75 (12 commits, 15 files) landed on
`main` as `253607a` after three Codex review rounds; the merged head was re-verified in place —
0 `tee`-wrapped invocations, 4 exit-integrity wrappers, `issues: write` on all four stage jobs,
4 cancellation-reachable escalations, 0 paths from `finish-stage` to `agent-failure` — with the
full gate green on the merged tree (2904 tests, build, lint, typecheck).

**What is NOT proven:** the repaired research/recovery runtime has never been exercised by a live
Pipeline V2 research canary. PR CI ran in Actions and is green — but CI runs the test suite, not
the research workflow. Every claim about the recovery path is unit-level or a wiring pin.

Recommended next step: **start Canary #4 on a fresh slug** (never by resuming Portugal) and treat
it as the boundary check the unit suite structurally cannot perform.

## Before Canary #4 — what to actually watch

The repair touches four seams where this code meets a system it does not control. Unit tests say
nothing about any of them, so watch these in the run's logs rather than assuming green means proven:

1. **The exit wrapper resolves.** Each agent step runs
   `bash "$GITHUB_WORKSPACE/scripts/run-logged-command.sh"`. Pass B's world is the recorded
   BASELINE commit — if a run's baseline predates `253607a`, that file is not in its tree.
   Canary #4's baseline is cut fresh from current main, so it will be there; a *resumed older
   run* is the case to watch.
2. **The escalation can actually comment.** B1's fix is the grant; the proof is one real
   `gh issue comment` from a stage job. Nothing has exercised it.
3. **The cancellation path completes in time.** B3 makes the retry decision and escalation
   reachable on cancellation, but that chain needs `npm ci` plus three node invocations inside
   GitHub's cancellation grace window. Reachable is proven; *finishing* is not. If a cancelled
   canary files no notice, this is the first suspect — and the fix is to make the escalate step
   cheaper, not to widen the conditions again.
4. **`gh` is authenticated where escalate runs.** It executes in `collect/` with
   `GH_TOKEN: github.token`. The Actions error prints *before* any `gh` call, so a gh failure
   still leaves a visible signal — confirm that ordering held.

Deliberately NOT auto-retryable, so expect a visible stop rather than a repair:
`usage-limit` · `agent-failure` · `cancelled` · `unknown` · missing findings · corrupt state ·
either budget exhausted.

## Canary evidence to preserve

- **Malta** — Canary #1, stale reusable-workflow checkout defect. Historical RED evidence.
- **Luxembourg** — Canary #2, gate-feedback/palette defects and manual convergence history.
  Historical RED evidence.
- **Portugal** — Canary #3, issue #74, run `portugal-20260822-7c041e`, branch
  `research-v2/portugal`. Preserve exactly as failure evidence; do not convert it into the green
  acceptance run.

## Standing operating rules

- V1 remains the rollback/default path; the V2 selector stays OFF until a canary is accepted.
- A manual `workflow_dispatch` is ALWAYS `landMode=pr` — a canary structurally cannot publish.
- Do not delete canary or research evidence branches.
- Every claim about a crash must name its execution plane: interactive bridge/browser, headless
  GitHub Actions research agent, or the deterministic control plane. They are never inferred
  from one another (`docs/reference/claude-research-runtime.md`).
- Interactive research must never attempt CAPTCHA, Turnstile, MFA, login, or security
  verification in Claude's embedded browser. Mark the origin blocked and use another source.

## A method note worth keeping

PR #75's first B1 regression **passed with its own fix deleted** — it was substring-matching the
comment explaining why the grant was needed, which itself contained `issues: write`. Every
workflow guard added since is verified by reverting its fix and confirming the test goes red. A
guard that has never failed is an assumption, not a test.

## Where to read more

- `CONTEXT.md` — durable project decisions/history, on demand only.
- `docs/reference/pipeline.md` — product pipeline architecture.
- `docs/reference/claude-research-runtime.md` — execution planes + the security-challenge rule.
- `docs/pipeline v2/IMPLEMENTATION_STATE.md` — detailed V2 build/canary record.
- `.claude/skills/waypoint-guide-author/references/research-efficiency.md` — interactive research
  and source-access rules.
