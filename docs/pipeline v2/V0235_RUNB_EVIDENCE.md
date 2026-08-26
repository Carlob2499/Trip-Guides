# V02 / V03 / V05 — Combined Research Run B (Tottori) evidence packet

Status: **V02 FAIL · V03 FAIL · V05 FAIL — repair before cutover**
Authority: `VALIDATION_RUNBOOK.md` §V02/§V03/§V05 · frozen scenario `VALIDATION_TRIAL_PACKETS.md` §"Combined Research Run B"
Verdict process: orchestrator judgment from durable artifacts, independently challenged by a fresh-context Opus 5 adversarial review. The reviewer **overturned** the orchestrator's provisional three-YELLOW read; the orchestrator verified the two internally-provable triggers directly and adopted FAIL on all three classes.

## Run identity

- Slug `tottori` · runId `tottori-20260826-e29ab7` · branch `research-v2/tottori`
- Scaffold/dispatch head `066460c` (frozen 8-adult / BINDING-mobility / luggage / no-car intake committed before any model output)
- Last gate-accepted checkpoint `b153af3` (reconcile complete) · HEAD `28337c9` (unaccepted critic attempt-3 output)
- Workflow runs: 33000323043 → 33007434470 (auto-repair) → 33009304348 → 33012692323 → 33020508988
- Frozen candidate exactly: Sonnet 5 high (A + reconcile), Sonnet B, Opus 5 critic
- `landMode: pr`; publication false; landing never reached. Publication boundary held.

## Stage history

| Stage | Attempts | Outcome |
|---|---|---|
| Pass A | 1 | complete first try (22 min) |
| Pass B | 1 | complete first try (22 min), native-language primary channel |
| Reconcile | 3 | gate findings 10 → 1 → 0; complete at `b153af3` |
| Critic | 3 | gate-failure (2 provenance findings) → **usage-limit** (592 s) → gate-failure (3 residuals) |

Attempt budget exhausted 5/5 (auto-repair 1/1); one of five dispatches consumed by an account usage limit.

## Why FAIL — one immediate-FAIL trigger per class, evidence-cited

- **V02 — translated ambiguity hardened into operational certainty (×2).** `ev-matsuba-gani-season` asserts "opens November 6, 2026" while quoting its only cited source (`torican.jp`) as saying "early November" — day-precision exceeding the source *inside the record's own claim text*, then re-cited to the official page at reconcile under the cite-up-the-ladder rule and shipped as "doesn't open until Nov 6" (drove two candidate rejections). Second instance: mitokusan.jp's 有料 ("chargeable") became a shipped "¥800" waraji rental price. Orchestrator-verified from `evidence.v2.json` alone.
- **V03 — last practical return invented/misattributed where consequence is high.** The anchor Kurayoshi→Misasa record was researched against Hinomaru route 72/73 (URL `/3455/`), whose stop list — per the critic's durable re-fetch (`ledger.md` at HEAD) — does not include Kurayoshi Station; the shipped 19:08 "last confirmed departure" is that depot line's, unreachable where the guide tells the party to stand (the station line is 70/71, last 19:25; real midday gap 80 min not ~100). The whole Day 2 was timed against it across five surfaces. Additionally the ability-split day's Misasa→Mitokusan leg received **zero** transport research (`transport[]` holds exactly one route; `depth.transport.requiredRouteIds` never asked) — orchestrator-verified.
- **V05 — taxi cost fabricated.** `ev-jumbo-taxi` lists regular-car (¥740 + ¥90/279 m) and large-car (¥790 + ¥100/224 m) tariffs as distinct figures; the shipped fallback prices the 9-seat jumbo — the flagship mobility recommendation — at the **regular-car** rate, presented as "published metered rates" with no ⚠ (critic re-fetch puts the real jumbo tariff higher still: ≈¥5,600 vs the ≈¥3,500 implied, ~60% understatement). Orchestrator-verified internal contradiction. Aggravated by `foreignFriction: "None"` on a Japanese phone-only advance-booking service and an unsourced "90–120 min round trip" climb duration.

## What genuinely passed (preserve in the record)

- Anti-padding/saturation behavior exemplary: two single-sourced native leads (Kissa Sante, Santo Mato) held as leads, never force-corroborated; earned stopping note.
- Native-language research was real, justified, inspectable (21/43 evidence records `language: "ja"`), and decision-relevant — its failure is precision hygiene, not performativity.
- Physical-vs-timetable separation well-architected; unreadable fare PDF recorded as a blocked unknown; the 2009-dated ~¥2,880 taxi figure handled correctly and never shipped as a number.
- V05's ≥2-decision condition met with five inspectable intake→evidence→decision chains; the Yakiniku Masashige party-of-8 trace (booking-widget cap ≠ real 2–60 room capacity, triangulated across three source kinds) is the best single piece of work in either run and survives the critic's corrections.
- **The critic detected every defect above from fresh context**, with per-fact citation-audit tables and deliberate re-sampling. Detection is proven; bounded repair-to-green is what the run could not demonstrate.

## Defect classification (runbook §10)

- **Research quality (the class verdicts):** precision hardening of Japanese sources; tariff-category misapplication; wrong-line timetable attribution; unsourced exertion figure; missing transport research on a consequential leg.
- **Deterministic pipeline (new, for the repair list):** (R-C) the reconcile gate accepted `b153af3` although its tree fails `npm run build` (facts.json `≈`+`state:"approx"` chip renders into two panels lacking `verified_on`) — the reconcile gate does not run the build gate the critic runs; (R-D) `check-candidates.mjs` substring matcher re-fired its documented qualifier-mismatch false positive ("Camel commute" vs "camels' own commute path"), burning capped budget — same class as the V2 canary and Tokyo's Kobikicho Ohno event; (R-E) **dual-pass corroboration counted two passes converging on the same wrong number (the 600 m viewpoint distance) as independence** — the most cutover-relevant structural finding; (R-F) `coverage.v2.json` over-claims: every ask "covered"/reason null in both states, including a priority the HEAD guide itself declares unresearched, with disproven evidence ids backing the BINDING-mobility ask. Also recurring from Run A: (R-A) post-critic `evidence.v2.json` desync (byte-identical at both states, contradicting the HEAD guide on the anchor transfer — the artifact V07 reads); (R-B) usage-limit failures consume the bounded attempt budget.
- **Constraint breach in shipped content:** the no-rental-car BINDING clause is contradicted at `b153af3` (dune free-parking advice; accessibility answer framed around parking-space counts).

## Rerun necessity

A repair-then-revalidate cycle is required for these classes before cutover (FAIL per the completion rule). The repairs are largely drafted in the unaccepted HEAD; what was never demonstrated is a gate-accepted, self-consistent end state. Judging protocol for any rerun: two-state scoring as here; treat critic citation-audit tables as durable evidence.
