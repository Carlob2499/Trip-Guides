# Waypoint Pipeline V2 — Validation Pack

Status: **ACCEPTANCE / GO-NO-GO PACK**  
Owner: Carlo  
Purpose: prove Pipeline V2 is safe and useful for real travel before the September backend freeze.

Read with:

1. `DECISIONS.md`
2. `IMPLEMENTATION_PLAN.md`
3. `SEPTEMBER_TRACKER.md`
4. the active V2 branch's `IMPLEMENTATION_STATE.md`

This document does **not** redesign Pipeline V2. It defines how to prove the finished system actually behaves as intended.

---

# Testing principle

Use the cheapest reliable proof first:

**deterministic test → regression fixture → targeted model stage → full research run → manual traveler test**

Do not run eight expensive full Claude guides merely because eight scenarios are listed below.

A good validation cycle combines several risks into a small number of strong runs.

A PASS requires evidence. Do not infer PASS from a green build, a confident model answer, or a large number of findings.

---

# A. Core acceptance criteria

| Criterion | Good behavior | Failure | Evidence that earns PASS |
|---|---|---|---|
| Frozen intake | Original traveler intent remains unchanged after scaffold | Research edits/reinterprets frozen intake as if it were new user input | File/state comparison or deterministic test proving intake stays immutable |
| Pass A / Pass B independence | Pass B reaches its own evidence without consuming Pass A conclusions/research artifacts | Pass B simply paraphrases or reads Pass A work | Mechanical isolation test plus at least one live case where B contributes independent evidence |
| Adaptive saturation | Candidate breadth scales to the destination and stops when novelty/decision impact collapses | Artificial candidate padding or premature stopping | Saturation record shows duplicate/weaker trend and unresolved evidence is unlikely to change winner |
| Objective vs experiential evidence | Operational facts use appropriate authority; subjective claims use suitable firsthand/independent evidence | Official marketing page is treated as proof of crowd/vibe/quality, or objective fact rests on anecdote | Evidence artifact + verifier demonstrates correct claim/source pairing |
| Source independence | Copied/derivative source families do not count as independent confirmation | Ten republished SEO pages become fake consensus | Evidence families/independence handling plus a controlled or real example |
| Native-language research | Local-language research is used when it adds meaningful evidence and skipped when it would be performative | English-only generic research misses local truth, or native queries burn tokens without value | Native audit records why used and what new evidence it contributed |
| Reservation depth | Important bookings get release/action/friction/fallback depth; casual stops stay light | Every lunch receives forensic booking research, or a trip-critical restaurant has no booking plan | Evidence shows depth scaled to importance and friction |
| Transport robustness | High-risk legs include physical transfer reality, consequences and fallback; routine transit stays simple | Fast timetable chosen despite unrealistic transfer, luggage, group or last-service risk | Transport evidence/risk record plus a real itinerary decision |
| Physical-transfer plausibility | Tight/important connection considers actual movement through station/terminal | Timetable arithmetic is treated as proof of a viable transfer | Map/layout/walking/buffer evidence where consequence justifies it |
| Decision-changing disagreement | Important conflicts receive extra investigation; trivial ones do not | First source wins, or tokens are spent exhaustively on irrelevant disagreement | Disagreement record shows impact and resulting decision |
| Contingencies | High-risk days have useful fallbacks that fail differently | Backup depends on the same fragile condition as the primary plan | Guide/evidence shows independent fallback for a material risk |
| Freshness/recheck | Volatile facts carry appropriate freshness/recheck behavior | Old event page becomes a future date, or stale hours ship as current | Recheck metadata and a controlled stale/future-event test |
| Honest uncertainty | Unknown remains unknown | Missing evidence is silently converted into a guess | Controlled missing/contradictory evidence test fails or ships an explicit uncertainty marker |
| Reconciliation accountability | Every meaningful Pass B finding receives a disposition | B finding disappears without explanation | Coverage/evidence validation plus concrete A → B → Reconcile example |
| Critic usefulness | Fresh critic catches real defects without flooding the run with noise | Critic rubber-stamps output or mostly creates false positives | Findings classified true defect / false positive / optional polish |
| Anti-hallucination verification | Deterministic gates reject important unsupported/unsafe output | Model self-certification can publish a bad artifact | Controlled invalid fixtures fail verification and publication |
| Interruption/resume | Completed work survives and expensive completed stages are not needlessly rerun | Restart loses state or duplicates expensive research | Deterministic state test + one realistic interruption/resume proof where practical |
| Safe publication | Incomplete/failed research cannot become a normal finished guide | Failed run publishes or marks itself complete | Controlled failure blocked before publish boundary |
| Truthful Pipeline UI | UI shows only real state/events; absent data remains honestly empty | Placeholder/demo data appears as real activity | Gateway/model test + manual UI check |
| Resource measurement | Real metrics are recorded where available; unknowns remain unknown | Token/cost numbers are guessed | Telemetry artifact distinguishes measured values from null/unavailable |

