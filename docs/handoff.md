# HANDOFF — current operational state

> Human-readable warm start for the next engineering session. Deep history lives in `CONTEXT.md` and the Pipeline V2 implementation records; this file stays deliberately current and compact.

<!-- WARM_START_BEGIN -->
WAYPOINT / Trip-Guides — CURRENT STATE (2026-08-23)
Pipeline V2 reliability repair is MERGED and Canary #4 (`uruguay-20260823-9789de`) completed the draft product path GREEN. Uruguay remains `draft: true`, `publication: false`, `landMode: pr`; it is evidence, not production content.
Canary #4 proved the fresh-run exit wrapper and normal recovery path, including real gate failures and bounded retry authority. Two live failure-only seams remain unproven by that run: a real escalation issue comment / `gh` path (no intake issue existed) and the cancellation grace-window chain (no cancellation occurred). Do not claim those as proven.
V1 remains intact and is still the default/rollback path while `WAYPOINT_RESEARCH_ENGINE` is unset. Manual V2 dispatches remain structurally draft-only; production cutover is a separate decision.
The reciprocal Claude↔Codex watcher now uses a job-level trust boundary: read-only validation and write-capable publication are separate jobs. Treat that boundary as security-critical.
Current engineering surface: draft cleanup PR #80 (`cleanup/grand-pass-2026-08-23`) is reconciling repo truth, CI/invariants, ownership docs, performance/offline/security seams, and repeated review/debug passes. Do not merge it merely because an early CI run is green.
Next product work after cleanup: prepare/execute the distinct V01–V05 validation risk classes, prove the two remaining live failure-only reliability seams when a safe targeted exercise can do so, then proceed toward cutover only on evidence.
Deep context: `CONTEXT.md`, `docs/reference/pipeline.md`, `docs/pipeline v2/IMPLEMENTATION_STATE.md`, `docs/pipeline v2/SEPTEMBER_TRACKER.md`.
<!-- WARM_START_END -->

## Accepted evidence to preserve

### Canary history

- **Malta — RED.** Historical Canary #1; preserve as failure evidence.
- **Luxembourg — RED.** Historical Canary #2; preserve as failure/convergence evidence.
- **Portugal — RED.** Canary #3, issue #74, run `portugal-20260822-7c041e`; exposed the reliability defect class fixed by PR #75. Never convert it into the accepted green run.
- **Uruguay — GREEN draft product path.** Canary #4, run `uruguay-20260823-9789de`, branch `research-v2/uruguay`, draft guide. Pass A/B first try; Reconcile attempt 4 after three real gate failures with findings converging 5→2→0 blocking; bounded auto-retry consumed once then correctly refused; Critic first try at Opus/high; landing gate passed. It did not publish.

Do not delete canary/research evidence branches merely to make the repository look cleaner.

## Reliability boundary truth

PR #75 fixed the runtime class Portugal exposed:

- agent exit status cannot be masked by `| tee`;
- partial output cannot enter the success path;
- failure classes name the correct execution plane;
- retry eligibility reads durable V2 state;
- stopped runs have an escalation path;
- caps remain bounded (5 attempts, 1 auto-retry).

Canary #4 proved the fresh-run wrapper/recovery product path. It did **not** exercise two failure-only seams:

1. a real escalation comment through `gh issue comment` with an intake issue present;
2. cancellation completing retry-decision + escalation inside GitHub's cancellation grace window.

Those remain targeted reliability proofs, not reasons to repeat a full research canary.

## Research-engine cutover truth

- V1 workflow/orchestrator stay present and usable.
- `/new` selects V2 only when `vars.WAYPOINT_RESEARCH_ENGINE == 'v2'`.
- With the selector unset, V1 remains the production default.
- Manual V2 `workflow_dispatch` is always `landMode=pr`; it cannot mint production publication authority.
- A green draft canary proves the research/product path, not a production cutover by itself.

## Claude ↔ Codex review automation

The reviewer loop is control-plane code. Current required architecture:

- `.github/workflows/claude-codex-signal.yml` is an unprivileged signal/doorbell;
- `.github/workflows/claude-codex-watcher.yml` separates read-only validation from write-capable publication at the **job** boundary;
- `scripts/codex-watcher.mjs` owns work-order parsing, eligibility, bounded handoff, and idempotency;
- `prompts/codex-work-order.md` is trusted control-plane input;
- PR-controlled validation code must never share the same credentialed execution domain as publication.

Historical note: PR #78's prose/history and the revision that actually reached the branch diverged; PR #79 restored the intended job-level boundary. Future reviews must inspect shipped code, not infer architecture from an old PR description.

## Current cleanup / autonomy pass

Draft PR #80 is the single cleanup surface. Its rules:

- `main` stays untouched until review is complete;
- structural cleanup requires evidence of duplicate ownership, not similar names;
- `trip-split`, `trip-tools`, and `trip-kit` are distinct systems and are not consolidation targets by name alone;
- project invariants protect V1/V2 coexistence, reviewer trust boundaries, Trip Split, itinerary/maps/SOS/offline, Atlas design authority, agent-instruction parity, and Canary #4's draft state;
- CI retains stricter coverage while local canonical checks provide one obvious verification path;
- the final branch must survive behavioral, architecture/security, and fresh-eyes consistency review loops.

Plain-English status: `docs/cleanup/GRAND_CLEANUP_STATUS.md`.
Repository ownership map: `docs/reference/repo-map.md`.

## Standing operating rules

- Do not use repeated full Claude research runs to debug deterministic state/schema/CI problems.
- Never infer one execution plane's failure from another (interactive browser/bridge, GitHub Actions research agent, deterministic control plane).
- Interactive research must never attempt CAPTCHA, Turnstile, MFA, login, or security verification; mark the source blocked and use another source.
- A missing metric is an honest blank. Never estimate tool/token/fetch telemetry as fact merely to fill a dashboard.
- Historical pipeline critic findings belong in process evidence, never traveler learnings.
- Every safety guard should have a test capable of going red when the protected behavior is removed; a guard that has never failed is still an assumption.

## Where to read more

- `CONTEXT.md` — durable decisions/history, read on demand.
- `docs/reference/pipeline.md` — product pipeline architecture.
- `docs/reference/claude-research-runtime.md` — execution planes and source-access safety.
- `docs/pipeline v2/IMPLEMENTATION_STATE.md` — detailed V2 build/canary evidence.
- `docs/pipeline v2/SEPTEMBER_TRACKER.md` — delivery state and deadlines.
- `.claude/skills/waypoint-guide-author/references/research-efficiency.md` — research/source-access rules.
