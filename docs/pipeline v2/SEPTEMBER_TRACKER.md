# Waypoint Pipeline V2 — September Execution Tracker

Status: **LIVING TRACKER**  
Owner: Carlo  
Window: **August 18–October 7, 2026**  
Hard backend deadline: **September 30, 2026**

Use this with `DECISIONS.md`, `CODEX_HANDOFF.md`, and the active branch's `IMPLEMENTATION_STATE.md`.

This file tracks delivery. It does not redefine Pipeline V2.

## Dashboard — August 22, 2026

- **Current phase (updated 2026-08-22):** post-integration **reliability acceptance**. P13 core
  proof is DONE. Integration I01–I06 executed (PR #68 + #70/#72/#73 hardening). Three live
  canaries ran and all three ended RED — Malta (#1), Luxembourg (#2), Portugal (#3, issue #74,
  run `portugal-20260822-7c041e`). Portugal exposed a reliability defect class rather than a
  research defect: a failed agent process was reported as a successful step. That repair is
  merged (**PR #75 → main `253607a`**) and its closeout is **PR #76** (this PR).
- **Current blocker:** **closeout PR #76 + live reliability acceptance.** The repaired V2
  research/recovery runtime has not yet been exercised by a live Pipeline V2 research canary.
- **Next hard deadline:** September 6 — core research engine proven end-to-end in isolation.
- **Days until September 20 feature freeze:** 29
- **Days until September 27 code freeze:** 36
- **Days until September 30 backend complete:** 39
- **Highest-risk unfinished item:** the four live-only seams of the #75 repair (exit-wrapper
  resolution on the runner, a real escalation issue comment, the cancellation chain completing
  inside GitHub's grace window, and `gh` auth where escalate runs). None can be proven by the
  unit suite.
- **Carlo's next action:** merge #76 after Codex re-review, then run **preflight + a FRESH
  Canary #4** (never by resuming Portugal), then hand its evidence to Codex for independent
  review.

### Current evidence already recorded

- M0–M8 complete; P13 core proof DONE.
- Integration I01–I06 executed; reliability hardening #75 merged.
- Build, lint, typecheck green; full suite green (this PR's exact numbers are recorded in its
  Validation section, rerun on the final head).
- V1 dispatch intact; `WAYPOINT_RESEARCH_ENGINE` selector **off**, so `/new` uses V1 today.
- Manual `workflow_dispatch` is always `landMode=pr` — a canary structurally cannot publish.
- V2 production publication is **not yet accepted live**.

**Do not mark the V2 product path accepted until a fresh canary and independent review are
complete.** Three RED canaries and a merged repair are not an acceptance.

---

# Master tracker

Statuses: `NOT STARTED` · `IN PROGRESS` · `BLOCKED` · `READY FOR REVIEW` · `DONE` · `DEFERRED`

| ID | Work item | Phase | Owner | Deadline | Status | Dependency | Evidence required | Blocker | Decision needed |
|---|---|---|---|---|---|---|---|---|---|
| P01 | Preserve locked creator decisions and V2 authority docs | Foundation | Carlo / Codex | Aug 18 | DONE | None | `DECISIONS.md`, `CODEX_HANDOFF.md`, Fable execution prompt present | None | No |
| P02 | Complete repo dependency audit and choose V2 build-beside-V1 | Foundation | Codex | Aug 18 | DONE | P01 | Codex handoff states audit complete; execution prompt specifies build beside V1 | None | No |
| P03 | Implement V2 contracts, state, evidence, coverage, telemetry | Core | Claude/Fable | Sep 6 | DONE | P02 | M2 recorded complete with contract tests | None | No |
| P04 | Implement V2 doctrine and Guide Author changes | Core | Claude/Fable | Sep 6 | DONE | P03 | M3 recorded complete; parity tests green | None | No |
| P05 | Implement manual V2 orchestration and Pass B / Critic isolation | Core | Claude/Fable | Sep 6 | DONE | P03 | M4 recorded complete; orchestration tests green | None | No |
| P06 | Replace fixed candidate/Pass-B quotas with adaptive saturation protections | Core | Claude/Fable | Sep 6 | DONE | P04 | M5 recorded complete; old floors removed from gates and replacement tests added | None | No |
| P07 | Preserve connected lifecycle safeguards: attempts, same-slug exclusion, answers/recert/pretrip | Core | Claude/Fable | Sep 6 | DONE | P03 | M6 recorded complete; lifecycle tests green | None | No |
| P08 | Connect V2 state to honest Progress UI compatibility | Core | Claude/Fable | Sep 6 | DONE | P03 | M7 recorded complete | None | No |
| P09 | Run full deterministic branch verification | Core proof | Automated CI/test | Sep 6 | DONE | P03–P08 | M8: build/lint/typecheck/test green; offline verify passes | None | No |
| P10 | Run one-shot manual draft-only V2 canary | Core proof | Claude/Fable | Sep 6 | DONE | P09 | Live Pass A → Pass B → Reconcile → geocode → Critic → landing gate → draft PR #61, GREEN (18 proof points, IMPLEMENTATION_STATE) | None | No |
| P11 | Independently review Fable's one-shot proof and every surgical fix | Core proof | Codex | Sep 6 | DONE / YELLOW | P10 | Independent review returned YELLOW (architecture accepted; bounded finalization list = P12) | None | No |
| P12 | Apply only blocker/high-priority fixes from the canary | Core proof | Codex + Claude/Fable | Sep 6 | DONE (+P12.1) | P11 | PR #63 merge conflict resolved (`8a591e8`); 4 CodeQL findings fixed (`57f9dcd`); live /proc/self/environ denial proven (run 32340406684); R3+ transport proven (transport-r3-proof test); gates green 163/2649 on `7809835`. P12.1 correction: Grep+Glob /proc denial proven at the tool layer (run 32348279562, job 96361626055); R3+ fixture re-researched, overstatements removed, source-to-claim mapping recorded — IMPLEMENTATION_STATE "P12.1 correction pass" | None | No |
| P13 | Declare core engine proven in isolation | Core proof | Codex / Carlo | Sep 6 | DONE | P10–P12 | P13.1 fixture correction accepted on the corrected head (source-faithful "bus or taxi", conditional missed-connection, exclusivity scar); records in IMPLEMENTATION_STATE §P13/§P13.1 | None | No |
| I01 | Connect `/new` dispatch to the proven V2 path behind a safe switch/cutover plan | Integration | Codex + Claude/Fable | Sep 13 | DONE | P13 | `new-guide.yml` has the trusted V2 `workflow_call` path, selector-gated on `WAYPOINT_RESEARCH_ENGINE`; V1 remains default while the selector is off (PR #68 + #70 hardening) | None | No |
| I02 | Prove full `/new → intake → research → verify → compose → publish` path | Integration | Codex + Automated CI/test | Sep 13 | IN PROGRESS — LIVE ACCEPTANCE PENDING | I01 | Deterministic + integration wiring exists and is tested, but NO canary has produced an accepted green product landing: Malta, Luxembourg and Portugal all ended RED. Acceptance requires a fresh Canary #4 after #76 | Live acceptance not earned | No |
| I03 | Prove incomplete/failed V2 run cannot publish | Integration | Automated CI/test | Sep 13 | DONE | I01 | Live failure evidence: Malta, Luxembourg and Portugal all failed and NONE published, plus the deterministic suite (publication stays false across every failure/retry state; manual dispatch cannot mint landing authority) | None | No |
| I04 | Prove resume from interruption without repeating completed expensive work | Integration | Automated CI/test + targeted live run | Sep 13 | DONE (manual resume) — autonomous repair LIVE-UNPROVEN | P13 | Andorra proved manual resume live (interrupt after passA → resume skipped it). The AUTONOMOUS bounded repair from #75 is a Canary #4 acceptance seam and does not retract this proof | None | No |
| I05 | Reconcile V2 telemetry with Progress cockpit / issue #56 instead of building a second system | Integration | Codex | Sep 13 | DONE | P13 | Progress reads real emitted events through the V2 gateway/adapter with a main fallback for merged runs; honest-empty preserved. Code + integration tests | None | No |
| I06 | Keep V1 available until V2 proves publication and resume parity | Integration | Codex | Sep 13 | SATISFIED TO DATE — HOLD UNTIL CUTOVER | I02–I04 | V1 intact and never bypassed; selector expected to stay off until acceptance. Cannot close until V2 earns publication parity | None | Carlo approves final V1 retirement |
| R01 | Repair the V2 runtime reliability defect class Portugal exposed | Reliability | Codex + Claude | Aug 22 | DONE | I01–I05 | PR #75 merged as main `253607a`: agent exit integrity (no `\| tee` masking), partial output cannot enter the success path, failure classes name a plane, retry authority is durable, a stopped run escalates visibly. Caps unchanged (5 attempts, 1 auto-retry) | None | No |
| R02 | Close out the post-merge documentation/authority truth | Reliability | Claude | Aug 22 | IN PROGRESS | R01 | PR #76 (this PR): handoff ritual, retry-authority invariant, tracker/handoff/policy/prompt-doc congruence, stale-comment fix | Awaiting Codex re-review | No |
| R03 | **Live reliability acceptance — fresh Canary #4** | Reliability | Carlo + Codex | Sep 6 | NOT STARTED | R02 | A FRESH slug (never a Portugal resume) exercises the repaired runtime end to end. Four live-only seams: exit-wrapper resolution on the runner; one real escalation issue comment; the cancellation chain completing inside GitHub's grace window; `gh` auth where escalate runs | #76 not merged | Yes — Carlo starts the canary |
| V01 | Mega-city food / reservation research trial | Validation | Claude/Fable + Codex | Sep 20 | NOT STARTED | I02 | Adaptive saturation, food fit, reservation depth, independent evidence proven | Integration not done | No |
| V02 | Native-language + thin-English research trial | Validation | Claude/Fable + Codex | Sep 20 | NOT STARTED | I02 | Native research produces meaningful new evidence or is correctly skipped | Integration not done | No |
| V03 | Fragile transport / physical-transfer trial | Validation | Claude/Fable + Codex | Sep 20 | NOT STARTED | Door-to-door plausibility, buffer, missed-connection consequence and fallback shown where risk earns depth | Integration not done | No |
| V04 | Conflicting-evidence / future-event trial | Validation | Claude/Fable + Codex | Sep 20 | NOT STARTED | Disagreement investigated; future date not fabricated; recheck behavior recorded | Integration not done | No |
| V05 | Large-group / mobility trial | Validation | Claude/Fable + Codex | Sep 20 | NOT STARTED | Group size changes transport/reservation/walking recommendations appropriately | Integration not done | No |
| V06 | Measure model/tool/token/time telemetry where truly available | Validation | Codex + Automated CI/test | Sep 20 | NOT STARTED | Real per-stage metrics; unavailable metrics marked unavailable, never estimated as fact | Integration not done | No |
| V07 | Compare research quality against resource use and identify observed waste | Validation | Codex | Sep 20 | NOT STARTED | Evidence-backed list of duplicated reads/searches/retries or no meaningful waste found | V01–V06 | No |
| F01 | **FEATURE FREEZE** — no ordinary new backend features | Freeze | Carlo | Sep 20 | NOT STARTED | V01–V07 | Explicit tracker status set to DONE; unfinished ideas moved to deferred | Validation incomplete | Yes — Carlo alone can waive |
| S01 | Adversarial invalid-state testing | Stabilization | Automated CI/test | Sep 27 | NOT STARTED | F01 | Unsupported facts, malformed artifacts, stale high-risk facts, corrupt state, unsafe publish fail correctly | Feature freeze not reached | No |
| S02 | Mobile traveler-path check | Stabilization | Carlo + Codex | Sep 27 | NOT STARTED | F01 | `/new`, `/progress`, finished guide critical path usable on phone; no blocking overflow/control issue | Feature freeze not reached | No |
| S03 | Offline / poor-network traveler-path check | Stabilization | Carlo + Codex | Sep 27 | NOT STARTED | F01 | Core trip information remains usable; network-dependent gaps fail honestly | Feature freeze not reached | No |
| S04 | Accessibility regression pass | Stabilization | Automated CI/test + manual check | Sep 27 | NOT STARTED | F01 | Existing a11y gate green; critical new controls keyboard/touch accessible | Feature freeze not reached | No |
| S05 | Bad-network / bot-blocked source behavior | Stabilization | Codex | Sep 27 | NOT STARTED | F01 | Blocked sources do not become fabricated failures or false confirmations | Feature freeze not reached | No |
| S06 | Run final regression suite including historical Japan scars | Stabilization | Automated CI/test | Sep 27 | NOT STARTED | F01 | Preserved regression tests green; intentional contract changes documented | Feature freeze not reached | No |
| F02 | **BACKEND CODE FREEZE** except release blockers | Freeze | Carlo | Sep 27 | NOT STARTED | S01–S06 | No unresolved release blocker; branch policy/work discipline follows freeze | Stabilization incomplete | Yes — Carlo alone can waive |
| F03 | Release-blocker-only window | Freeze | Codex + Claude/Fable | Sep 28–30 | NOT STARTED | F02 | Only defects threatening correctness, creation, verification, publication, offline use, data integrity, security or major usability are changed | F02 | Carlo approves each scope exception |
| F04 | **BACKEND COMPLETE** | Freeze | Carlo / Codex | Sep 30 | NOT STARTED | F03 | Full integration green; validation rubric green/yellow with no blocker; production path documented | Prior milestones | Yes — final backend acceptance |
| U01 | UI hierarchy and visual polish | UI finalization | Carlo + design/coding agent | Oct 1–7 | NOT STARTED | F04 | Critical traveler tasks clear on mobile/desktop; no backend contract redesign | Backend not frozen | No |
| U02 | Progress UI clarity and backend/UI congruency | UI finalization | Carlo + Codex | Oct 1–7 | NOT STARTED | F04 | Every displayed status/event is backed by real backend data or honestly empty | Backend not frozen | No |
| U03 | Final accessibility and interaction polish | UI finalization | Automated CI/test + Carlo | Oct 1–7 | NOT STARTED | F04 | A11y gate green + manual critical-flow check | Backend not frozen | No |
| U04 | Shift project from engineering to trip use | Handoff | Carlo | Oct 7 | NOT STARTED | U01–U03 | Remaining work is content/reverification/real bugs, not architecture projects | UI finalization incomplete | No |

---

# Weekly operating cadence

Carlo's Claude Max 5x window resets **Wednesday at 3:00 AM**.

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