---

# B. Eight adversarial scenarios

These are **risk scenarios**, not eight required full-guide runs.

## 1. Mega-city food problem

### Setup
A 5–6 person group has a food-heavy day in a Tokyo/Osaka/Seoul-scale city. Hundreds of plausible restaurant results exist. One highly praised option is inconvenient to reach and harder to reserve.

### Tests
- adaptive candidate saturation
- restaurant/menu quality
- itinerary fit
- hidden-gem discovery
- copied SEO consensus
- reservation difficulty
- Worth the Effort / Worth the Detour behavior

### Expected correct behavior
The pipeline explores enough candidates to reach decision stability without padding a quota, heavily weights food quality, detects derivative consensus, researches booking friction for finalists, and preserves an exceptional inconvenient option separately when deserved.

### Failure examples
- stops after generic top-10 pages
- produces a fixed number of candidates regardless of area
- closest restaurant wins despite materially worse food
- five copied listicles count as five independent endorsements
- deep reservation investigation is performed for every casual option
- exceptional difficult option disappears with no trace

### Evidence required
A saturation record, candidate funnel, source-family evidence, finalist reservation dossier, and one explicit reconciliation decision explaining why the practical or exceptional option won.

### Severity if failed
**HIGH**; **RELEASE BLOCKER** if saturation/evidence handling is structurally broken.

### Cheapest method
**Controlled pipeline draft**; reuse as Full Research Run A.

---

## 2. Rural / remote destination

### Setup
A smaller Japanese/Korean/regional destination has thin English coverage, infrequent transport, uncertain last return, and realistic taxi tradeoffs.

### Tests
- thin English evidence
- native/local research
- adaptive saturation in a small market
- remote transport
- taxi realism
- last practical return
- contingencies

### Expected correct behavior
The pipeline recognizes that a small candidate set can be complete, uses local-language sources when they add value, researches the fragile transport leg deeply, and gives a robust fallback without inventing unavailable service.

### Failure examples
- pads candidates with weak distant options
- declares “nothing exists” from English-only search
- chooses fastest connection without checking last return
- invents taxi availability or cost certainty
- backup relies on the same infrequent service

### Evidence required
Native audit, saturation evidence, transport risk record, last-return/fallback evidence, and explicit uncertainty where local transport cannot be confirmed.

### Severity if failed
**HIGH**; transport safety/reliability failure may be **RELEASE BLOCKER**.

### Cheapest method
**Controlled pipeline draft**; combine with Full Research Run B.

---

## 3. Difficult high-value restaurant

### Setup
A trip-highlight restaurant has scarce reservations, release timing, possible foreign-booking friction, and an uncertain hotel-concierge route.

### Tests
- reservation release/action date
- party-size rules
- foreign booking friction
- concierge lead labeling
- fallback
- Worth the Effort/Detour

### Expected correct behavior
The pipeline researches the serious finalist deeply, calculates the action window where evidence allows, labels concierge/local leads as unconfirmed until confirmed, provides a fallback, and does not pretend a booking method is available merely because someone mentioned it online.

### Failure examples
- no booking plan for an anchor meal
- unsupported concierge route labeled confirmed
- wrong release date inferred from an old page
- foreign card/account restrictions ignored despite evidence
- no fallback

### Evidence required
Reservation evidence object/dossier with source dates, action window, friction, fallback, and confidence/uncertainty.

### Severity if failed
**HIGH**; fabricated booking method is **RELEASE BLOCKER**.

