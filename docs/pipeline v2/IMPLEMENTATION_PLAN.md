# Waypoint Pipeline V2 — Current Implementation Plan

Status: CURRENT PLAN
Owner: Carlo
Target: Backend complete by September 30, 2026

Read alongside `DECISIONS.md` and `CODEX_HANDOFF.md`.

This is the current delivery plan. Carlo may intentionally change it. Agents must not silently extend deadlines, expand scope, or keep redesigning the system because a cleaner architecture is possible.

## Main rule

Finish a reliable Waypoint research pipeline that produces excellent travel research, strongly resists hallucinations, uses Claude tokens intelligently, survives interruptions, connects Intake to a published guide, reports progress honestly, and remains understandable to future AI coding sessions.

Salvage strong existing behavior. Do not preserve complexity merely because it already exists.

## Aug 17–23 — Audit and stabilize

- Establish the current working baseline.
- Identify existing Fable/Work errors.
- Trace `/new` through research, verification, publication, and both UIs.
- Audit Guide Author dependencies.
- Identify what must be preserved, changed, or deleted.
- Classify important tests.
- Compare Pipeline UI promises with real backend behavior.

**Aug 23 kill date:** Codex must recommend either:
1. repair and simplify the current pipeline, or
2. build Pipeline V2 beside it.

Do not continue architecture discovery indefinitely after this date.

## Aug 24–Sep 6 — Build the core

Implement the chosen research-engine plan.

Priorities:
- Guide Author rules
- Pass A / Pass B
- Reconcile / Critic
- evidence handling
- research state
- interruption/resume
- verification and anti-hallucination protections
- basic run telemetry

Do not spend this period polishing the traveler UI. Do not add speculative APIs/MCPs or GPT to production.

**Sep 6 kill date:** the core engine must work end-to-end in isolation. If not, reduce scope instead of adding architecture.

## Sep 7–13 — Connect the product

Connect:

`/new → Intake → research → verification → composition → publication → finished guide`

Connect the Pipeline/Progress UI to real backend state.

Priorities:
- correct stage progress
- honest failures
- resume state
- real telemetry
- clean publication
- required traveler-facing structured data

**Sep 13 kill date:** New Guide → Research → Verify → Publish must work. Anything not required for this path becomes secondary.

## Sep 14–20 — Prove it

Test with:
- existing guides and regression fixtures
- fresh guide creation
- difficult reservations
- native-language research
- large-city and small-area discovery
- remote transport and tight transfers
- contingencies
- stale information
- conflicting sources
- interrupted Claude runs

Measure where possible:
- tokens
- stage duration
- searches/fetches
- retries
- candidates considered/deeply verified
- facts verified
- disagreement investigations
- native-language activity
- total run duration

Goal: reduce unnecessary token use without lowering research quality.

**Sep 20: feature freeze.** New work should primarily fix observed problems.

## Sep 21–27 — Stabilization only

Focus on:
- adversarial testing
- mobile/desktop
- offline and bad networks
- Claude usage-limit interruptions
- resume behavior
- malformed/missing data
- bad citations and stale facts
- publishing failures
- accessibility
- traveler stress scenarios

Do not redesign research architecture.

**Sep 27: backend code freeze** except release-blocking defects affecting correctness, guide creation, verification, publication, offline/travel use, data integrity, security, or major usability.

## Sep 28–30 — Backend freeze

Only fix genuine release blockers.

No architecture changes, new agents/APIs, broad prompt rewrites, new state formats, or opportunistic refactors.

**Sep 30: backend engineering is done.**

## Oct 1–7 — UI finalization

Focus on:
- visual polish
- information hierarchy
- mobile/desktop refinement
- Pipeline UI clarity
- traveler UI clarity
- backend/UI congruency
- accessibility
- small interaction improvements
- removing confusing/unused UI

Do not redesign backend contracts during UI week.

## After Oct 7 — Use Waypoint

Shift toward creating guides, adding bookings, itinerary updates, trip uploads, re-verification, small UI improvements, and genuine bug fixes.

The normal state should no longer be constant engineering.

## Claude Max 5x weekly cadence

Carlo's Claude Max 5x usage period resets **Wednesday at 3:00 AM**.

**Mon–Tue:** Codex planning, coding, deterministic tests, known fixes, prepare the next research test.

**Wednesday after reset:** expensive full-pipeline Claude test with a clear test objective.

**Thu–Fri:** analyze failures and fix research/orchestration/validation/token-waste/UI-backend issues. Use deterministic tests before expensive reruns.

**Weekend:** targeted Claude reruns and integration testing. Rerun only expensive stages that need new research.

**Mon–Tue:** stabilize before the next weekly full test.

Cycle: **test → learn → fix → targeted retest → stabilize → full test**.

## Codex + Claude/Fable roles

Codex owns:
- repo audit
- implementation planning
- task boundaries
- dependency tracing
- reviewing Fable changes
- deciding whether test failures are real regressions

Claude/Fable receives bounded implementation tasks.

Codex should specify:
- exact goal
- allowed files
- preserved behavior
- intentionally changed behavior
- tests to run
- out-of-scope work

Codex reviews the diff before accepting each task.

## Scope rule

For every new idea ask:

**Does this solve an observed problem that threatens the September goal?**

If not, defer it.

Useful does not automatically mean necessary before Sep 30.

## Definition of done

Backend work is finished when:

1. A new guide can be created from the Waypoint UI.
2. Intake is preserved correctly.
3. Research completes with intended Pass A/Pass B independence.
4. Research follows `DECISIONS.md`.
5. Important claims use appropriate evidence.
6. Uncertainty is shown instead of invented answers.
7. Interrupted runs resume safely.
8. Verification catches meaningful bad output.
9. Guides publish without manual pipeline-state repair.
10. Pipeline UI honestly reports what is happening.
11. Token/time/research telemetry exists where realistically measurable.
12. Important regression protections still pass.
13. Mobile/offline behavior is reliable enough for travel.
14. Failed/incomplete research cannot silently become a finished guide.
15. Carlo can spend October using Waypoint instead of rebuilding it.

## Final instruction to agents

Do not silently move deadlines or expand scope.

If this plan becomes unrealistic, report:
1. what is blocking it
2. what can safely be cut
3. what must remain for Waypoint to be useful

Then let Carlo decide.
