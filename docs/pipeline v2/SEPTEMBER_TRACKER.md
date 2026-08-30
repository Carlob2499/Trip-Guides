# Waypoint Research — September Execution Tracker

Status: **LIVING TRACKER**  
Owner: Carlo  
Window: **August 18–September 30, 2026 engineering completion; October is content/reverification + genuine field-bug follow-up only**  
Hard engineering deadline: **September 30, 2026**

Use this with `DECISIONS.md`, `CODEX_HANDOFF.md`, `docs/handoff.md`, and the active branch's `IMPLEMENTATION_STATE.md`.

This file tracks delivery. It does not redefine Pipeline V2. V3 is now the single forward Research
route; V2 entries below remain historical trial evidence and must not be dispatched as a substitute.

## Dashboard — August 30, 2026

- **Current phase:** Fukuoka remains the failed historical final-acceptance attempt, but its post-failure deterministic/model-input remediation is now merged. The frozen V2 Kumamoto candidate remains evidence only and must not be dispatched for V3. The **V3 deterministic replacement route is implemented and preflight-tested**; no model-backed V3 acceptance has been dispatched yet.
- **Historical acceptance authority:** accepted base `6fdae06af63e3890d7e147e13e08af056bb150b6`; V2 dispatch branch SHA `0a52ea1eb423f2d942b690942c3e9b62265b3c43`; Actions #59–#65. These records explain V2's failure modes and are not V3 acceptance authority.
- **Deterministic closeout:** independent review found and repaired two bounded repository defects without touching the failed Fukuoka research evidence: the Claude↔Codex watcher no-artifact YAML command and `routeToEvidenceOwner()`'s unauthorized autonomous +1 attempt-cap extension. Regression tests pin both, plus repeated usage-limit refund semantics.
- **Post-Fukuoka remediation:** PR #117 is merged. The new hash-pinned model-input candidate makes retained validator findings repair-first, forbids search-preview relabeling as verification, preserves unaffected work, removes Reconcile's impossible shell/offline-gate instruction, and pins a narrow no-guess map-placeholder repair path. No Claude/Fable run was used to create this remediation.
- **Kumamoto preflight:** closed-unmerged PR #123 proved rebuilt exact frozen candidate head `621dd43238d18b2b918827a9dca2268cd6f28c56` with Tests run `33252721880` PASS, Accessibility run `33252721875` PASS, CodeQL PASS, Analyze (actions) PASS, and Analyze (javascript-typescript) PASS. PR #122 invalidated the earlier candidate proven by PR #120; that superseded candidate remains preserved but must not be dispatched. The earlier preflight PR #118 is preserved as the deterministic viewport failure that led to merged PR #119.
- **Core engine:** P01–P13 DONE.
- **Integration:** I01–I05 have deterministic/live evidence; I06 remains open until explicit production cutover/V1 retirement approval.
- **Reliability acceptance:** Uruguay Canary #4 remains accepted historical proof that the **draft product path GREEN** contract can complete, and the targeted escalation/cancellation failure-only seams remain proven. They do not override the later Fukuoka production-readiness failure.
- **Production cutover:** NOT DONE / BLOCKED. `WAYPOINT_RESEARCH_ENGINE` remains unset/off; V1 remains the production default/rollback path. V3 must pass one fresh draft-only acceptance before selector change. Fukuoka grants no publication, merge, or cutover authority.
- **Release governance:** repository-side protected-main prerequisites are now implemented and zero-Claude automation-PR semantics are proven through PRs #137–#140 and proof run `33285553280`; issue #130 is reduced to the final owner/tooling repository-settings mutation and verification. No broad GitHub Actions bypass is required or authorized.
- **Preservation rule:** do not repair-and-merge `research-v2/fukuoka` or continue it past its cap. Do not dispatch or mutate superseded Kumamoto candidate `acceptance/v2-kumamoto-20260902`; current dispatch authority is only rebuilt frozen branch `acceptance/v2-kumamoto-20260902-r2` at `621dd43238d18b2b918827a9dca2268cd6f28c56`. Any deterministic defect discovered during the new run invalidates that run and requires a separately repaired/rebuilt candidate.
- **UI/design schedule:** the old Oct 1–7 U01–U04 placement is retired schedule debt. Ordinary hierarchy, Progress clarity, accessibility/interaction polish, and engineering handoff now complete by Sep 30; October is reserved for content/reverification and genuine field bugs. PR #115 / `codex/r6-traveler-first-cleanup` remain historical design inputs only and must be selectively rebuilt on current main rather than merged wholesale.
- **Days until September 20 feature freeze:** 21
- **Days until September 27 code freeze:** 28
- **Days until September 30 engineering complete:** 31
- **Highest-risk unfinished items:** deterministic V3 scar replay; one clean fresh V3 release-readiness run proving Reconcile → Critic → landing; final protected-main repository settings; and frontend finalization before the Sep 20/Sep 27 freezes without destabilizing the acceptance candidate.