### Cheapest method
Prefer **targeted live research stage**; can be embedded in Full Research Run A.

---

## 4. Fragile transportation day

### Setup
A group with luggage must make an important rail/bus transfer where the published timetable looks feasible but the physical station transfer may be tight.

### Tests
- exact service/date validity
- physical transfer
- group/luggage effect
- buffer
- missed-connection consequence
- next service / last practical return
- fallback

### Expected correct behavior
The pipeline treats timetable feasibility and physical feasibility separately, increases depth because consequence is high, and may select a slower route if it is materially more robust.

### Failure examples
- 7-minute connection accepted only because timetable permits it
- platform/terminal movement ignored
- group/luggage treated like a solo traveler
- no consequence analysis if connection is missed
- fallback is unavailable after the missed connection

### Evidence required
Transport risk/depth record and a written final route decision showing why robustness beat or did not beat speed.

### Severity if failed
**RELEASE BLOCKER** for a materially fragile trip-critical connection.

### Cheapest method
**Targeted research stage** or embed in Full Research Run B.

---

## 5. Conflicting evidence

### Setup
Official information says one thing while several recent, independent travelers report a materially different practical reality (for example queue reality, enforcement, access or transfer difficulty).

### Tests
- fact lane vs experience lane
- source independence
- decision-changing disagreement
- official minimum vs traveler-realistic planning value
- uncertainty

### Expected correct behavior
The pipeline preserves the official fact, separately records credible experiential evidence, investigates only because the disagreement changes planning, and chooses a realistic planning value without rewriting subjective experience as official truth.

### Failure examples
- official page automatically erases recent consistent firsthand evidence
- anecdotes overwrite an objective rule
- copied traveler posts are counted as independent
- disagreement is ignored despite changing the itinerary
- uncertainty disappears

### Evidence required
Disagreement record, source-family classification, reconcile disposition, and traveler-facing wording that distinguishes official fact from practical expectation.

### Severity if failed
**HIGH**; fabricated source role is **RELEASE BLOCKER**.

### Cheapest method
**Targeted fixture + live research evidence**; can be embedded in A or B.

---

## 6. Future event not fully announced

### Setup
A recurring event has prior-year pages, but the exact 2026 date/venue/ticketing has not been officially announced.

### Tests
- historical recurrence
- future-year safety
- freshness
- recheck scheduling
- uncertainty

### Expected correct behavior
The pipeline may use prior years as evidence that recurrence is plausible but must never convert them into a confirmed 2026 date. It schedules a recheck and tells the traveler what is and is not known.

### Failure examples
- copies 2025 date into 2026
- says “confirmed” because event is annual
- no recheck trigger/date
- invented venue/ticket availability

### Evidence required
Controlled recurring-event rule test plus a real or fixture output showing unconfirmed future-year handling.

### Severity if failed
**RELEASE BLOCKER** because it is a direct fabrication-risk regression.

### Cheapest method
**Deterministic fixture first**; no full guide required.

---

## 7. Large group with limited mobility

### Setup
A 7–10 person group includes travelers with low walking tolerance, luggage, and limited tolerance for complex transfers.

### Tests
- party-size implication
- walking burden
- realistic transit buffer
- reservation availability/friction
- taxis/private transport when sensible
- fallback choice

### Expected correct behavior
Group and mobility constraints materially change route, buffer, booking and itinerary recommendations. The pipeline does not merely append “allow extra time” to a solo-oriented plan.

### Failure examples
- recommends tiny restaurant that cannot seat party
- assumes everyone can make a long station transfer
- repeated standing/walking load is ignored
- fastest route chosen despite high failure cost
- no realistic group fallback

### Evidence required
Intake-to-decision trace showing at least two recommendations changed because of party/mobility constraints.

### Severity if failed
**HIGH**.

### Cheapest method
**Controlled pipeline draft**; combine with Full Research Run B or a targeted reconcile test.

---

## 8. Interrupted research run

### Setup
The pipeline stops after one or more expensive stages because of a cancellation, usage limit, agent failure or runner interruption.

### Tests
- durable checkpoint
- resume target
- bounded attempts
- no unnecessary re-research
- incomplete run cannot publish
- state corruption fails safely

