# Waypoint Pipeline V2 — September Execution Tracker

Status: **LIVING TRACKER**  
Owner: Carlo  
Window: **August 18–October 7, 2026**  
Hard backend deadline: **September 30, 2026**

Use this with `DECISIONS.md`, `CODEX_HANDOFF.md`, `docs/handoff.md`, and the active branch's `IMPLEMENTATION_STATE.md`.

This file tracks delivery. It does not redefine Pipeline V2.

## Dashboard — August 23, 2026

- **Current phase:** post-Canary #4 **validation preparation**; repository cleanup/autonomy hardening is merged.
- **Core engine:** P01–P13 DONE.
- **Integration:** I01–I05 have deterministic/live evidence; I06 deliberately stays open until final V1 retirement/cutover approval.
- **Reliability acceptance:** PR #75 repair (`253607a`) is merged; PR #76 closeout is merged; fresh Canary #4 (`uruguay-20260823-9789de`) completed the draft product path GREEN. Uruguay remains draft-only and unpublished.
- **Canary #4 truth:** it proved the fresh-run wrapper and ordinary bounded recovery path. It did **not** exercise a real escalation issue comment/`gh` path because no intake issue existed, and it did **not** exercise the cancellation grace-window chain because no cancellation occurred. Those two failure-only seams remain targeted proofs.
- **Production cutover:** NOT DONE. `WAYPOINT_RESEARCH_ENGINE` remains unset/off, V1 remains the production default/rollback path, and a manual V2 canary cannot mint production publication authority.
- **Cleanup closeout:** PR #80 merged as `ca9d1b8e76d72ea95620e1c006417418855c88d0` after exact-head Project invariants, Tests/coverage, Accessibility, and Vercel passed. The revision-4 Claude↔Codex reviewer trust boundary remains active and protected.
- **Next validation work:** prepare and execute V01–V05 distinct research-risk trials, measure only telemetry that truly exists (V06), then assess observed resource waste (V07). Do not spend full Claude runs debugging deterministic CI/state/schema failures.
- **Days until September 20 feature freeze:** 28
- **Days until September 27 code freeze:** 35
- **Days until September 30 backend complete:** 38
- **Highest-risk unfinished items:** validation breadth across distinct risk classes; the two remaining live failure-only reliability seams; production cutover/publication parity; final mobile/offline/security stabilization.

### Current evidence already recorded

- M0–M8 complete; P13 core proof DONE.
- Integration wiring is in place; V1 remains intact behind the selector architecture.
- Malta, Luxembourg, and Portugal remain preserved RED canary evidence.
- Uruguay Canary #4: Pass A/B first try; Reconcile attempt 4 after three real gate failures with findings converging 5→2→0 blocking; bounded auto-retry consumed once then correctly refused; Critic first try; landing gate passed; `publication: false`; `landMode: pr`.
- Progress consumes real V2 durable run events; unavailable fetch-level/nugget/unmeasured counters remain honestly absent.
- The reciprocal Claude↔Codex reviewer from PRs #78/#79 remains active with the revision-4 separation restored by #79: unprivileged signal, read-only validation of PR-controlled content, and a separate write-capable publish job that never executes PR content.

**Do not equate “green draft canary” with “production cutover complete.”** The former is accepted evidence; the latter remains a deliberate product/operations decision with its own proof.

---

# Master tracker

Statuses: `NOT STARTED` · `IN PROGRESS` · `BLOCKED` · `READY FOR REVIEW` · `DONE` · `DEFERRED` · `DONE / YELLOW`

