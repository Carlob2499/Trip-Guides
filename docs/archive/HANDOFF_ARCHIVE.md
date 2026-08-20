# HANDOFF archive — superseded snapshots and re-prompts

> **Truncated 2026-08-15** (owner ruling): only the three most recent snapshots stay in the
> working tree. Every older one is in git — `git log -- docs/archive/HANDOFF_ARCHIVE.md`
> walks the history, and `git show a79d194:docs/archive/HANDOFF_ARCHIVE.md` prints the full
> 2,080-line file as it stood. Newest first, verbatim.
>
> Moved out of `docs/handoff.md` 2026-08-03 to keep it a handoff, not a chronicle
> (the ~80-line budget its own header sets is gated by
> `scripts/__tests__/docs-integrity.test.mjs`). The session-end ritual still appends here.

## Snapshot (2026-08-20 — Pipeline V2 finalization: canary GREEN, census clean, cutover switch built)

The Fable finalization session fixed all four Core Proof blockers (generated machine-contract
capsule · durable per-stage retry feedback · V2 coverage consumed by the real verifier ·
deterministic geocoding in-pipeline), added source-access classes with a proxy refusal, per-attempt
retry telemetry, and a truthful Progress event emitter. The V2 workflow was registered via an inert
main stub (PR #59, the one authorized early merge) and the REAL pipeline ran end-to-end on GitHub
Actions: Pass A → Pass B → Reconcile → geocode → Critic → **draft PR #61**, landing gate PASSED
honestly (build + networked verify, 0 dead links), guide still `draft: true`, publication false.
Eleven dispatches; every failure deterministic, regression-tested, and resumed at the failed stage
— including a real usage-limit interruption and two live trips of the attempt-cap breaker (stuck
issues #60/#62, resolved by documented operator resets). The repository-wide legacy census found
ZERO dead code files; its five findings (template blurbs, motion.md rows, a silo deep-import, an
archived build prompt, three dead labels) are all resolved — `docs/LEGACY_ERADICATION.md` is the
ledger. `/new` now carries the cutover switch: `WAYPOINT_RESEARCH_ENGINE=v2` routes to V2; unset
means V1, unconditionally. An independent code review of the session's diff found one HIGH (clean
first-try runs crashed their completion checkpoint on the absent feedback pathspec), one MEDIUM
(comma-hostname injection into the critic's --allowedTools) and one LOW — all fixed same-session
with pinning tests. Durable record: `docs/pipeline v2/IMPLEMENTATION_STATE.md` (18-point proof).

## Snapshot (2026-08-17 — Pipeline V2 implementation adversarially audited and hardened)

Fable's M0–M8 implementation was reviewed from fixed base `9f1599b` by independent code,
specification, and security lanes, then corrected to convergence. The durable technical record
is `docs/pipeline v2/IMPLEMENTATION_STATE.md`. Delivery timeline:
`docs/pipeline v2/IMPLEMENTATION_PLAN.md` — Claude must read and follow it for sequencing,
kill dates, freezes, and Codex/Fable roles.

V2 remains manual, draft-only, and beside V1. Agents now execute in pinned Docker/Claude CLI
boundaries with workspace-only filesystem tools, explicit system-path denials, no host token,
no runner command files, no git remote/history, and canonical path-scoped artifact collection.
Pass B remains baseline-isolated; critic source fetches are restricted to pre-verified domains.
Run scope/model settings are durable across resumes; usage/void retries are bounded; stuck state
cannot reset itself; malformed artifacts/state fail closed; intake coverage is relational and
includes constraints, traveler count, and departure airport; the real landing gate is durable
and is the only event that clears the UI's Verify station.

V1's numeric breadth safeguards remain intact only for V1. V2 explicitly selects adaptive mode,
where the typed earned-saturation gate replaces quotas while structural anti-padding checks stay.
Critic findings now produce validated, provenance-complete newest-first process-memory rows.
Answers route atomically back to active or complete-unmerged research branches with the original
run inputs. Public issue spend and short owner keys fail closed.

## Where we left off

**Branch `codex/pipeline-v2`; final audited commit is the handoff point.** Local gates are green:
all workflow YAML parses; build, lint, typecheck and full tests pass; targeted V2/progress suites
pass; production preview was checked desktop plus 375px dark/reduced-motion with no overflow or
browser errors; compiled output carries `landingGate` and no synthetic live-publication copy.

**Next: the Phase 1 manual canary in IMPLEMENTATION_PLAN — not cutover.** First canary must prove
the live Docker permission denial (`Read /proc/self/environ`), cancellation/resume, configured
Places/Routes gate, draft-PR-only landing, Worker answer routing, and branch protection. Do not
merge V2 to main, switch `/new`, publish, delete V1, or begin the secondary UI/UX pass until its
timeline gate explicitly allows it.

## Snapshot (2026-08-16 — PLAN_PIPELINE_SURFACES executed end to end; the bundle is retired)

**Five commits on `design/pipeline-surfaces`, each through the full ship loop.** The progress
cockpit with its frame-by-frame route map (`0d6aae0`), the intake preflight checklist (`f9b333a`),
the change-request requester view (`544cc95`), the owner triage queue at `/progress/triage/`
(`63a63ff`), and this retirement. The plan's one deferred fork closed on the way (`e119f2a` — the
hub now stamps a guide that is BUILDING, deliberately not the `ongoing` "trip happening now"
class).

**Three things the design asked for were NOT built, on purpose, and each is recorded as a
Decision in CONTEXT.md.** Triage's Quick fix / Full re-check go through the owner-keyed Worker
rather than the deleted `*-approved` labels; the feedback-proposals panel moved off `/progress/`
into triage; and the live-event panels (sources · decisions · nuggets · counters) ship with the
full layout and honestly empty boxes, because nothing in the pipeline emits per-event data yet.
Emission is issue **#56** — the gateway, types, mocks and tests are already there for it to drop
into. The bundle's "Watch a demo run" button was never built for the same reason.

**Retirement, per the bundle's own instructions.** `design_handoff_pipeline_and_intake/` (39
files) and `PLAN_PIPELINE_SURFACES.md` are DELETED, not moved — an inline-styled prototype drifts
from the implementation within a release. What survives: one section in
`docs/reference/pipeline.md` (note-panel colours · the stalled-run rule · the route map's
frame-by-frame requirement), eight rows in `docs/reference/motion.md`'s inventory, and a closure
entry in `docs/archive/INDEX.md` carrying the `git show` paths to both. Four code comments that
cited the plan by filename now cite the archive heading instead.