### Expected correct behavior
Completed stages remain durable, the run resumes at the correct stage, retries are bounded, missing/corrupt mandatory artifacts fail closed, and publication remains impossible until the run is valid.

### Failure examples
- restart loses Pass A
- complete Pass A is rerun unnecessarily
- corrupted state silently resets to “new”
- attempt counter loops forever
- incomplete run appears complete/published

### Evidence required
Deterministic state/resume tests plus one realistic interruption proof if it adds evidence beyond the tests.

### Severity if failed
**RELEASE BLOCKER**.

### Cheapest method
**Deterministic test / fixture** first. Do not burn a full Claude run merely to simulate interruption.

---

# C. Regression pack

Preserve these categories even if implementation changes.

| Regression category | Required check | Preferred proof |
|---|---|---|
| Stale operational fact | Perishable fact cannot quietly remain current forever | Existing staleness tests + controlled stale fixture |
| Unsourced numeric claim | Important numeric operational claim is sourced or blocked/flagged | Existing fact-hygiene/verify tests |
| Bot-blocked source | 401/403/fetch failure does not become “dead” or “verified” without evidence | Network audit fixture/manual browser follow-up |
| Wrong venue/branch | Operational claims attach to exact entity when branch matters | Candidate/entity fixture + real guide sample |
| Ripple not updated | Repeated material fact is not changed in one location only | Continuity/content-drift tests |
| Incomplete research publishes | Invalid/incomplete state cannot land as a finished guide | Publication gate test |
| Dead/missing telemetry | UI remains honest-empty; no fabricated activity | Progress model/gateway test |
| Mobile/a11y regression | Critical path remains touch/keyboard accessible and avoids overflow | Existing a11y gate + manual phone pass |
| Offline dependency | Critical traveler information remains available without live network where designed | Offline/manual service-worker check |
| Wrong event year | Historical event date cannot be presented as confirmed future date | V2 recurring-event deterministic rule |
| Physically unrealistic connection | High-risk route must consider actual transfer plausibility | Transport research rule + controlled example |
| V1 safety regression during V2 proving | `/new` does not silently switch to an unproven V2 path | Workflow/dispatch tests until planned cutover |
| Run-integrity failure | Void/burst/bad compose run cannot auto-land | Existing run-integrity regression tests |
| Citation/source-role mismatch | Official source cannot “verify” an experiential statement it does not support | V2 research-rules tests |

When a test came from a real historical failure, treat it as a **regression scar**, not cleanup noise.

---

# D. Resource-efficient validation order

## Stage 1 — deterministic proof

Run first:

- V2 contract/schema tests
- state/resume tests
- attempt/stuck protections
- publication blocking
- recurring-event year safety
- objective/experiential source-role checks
- saturation-gate mechanics
- reconciliation-accountability checks
- telemetry null/known semantics
- V1/V2 dispatch isolation
- historical regression scars

If these are broken, do **not** spend expensive research tokens yet.

## Stage 2 — one-shot manual core canary

Run exactly one strong draft canary through:

**Pass A → Pass B → Reconcile → Critic → Verify**

Use it to exercise:

- adaptive discovery
- native research
- experiential evidence
- disagreement
- serious reservation
- critic quality
- real telemetry

This is the current immediate milestone.

## Stage 3 — full integration proof

After core canary approval, exercise:

`/new → intake → research → verify → compose → publish`

Do not delete V1 until V2 proves safe publication and resume behavior.

## Stage 4 — two distinct high-value research trials

Default recommendation: **2 full research trials after the core canary**, not 8.

### Full Research Run A — Mega-city / reservation / conflicting evidence

Covers scenarios:

- 1 Mega-city food
- 3 Difficult restaurant
- 5 Conflicting evidence
- part of 6 Future event if naturally present

Primary questions:

- does saturation stop intelligently?
- does Pass B earn its cost?
- is reservation depth proportional?
- does source independence affect decisions?
- is disagreement handled rather than flattened?

### Full Research Run B — Remote / transport / mobility / native-language

Covers scenarios:

- 2 Rural/remote
- 4 Fragile transportation
- 7 Large group / limited mobility
- native-language behavior

Primary questions:

- does thin English coverage trigger useful local research?
- does transport depth scale with consequence?
- do group/mobility constraints materially change the plan?
- are fallback and last-return risks realistic?

