# Waypoint Cleanup Mission Control

> Non-coder status board for the repository-wide cleanup and autonomy pass.
>
> Branch: `cleanup/grand-pass-2026-08-23`
> Baseline: `main` at `a49ccf8e0a5c46eef9fc789f568da277f07fb750`
> Started: 2026-08-23

## Overall status

**████░░░░░░ 40% — guardrails and truth cleanup in progress**

| Phase | What it means in plain English | Status |
|---|---|---|
| 1. Lock baseline | Freeze a known-good starting point so cleanup cannot quietly rewrite history | ✅ Done |
| 2. Map the repo | Identify the real product systems and avoid merging things just because names look similar | ✅ Done |
| 3. Protect contracts | Add machine checks for the systems that must survive cleanup | 🟢 In progress |
| 4. Make status truthful | Remove stale roadmap / issue claims that tell agents to repeat completed work | 🟡 In progress |
| 5. Simplify verification | Give humans and agents one obvious way to ask “is this safe?” | 🟢 In progress |
| 6. Structural cleanup | Remove only proven duplication/dead paths; preserve behavior | ⏳ Pending |
| 7. Performance / offline audit | Check traveler-critical bundles, lazy loading, PWA/offline behavior | ⏳ Pending |
| 8. Security sweep | Re-check trust boundaries, credentials, workflow execution, supply-chain seams | ⏳ Pending |
| 9. Debug loop A | Full CI + code review, fix every finding | ⏳ Pending |
| 10. Debug loop B | Re-review the fixes from scratch, looking for regressions and contradictions | ⏳ Pending |
| 11. Debug loop C | Final adversarial pass and release-readiness check | ⏳ Pending |

## Protected systems

These are not cleanup targets unless a failing test proves they need a surgical fix.

- **Pipeline V1** remains the rollback/default path until an explicit cutover decision.
- **Pipeline V2** remains the proven next-generation research path.
- **Claude ↔ Codex watcher** keeps the revision-4 job-level trust boundary restored by PR #79.
- **Trip Split** keeps its deterministic split + settlement engine and shared ledger behavior.
- **Day-to-day itinerary**, **maps**, **SOS**, and **offline service worker** remain intact.
- **Uruguay / Canary #4** remains draft-only during cleanup.
- **Atlas redesign authority** remains in `docs/design-handoff/`; this cleanup does not redesign the product UI.

## What has changed so far

| Change | Why it helps | Risk |
|---|---|---|
| Dedicated cleanup branch | Keeps `main` untouched until review | Low |
| `scripts/check-project-invariants.mjs` | Turns “do not break these systems” into executable checks | Low |
| Canonical `check:*` and `ship:check` npm commands | Stops humans/agents from inventing different verification sequences | Low |
| Historical audit of PRs #76–#79 | Corrects the difference between what PR descriptions claimed and what actually reached `main` | None |

## Findings discovered during cleanup

### F-001 — stale execution tracker

`docs/pipeline v2/SEPTEMBER_TRACKER.md` still describes Canary #4 as not started and PR #76 as pending even though #76 is merged and the Uruguay canary later landed as a reviewed draft. An agent relying on that file can repeat already-completed work.

**Status:** fixing in this branch.

### F-002 — issue #56 describes already-shipped work as missing

The issue still says run events are never emitted and `fetchRunEvents()` is permanently empty. Pipeline V2 now emits durable events and the Progress gateway consumes them. The remaining work is narrower: truthful missing fetch/nugget telemetry, measurable counters, Worker `POST /note`, and the note-panel control.

**Status:** issue body will be reconciled, not blindly closed.

### F-003 — verification commands are fragmented

The repository already has strong lint, typecheck, tests, build, coverage, performance, and product-specific checks, but no single obvious local command represented the documented ship loop.

**Status:** canonical commands added; CI wiring is being updated.

### F-004 — PR #78 history can mislead future readers

PR #78's body documents revision 4, but the wrong revision reached `main`; PR #79 restored the job-level security boundary. Cleanup checks must pin the actual post-#79 structure, not trust prose alone.

**Status:** invariant check added; security review still pending.

## Review standard

The cleanup is not complete merely because the diff looks tidy. It must survive **three independent review/debug loops**:

1. **Behavioral review:** tests, build, typecheck, lint, coverage/performance signals, product invariants.
2. **Architecture/security review:** trust boundaries, duplicated ownership, stale paths, unsafe workflow assumptions, credential exposure.
3. **Fresh-eyes consistency review:** re-read the final branch as if none of the previous work were trusted; compare docs, code, CI, issues, and product doctrine for contradictions.

Any finding sends the branch back into the fix → retest loop.

## Definition of “clean enough to merge”

- All required CI checks green on the exact final head.
- Project invariant check green.
- No unresolved blocker/high-severity review findings.
- No known stale authority document that changes what an agent would do next.
- No known duplicated product implementation with two independent sources of truth.
- No cleanup-caused traveler-facing regression.
- No weakening of Pipeline V1/V2 safety, evidence, resumability, or publication gates.
- No regression in Trip Split, itinerary, maps, SOS, or offline-critical behavior.
- Final review loop finds no new actionable defect.

This board is intentionally conservative. “Unknown” is not rendered as “green” just to make the dashboard prettier. Humans already have PowerPoint for that.
