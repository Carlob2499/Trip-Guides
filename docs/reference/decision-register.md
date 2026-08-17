# Waypoint decision register

> Status: implementation authority for the August–September 2026 completion project
> Source: creator decisions in “Trip-Guides Repository Critique,” reconciled with `main` at
> `18020d4` on 2026-08-17

This register is the bridge between the creator, Codex, and Claude Code. It records the intended
behavior; it does not override the verified-fact rules or silently declare missing behavior
implemented.

## Reading the register

- **Realized** — doctrine, backend, and required surface agree.
- **Partial** — useful machinery exists, but the complete decision is not enforced or surfaced.
- **Missing** — the decision has no dependable implementation yet.
- **Conflict** — current behavior contradicts the decision.
- **Provisional** — no explicit creator answer was recorded; the default is reversible and cannot
  independently justify a large implementation.

R23 was accepted by non-objection. R42–R48 were proposed immediately before the creator stopped
the questionnaire for drift and were never explicitly answered. They remain provisional. The
exact prompt wording for R4–R6 was truncated by the bounded conversation export; their normalized
rows rely only on later decisions that restated the same policy, so they create no independent
work.

## Product contract established before R1

These decisions came from the earlier product questionnaire and govern how research reaches the
traveler.

| Contract | Decision | Current state |
|---|---|---|
| Product identity | A calm personal/group trip operating system, not a generic travel-content site | Partial — the Atlas and guide are mature; trip operations are distributed across guide tools |
| Intake | Start from a concise human intake with strong freeform; expand only when a real fork appears | Realized in the New Guide flow |
| Research continuity | Research continues under explicit assumptions; later input invalidates only affected work | Partial — questions/assumptions exist; scoped mid-run invalidation is incomplete |
| Incomplete trips | Show meaningful booking/ticket/lodging gaps and subtle incomplete tab states | Partial |
| Booking ingestion | Parse once, let the owner review/edit fields, apply them, discard the source, then recheck affected logistics | Partial |
| Operational navigation | Desktop is a planning cockpit; mobile is a field instrument. Test `Today · Itinerary · Map · Split · Guide` against real scenarios before changing navigation | Partial; no navigation rewrite is authorized by this register |
| Offline guarantee | Itinerary/transit, booking/access details, SOS/language, contingencies, and Trip Split must work offline | Partial; requires pre-freeze field simulation |
| Group access | Anyone with the trip link can use ordinary trip/group features; sensitive access details require an additional lightweight protection layer | Partial; ordinary link access exists, sensitive-field separation is incomplete |
| Group authority | Companions may complete activities, add expenses/notes/saves, and contribute their bookings; the owner controls itinerary changes | Partial |
| Trip Split | Keep it simple and dependable: amount, purpose, payer, participants, balances, minimized repayments | Realized; harden rather than expand |
| Post-trip memory | Preserve plan vs. actual, notes, expenses, recap, and reusable evidence-backed lessons | Partial; Learnings exists |
| Saved | Contextual capability, not a primary destination, until repeated use earns that position | Realized as product direction |
| Engineering boundary | Finish and harden the current product; no wholesale rewrite or generalized subsystem without demonstrated travel value | Active constraint |

## R1–R18 — research depth, food, reservations, and completion