Scenario 8 (interruption) and most of Scenario 6 (future event) should remain deterministic/fixture-heavy unless a live run adds unique evidence.

## Stage 5 — targeted reruns only

A new model call must answer a specific unresolved question.

Examples:

- weak native discovery → rerun Pass B only
- noisy critic → rerun Critic only
- lost reconciliation finding → inspect code/artifact first; do not repeat research

Do not rerun a whole guide to make the report look cleaner.

## Stage 6 — manual traveler proof

On a phone and desktop, test the actual traveler path:

- create/start guide
- understand progress
- recover from incomplete state
- open finished guide
- find today's operational information
- find reservation details
- find transport/fallback information
- use core information with poor/no network where promised
- use Trip Split critical flow

This is not a design critique session. Record only friction that threatens real use or the October deadline; polish belongs after the backend freeze.

---

# E. Go / No-Go rubric

## GREEN — safe to proceed

All release-blocking contracts are proven. High-priority issues are either fixed or have a bounded workaround that does not compromise truth/safety. Core canary and integration path work. No failed/incomplete run can publish. Research behavior demonstrates the locked decisions rather than merely passing schemas.

**Action:** proceed to the next timeline phase.

## YELLOW — proceed after small bounded fixes

The architecture/contracts are sound, but one or more local defects remain, such as:

- a noisy critic rule
- a bounded telemetry gap
- a small wiring/fixture problem
- one missing deterministic check
- a noncritical UI/backend mismatch

No YELLOW issue may allow fabricated facts, unsafe publication, lost state, fake progress, or materially unreliable trip-critical transport/reservation behavior.

**Action:** Codex creates the smallest prioritized patch list; fix and rerun only affected checks.

## RED — do not proceed

Any of the following is RED:

- Pass B is not actually independent
- objective/experiential evidence contract can be bypassed materially
- reconciliation can silently lose important B findings
- deterministic verification can be bypassed by model confidence
- failed/incomplete run can publish
- resume loses completed work or loops attempts unsafely
- future event date can be fabricated from historical recurrence
- high-risk transport can ship without the required robustness evidence
- V2 cutover breaks V1 safety before V2 is proven
- required real-trip behavior is untested but reported as PASS

**Action:** stop integration/cutover. Codex identifies the smallest root-cause fixes. Do not hand an agent a broad “fix everything” redesign prompt.

---

# Severity definitions

**RELEASE BLOCKER**  
Threatens correctness, anti-hallucination, state/data integrity, safe publication, trip-critical offline use, or a core traveler flow.

**HIGH**  
Materially weakens research quality or trip reliability and should be fixed before feature freeze.

**MEDIUM**  
Noticeable weakness with a safe workaround; fix if it protects September goals.

**LOW / POLISH**  
Does not threaten the product contract. Defer when needed.

**FUTURE IMPROVEMENT**  
Useful idea that does not need to exist before September 30. Put it on the post-freeze list rather than expanding the current project.

---

# Final acceptance questions

Before backend freeze, Carlo/Codex should be able to answer YES with evidence to all of these:

1. Can a new guide start and finish without manual repair of pipeline state?
2. Is the original intake preserved?
3. Does Pass B provide genuine independent value?
4. Does research stop because decisions are stable rather than because a quota was reached?
5. Are objective facts and traveler experience sourced differently when they should be?
6. Does native-language research earn its tokens?
7. Are difficult reservations researched deeply only when they matter?
8. Are fragile transport connections physically plausible, not merely timetable-plausible?
9. Does reconciliation account for independent findings and disagreements?
10. Does the critic catch real problems without becoming a noise generator?
11. Can deterministic verification stop a confident-but-wrong model output?
12. Can an interrupted run resume safely without needless expensive repetition?
13. Can a failed/incomplete run ever appear published? The answer must be NO.
14. Does the Progress UI tell the truth about what is and is not known?
15. Can we see enough real resource data to identify obvious token waste without inventing metrics?
16. Is Waypoint usable on the actual travel device and under poor-network conditions?
17. Can Carlo spend October using Waypoint rather than rebuilding it?

If any answer is “we think so,” the corresponding item is not yet proven.