# Field Report — Waypoint vs. itself and the market (2026-07-22)

> **Reference snapshot — do not execute from this file.** The actionable work items live in
> `docs/PLAN_FIELD_REPORT_FIXES.md`; this file is the evidence base behind them. Method:
> a 106-agent deep-research pass (24 web sources fetched, 116 claims extracted, 25
> adversarially verified, 23 confirmed) plus three same-day file-level codebase audits.
> Interactive version: the "Waypoint — Field Report" artifact (claude.ai).

## Verdict

The market evidence strongly validates Waypoint's core bet — AI-generated travel content is
measurably unreliable, travelers know it, and verified provenance + recertification is the
mechanism the research literature itself recommends. But the moat is only **partially
machine-enforced** today, and the autonomous factory that is supposed to scale it **has never
completed a real headless run**.

Scorecard: core bet **strong** · pipeline hardening **strong** · provenance enforcement
**partial** · autonomous-run proof **gap** · feature completeness **partial** · market
differentiation **strong**.

## 1 · The core bet, tested against evidence

- **Hallucinations erode trust and can't be fixed at the model level.** Peer-reviewed
  (J. Consumer Behaviour 2026, n=1,004): itinerary hallucinations significantly reduce
  perceived accuracy → usefulness → trust → intention-to-follow; authors conclude errors must
  be managed with verified-source coverage + human oversight — Waypoint's exact design.
  **[high confidence]**
- **Field failures are real and dangerous:** AI sent tourists to a nonexistent Peruvian
  canyon at ~4,000 m; stranded a couple on a Japanese peak via wrong ropeway times; a tour
  operator's AI ranked a fictional hot springs. **[high]**
- **The engineering choices match the literature:** grounded citation ≤60% / attribution
  ≤58.9% F1 without enforcement (GaRAGe, ACL 2025) → primary-source discipline justified;
  ~10% RAG performance drop on time-sensitive facts → shelf-life/recert justified; multi-agent
  consensus filtering +2–11% accuracy (MAIN-RAG, ACL 2025) → dual-pass reconcile justified;
  retrieval-grounded + critique verification +5.8 macro-F1 over best LLM baseline (CiteCheck,
  preprint, adjacent domain) → a dedicated verify gate justified. **[high, one starred]**
- **The counter-finding:** single-pass review beat every multi-turn variant in a controlled
  test (F1 .376 vs .303; extra rounds = +62% false positives). Lesson: value lies in
  *independent corroboration and grounding*, not iteration count — keep the Critic
  evidence-gated. **[medium]**
- **Demand-side:** only 22% would consider agentic AI for a trip; 79% uncomfortable with
  unapproved booking; US comfort with AI planning fell to 30% (18–24s: 47%→34%). 82% of group
  travelers pay a "peace tax" to avoid money conflict; 61% cite hidden fees as top booking
  frustration. The honest, approval-preserving stance is a market **advantage**. **[high/medium,
  several stakeholder-commissioned surveys]**

## 2 · Verification as actually built (code audit, current `main`)

Machine-enforced hard gates: prose-tag allowlist (XSS) · `json-embed` script escaping ·
contrast / tab budget / learnings join-integrity · `entry`/`advisory` schema-required
provenance. Conditional: the `≈`-without-`verified_on` gate fires **only** on
`provenance:"strict"` guides, section-level types only. Silent: **precise undated hours/prices
pass every hard gate** (43 info-level findings on korea, 13 on denmark). Convention-only:
source tiering (T0/T1/T2), dual-pass, disproof search.

**The central gap:** the two rendered exemplar guides (korea, denmark — both archived) are NOT
strict; korea carries partial structured provenance + 197 unenforced `≈`, denmark is
essentially one prose `verified` blob + 70 unenforced `≈`. The strict regime lives only on the
draft tier (us/mexico/portugal).

## 3 · Pipeline state (code audit, current `main`)