| ID | Finalized decision | State | Required landing point |
|---|---|---|---|
| R1 | Candidate breadth scales with the destination; stop on demonstrated saturation rather than a universal quota | Partial | Replace hard success semantics with risk-scaled floors plus an explicit saturation record |
| R2 | Food quality and menu fit lead. Distance/ease matter more for large groups and difficult days; solo travel tolerates more friction and splurge detours | Partial | Candidate judgment and itinerary-fit rubric |
| R3 | Seek hidden/local alternatives when they are genuinely better, worth the effort, or useful crowd relief; obscurity has no value by itself | Partial | Pass B doctrine and critic |
| R4 | Operational truth and experiential judgment use appropriate, distinct evidence rather than one undifferentiated source ladder | Partial | Two evidence lanes in verification doctrine |
| R5 | Research and surface depth scale with consequence and importance | Partial | Risk model, dossier triggers, presentation rules |
| R6 | Use a middle-ground default: sufficient independent support without exhaustive research when the decision is low-risk | Partial | Search budgets and stop rules |
| R7 | Important reservations are operational objects: booking route, opening/release timing, party rules, foreign-user friction, cancellation, and fallback | Partial | Reservation dossier/protocol |
| R8 | Native-language research is adaptive overall, with deeper local-first work in strong local ecosystems when the category or evidence warrants it | Conflict | Current Pass B mandates a full native-first sweep |
| R9 | Menu/experience and traveler fit dominate restaurant ranking; blended independent evidence supports the judgment; awards are corroboration or a tiebreaker | Partial | Food research rubric |
| R10 | Prefer the practical booking path normally; preserve a meaningfully better difficult option when an intermediary such as the hotel makes it realistic | Partial | Reservation escalation and final output |
| R11 | Detect copied consensus. Independent, detailed agreement matters more than raw mention count; material disparity earns more verification | Partial | Source-independence and disagreement protocol |
| R12 | Every new API/MCP must prove repeated value before becoming permanent | Missing | Evaluation harness and tool-adoption gate |
| R13 | Language friction should not automatically disqualify exceptional experiences, but normal output should favor a practical assisted route over making the traveler a specialist | Partial | Reservation/language protocol |
| R14 | Keep a deep internal reservation dossier; scale its depth and show only the useful subset to travelers | Missing | Dossier schema/artifact and renderer mapping |
| R15 | Recommend the practical itinerary choice while preserving a genuinely superior difficult option as **Worth the Effort/Detour** | Missing | Guide-author rule, schema choice, rendering/test |
| R16 | Native research must be auditable through results/metrics and query purpose, without storing every result dump | Partial | Discovery table exists; durable telemetry does not |
| R17 | Use cannot-fail transport depth only for remote, fragile, or consequential legs; prefer the robust reasonable route and account for disruption | Partial | Transport protocol and guide output |
| R18 | Research is done when discovery saturates, the winner can be defended against serious alternatives, failure conditions are known, and unresolved evidence is unlikely to change the choice | Partial | Stop-reason artifact and gate semantics |

## R19–R41 — evidence, transit, freshness, and learning

| ID | Finalized decision | State | Required landing point |
|---|---|---|---|
| R19 | Plan with a realistic traveler value while retaining the official minimum/source when credible experiential evidence shows the difference | Partial | Fact/experience evidence lanes and transport output |
| R20 | For important subjective recommendations, classify independence/derivation/affiliate incentives; weak sources may discover leads but not decide | Missing | Source analysis protocol |
| R21 | Decision-changing disagreement receives a bounded extra investigation: recency, entity, independence, material change, and stronger evidence | Partial | Explicit budget, artifact, and metrics event |
| R22 | Post-trip learning is lightweight by default and deeper for notable outcomes; weight explicit feedback, behavior, repeated results, corrections, and rejects differently | Partial | Learnings and traveler-pattern evidence model |
| R23 | **Provisional C:** use a structured native-query concept matrix plus freedom to learn local vernacular | Partial | Native research protocol |
| R24 | Preserve query family, purpose, novelty/result, and saturation for Pass B/native work—not raw result dumps | Missing | Run event/ledger contract |
| R25 | Any serious operational mismatch can remove a restaurant from the load-bearing plan; an exceptional reject may survive as Worth the Detour | Partial | Rejection rubric exists; alternate surface does not |
| R26 | Run deep booking escalation only for exceptional/high-priority candidates | Missing | Reservation trigger |
| R27 | Fragility is case-specific but must consider buffer, station complexity, missed-service penalty, group/mobility, and absence of alternatives | Missing | Transport risk assessment |
| R28 | Prefer robustness over minimum travel time in most consequential cases | Partial | Transport doctrine and itinerary decision record |
| R29 | Last-service and stranded-state research scales with remoteness and consequences | Partial | Transport dossier |
| R30 | A tight or important timetable transfer is not verified until the physical transfer is plausible | Missing | Transfer protocol/gate |
| R31 | Route recommendations account for actual group size, luggage, mobility, children, language, and ticket friction; taxis may be more sensible | Partial | Intake data exists; formal route judgment does not |
| R32 | Research fallbacks broadly but surface them only when risk is meaningful, including sudden closure/suspension risk | Partial | `plan_b` exists; trigger and verification depth vary |
| R33 | Evaluate door-to-door reality internally; expose detailed legs selectively | Partial | Route research and output |
| R34 | Prior-year event dates may establish recurrence but must not become dates in the target-year itinerary until officially announced | Partial | Event rule and regression fixture |
| R35 | Assign risk-scaled validity/recheck timing and run a pre-trip reverification sweep, with very volatile anchors checked close to use | Partial | Shelf life/pretrip exists; validity horizon and UI need completion |
| R36 | Minor degradation gets a note; material degradation triggers value reassessment; severe degradation can trigger replacement research | Missing | Closure/impairment protocol |
| R37 | Reservation lifecycle depth scales with importance/scarcity; high-scarcity anchors get release, identity/payment, cancellation, fallback, reminder, and recheck depth | Missing | Attraction/event reservation dossier |
| R38 | Brand-level evidence may support stable menu facts, but operational or experiential claims resolve to the exact branch whenever differences could matter | Partial | Entity-matching rule and tests |
| R39 | Freshness is category/claim-specific and intelligently risk-scaled | Partial | Shelf-life model exists; subjective evidence windows need definition |
| R40 | Detailed, recent, firsthand evidence materially outweighs vague secondhand reputation summaries for experiential claims | Partial | Experience-lane protocol |
| R41 | Source reliability may be learned only by claim type, must alter search choices, reduce redundant work, and remain owner-inspectable | Missing | Deferred source-memory capability; do not build before core metrics |

