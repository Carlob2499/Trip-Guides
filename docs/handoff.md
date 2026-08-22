# HANDOFF — current operational state

> This file is the human-readable handoff. Only the bounded block between the warm-start
> markers is auto-injected by `scripts/handoff-head.mjs`; deeper history is read on demand.

<!-- WARM_START_BEGIN -->
WAYPOINT / Trip-Guides — CURRENT STATE
Pipeline V2 is reliability-blocked, not accepted for production.
Merged hardening PRs: #68, #70, #72, #73.
Canaries: Malta RED; Luxembourg RED; Portugal CANARY_RED (#74, run portugal-20260822-7c041e).
Portugal: Pass A complete; Pass B complete; reconcile failed twice; publication=false; landing pending. DO NOT RESUME it during reliability repair.
Confirmed reliability defects: interactive Remote Control can lose the local bridge (`computer_unreachable`); Claude's embedded browser can crash on login/CAPTCHA/Cloudflare security verification; a headless Claude research invocation hit a session limit while `| tee` masked the command failure; ordinary repairable V2 failures do not autonomously redispatch; prior warm-start output was oversized/stale.
Safety: keep V1 intact; keep the V2 selector rolled back unless explicitly re-authorized; do not start Canary #4 yet; do not delete evidence branches.
Current engineering branch: `fix/v2-reliability-hardening`.
Next: review/finish reliability hardening, then run a FRESH Canary #4 only after acceptance.
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
  class. Agent exit integrity must be fixed before another production research run.

### Pipeline recovery

- Repairable deterministic failures currently do not reliably self-dispatch. Existing auto-retry
  wiring is centered on the `void` output path.
- Failure classification also needs separation: invalid-but-dirty model output is currently
  capable of being labeled `agent-failure`, conflating model-process failure with deterministic
  contract rejection.
- Do not make retries broader until those semantics are corrected and tested fail-closed.

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

## Where to read more

- `CONTEXT.md` — durable project decisions/history, on demand only.
- `docs/reference/pipeline.md` — product pipeline architecture.
- `docs/pipeline v2/IMPLEMENTATION_STATE.md` — detailed V2 build/canary record.
- `.claude/skills/waypoint-guide-author/references/research-efficiency.md` — interactive research
  and source-access rules.