Fixed and verified in code: resume ordering (checkout before state mutation) · attempt
circuit-breaker persists to the research branch, cap 5 → `stuck` issue · shared `isValidSlug`
everywhere (path traversal + workflow injection) · issue free-text passed as data via
`change.txt` · `land-branch.sh` distinguishes real failures from merge conflicts ·
`json-embed` XSS escaping.

**Open — the #1 hole:** the autonomous path graduates on an **offline** verify
(`research-pass.yml` self-correction loop step (a) has no `--network`); the post-graduation
`--network` scorecard run is cosmetic because `PASSED` derives from the checkpoint, not the
verify exit code. And the content gate **fails open**: `check-photos` returns `apiError` which
`verify-guide.mjs` never reads, and `check-links` buckets outages as `error` (non-blocking) —
a Commons/network outage reports content PASS.

**Open — proof:** the headless Action → auto-merge loop has never fired (blocked on the
`CLAUDE_CODE_OAUTH_TOKEN` secret). The scripted spine was proven once, interactively (Sedona:
all checkpoints, human commit authors, `attempts: 0`).

## 4 · Feature parity (vs Wanderlog / Mindtrip / Layla / TripIt et al.)

Beyond parity (unique): verified source-dated facts · auto-recert of stale facts · post-trip →
next-trip learning loop · ranked-priority personalization · free no-account offline (paywalled
at ~$40/yr elsewhere; map tiles still uncached). Parity: maps + GPX/ICS, group budget-split.
Deliberately rejected (defensible): booking/live prices, live co-edit of guide content,
reservation vault, flight alerts, instant AI itineraries. **The one plain gap: route
optimization** — Wanderlog Pro's paid online-only headliner, buildable here free/offline from
already-verified coords. Liability: `phrases`, `entry`, and `weather` ship as **empty
mechanisms** on the live guides. Competitor pricing figures are single-source practitioner
teardowns **[low confidence]**: Wanderlog Pro ~$39.99–40/yr, TripIt Pro $49/yr, Layla
$9.99/mo≈$50/yr, Mindtrip free 11M-POI + Priceline/Viator booking.

## 5 · Prioritized roadmap (impact × feasibility)

| # | Item | Why | Effort |
|---|------|-----|--------|
| P0·1 | **Fail-closed `--network` gate on the auto-publish path** | A guide can auto-publish with dead citations; outages report PASS | Trivial |
| P0·2 | **One real end-to-end autonomous run** (needs OAuth secret) | The factory claim is unproven; also validates P0·1 | Low + wait |
| P1·3 | **Enforce the doctrine on shipped guides** (promote undated-figure detector to blocking on strict; korea backfill-or-caveat) | Makes "verified" machine-true where visitors look | Medium |
| P1·4 | **Fill dormant safety content** (`entry`, `phrases`) | Research-only; denied-boarding stakes; removes empty-demo liability | Low (research) |
| P1·5 | **Free client-side route optimizer** (advisory) | The one plain parity gap; free+offline vs their paid+online | Medium |
| P2·6 | **Keep the Critic evidence-gated** | The single-pass finding warns against faith-based extra passes | Prompt-only |
| P2·7 | **Hygiene**: shelf-life constant dedup/test, SOS coverage, map-tile offline decision, guide-shape resolution dedup | No half-turned keys | Low |

## Confidence & limits

High confidence: peer-reviewed accuracy findings; the code audits (same-day, file-level).
Caution: CiteCheck/single-pass/hotel-bias are preprints, two adjacent-domain; the fake-photo /
agentic-AI / peace-tax numbers are stakeholder-commissioned surveys; competitor pricing and
market sizing (~$166B 2025, ~34% CAGR claimed) survived extraction but not adversarial
verification. No source provides a population-level "X% of AI itinerary facts are wrong" rate.

Key sources: Wiley JCB 10.1002/cb.70105 · ACL 2025 (GaRAGe findings-875, MAIN-RAG long-131) ·
arXiv 2605.27700, 2603.16244, 2606.16344 · Global Rescue Fall-2025 · YouGov 52770 · CIT
Bank/Harris 2026 · Fullstory 2026.
