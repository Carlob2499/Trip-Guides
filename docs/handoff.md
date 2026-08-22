# HANDOFF — current operational state

> This file is the human-readable handoff. Only the bounded block between the warm-start
> markers is auto-injected by `scripts/handoff-head.mjs`; deeper history is read on demand.

<!-- WARM_START_BEGIN -->
WAYPOINT / Trip-Guides — CURRENT STATE
Pipeline V2 is reliability-blocked, not accepted for production.
Merged hardening PRs: #68, #70, #72, #73.
Canaries: Malta RED; Luxembourg RED; Portugal CANARY_RED (#74, run portugal-20260822-7c041e).
Portugal: Pass A complete; Pass B complete; reconcile failed twice; publication=false; landing pending. DO NOT RESUME it during reliability repair.
Standing hazard: Claude's embedded browser can crash on login/CAPTCHA/Cloudflare verification — never attempt one; interactive Remote Control can lose the local bridge (`computer_unreachable`).
Repaired on `fix/v2-reliability-hardening` (PR open, UNMERGED, unproven in production): agent exit integrity (`| tee` no longer masks a nonzero Claude process); partial output can no longer enter the success path; invalid artifacts classify as `gate-failure`, never `agent-failure`; retry eligibility now reads durable run state; a stopped run escalates visibly. Caps unchanged (5 attempts, 1 auto-retry).
Safety: keep V1 intact; keep the V2 selector rolled back unless explicitly re-authorized; do not start Canary #4 yet; do not delete evidence branches.
Current engineering branch: `fix/v2-reliability-hardening`.
Next: review the reliability PR, merge it, then run a FRESH Canary #4 only after acceptance.
Deep context: `CONTEXT.md`, `docs/reference/pipeline.md`, `docs/pipeline v2/IMPLEMENTATION_STATE.md`.
<!-- WARM_START_END -->

## Current reliability findings

### Interactive Claude / Remote Control

- Control-plane evidence recorded repeated `computer_unreachable` events on local bridge-backed
  Claude Code sessions. That proves reachability loss, not that the physical computer itself
  crashed.
- A reproducible local trigger is now known: opening a site such as Kuromon in Claude's embedded
  browser and entering login/security-verification/Cloudflare challenge flow can immediately crash
  the program. Treat those flows as an environment hazard, not a research obligation.
- Interactive research must never attempt CAPTCHA, Turnstile, MFA, login, or security-verification
  challenges in Claude's embedded browser. Mark the origin blocked and use another legitimate
  source or leave the claim unverified.

### Headless GitHub Actions Claude

- The production research plane remains Claude Code running headlessly in GitHub Actions.
- Portugal showed a separate failure: reconcile printed `You've hit your session limit` while the
  workflow step still appeared successful because the Claude/docker command was piped through
  `tee` without preserving the producer's exit status.
- That allowed collection/verification to inspect partial output and obscured the real failure
  class.
- **Repaired (unmerged).** All four agent invocations run through `scripts/run-logged-command.sh`,
  so the step observes the Claude process and not `tee`, while `agent-output.log` still holds the
  complete combined output. The collect/verify steps are gated on the agent having returned
  cleanly, so a partial workspace can no longer be verified into a misleading content-gate story;
  the `always()` control-plane checkout and the failure record still run (and now install their
  own dependencies — a path that was unreachable while the agent step could not fail).

### Pipeline recovery

- Repairable deterministic failures did not reliably self-dispatch: the auto-retry wiring was
  centered on the `void` step output, which an ordinary deterministic gate failure never sets.
- Failure classification conflated planes: invalid-but-dirty model output could be labeled
  `agent-failure`, which asserts a failed model process.
- **Repaired (unmerged).** Classification now follows the plane: `finish-stage` judges output from
  a process that RETURNED, so it says `void-run` or `gate-failure` and never `agent-failure`; the
  process plane is classified once, in `scripts/pipeline/v2/recovery.mjs`, from the step
  conclusion plus the CLI's own printed diagnostic. Retry eligibility is read from `run.v2.json`
  — an auto-retryable class, actionable findings for the same runId/stage, and room in both
  budgets — and a repair re-dispatch resumes the same runId with completed stages skipped.
  Anything else stops and escalates visibly (Actions error + one deduped issue comment).
- Retries were NOT made broader and the authorized caps are untouched (5 attempts, 1 auto-retry).
- Still unproven in production: none of this has run in a live Actions job. Canary #4 is the
  proof, and it stays unstarted until the PR is reviewed and merged.

## Canary evidence to preserve

- **Malta** — Canary #1, stale reusable-workflow checkout defect. Historical RED evidence.
- **Luxembourg** — Canary #2, gate-feedback/palette defects and manual convergence history.
  Historical RED evidence.
- **Portugal** — Canary #3, issue #74, run `portugal-20260822-7c041e`, branch
  `research-v2/portugal`. Preserve exactly as failure evidence; do not convert it into the green
  acceptance run.

## Operating rules for the repair

- No Portugal resume while reliability code is under review.
- No fresh canary until the reliability PR(s) are reviewed and merged.
- V1 remains the rollback/default path.
- Do not delete canary or research evidence branches during this repair.
- Keep fixes reviewable. Separate runtime/continuity fixes from larger product or cleanup work.
- Every claim about a crash must name its execution plane: interactive bridge/browser vs. headless
  GitHub Actions research agent.

## Where we left off

The reliability repair is complete on `fix/v2-reliability-hardening` and open as ONE review PR
against `main`. Nothing is merged, no research was dispatched, Portugal is untouched, Canary #4 is
unstarted, V1 is intact and the V2 selector stays rolled back.

Recommended next step: review the PR (the failure-class and retry-eligibility matrices are in its
body), merge it, and only then start a FRESH Canary #4 on a new slug — never by resuming Portugal,
which stays as CANARY_RED evidence.

## Where to read more

- `CONTEXT.md` — durable project decisions/history, on demand only.
- `docs/reference/pipeline.md` — product pipeline architecture.
- `docs/pipeline v2/IMPLEMENTATION_STATE.md` — detailed V2 build/canary record.
- `.claude/skills/waypoint-guide-author/references/research-efficiency.md` — interactive research
  and source-access rules.
