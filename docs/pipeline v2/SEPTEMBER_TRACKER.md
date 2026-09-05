# Waypoint Pipeline V2 — September Execution Tracker

Status: **LIVING TRACKER**  
Owner: Carlo  
Window: **through September 30, 2026 engineering completion; October is content/reverification + genuine field-bug follow-up only**  
Hard engineering deadline: **September 30, 2026**

Use this with `DECISIONS.md`, `IMPLEMENTATION_STATE.md`, `docs/handoff.md`, and issue #187. This file tracks delivery; it does not redefine Pipeline V2.

## Dashboard — September 5, 2026

- **Selected engine:** V2 is the selected product research path through `WAYPOINT_RESEARCH_ENGINE=v2`. V1 is retained as rollback/compatibility, not the current default.
- **Release-readiness:** **ratification pending.** Uruguay Canary #4 remains GREEN draft/reliability evidence; Fukuoka remains terminal failed release-readiness evidence. A fresh exact-head Kumamoto release-readiness ratification is still required.
- **Kumamoto authority:** historical r1/r2/r3 are stale evidence only. Rebuild/replay from settled current `main`, prove the exact candidate head deterministically, run a fresh drift audit, then await explicit owner authorization before any Claude/model burn.
- **Design/frontend:** the D7 ten-surface transplant and product frame are on `main`. Creator-directed fidelity corrections are being handled separately; creator visual acceptance remains pending. This is convergence, not D8.
- **Runtime:** PR #210 provider-neutral runtime integrations are on `main`. September deterministic hardening must cover any proven product-completeness/runtime issues without creating new feature families.
- **Release governance:** #130 remains PARTIAL until the concrete required checks, fresh-integration enforcement, main-deletion protection, and protected-landing proof under the final ruleset are mechanically proven.
- **Resource policy:** reciprocal Claude↔Codex review automation is retired. The hourly September completion watcher is retired. LEARN feedback synthesis is manual-only. Claude Pro usage is reserved for the eventual authorized Kumamoto research run.
- **Freeze dates:** feature freeze **Sep 20**; code freeze **Sep 27**; engineering complete **Sep 30**. Use absolute dates; do not maintain drifting countdown prose.
- **Current P0 closure sequence:** continuity/current-state reconciliation → creator-directed D7 fidelity + visual acceptance → deterministic product-completeness/runtime/performance hardening → #130 → settled-main fresh Kumamoto → adversarial field/device closeout.

### Current evidence already recorded

- Core V2 P01–P13: implemented/proven at deterministic/draft-product level.
- Uruguay Canary #4: GREEN draft product/reliability proof; Pass A/B, bounded Reconcile repair, Critic and landing gate were exercised with publication false in draft authority.
- R03 failure-only escalation/cancellation seams: PASS / fully accepted through targeted live proofs.
- Fukuoka `fukuoka-20260829-7cb4fa`: terminal release-readiness FAIL; preserve as evidence, do not continue past its cap.
- Kumamoto r1/r2/r3: historical preflight evidence only; none has current dispatch authority.
- D7 surface transplant: merged through the surface series and closeout; creator acceptance is separate from implementation green.
- PR #210: provider-neutral runtime integration foundation merged.
- Main protection: partial; issue #130 owns final governance truth.

**Do not equate “V2 selected” with “fresh release-readiness evidence passed.”** The owner has selected V2 operationally; Kumamoto remains the final ratification test of that selected system.

---

# Master tracker

Statuses: `NOT STARTED` · `IN PROGRESS` · `BLOCKED` · `READY FOR REVIEW` · `DONE` · `DEFERRED` · `DONE / YELLOW` · `RATIFICATION PENDING`