### Current evidence already recorded

- M0–M8 complete; P13 core proof DONE.
- Integration wiring is in place; V1 remains intact behind the selector architecture.
- Malta, Luxembourg, and Portugal remain preserved RED canary evidence.
- Uruguay Canary #4: Pass A/B first try; Reconcile attempt 4 after three real gate failures with findings converging 5→2→0 blocking; bounded auto-retry consumed once then correctly refused; Critic first try; landing gate passed; `publication: false`; `landMode: pr`.
- Final Fukuoka acceptance: `fukuoka-20260829-7cb4fa` FAILED at Reconcile after 5/5 quality attempts; Actions #59–#65 include five manual resumes and one system auto-retry, with two usage-limit interruptions refunded. Critic/landing were not reached; publication stayed false. Full record: `FINAL_V2_ACCEPTANCE_FUKUOKA_EVIDENCE.md`.
- Progress consumes real V2 durable run events; unavailable fetch-level/nugget/unmeasured counters remain honestly absent.
- The reciprocal Claude↔Codex reviewer from PRs #78/#79 remains active with the revision-4 separation restored by #79: unprivileged signal, read-only validation of PR-controlled content, and a separate write-capable publish job that never executes PR content.
- V01–V05 have pre-registered trial cards, evidence packets, immediate-fail conditions, and a resource-efficient execution grouping in `docs/pipeline v2/VALIDATION_RUNBOOK.md`.
- V04 deterministic validation is PASS: future-year event facts cannot inherit historical dates as confirmed, and recommendation-changing disagreements now require links to at least two distinct real evidence records (PRs #84/#85).
- V06 telemetry evidence is recorded in `docs/pipeline v2/V06_TELEMETRY_EVIDENCE.md`: real Uruguay stage/retry/model/count metrics are measured from Uruguay; tool-call/search/fetch/native-search counts, tokens, and cost remain explicitly unavailable instead of inferred.
- R03 failure-only seams are PASS in `docs/pipeline v2/R03_LIVE_FAILURE_SEAMS_EVIDENCE.md`: issue #90 received the real authenticated/deduped Actions escalation witness from disposable PR #91, and Tests run `32680115285` proved a cancelled simulated agent can be followed by successful `always()` control-plane work and a successful `cancelled()` escalation witness; disposable PR #92 was closed unmerged.
- V07's resource-efficiency rubric is frozen in `docs/pipeline v2/V07_EVALUATION_METHOD.md` before Run A/B output exists; it uses only truthful V06-style telemetry and does not classify required corroboration/verification as waste merely because it costs time.

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
| I01 | Connect `/new` dispatch to the single V3 path behind a safe switch/cutover plan | Integration | Codex + Claude/Fable | Sep 13 | DONE / V3 IMPLEMENTED; CUTOVER PENDING | P13 | `new-guide.yml` selector-gated V3 `workflow_call`; V1 remains default while selector is off; V2 remains historical | None | No |
| I02 | Prove full `/new → intake → research → verify → compose → landing` product path | Integration | Codex + Automated CI/test | Sep 13 | IN PROGRESS — V3 DETERMINISTIC PATH GREEN; MODEL ACCEPTANCE PENDING | I01 | V2 Uruguay Canary #4 remains historical draft-path evidence; V3 still needs one fresh acceptance covering every stage and draft landing | Production cutover/publication parity not yet exercised | Carlo approves cutover later |
| I03 | Prove incomplete/failed V2 run cannot publish | Integration | Automated CI/test | Sep 13 | DONE | I01 | Malta/Luxembourg/Portugal failed without publication + deterministic publication-state tests | None | No |
| I04 | Prove resume/recovery without repeating completed expensive work | Integration | Automated CI/test + targeted live run | Sep 13 | DONE | P13 | Andorra proved manual resume; Uruguay exercised real bounded gate-failure retry authority; R03 targeted Actions cancellation proof closed the remaining cancellation timing seam | None | No |
| I05 | Reconcile V2 telemetry with Progress cockpit / issue #56 instead of building a second system | Integration | Codex | Sep 13 | DONE | P13 | Progress reads durable emitted V2 events with generation/main fallback; honest-empty preserved | None | No |
| I06 | Keep V1 available until V3 proves publication and resume parity | Integration | Codex | Sep 13 | IN PROGRESS — HOLD UNTIL CUTOVER | I02–I04 | V1 remains intact/default; no silent retirement while V3 acceptance is pending | Final production cutover not approved | Carlo approves final V1 retirement |
| R01 | Repair the V2 runtime reliability defect class Portugal exposed | Reliability | Codex + Claude | Aug 22 | DONE | I01–I05 | PR #75: exit integrity, partial-output rejection, plane-correct failures, durable retry authority, visible escalation path | None | No |
| R02 | Close out the post-merge documentation/authority truth | Reliability | Claude | Aug 22 | DONE | R01 | PR #76 merged; retry/authority/handoff congruence tests landed | None | No |
| R03 | **Live reliability acceptance — fresh Canary #4 + targeted failure seams** | Reliability | Carlo + Codex | Sep 6 | DONE | R02 | Uruguay fresh canary GREEN; `R03_LIVE_FAILURE_SEAMS_EVIDENCE.md` closes real issue escalation and cancellation grace-window behavior with targeted GitHub proofs | None | No |
| C01 | Repository-wide cleanup/autonomy pass (PR #80) | Cleanup | Codex + Automated CI/test | Sep 6 | DONE | R03 | PR #80 merged at `ca9d1b8e`; invariants, truthful authority surfaces, repo ownership map, canonical checks, Progress run-note completion, offline/security cleanup, and repeated review/debug passes; final exact-head invariants/tests/a11y/Vercel green | None | No |
| V01 | Mega-city food / reservation research trial | Validation | Claude/Fable + Codex | Sep 20 | YELLOW | I02 | Run A executed 2026-08-26 (`tokyo-20260826-41ae82`); all 7 pre-registered conditions PASS, no immediate-FAIL; evidence + bounded gap in `V01_RUNA_EVIDENCE.md` | Critic checkpoint/landing unfinished (attempt cap; 2 of 5 dispatches lost to usage limits) — owner may grant one completion dispatch | No |
| V02 | Native-language + thin-English research trial | Validation | Claude/Fable + Codex | Sep 20 | FAIL — REPAIR CLASS ADDRESSED; LIVE ACCEPTANCE PENDING | I02 | Historical Tottori FAIL preserved; deterministic repair stack merged through #111; Yamagata repaired-class evidence in `RUNB2_YAMAGATA_EVIDENCE.md` | Do not repeat Run-B; separate release-readiness acceptance proof required before cutover | No |
| V03 | Fragile transport / physical-transfer trial | Validation | Claude/Fable + Codex | Sep 20 | FAIL — REPAIR CLASS ADDRESSED; LIVE ACCEPTANCE PENDING | I02 | Historical Tottori FAIL preserved; repaired-class Yamagata exercised transport/transfer gates and the deterministic repair stack is merged through #111 | Do not repeat Run-B; separate release-readiness acceptance proof required before cutover | No |
| V04 | Conflicting-evidence / future-event trial | Validation | Claude/Fable + Codex | Sep 20 | DONE | I02 | PRs #84/#85: deterministic future-event safety + evidence-linked disagreement accountability PASS | None | No |
| V05 | Large-group / mobility trial | Validation | Claude/Fable + Codex | Sep 20 | FAIL — REPAIR CLASS ADDRESSED; LIVE ACCEPTANCE PENDING | I02 | Historical Tottori FAIL preserved; Yamagata repaired-class run exercised large-group/mobility decision surfaces; deterministic repair stack merged through #111 | Do not repeat Run-B; separate release-readiness acceptance proof required before cutover | No |
| V06 | Measure model/tool/token/time telemetry where truly available | Validation | Codex + Automated CI/test | Sep 20 | DONE | I02 | `docs/pipeline v2/V06_TELEMETRY_EVIDENCE.md`: real Uruguay stage/retry/model/count metrics recorded; tool/search/fetch/native-search/token/cost remain honest nulls | None | No |
| V07 | Compare research quality against resource use and identify observed waste | Validation | Claude/Fable + Codex | Sep 20 | FAIL / ACTION | V01–V06 | Executed 2026-08-26 on Run A/B durable telemetry per the frozen method; two W1 deterministic-waste findings (candidate-id contract mismatch repeated across both runs; reconcile/critic gate-parity defect) with bounded control-plane fixes — see `V07_EFFICIENCY_EVIDENCE.md` | Control-plane repairs only; no research-behavior change | No |
| A01 | **Final V2 release-readiness acceptance — Fukuoka** | Acceptance | Claude/Fable + Codex | Aug 29 | **FAIL — MODEL / CONTENT; CUTOVER BLOCKED** | S01–S06 automated readiness + repaired V2 stack | `FINAL_V2_ACCEPTANCE_FUKUOKA_EVIDENCE.md`; Actions #59–#65; durable `research-v2/fukuoka` state | Final Reconcile provenance failure; 5/5 quality cap exhausted; critic/landing unproven | No new run from this closeout |
| A02 | **Post-Fukuoka model-input remediation candidate** | Acceptance repair | Codex + Automated CI/test | Aug 29 | **DONE / YELLOW — DETERMINISTIC REMEDIATION; LIVE ACCEPTANCE PENDING** | A01 | PR #117 merged; repair-first prompt/feedback regressions; historical Fukuoka and new candidate blob hashes pinned separately | Fresh Reconcile → Critic → landing proof still absent | No |
| A03 | **Historical V2 release-readiness candidate — Kumamoto** | Acceptance evidence | Claude/Fable + Codex | Sep 2 | **FROZEN / DO NOT DISPATCH FOR V3** | A02 | Branch `acceptance/v2-kumamoto-20260902-r2` at `621dd43238d18b2b918827a9dca2268cd6f28c56`; preflight evidence remains useful for comparison only | It cannot validate V3 because its engine and prompts are V2 | Preserve unchanged; no model dispatch, cap extension, artifact edit, cutover, publication, or candidate mutation |
| A04 | **Fresh V3 release-readiness acceptance — new candidate** | Acceptance | Claude/Fable + Codex | Sep 13 | **NOT STARTED — DETERMINISTIC PRE-FLIGHT READY** | I01, A03 evidence only | New V3 candidate from accepted main; scar replay green; one draft-only Pass A → Pass B → Reconcile → Critic → landing run within frozen cap | Live model-backed proof and adversarial review are still absent | Create a new V3 candidate; never repurpose A03 |
| U01 | UI hierarchy and visual polish | UI finalization | Carlo + design/coding agent | Sep 19 | NOT STARTED | I05 + S02 | Critical traveler tasks clear on mobile/desktop; no backend contract redesign; traveler-first IA rebuilt selectively on current main | PR #115 / R6 branch is historical and heavily diverged; extract ideas, never merge wholesale | No |
| U02 | Progress UI clarity and backend/UI congruency | UI finalization | Carlo + Codex | Sep 19 | NOT STARTED | I05 | Every displayed status/event backed by real backend data or honestly empty; primary traveler progress path is clear | None | No |
| F01 | **FEATURE FREEZE** — no ordinary new engineering features | Freeze | Carlo | Sep 20 | NOT STARTED | V01–V07 + U01–U02 | Tracker status explicitly DONE; unfinished ordinary feature ideas deferred | Validation/frontend completion incomplete | Yes — Carlo alone can waive |
| S01 | Adversarial invalid-state testing | Stabilization | Automated CI/test | Sep 27 | DONE | F01 | Existing fail-closed suites cover malformed run/evidence/coverage/feedback artifacts, stale objective + experiential evidence, high-risk transport requirements, landing-state/publication invariants, and unsafe publish rejection; full Tests workflow passed on PR #111 exact code head | None | No |
| S02 | Mobile traveler-path check | Stabilization | Carlo + Codex | Sep 27 | DONE | F01 | PR #114 browser proof: `/new`, `/progress`, and a finished guide expose their primary traveler surfaces at 375×812 and stay inside the viewport; 320px reflow matrix includes all three | None | No |
| S03 | Offline / poor-network traveler-path check | Stabilization | Carlo + Codex | Sep 27 | DONE | F01 | PR #114 primes a real finished guide online, forces the browser context offline, opens a fresh page, and proves the service worker serves readable guide content/tabs with no horizontal escape; existing offline-sync suite covers durable write/replay semantics | None | No |
| S04 | Accessibility regression pass | Stabilization | Automated CI/test + manual check | Sep 27 | DONE / YELLOW — AUTOMATED PASS; PHYSICAL SPOT CHECK PENDING | F01 | PR #114 adds `/progress` to light/dark desktop/mobile axe, iOS zoom-trap, and nine-device 44px target sweeps; it found and fixed real status-contrast + 32/38/18px target defects. Full Accessibility workflow green after repair | One brief physical-device interaction spot check remains; not a code/model blocker unless it finds a defect | No |
| S05 | Bad-network / bot-blocked source behavior | Stabilization | Codex | Sep 27 | DONE | F01 | Source-access regressions reject search-preview-as-read, proxy/mirror origins, and R3+ transport without fetched evidence; honest `blocked` access remains valid data rather than a fabricated fetch. Full Tests workflow passed on PR #111 exact code head | None | No |
| S06 | Run final regression suite including historical Japan scars | Stabilization | Automated CI/test | Sep 27 | DONE | F01 | PR #111 exact code head passed Tests/coverage, invariants and Accessibility. The suite includes the Tottori scar fixture + repair-roundtrip/post-#105 regressions, Portugal reliability scars, Luxembourg gate-feedback scar, and Yamagata resume-version regression | None | No |
| U03 | Final accessibility and interaction polish | UI finalization / stabilization | Automated CI/test + Carlo | Sep 26 | NOT STARTED | U01–U02 + S04 automated proof | A11y gate green + manual critical-flow/physical-device check; only stabilization fixes after Sep 20 | Physical-device interaction spot check remains | No |
| F02 | **ENGINEERING CODE FREEZE** except release blockers | Freeze | Carlo | Sep 27 | NOT STARTED | S01–S06 + U03 | No unresolved release blocker; freeze discipline active | Stabilization incomplete | Yes — Carlo alone can waive |
| F03 | Release-blocker-only window | Freeze | Codex + Claude/Fable | Sep 28–30 | NOT STARTED | F02 | Only correctness/creation/verification/publication/offline/data-integrity/security/major-usability blockers change | F02 | Carlo approves each scope exception |
| F04 | **BACKEND COMPLETE** | Freeze | Carlo / Codex | Sep 30 | NOT STARTED | F03 | Integration/cutover green; validation rubric green/yellow with no blocker; production path documented | Prior milestones | Yes — final backend acceptance |
| U04 | **ENGINEERING COMPLETE — shift project to trip use** | Handoff | Carlo | Sep 30 | NOT STARTED | U01–U03 + F04 | Remaining planned work is content/reverification or genuine field bugs, not architecture/backend/UI completion | Backend acceptance/cutover and frontend finalization incomplete | Yes — final engineering handoff |

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