| ID | Work item | Phase | Owner | Deadline | Status | Dependency | Evidence required | Blocker | Decision needed |
|---|---|---|---|---|---|---|---|---|---|
| P01 | Preserve locked creator decisions and V2 authority docs | Foundation | Carlo / Codex | Aug 18 | DONE | None | `DECISIONS.md`, `CODEX_HANDOFF.md`, execution prompt present | None | No |
| P02 | Complete repo dependency audit and choose V2 build-beside-V1 | Foundation | Codex | Aug 18 | DONE | P01 | Audit complete; V2 intentionally built beside V1 | None | No |
| P03 | Implement V2 contracts, state, evidence, coverage, telemetry | Core | Claude/Fable | Sep 6 | DONE | P02 | M2 contract/state tests | None | No |
| P04 | Implement V2 doctrine and Guide Author changes | Core | Claude/Fable | Sep 6 | DONE | P03 | M3 parity tests | None | No |
| P05 | Implement manual V2 orchestration and Pass B / Critic isolation | Core | Claude/Fable | Sep 6 | DONE | P03 | M4 orchestration tests | None | No |
| P06 | Replace fixed candidate/Pass-B quotas with adaptive saturation protections | Core | Claude/Fable | Sep 6 | DONE | P04 | M5 adaptive protections; old floors removed | None | No |
| P07 | Preserve connected lifecycle safeguards: attempts, same-slug exclusion, answers/recert/pretrip | Core | Claude/Fable | Sep 6 | DONE | P03 | M6 lifecycle tests | None | No |
| P08 | Connect V2 state to honest Progress UI compatibility | Core | Claude/Fable | Sep 6 | DONE | P03 | M7 Progress adapter/gateway evidence | None | No |
| P09 | Run full deterministic branch verification | Core proof | Automated CI/test | Sep 6 | DONE | P03–P08 | M8 build/lint/typecheck/test/offline verify | None | No |
| P10 | Run one-shot manual draft-only V2 canary | Core proof | Claude/Fable | Sep 6 | DONE | P09 | Initial GREEN draft proof recorded in IMPLEMENTATION_STATE | None | No |
| P11 | Independently review Fable's one-shot proof and every surgical fix | Core proof | Codex | Sep 6 | DONE / YELLOW | P10 | Architecture accepted; bounded correction list produced | None | No |
| P12 | Apply only blocker/high-priority fixes from the canary | Core proof | Codex + Claude/Fable | Sep 6 | DONE (+P12.1) | P11 | Merge conflict + CodeQL + tool-layer /proc + R3+ fixture corrections accepted | None | No |
| P13 | Declare core engine proven in isolation | Core proof | Codex / Carlo | Sep 6 | DONE | P10–P12 | Corrected proof accepted; source-faithful transport scar preserved | None | No |
| I01 | Connect `/new` dispatch to the proven V2 path behind a safe switch/cutover plan | Integration | Codex + Claude/Fable | Sep 13 | DONE | P13 | `new-guide.yml` selector-gated V2 `workflow_call`; V1 remains default while selector is off | None | No |
| I02 | Prove full `/new → intake → research → verify → compose → landing` product path | Integration | Codex + Automated CI/test | Sep 13 | DONE / YELLOW — DRAFT PRODUCT PATH GREEN; PRODUCTION CUTOVER PENDING | I01 | Uruguay Canary #4 completed every research/verification/composition/landing stage and passed landing gate in `landMode=pr`; production auto-publication remains intentionally unproven while selector is off | Production cutover/publication parity not yet exercised | Carlo approves cutover later |
| I03 | Prove incomplete/failed V2 run cannot publish | Integration | Automated CI/test | Sep 13 | DONE | I01 | Malta/Luxembourg/Portugal failed without publication + deterministic publication-state tests | None | No |
| I04 | Prove resume/recovery without repeating completed expensive work | Integration | Automated CI/test + targeted live run | Sep 13 | DONE / YELLOW | P13 | Andorra proved manual resume; Uruguay exercised real bounded gate-failure retry authority. Cancellation recovery timing remains tracked under R03 | Cancellation seam unproven | No |
| I05 | Reconcile V2 telemetry with Progress cockpit / issue #56 instead of building a second system | Integration | Codex | Sep 13 | DONE | P13 | Progress reads durable emitted V2 events with generation/main fallback; honest-empty preserved | None | No |
| I06 | Keep V1 available until V2 proves publication and resume parity | Integration | Codex | Sep 13 | IN PROGRESS — HOLD UNTIL CUTOVER | I02–I04 | V1 remains intact/default; no silent retirement | Final production cutover not approved | Carlo approves final V1 retirement |
| R01 | Repair the V2 runtime reliability defect class Portugal exposed | Reliability | Codex + Claude | Aug 22 | DONE | I01–I05 | PR #75: exit integrity, partial-output rejection, plane-correct failures, durable retry authority, visible escalation path | None | No |
| R02 | Close out the post-merge documentation/authority truth | Reliability | Claude | Aug 22 | DONE | R01 | PR #76 merged; retry/authority/handoff congruence tests landed | None | No |
| R03 | **Live reliability acceptance — fresh Canary #4** | Reliability | Carlo + Codex | Sep 6 | DONE / YELLOW | R02 | Uruguay fresh canary GREEN. Fresh-run wrapper/recovery proved; two failure-only seams remain: real issue escalation/`gh` path and cancellation grace-window completion | Two targeted failure-only proofs remain | No full-canary rerun required |
| C01 | Repository-wide cleanup/autonomy pass (PR #80) | Cleanup | Codex + Automated CI/test | Sep 6 | DONE | R03 | PR #80 merged at `ca9d1b8e`; invariants, truthful authority surfaces, repo ownership map, canonical checks, Progress run-note completion, offline/security cleanup, and repeated review/debug passes; final exact-head invariants/tests/a11y/Vercel green | None | No |
| V01 | Mega-city food / reservation research trial | Validation | Claude/Fable + Codex | Sep 20 | NOT STARTED | I02 | Adaptive saturation, food fit, reservation depth, independent evidence | Fixture/success criteria must be prepared before expensive run | No |
| V02 | Native-language + thin-English research trial | Validation | Claude/Fable + Codex | Sep 20 | NOT STARTED | I02 | Native research adds meaningful evidence or is correctly skipped | Fixture/success criteria pending | No |
| V03 | Fragile transport / physical-transfer trial | Validation | Claude/Fable + Codex | Sep 20 | NOT STARTED | I02 | Door-to-door plausibility, buffers, missed-connection consequence/fallback where risk earns depth | Fixture/success criteria pending | No |
| V04 | Conflicting-evidence / future-event trial | Validation | Claude/Fable + Codex | Sep 20 | NOT STARTED | I02 | Disagreement investigated; future date not fabricated; recheck behavior recorded | Fixture/success criteria pending | No |
| V05 | Large-group / mobility trial | Validation | Claude/Fable + Codex | Sep 20 | NOT STARTED | I02 | Group size/mobility materially changes transport/reservation/walking recommendations where appropriate | Fixture/success criteria pending | No |
| V06 | Measure model/tool/token/time telemetry where truly available | Validation | Codex + Automated CI/test | Sep 20 | NOT STARTED | I02 | Real per-stage metrics only; unavailable values explicitly unavailable | Some metrics may not exist | No |
| V07 | Compare research quality against resource use and identify observed waste | Validation | Codex | Sep 20 | NOT STARTED | V01–V06 | Evidence-backed duplicated reads/searches/retries or explicit no-meaningful-waste result | Requires validation evidence | No |
| F01 | **FEATURE FREEZE** — no ordinary new backend features | Freeze | Carlo | Sep 20 | NOT STARTED | V01–V07 | Tracker status explicitly DONE; unfinished ideas deferred | Validation incomplete | Yes — Carlo alone can waive |
| S01 | Adversarial invalid-state testing | Stabilization | Automated CI/test | Sep 27 | NOT STARTED | F01 | Unsupported facts, malformed artifacts, stale high-risk facts, corrupt state, unsafe publish fail correctly | Feature freeze not reached | No |
| S02 | Mobile traveler-path check | Stabilization | Carlo + Codex | Sep 27 | NOT STARTED | F01 | `/new`, `/progress`, finished-guide critical path usable on phone | Feature freeze not reached | No |
| S03 | Offline / poor-network traveler-path check | Stabilization | Carlo + Codex | Sep 27 | NOT STARTED | F01 | Core trip info usable; network-dependent gaps fail honestly | Feature freeze not reached | No |
| S04 | Accessibility regression pass | Stabilization | Automated CI/test + manual check | Sep 27 | NOT STARTED | F01 | Existing a11y gate green; critical controls keyboard/touch accessible | Feature freeze not reached | No |
| S05 | Bad-network / bot-blocked source behavior | Stabilization | Codex | Sep 27 | NOT STARTED | F01 | Blocked sources do not become fabricated failures or false confirmations | Feature freeze not reached | No |
| S06 | Run final regression suite including historical Japan scars | Stabilization | Automated CI/test | Sep 27 | NOT STARTED | F01 | Preserved regression tests green; intentional contract changes documented | Feature freeze not reached | No |
| F02 | **BACKEND CODE FREEZE** except release blockers | Freeze | Carlo | Sep 27 | NOT STARTED | S01–S06 | No unresolved release blocker; freeze discipline active | Stabilization incomplete | Yes — Carlo alone can waive |
| F03 | Release-blocker-only window | Freeze | Codex + Claude/Fable | Sep 28–30 | NOT STARTED | F02 | Only correctness/creation/verification/publication/offline/data-integrity/security/major-usability blockers change | F02 | Carlo approves each scope exception |
| F04 | **BACKEND COMPLETE** | Freeze | Carlo / Codex | Sep 30 | NOT STARTED | F03 | Integration/cutover green; validation rubric green/yellow with no blocker; production path documented | Prior milestones | Yes — final backend acceptance |
| U01 | UI hierarchy and visual polish | UI finalization | Carlo + design/coding agent | Oct 1–7 | NOT STARTED | F04 | Critical traveler tasks clear on mobile/desktop; no backend contract redesign | Backend not frozen | No |
| U02 | Progress UI clarity and backend/UI congruency | UI finalization | Carlo + Codex | Oct 1–7 | NOT STARTED | F04 | Every displayed status/event backed by real backend data or honestly empty | Backend not frozen | No |
| U03 | Final accessibility and interaction polish | UI finalization | Automated CI/test + Carlo | Oct 1–7 | NOT STARTED | F04 | A11y gate green + manual critical-flow check | Backend not frozen | No |
| U04 | Shift project from engineering to trip use | Handoff | Carlo | Oct 7 | NOT STARTED | U01–U03 | Remaining work is content/reverification/real bugs, not architecture projects | UI finalization incomplete | No |

---

# Weekly operating cadence

Claude Max 5x window resets **Wednesday at 3:00 AM**.

Use the allowance deliberately:

- **Monday–Tuesday:** Codex analysis, deterministic tests, targeted fixes, prepare the next research question.
- **Wednesday after reset:** expensive full-pipeline or high-value research validation run.
- **Thursday–Friday:** analyze failures; fix mechanically; avoid broad reruns.
- **Weekend:** targeted stage reruns and integration testing.
- **Monday–Tuesday:** stabilize before the next expensive run.

Default cycle:

**test → learn → fix → targeted retest → stabilize → full test**

Do not use repeated full Claude runs to debug deterministic state/schema problems.

---

# If schedule slips, cut these first

Cut/defer in this order before moving a hard deadline:

1. Estimated API-equivalent dollar-cost display if exact model/token data is unavailable.
2. Fancy owner-facing telemetry visualizations beyond truthful raw/summary metrics.
3. Additional research-memory automation beyond preserving inspectable leads.
4. New permanent external APIs/MCP integrations.
5. Extra `Worth the Detour` presentation polish beyond preserving the underlying data/label.
6. Automated post-trip learning beyond simple inspectable feedback capture.
7. Additional full research validation runs once the distinct risk classes are already covered.
8. Noncritical Progress UI animation/polish.
9. Broad documentation cleanup unrelated to the active V2 contract.

Do **not** cut:

- research correctness
- evidence / anti-hallucination protections
- frozen intake
- Pass A/B independence
- reconciliation accountability
- verification
- resumability
- publication safety
- offline-critical traveler information
- Trip Split reliability
- required reservation/transport information

---

# Update rule

When a milestone changes:

1. change its status;
2. add the concrete evidence that earned the change;
3. record a blocker instead of guessing progress;
4. move nonessential work to `DEFERRED` rather than extending the deadline silently.

No fake completion percentages.