| ID | Work item | Phase | Owner | Deadline | Status | Dependency | Evidence required | Blocker | Decision needed |
|---|---|---|---|---|---|---|---|---|---|
| P01 | Preserve creator decisions and V2 authority | Foundation | Carlo / agents | Aug 18 | DONE | None | authority docs | None | No |
| P02 | Dependency audit and build V2 beside V1 | Foundation | Engineering | Aug 18 | DONE | P01 | implementation evidence | None | No |
| P03 | V2 contracts/state/evidence/coverage/telemetry | Core | Engineering | Sep 6 | DONE | P02 | deterministic tests | None | No |
| P04 | V2 doctrine + Guide Author integration | Core | Engineering | Sep 6 | DONE | P03 | contract tests | None | No |
| P05 | V2 orchestration + isolation | Core | Engineering | Sep 6 | DONE | P03 | orchestration tests | None | No |
| P06 | Adaptive saturation protections | Core | Engineering | Sep 6 | DONE | P04 | regression tests | None | No |
| P07 | Lifecycle safeguards/recovery | Core | Engineering | Sep 6 | DONE | P03 | lifecycle tests | None | No |
| P08 | Honest Progress compatibility | Core | Engineering | Sep 6 | DONE | P03 | UI/state adapter evidence | None | No |
| P09 | Deterministic branch verification | Core proof | CI | Sep 6 | DONE | P03–P08 | gates green | None | No |
| P10 | Draft-only V2 canary | Core proof | Research pipeline | Sep 6 | DONE | P09 | Uruguay evidence | None | No |
| P11 | Independent canary review | Core proof | Engineering | Sep 6 | DONE / YELLOW | P10 | bounded correction list | None | No |
| P12 | Repair demonstrated blocker classes | Core proof | Engineering | Sep 6 | DONE | P11 | regression evidence | None | No |
| P13 | Core engine proven in isolation | Core proof | Carlo / Engineering | Sep 6 | DONE | P10–P12 | accepted deterministic/draft proof | None | No |
| I01 | Connect `/new` to V2 selector architecture | Integration | Engineering | Sep 13 | DONE | P13 | trusted V2 `workflow_call` + V1 rollback path | None | No |
| I02 | Prove full `/new → research → landing` path | Integration | CI / research | Sep 13 | DONE / YELLOW — DRAFT PRODUCT PATH GREEN; RELEASE-READINESS PENDING | I01 | Uruguay GREEN; Fukuoka historical fail | Fresh Kumamoto still required | No |
| I03 | Failed/incomplete V2 cannot publish | Integration | CI | Sep 13 | DONE | I01 | failed-canary + deterministic publication tests | None | No |
| I04 | Resume/recovery preserves completed expensive work | Integration | CI / targeted live | Sep 13 | DONE | P13 | durable retry/resume evidence | None | No |
| I05 | V2 telemetry feeds existing Progress owner | Integration | Engineering | Sep 13 | DONE | P13 | durable events / honest-empty behavior | None | No |
| I06 | V2 selected; preserve V1 rollback until ratification/retirement decision | Integration | Carlo / Engineering | Sep 30 | RATIFICATION PENDING | I02–I05 | fresh Kumamoto + rollback proof | Settled-main acceptance not yet run | Carlo decides V1 retirement later |
| R01 | Repair Portugal-exposed reliability class | Reliability | Engineering | Aug 22 | DONE | I01–I05 | merged deterministic fixes | None | No |
| R02 | Close post-merge authority truth | Reliability | Engineering | Aug 22 | DONE | R01 | congruence tests | None | No |
| R03 | Live reliability acceptance + failure seams | Reliability | Carlo / Engineering | Sep 6 | DONE | R02 | Uruguay + escalation/cancellation evidence | None | No |

## September closure work

| ID | Work item | Owner | Target | Status | Gate |
|---|---|---|---|---|---|
| S20-01 | Continuity/current-state reconciliation; retire stale watcher scaffolding | Engineering | Sep 6 | IN PROGRESS | current docs/tests/workflows agree; zero surprise Claude schedules |
| S20-02 | Creator-directed D7 fidelity corrections | Carlo + design agent | Sep 9 | IN PROGRESS | creator review, no D8 |
| S20-03 | Creator visual acceptance + accepted baseline lock | Carlo | Sep 10 | NOT STARTED | representative phone/intermediate/desktop + degraded states |
| S20-04 | Deterministic Guide Completeness/product-surface contract | Engineering | Sep 11 | NOT STARTED | intake → structured truth → relevant surfaces fail closed |
| S20-05 | Runtime hardening: travel-mode fidelity, >8-stop truthfulness, degraded/live semantics | Engineering | Sep 11 | NOT STARTED | focused runtime/browser tests |
| S20-06 | Put performance budget in premerge authority | Engineering | Sep 11 | NOT STARTED | over-budget branch fails before merge |
| S20-07 | Final protected-main governance (#130) | Carlo / tooling | Sep 11 | BLOCKED | final ruleset + protected landing proof |
| S20-08 | Freeze settled `main`; rebuild exact Kumamoto candidate | Engineering | Sep 12 | BLOCKED | S20-01..07 stable enough not to invalidate candidate |
| S20-09 | Fresh Kumamoto release-readiness ratification | Carlo / V2 pipeline | Sep 16 | BLOCKED | explicit owner model-burn authorization after exact-head/drift proof |
| S20-10 | V2 rollback/cutover truth + V1 retirement decision | Carlo | Sep 19 | BLOCKED | Kumamoto result; V1 may remain if retirement is not worth risk |
| S20-11 | Adversarial field/device closeout | Carlo + Engineering | Sep 27 | NOT STARTED | offline/poor network/geolocation/provider failures/200%/CJK/group constraints |
| S20-12 | Final production verification + handoff | Engineering | Sep 30 | NOT STARTED | only content/reverification/real field bugs remain |

## Hard rules

- Do not dispatch historical Kumamoto candidates.
- Do not use model runs to debug deterministic code.
- Do not weaken attempt caps, evidence requirements, publication gates, branch protection or exact-head rules to obtain green.
- Do not revert `WAYPOINT_RESEARCH_ENGINE` merely to make stale pre-cutover tooling pass; repair the tooling/authority to current reality.
- Do not retire V1 inside an unrelated cleanup pass.
- Do not regenerate visual baselines as a substitute for creator acceptance.
- Do not revive retired reciprocal-review or hourly completion watchers.
- No new broad design/research/feature round before Sep 30 unless a reproduced release blocker proves it necessary.