## Snapshot (2026-08-15 — guide-deepening list, items 1/3/4/5 closed)

**Korea geocode backfill.** `PLACES_API_KEY` lives in `.env` but nothing sources it into the
process env — `set -a; source .env; set +a` before invoking `geocode-venues.mjs`. 1 of 25
unresolved venues (LoL Park) matched confidently and was written; the other 24 stay blank on
purpose — name mismatches Places itself disagrees with, or category entries ("Konbini") that
aren't a single place. Refuse-rather-than-guess working as designed.

**Bare-echo / undated-budget items were already clean.** Korea/denmark's facts hygiene
(bare-echo, malformed, misattribution) and untokenized-money checks both ran clean — an earlier
2026-08-15 session had already closed them. Japan's findings (3 malformed + 1 misattribution + 3
bare-echo stems) left with the guide — it was deleted later the same day for a fresh redo (see
Decisions). The defects survive as frozen fixture evidence, which is where they always belonged.

**E1 tiering backfill done; `backfill-tier.mjs` deleted.** Re-run on korea/denmark: 0 rows left
to assign — everything's already `tier: primary` or correctly left blank as a research call the
script was never built to make.

## Snapshot (2026-08-14 — the codebase-audit cleanup: audited, then cut, all gates green)

**Six-lens adversarial audit → three executed passes** (branch `claude/codebase-audit-cleanup-cahyfq`,
report artifact shared with the creator). Verdict: near-zero dead code, but process weight, helper
duplication, and four shipped defects. **Defects fixed:** tools-reminders.js was never imported
(Tools ticks didn't persist — now wired); double `.sheet-grip` drag-handle removed; grid.js's two
literal NUL bytes (grep saw the file as binary) escaped; the guide footer's telemetry disclosure
outlived the feature (caught by the dist grep, removed).

**Cuts, all creator-approved:** panel/progress-preview design-study trees; 5 unreferenced archive
docs; the test-index meta-gate (test + generator + 248KB catalog); the ENTIRE telemetry chain
(silo, bumpCounter, RTDB rules node, weekly workflow — whose docs/telemetry commit path was broken
and never fired); the 24 local-only Playwright specs (a11y.spec.ts remains the CI gate);
model-smoke.yml; CHANGELOG (frozen, moved to docs/archive/). Workflow diet: content-audit merged
into recert.yml as its Monday report job; mutation + skill-retro de-cronned to dispatch-only.
17 workflows remain, 4 crons.

**Structure:** silo contract's 3 violations sealed (hub index.ts; atlas exports initAtlasWorld —
atlas-map.js got an SSR-safe HTMLElement base for the barrel; route-optimizer math →
`src/lib/route-optimize.ts`); guide.css split under its ~800 rule (botbar/sheet → mobile-nav.css,
map/budget blocks rehomed); index.astro's inline hub script → `src/scripts/atlas-hub.js`;
`check-drift.mjs`→`check-content-drift.mjs` and trip-tools `reminders.ts`→`booking-reminders.ts`
(name collisions); single-letter-variable rename sweep over the 6 worst files (274→185 repo-wide).
Dedup: esc/reducedMotion → scripts/util.js; scripts gained lib/cli.mjs + lib/geo.mjs; og/recap
share pages/og/_card.ts. d3 → 3 submodules (~200KB less shipped); geo-tz → devDependencies.

## Snapshot (2026-08-17 — Fable's initial Pipeline V2 implementation, before Codex final audit)

M0–M8 were implemented and pushed on `codex/pipeline-v2` through `af876c3`. V2 was manual and
draft-only beside V1, with versioned run/evidence/coverage contracts, stage checkpointing,
Pass-B baseline isolation, adaptive research doctrine, connected answer routing, and initial
progress adapters. Codex's next task was the promised independent adversarial audit; no V2
canary, cutover, merge, or publication had occurred.