## R42–R48 — reversible defaults, not recorded votes

These defaults support the surrounding finalized doctrine but require evidence before they grow
into a generalized memory system.

| ID | Provisional default | State |
|---|---|---|
| R42 | Memory proposes; current research verifies according to claim volatility | Partial — prior learnings exist, reusable research memory does not |
| R43 | Proven source paths may influence search order while retaining deliberate exploration | Missing |
| R44 | Owner may inspect researcher-level reasoning/evidence; ordinary travelers see only operationally useful confidence and uncertainty | Missing; Pipeline UI is the intended owner surface |
| R45 | Record why research stopped and expose it to the owner on demand | Missing |
| R46 | Uncertain options may be clearly labeled adventure choices but cannot be load-bearing when failure matters | Realized in ship/flag/omit doctrine; surface consistency needs tests |
| R47 | Reserve a small discovery allowance for exceptional preference-breaking local specialties | Missing; low priority |
| R48 | Preserve important/high-quality rejects with rejection reason and conditions that would make them viable later | Partial — candidate ledger preserves rejects but not reusable conditions consistently |

## R49–R61 — final explicit decisions

| ID | Finalized decision | State | Required landing point |
|---|---|---|---|
| R49 | Native-language research becomes mandatory when English evidence is thin, generic, contradictory, insufficient, or tourist-heavy | Conflict | Replace unconditional native-first success rule with a recorded trigger |
| R50 | Strong local-language evidence stands normally when operational facts are strong; English coverage is not required | Partial | Separate experience corroboration from operational verification |
| R51 | Deep reservation research goes to the top 2–3 and any candidate whose resolved friction could change the itinerary | Missing | Reservation trigger and metrics |
| R52 | Investigate hotel concierge capability only for a specific meaningful booking that could benefit | Missing | Demand-driven concierge branch |
| R53 | Preserve an unconfirmed experiential concierge lead; actively confirm it when the experience is exceptional enough | Missing | Honest lead state and escalation rule |
| R54 | Show the practical recommendation plus a separate Worth the Effort/Detour option with the tradeoff | Missing | Guide contract and UI |
| R55 | Agent count is not sacred. Add, retain, merge, or remove roles only when controlled tests show better quality per token | Missing | Frozen-fixture architecture evaluation |
| R56 | Claude remains the production backbone through September; GPT is a later controlled experiment, not a dependency | Realized | Keep production workflows Claude-only through freeze |
| R57 | A permanent tool must be broadly useful and improve both discovery and correctness; time/token savings are a bonus | Partial | Tool evaluation scorecard |
| R58 | Do not build NAVER/Resy/helper integrations now. Prefer existing web research and deterministic scripts; implementation detail matters only when educational or outcome-relevant | Realized direction | No integration-platform work before freeze |
| R59 | Sonnet may use judgment over spending with existing safety limits; measure Intake-to-Finished time, tokens, attempts, and cost before optimizing architecture | Missing instrumentation | `run-metrics.md`, emitter, UI |
| R60 | GPT is not planned in production. If a later experiment yields important unresolved disagreement, escalate it to the owner; evidence gathering precedes escalation | Not applicable yet | Evaluation-only behavior |
| R61 | Finish research/engineering by 2026-09-30, reserve late September for real-trip/adversarial/offline testing, and finalize UI the following week | Missing as execution state | `implementation-roadmap.md` |

## Precedence

When rules appear to conflict:

1. Creator decisions in this register define product intent.
2. Verified-fact safety rules may make implementation stricter, but cannot silently reverse intent.
3. The current workflow describes what exists, not what has been approved forever.
4. Provisional R42–R48 defaults cannot independently justify a new subsystem before the core
   doctrine, metrics, and field reliability work are complete.
