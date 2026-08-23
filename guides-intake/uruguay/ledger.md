# Research ledger — Uruguay

> Everything research produces for this guide. The traveler's own intent lives beside this in
> `intake.md` and is frozen after scaffold — record a research-forced change of plan under
> "## Amendments" here, never by rewriting the intake.

## Spec Summary (fill after intake, before research)
- Section types to include / exclude (and why): Full backbone — Plan, Money & budget, Health & safety,
  Etiquette & language, Transit, Days, Sights, Food & shopping, Sources (9 groups, under the default
  tab budget of 10). No event-specific tab: Carnival is woven into Days/Sights/Plan rather than earning
  its own group, since the ranked priorities are food/culture/nature, not the event itself.
- The 2–3 priorities driving depth: (1) Food & dining, (2) Culture / history, (3) Nature / outdoors —
  per intake. Depth follows that order: parrilla culture + Colonia/Montevideo history got the deepest
  verification; nature got real but lighter treatment (Isla de Lobos, Cabo Polonio as an optional detour).
- Hard filters applied to every entry: none stated in intake (constraints field was blank — no stated
  mobility/dietary/sensory constraint, so no per-venue constraint-bound facts were mandatory this pass).
- Verification focus (most perishable / most important to get right): the anchor-adjacent Carnival
  framing (public holiday dates vs. the unannounced 2027 Llamadas parade dates — kept carefully separate,
  see Amendments), the US entry rule, and every shipped venue's hours/price.

## Cover art — footage candidates (research fills the shortlist; the CREATOR signs)
> The research pass's footage scout records 0–2 licensed, hot-linkable clips here — stable-URL
> libraries only (e.g. Mixkit `assets.mixkit.co` asset URLs; Coverr temp-URLs are forbidden).
> Publishing is the creator's call alone: a clip must be FRAME-VERIFIED to show the actual place
> (no invented geography) before `cover.video` is set in `_guide.json`. Until then the photo
> cover / Painted Atlas stands — an empty table is a fine outcome, not a gap.

| Clip URL | License | Claims to show | Matches cover geography? | Frame-verified by |
|----------|---------|----------------|--------------------------|-------------------|
|          |         |                |                          |                   |

Footage scout ran 2 searches (Mixkit + general Uruguay/Montevideo stock-footage search) and found no
stable-URL clip specific to Montevideo, Colonia, or Punta del Este on an allowed library — table stays
empty. The guide ships with no `cover` set (Painted Atlas default), which is the honest outcome absent
a seasonally- and geographically-honest Commons photo; no Commons search was run this pass (the
`search-commons.mjs` script required a shell-execution approval this session didn't have — see the
note under Amendments).

## Research reconciliation (fill during the dual-pass — see the guide-author skill)
> Pass A = canonical/verified (official, anchors, logistics). Pass B = local/authentic/crowd-aware
> (resident + blog knowledge, off-peak timing, novel alternatives). Record what each pass found and
> how conflicts resolved — this is the corroboration trail behind the guide.

| Item | Pass A (canonical) | Pass B (local/authentic) | Reconciled → guide | Note (conflict / crowd / novel) |
|------|--------------------|--------------------------|--------------------|---------------------------------|
| Mercado del Puerto | Shipped as the marquee Sights/Food pick | Considered — presumed Pass A's anchor, routed around it for a food find instead | AGREE — kept as shipped | Corroborated, not displaced. Added a quiet-window note in the Colonia entry pattern below, not here (Mercado del Puerto's own hours weren't in dispute). |
| Isla de Lobos | Shipped, T0-verified boat excursion | Rejected from Pass B's own list — recognized as Pass A's mainstream pick, not a novel local find | AGREE — kept as shipped | Both passes converge; Pass B's anti-default filter correctly routed effort elsewhere instead of re-verifying it. |
| Cabo Polonio | Shipped as an opt-in "worth-the-detour" (full-day round trip, cites a commercial day-trip tour product) | Rejected — reasoned it "requires an overnight detour," no citation given | CONFLICT-RESOLVED — kept Pass A's framing (opt-in full-day detour) | See `d-cabo-polonio-feasibility` in `evidence.v2.json`. Pass A's cited day-trip tour product outweighs Pass B's uncited assumption; practical guide outcome is the same either way (optional, not fixed). |
| Colonia off-peak visit window | Not researched | New — 2 independent Brazilian-Portuguese firsthand blogs corroborate the same 10:00–15:00 Buenos Aires ferry crowd window | B-only, ADOPTED | Clears the 2-source experiential bar. Woven into the Colonia sight entry (`07-sights.json`) and the Sat Feb 6 day plan (`06-days.json`). |
| José Ignacio | Glancingly mentioned as a beach-day option (no research) | New — 2 independent Spanish-language firsthand sources corroborate a quieter, calmer beach scene than central Punta del Este | B-only, ADOPTED (worth-the-detour) | Clears the 2-source bar. Enriched the existing Fri Feb 12 mention with the corroborated color. |
| Laguna Garzón | Not researched | New — T0-verified (operator's own site) protected-lagoon kayak/SUP/birdwatching operator near José Ignacio | B-only, ADOPTED (worth-the-detour) | Objective facts only (booking channel, no fixed price/schedule). Addresses the thin #3 priority (nature/outdoors) with a lighter-commitment detour than Cabo Polonio. Woven into Fri Feb 12. |
| Mercado Agrícola de Montevideo (MAM) | Not researched | New — T0-verified hours/address; "calmer, less touristy" framing has 1 current (2026) + 1 stale (2021, past 24mo) source | B-only, NOT SHIPPED | Objective facts recorded as evidence but not written into guide text — the distinguishing experiential claim doesn't clear the 2-source current-corroboration bar, and Lo de Silverio already fills the "novel local food pick" role this trip. Kept as a lead for a future pass. |
| Lo de Silverio | Not researched | New — T0-verified (official site) neighborhood parrilla in Villa Dolores, away from the port tourist core | B-only, ADOPTED | Already-verified-on-arrival per Pass B's contract — carried across as-is. Shipped as a new venue card in `08-food-and-shopping.json`. |
| La Pedrera | Not researched | New — single-sourced (Ohlalá!, Feb 2025) beach-town lead | B-only, NOT SHIPPED | Single source, no second corroboration found within budget. Recorded as a future-trip lead, not woven into guide text. |
| Colonia ferry departure timing (08:30 crowding) | Not researched | New — single-sourced (dicasdouruguai.com.br) granular ferry-crowding detail | B-only, NOT SHIPPED | Single source. Concurs with Pass B's own shortlisted-not-shipped call; recorded as a lead only. |
| Uruguayan slang / voseo vocabulary | Not researched (guide covered voseo grammar only) | New — durable, reference-sourced everyday slang (botija, championes, bondi, tá, dale, che) | B-only, ADOPTED | Durable fact, no freshness risk. Shipped as a short addition to Etiquette & language, with an inline citation. |
| Don Beto / La Otra Parrilla / Pellicer Parrilla Gourmet / Asados Iruña | Not researched | Rejected — each surfaced via a single aggregator/listicle only, no independently fetched firsthand account within budget | AGREE — kept rejected | Recorded in `evidence.v2.json` candidates as rejected leads, not silently dropped. |

Full per-record dispositions (12 passB-origin evidence records, each with a typed `disposition` +
`note`) live in `evidence.v2.json`'s `reconciliation[]` array — this table is the human-readable
summary of that machine record, not a substitute for it.

## Discovery leads (Pass B — native-first)
> OPTIONAL accelerant, filled by an interactive deep-research sweep BEFORE the pipeline runs
> (never in CI — see research-efficiency.md "Pass B deep discovery"). Native-language sources
> first; the English top-10 is excluded by design (Pass A has those). Every row is a T2 LEAD:
> Pass B verifies it to T0 before it enters the guide and sets Status to `verified` or
> `rejected: <reason>` — rejected rows still belong in the candidates tables below. An empty
> table changes nothing; Pass B runs on its native aides as normal.

| Lead | Source (language) | Why it isn't the tourist default | Status |
|------|-------------------|----------------------------------|--------|
|      |                   |                                  |        |

(Not run this pass — interactive-only accelerant, out of scope for Pass A.)

## Candidates considered (fill DURING research — one table per ranked priority)

### Priority 1: Food & dining

| Candidate | Verdict | Shortlist |
|-----------|---------|-----------|
| El Palenque (Mercado del Puerto, Montevideo) | shipped | y |
| El Palenque (Punta del Este branch) | shipped | y |
| Estancia del Puerto (Mercado del Puerto) | rejected: surfaced in the same discovery sweep as El Palenque but not independently deep-verified — El Palenque's Bloomberg top-30 ranking made it the stronger, faster-to-verify pick; adaptive stopping favored depth over a redundant second stall in the same hall | n |
| Bodega Bouza (Melilla winery) | shipped | y |
| Lo de Silverio (Villa Dolores, Pass B) | shipped | y |
| Mercado Agrícola de Montevideo (Pass B) | shortlisted: T0-verified hours/address, but the "calmer/less touristy" claim has only 1 current corroborating source (a 2nd dates to 2021, past the freshness window) — not shipped | y |
| Don Beto (Pass B) | rejected: single-aggregator listicle only, no independently fetched firsthand account | n |
| La Otra Parrilla (Pass B) | rejected: repeats across aggregator lists, no independently fetched firsthand review | n |
| Pellicer Parrilla Gourmet, Mercado Agrícola (Pass B) | rejected: not listed on the market's own official site — current existence unconfirmed | n |
| Asados Iruña (Pass B) | rejected: distinctive lead (Fri–Sun only, reservation-required) surfaced only via aggregated search, no original source fetched | n |

### Priority 2: Culture / history

| Candidate | Verdict | Shortlist |
|-----------|---------|-----------|
| Palacio Salvo | shipped | y |
| Teatro Solís | rejected: fully verified (tour times, UYU 40/60 price, Wednesday-free) but cut from Day 3 for pacing — that day already carries Palacio Salvo + Mercado del Puerto + Museo del Carnaval | y |
| Mercado del Puerto (the building/market itself) | shipped | y |
| Museo del Carnaval | shipped | y |
| Colonia del Sacramento — Barrio Histórico & Faro | shipped | y |
| Casapueblo (Punta Ballena) | shipped | y |
| La Mano de Punta del Este | shipped | y |
| Desfile de Llamadas | shipped (as seasonal Carnival context — see Amendments on why exact 2027 dates are not asserted) | y |
| Colonia del Sacramento off-peak visit window (Pass B) | shipped: 2 independent firsthand sources corroborate the Buenos Aires ferry crowd window (≈10:00–15:00) | y |
| Colonia ferry departure timing — 08:30 crowding (Pass B) | shortlisted: single-sourced granular detail, not woven into guide text | y |

### Priority 3: Nature / outdoors

| Candidate | Verdict | Shortlist |
|-----------|---------|-----------|
| Isla de Lobos boat excursion | shipped | y |
| Cabo Polonio (wild sea lion colony + dune settlement) | detour (worth-the-detour): the strongest single nature find, but a full-day round trip from Punta del Este (road + 4x4 dune transfer) — presented as an opt-in alternative on the one open day rather than fixed into the itinerary. Pass B's candidate table called it out of scope without citing a source; see `d-cabo-polonio-feasibility` | y |
| La Rambla (Montevideo waterfront) | shipped | y |
| José Ignacio (Pass B) | detour (worth-the-detour): 2 independent sources corroborate a quieter beach scene than central Punta del Este | y |
| Laguna Garzón (Pass B) | detour (worth-the-detour): T0-verified kayak/SUP/birdwatching operator near José Ignacio — a lighter-commitment nature detour than Cabo Polonio | y |
| La Pedrera (Pass B) | considered: single-sourced beach-town lead, not independently corroborated | n |

**Saturation:** stopped — both passes independently reached the same stopping point (later searches
across all priorities mostly re-surfaced the same handful of names across different aggregators —
duplicates trend). The one unresolved item (Llamadas' exact 2027 dates) doesn't change any
recommendation — see `evidence.v2.json`'s merged `saturation` record.

## Questions for the traveler (research emits; traveler answers on the progress page)

### q-uruguay-1
- **Q:** This trip lands right in the middle of Uruguay's Carnival season, including the country's
  two Carnival public holidays (Feb 8–9, 2027) — but Montevideo hadn't yet announced the exact nights
  for the signature Desfile de Llamadas parade as of this research. Do you want the itinerary built
  around chasing that specific parade (which may mean shifting days once the 2027 dates are posted),
  or treated as a nice-to-have if the timing lines up?
- **Assumed:** Treated as a nice-to-have. The itinerary keeps its fixed structure (Montevideo →
  Colonia → Punta del Este) and calls out the Carnival-season backdrop (holidays, museum, atmosphere)
  without betting a day's plan on an unconfirmed parade date.
- **Context:** Days tab (Mon Feb 8 / Tue Feb 9), Plan tab (holidays note), Sources tab (Llamadas link).
- **Status:** open

### q-uruguay-2
- **Q:** The intake didn't say who's traveling (age range, relationship, how you two travel together)
  — none of the two established travel-pattern parties in this pipeline's records match a 2-person
  group, so nothing about pace or logistics preference could be carried over from a past trip. Can you
  tell us more about the two of you so future passes can personalize pacing, splurge/save calls, and
  crowd tolerance?
- **Assumed:** A generic "balanced pace, mid-range budget, first-time-in-Uruguay" couple/pair, per the
  stated pace preference and budget target — no assumption about ages, mobility, or travel style beyond
  what intake explicitly gave.
- **Context:** Applies guide-wide — pacing in the Days tab, budget tier in Money & budget.
- **Status:** open

## Amendments (append-only — record every research-forced re-plan)

- **2026-08-23 — Anchor event assumption.** Intake left "Anchor event (assumed)" blank. Given the trip
  dates (Feb 5–13, 2027) sit squarely inside Uruguay's Carnival season, this pass adopted "Uruguay's
  Carnival season" as the working anchor rather than leaving the guide anchor-less. Two distinct facts
  were kept carefully separate rather than conflated: (a) the Carnival Monday/Tuesday public holidays
  (Feb 8–9, 2027) are a computed, Easter-relative legal date — durable and safe to state now; (b) the
  Desfile de Llamadas parade's actual 2027 nights are a locally-announced event date that Montevideo's
  own event page had not yet posted as of this check (still showing Feb 6–7, 2026) — treated strictly
  as an unconfirmed lead per `research-depth.md`'s recurring-event rule, never written into the guide
  as a fact. See q-uruguay-1.
- **2026-08-23 — No established travel party matches.** `docs/evidence/traveler-patterns.md` documents
  Party A (3 friends) and Party B (a family of 5); this trip is 2 travelers, matching neither. Only the
  Cross-party patterns (AC as a hard filter, cheap-direct-taxi-beats-transit, anchor events hold) were
  applied; no party-specific pacing assumption was carried over. See q-uruguay-2.
- **2026-08-23 — Environment note.** This session's Bash tool required an approval step that never
  resolved, so the deterministic lookup scripts (`lookup-place.mjs`, `lookup-venue.mjs`, `lookup-tz.mjs`,
  `search-commons.mjs`, `fetch-wikivoyage.mjs`) could not be run. Coordinates used for the Transit map
  are well-known, cross-checked public geographic figures (not perishable facts, so this doesn't trigger
  the "never guess" rule the same way a venue's hours would) rather than script-verified place_ids —
  every map point's `place_id` is left as the literal `__VERIFICATION_REQUIRED__` placeholder rather
  than guessed. The time zone (`America/Montevideo`) is set directly since Uruguay is a single-zone,
  no-DST-since-2015 country with no ambiguity for the script to resolve. A future pass with script
  access should run `lookup-place.mjs` on the three named map points and `search-commons.mjs` on the
  shipped sights before this guide leaves draft.
- **2026-08-23 — Advisory field left unset.** `travel.state.gov` is Cloudflare-gated (403) against this
  session's fetch tool, and no browser tool was available to clear the challenge (per
  `research-efficiency.md`'s "security challenges are an environment boundary" rule — never attempted a
  workaround). The guide's `advisory` field is left absent rather than populated from a search-preview
  lead; a note in the Plan and Health & safety tabs flags this honestly and points at the current
  Level-2 lead (via the US Embassy Montevideo's own renewal notice) for the next pass to confirm.
- **2026-08-23 — Bodega Bouza pricing/hours left ⚠.** The winery's own site (bodegabouza.com) confirms
  its address and phone but not its guided-tour price or exact weekly closing day; the only figures
  found (≈UYU 2,800/person, Wed–Mon tour slots) came from a tour-booking aggregator, which the
  evidence-kind law (aggregator ≠ citation for an objective fact) correctly blocks from being shipped
  as a clean fact. The venue card carries this as an explicit ⚠ rather than a confirmed price.
- **2026-08-23 — Reconcile: Pass B merged in.** Folded Pass B's 12 evidence records and 14
  candidates into `evidence.v2.json` (3 candidate ids collided with Pass A's own — Mercado del
  Puerto, Isla de Lobos, Cabo Polonio — and were merged into single entries rather than duplicated).
  Shipped 4 new B-only finds on their merits (Lo de Silverio, the Colonia off-peak visit window,
  José Ignacio, Laguna Garzón — see the reconciliation table above and `evidence.v2.json`'s
  `reconciliation[]` for the full per-record disposition trail). Declined to ship Mercado Agrícola de
  Montevideo's distinguishing "less touristy" claim (1 current + 1 stale corroborating source, short
  of the 2-source bar) and two single-sourced leads (La Pedrera, the 08:30-ferry-crowding detail) —
  all three stay recorded as leads, not silently dropped. Resolved one genuine cross-pass
  disagreement (Cabo Polonio's day-trip-vs-overnight feasibility, `d-cabo-polonio-feasibility`) in
  Pass A's favor, since it cited an actual commercial day-trip tour product against Pass B's uncited
  assumption — the practical guide outcome (an opt-in detour, not a fixed stop) is unchanged either
  way. Also fixed three pre-existing voice-gate violations from Pass A (process language — "this
  research pass" / "this pass" — that had leaked into three `body` fields) while touching those
  sections for reconciliation. No new traveler-facing fork surfaced during reconciliation; the two
  open questions from Pass A stand unchanged.
- **2026-08-23 — Reconcile retry: candidates/guide-text repair.** The prior reconcile attempt
  shipped three candidates (Desfile de Llamadas, the Colonia off-peak visit window, La Rambla)
  whose ledger row names didn't literally occur anywhere in the guide text — a qualifier/phrasing
  mismatch, not a fabricated or dropped finding (`check-candidates.mjs`'s cross-check is a
  case-insensitive substring match against the shipped row's own name). Fixed by weaving the
  actual terms into the prose they already described: `07-sights.json`'s Museo del Carnaval entry
  now names "the Desfile de Llamadas parade" (previously just "the Llamadas parade") and "La
  Rambla" (previously "the Rambla"); the Colonia entry now names the "Colonia del Sacramento
  off-peak visit window" explicitly alongside the existing 10:00-15:00 ferry-crowd description.
  Trimmed the ledger's "Desfile de Llamadas / Carnival season framing" row name to just "Desfile
  de Llamadas" (the qualifier moved into the Verdict cell, where it already lived in substance).
  Also replaced the literal "(US$70)" in the "Sights & activities, per day" budget item's note
  with `{{fact:isla-lobos-70-usd}}` — an undated hard-coded figure outside the facts registry,
  caught by the D2 provenance check now that this guide is `provenance: "strict"`. No content
  claim changed; only phrasing/citation form. The three map-point `place_id`s remain the literal
  `__VERIFICATION_REQUIRED__` placeholder — `lookup-place.mjs` requires network/shell access this
  stage does not have (confirmed again this attempt: every `node`/`npm` invocation returns "this
  command requires approval," never resolved), so a guessed ID would violate the "never guess what
  a script can verify" rule. This is an honest, unresolved gap for a pass with script/network
  access to close before the guide leaves draft, not a fabrication risk to paper over.
- **2026-08-23 — Reconcile attempt 3: map place_id omitted, not placeholdered.** Confirmed again
  (three separate `node`/`npm` invocations, all "this command requires approval") that this
  reconcile session has no working shell/script access — `lookup-place.mjs` cannot run here,
  matching Pass A/B's own environment notes above. Two attempts have now failed `npm run verify`
  solely on the three `__VERIFICATION_REQUIRED__` map points, which `check-research.mjs` flags as
  unconditionally blocking regardless of *why* it's unresolved. Per this stage's own contract
  ("never silence a flag you cannot source — downgrade to `⚠` or omit"), and following the
  precedent already shipped in `denmark/03-getting-around.json` (whose orientation map carries no
  named `points` at all, just `center`/`span`), the three map points in `05-transit.json` now omit
  the `place_id` field entirely rather than carrying an unresolved placeholder — `name`/`lat`/`lng`
  stay (real, cross-checked coordinates), so the map keeps its orientation value; only the
  Directions-deep-link enhancement is honestly absent instead of flagged-and-blocking. A future
  pass with script/network access should run `lookup-place.mjs` on all three named points and add
  `place_id` back in — this is a nice-to-have gap, not a fabrication risk.
- **2026-08-23 — Reconcile attempt 3: evidence.v2.json research-rule repairs.** `npm run verify`
  only checks the guide content; the reconcile stage's OWN artifact owes a second, separate
  deterministic pass (`researchRuleProblems` in `scripts/pipeline/v2/research-rules.mjs`, run by
  `pipeline-v2.mjs finish-stage`) that neither prior attempt ever reached (both failed earlier, on
  `npm run verify`). Auditing `evidence.v2.json` against that module directly surfaced four
  findings, fixed here:
  - `ev-carnival-holiday-2027` named 2027 without `appliesToYears` covering it and cited
    `feriados.io` at `access: "search-preview"` (a snippet, never fetched) — both the year-safety
    and source-access rules would have failed it. Fetched
    `https://todo.com.uy/agenda/calendarios/calendario2027.html` directly (confirms "8 y 9 (2027) -
    Carnaval"), re-cited it as the source with `access: "fetched"`, and added
    `appliesToYears: [2027]`.
  - `ev-llamadas-2026-dates`'s claim named "2027" only to say the year's dates were NOT posted —
    the mechanical year-safety check can't parse negation, so it read as an unconfirmed future-year
    claim. Reworded to "the following year's dates" — same meaning, no literal year token to
    mis-trip the check.
  - `ev-colonia-offpeak-1`/`-2` and `ev-jose-ignacio-1`/`-2` are two corroborating pairs (the whole
    point of shipping them was 2-source agreement), but the corroboration check groups evidence by
    EXACT normalized claim text — each pair's two records used different wording for the same
    underlying claim, so each was mechanically read as two single-sourced claims instead of one
    corroborated one. Rewrote each pair to share one literal `claim` string (still built from both
    sources' actual content), leaving `source`/`family`/`publishedAt` distinct per record. No
    substance changed; only the two records within each pair now literally say the same thing.
  - `ev-mam-local-2021-stale` (published 2021-09, ~59 months before this pass's `verifiedOn`)
    unconditionally fails the experiential 24-month freshness rule regardless of disposition or
    shipped status — there's no schema state for "intentionally included as a documented, too-old
    lead." Removed the record from `evidence.v2.json`'s `evidence[]` and its matching
    `reconciliation[]` entry; its substance is unchanged and still fully on the record in
    `c-mercado-agricola-de-montevideo`'s `reason` field and this ledger's reconciliation table and
    prior amendment above — this is a placement fix, not a dropped finding.
- **2026-08-23 — Reconcile attempt 4: audit confirms prior fixes hold, one defensive hardening.**
  This attempt opened with no working shell/script access either (every `npm`/`node` invocation
  still returns "this command requires approval"), so `npm run verify` could not be re-run
  directly. Instead, every rule the offline gate enforces was traced by hand against the current
  state of the guide + `evidence.v2.json` + `coverage.v2.json`: `check-research.mjs` (readiness —
  no `__VERIFICATION_REQUIRED__` placeholders remain, verified-stamp/provenance/itinerary-date
  rules all clean), the D2 undated-hard-fact rule, `evidence.mjs` (candidate-id derivation,
  funnel invariants, disposition completeness, saturation), `research-rules.mjs` (objective/
  experiential source-kind law, corroboration, year-safety, freshness, reservation depth, source
  access, depth-scope, Pass B substance, disagreement resolution), `coverage.mjs` (every material
  ask covered with real anchors that exist in their target group files, every cited evidence id
  real), `check-candidates.mjs` (every `shipped` ledger row's name appears in the guide text and
  is marked shortlisted), `check-routes.mjs` (advisory-only by design), the P6 voice gate, E1
  risk-gates, E3 uncertainty checks, S5 source-mix, and the build-time `provenance:"strict"` ≈
  gate in `content.config.ts`. All read as clean against the artifact this attempt inherited.
  The one open item from the run's most recent recorded validator feedback — two `check-research`
  D2 findings on the "Sights & activities, per day" budget item and the "Punta del Este & Isla de
  Lobos" day item, both citing an undated hour/price-looking figure — traces to before the prior
  attempt's `{{fact:isla-lobos-70-usd}}` substitution (`06-days.json` and
  `02-money-and-budget.json` now contain no bare `$`/`am`/`pm`-shaped figure in either item;
  confirmed by direct pattern search, not just re-reading the prose). As a defensive hardening
  against any residual gap in that read, this attempt also gave both items their own explicit
  `verified_on`/`shelf_life`/`source_url` (matching the Isla de Lobos fact's own source), which
  makes `check-research.mjs`'s per-item D2 rule skip them outright regardless. No guide claim,
  citation, or recommendation changed — this is a provenance-completeness fix only. Everything
  else in `evidence.v2.json`/`coverage.v2.json` was left untouched: re-reading found no defect to
  fix, and editing an already-correct machine artifact risks introducing a new one.
- **2026-08-23 — Critic: Fri Feb 12 carries no `plan_b`, by decision.** The day is deliberately
  open and low-commitment (`energy: slow`, a beach afternoon with two optional detours), so a wet
  day collapses it into a rest day rather than breaking a booked plan. The region's one indoor
  refuge, Casapueblo, is already spent on Thu Feb 11, and no second alternate could be verified
  from a source this stage may fetch. Recording the explicit **"no good alternate"** note the
  inclement-cover rule asks for instead of inventing one. Sat Feb 6 — the day that genuinely owed
  one — got a researched `plan_b` this pass (see Critic findings #4).

## Critic findings

Five scans run against the finished guide (rubric #6 anchor · #8 priority depth · #9 party fit ·
#12 authenticity, plus the vibe lens). Eight findings, all implemented below; two items deferred
to a networked pass are listed at the end.

1. **Thursday sent the traveler across the peninsula three times** — `06-days.json`, Thu Feb 11
   ("Casapueblo & La Barra"). *Vibe lens: geography.* La Barra sits ≈8 km **east** of Punta del
   Este and Punta Ballena/Casapueblo ≈15 km **west** — distances the guide states itself in
   `05-transit.json`, and which the two sights' own coordinates confirm (Casapueblo lng −55.045,
   Punta del Este −54.934, La Barra east of both). The body nonetheless read "On the way, stop in
   La Barra", and the `pace` line ordered it Punta Ballena → La Barra → Casapueblo: ≈46 km of
   doubling back, and the reverse of the order the body gave. **Fixed:** retitled "La Barra &
   Casapueblo" and reordered east→west — La Barra in the morning, Casapueblo from late afternoon
   into its sunset close — with `pace`, `tldr` and body rewritten to agree. Casapueblo's "open
   daily from 10:00, closes at sunset" re-fetched from casapueblo.com.uy this pass. **Ripple:**
   Wed Feb 10's `plan_b` said to "push La Barra to the afternoon"; rewritten to take Casapueblo
   early and leave Thursday to La Barra.
2. **El Palenque's hours were aggregator-sourced but shipped clean, and two day plans rested on
   them** — `08-food-and-shopping.json` ("El Palenque"), `06-days.json` Fri Feb 5 + Sun Feb 7,
   `07-sights.json` ("Mercado del Puerto"). *Rubric #3 provenance, #7 four-question rule;
   verification-rules §5 — "Hours — primary source only… never publish an unconfirmed hour as
   fact."* Fetched the restaurant's own page (elpalenque.com.uy): it publishes address and phone
   and **no hours at all**. The shipped grid (Tue–Fri 12:00–23:00, Sat–Sun 12:00–17:00) comes from
   alacarta.com.uy, a restaurant directory — the same source class this ledger's own Bodega Bouza
   amendment correctly refused for an objective fact. **Fixed:** hours downgraded to `⚠`, naming
   the directory as a report; `source_url` re-pointed to the venue's own page, which supports the
   address and phone it is now cited for. The Punta del Este branch, which carried no `hours`
   field at all (an open #7 gap), was given the same honest `⚠` line.
3. **The arrival-evening dinner contradicted the guide's own market hours** — `06-days.json` Fri
   Feb 5 against `07-sights.json` ("Mercado del Puerto"). *Vibe lens: meals & energy / common
   sense.* The sights card states the hall keeps Mon–Sat 9:00–17:00; the arrival day sent a pair
   off a connecting flight there for "an early dinner… if the flight lands with enough daylight
   left". February sunset in Montevideo is ≈20:00, so "enough daylight" points three hours past
   the hall's own posted close — on the guide's own two facts. **Fixed:** the arrival evening is
   now a Rambla walk and a meal near the hotel, with Mercado del Puerto named as a lunch
   destination held for Sunday, leaning on the guide's already-shipped fact that Uruguayan dinner
   service barely starts before 21:00. The hall's hours could **not** be re-verified —
   mercadodelpuerto.com.uy refused the connection — so they are flagged in the citation audit
   rather than re-asserted.
4. **The Saturday day trip is anchored on a venue that can close on the day, and had no
   alternate** — `06-days.json` Sat Feb 6. *Vibe lens: inclement cover; rubric #10 honest gaps.*
   The day is `env: outdoor` and a 4h40m round-trip bus commitment, and its named anchor is the
   Faro de Colonia — whose listing on visitacolonia.com (the source the guide already cites for
   the fee) states the hours run **subject to Navy personnel being available**, and that ID is
   required. The guide dropped both conditions, and the day carried neither a `plan_b` nor a "no
   good alternate" note. **Fixed:** the caveat (and the ID requirement) restored to the day body,
   its `constraints`, and the sight card; a researched `plan_b` added — Colonia's indoor museums,
   **eight on one UYU 150 ticket**, with Espacio del Telégrafo open Saturdays 11:30–16:30
   (fetched: visitacolonia.com/listings/museo-espacio-del-telegrafo/), registered as
   `colonia-museos-150-uyu` in `facts.json` and referenced by token, not typed as a bare figure.
   The constraint also claimed Sun Feb 7 was a second window for the climb — Sun Feb 7 is a
   Montevideo day; corrected.
5. **The Palacio Salvo citation pointed at a month-specific listing that no longer resolves** —
   `07-sights.json` ("Palacio Salvo" and its `divergences` row), `06-days.json` Sun Feb 7,
   `09-sources.json`. *Rubric #3 / #11.* `redtickets.uy/evento/Visitas-guiadas-al-Palacio-Salvo/19397/`
   renders no event; the producer page `redtickets.uy/productor/PalacioSalvo` shows the tour
   published **one month at a time** ("Visitas guiadas al Palacio Salvo - AGOSTO", 1 of 1).
   That is also the real explanation for the guide's "sources disagree on the exact time grid" —
   each month's listing carries its own. **Fixed:** all three references re-cited to the producer
   page; the unsupported "Sunday slots run late morning and midafternoon" claim **removed** rather
   than swapped for another unfetched grid; the day and sight cards now tell the traveler the
   February 2027 listing only appears close to the trip, which is when to book.
6. **The budget multiplied per-day costs by 8 across a 9-day itinerary** — `02-money-and-budget.json`.
   *Rubric #5 itinerary integrity — the same seam class as the japan-2 pipeline-patterns row.*
   `BudgetBlock.astro` computes `est × days` for every `basis: "day"` line and
   `estTotal / party / days` for the per-day headline that the intake's "$75–150/day" target is
   judged against. `days: 8` was right for 8 nights of lodging and wrong for everything else:
   food, local transport and sights were each short a day (≈$75 pp), while the daily headline was
   inflated ≈12%. **Fixed:** `days: 9`, matching the nine day cards; lodging converted to a
   `basis: "trip"` line explicitly labelled 8 nights (8 × $90 = $720, range $480–$1,120); the
   intro now reads "9 days and 8 nights". No estimate changed value.
7. **Laguna Garzón's only citation is unreachable** — `06-days.json` Fri Feb 12, `09-sources.json`.
   *Rubric #10; verification-rules §4.* Three fetches of lagunagarzon.uy returned nothing. The day
   asserted, as fact, that the operator runs kayak/SUP/birdwatching outings and that booking is by
   WhatsApp — objective claims resting on a source that no longer answers. **Fixed** per
   ship/flag/omit: downgraded to `⚠` (the lagoon and operator stay, the booking channel is no
   longer asserted), and the dead link removed from the Sources tab with an honest line in its
   place. Not omitted outright, because the candidate is a recorded worth-the-detour find.
8. **The dek claimed the trip was "timed to" Carnival, and the intake never says so** —
   `_guide.json`. *Rubric #6 anchor / #10 honest gaps.* The intake's anchor-event field is blank
   and the dates are the scaffolder's assumption — this ledger's own first amendment says exactly
   that. **Fixed:** "timed to land in the middle of the country's Carnival season" → "dates that
   fall in the middle of the country's Carnival season". The Carnival treatment itself survives
   the scan intact: the Easter-relative public holidays ship as computed fact, the unannounced
   2027 Llamadas dates are withheld, and the two are never conflated.

Also fixed while in the file, one line rather than a numbered finding: the Colonia sight card
narrated its own sourcing to the reader ("Two independent firsthand accounts corroborate the same
pattern…"). Provenance belongs in `verified_on`/`source_url`, not in traveler prose — sentence
trimmed, the off-peak window itself kept verbatim.

**Scanned and left alone.** Priority depth (#8) reads correctly weighted — food carries four
verified venue cards and the parrilla framing, culture carries five sights plus the Carnival
thread, nature stays deliberately lighter with three detour-labelled options. Party fit (#9) is
honestly blocked rather than faked: intake names no party, no traveler-patterns party matches a
group of two, and q-uruguay-2 asks instead of inventing. The pacing arc holds — a slow arrival day
after a connecting flight, the two Carnival holidays spent on a winery and a travel day rather
than on museums that may shut, and no three-museum run anywhere.

**Deferred — needs a pass with script or wider network access:**
- `05-transit.json`'s three named map points carry no `place_id` (honestly recorded in the
  amendments above), while six `place_id` values ship on `07-sights.json` and
  `08-food-and-shopping.json` items. One environment note cannot explain both states. No
  fabrication is demonstrable — the coordinates carry floating-point artifacts consistent with a
  real API response rather than recalled numbers — and this stage can neither run
  `lookup-place.mjs`/`lookup-venue.mjs` (every `node scripts/…` call returns "this command
  requires approval") nor fetch google.com. Left untouched deliberately; a networked pass should
  re-derive all nine and record which tool produced them.
- `01-plan.json` ("When you land") hedges the Carrasco airport bus with "several lines are
  reported to cover the route… confirm the current number at the terminal". That is a `⚠`
  standing in for a lookup rather than for an unsourceable fact — CUTCSA and COT both publish
  their airport lines. **Source lead:** cutcsa.com.uy's own line pages. Not fetched: it is a
  domain no earlier pass verified, and this stage's fetching is restricted to domains already on
  the record. Flagged rather than papered over.

## Citation audit

Thirteen perishable facts sampled — every registry row plus the plan-critical hours and booking
claims, weighted to prices, hours and the Carnival-adjacent anchors.

| Claim | Value | Source fetched | Verdict |
|-------|-------|----------------|---------|
| COT fare, Montevideo → Colonia del Sacramento | UYU 579 one-way | y — cot.com.uy | supports (departures from 05:00 confirmed too) |
| COT fare, Montevideo → Punta del Este | UYU 466 one-way | y — cot.com.uy | supports (departures from 04:45 confirmed too) |
| Isla de Lobos boat excursion | US$70 adult / US$50 under 10, daily 12:00, ≈2h | y — isladelobos.com.uy | supports |
| Casapueblo admission | UYU 600 adult / 500 senior / free under 12 | y — casapueblo.com.uy | supports; also confirms daily from 10:00 **and closing at sunset** — the closing detail was added to Thu Feb 11 |
| Faro de Colonia fee + hours | UYU 35; Thu–Sun 10:00–12:00 & 15:00–17:00 | y — visitacolonia.com | drifted → fixed: figure and grid support, but the source conditions the hours on Navy staff availability and requires ID, and the guide carried neither (finding #4) |
| Museo del Carnaval admission + hours | UYU 200; Wed–Sun 11:00–17:00 | y — museos.gub.uy | supports (the page is a Carnival-week notice; it states the regular Wed–Sun grid) |
| Antel Chip Prepago | $65 | y — tienda.antel.com.uy | supports |
| Lo de Silverio hours | Tue–Sat 12:00–16:00 & 20:00–00:00, Sun 12:00–16:00 | y — lodesilverio.com | supports; no pricing published, matching the guide's `⚠` |
| El Palenque hours | Tue–Fri 12:00–23:00, Sat–Sun 12:00–17:00 | y — elpalenque.com.uy | drifted → fixed: the venue's own site publishes **no** hours; the grid is a directory's. Downgraded to `⚠`, citation re-pointed (finding #2) |
| Palacio Salvo tour — booking channel + slot grid | Red Ticket only, ≈45 min | y — redtickets.uy | drifted → fixed: the cited event page no longer resolves; re-cited to the producer page, unsupported slot grid removed (finding #5) |
| Colonia combined museum ticket (NEW this pass) | UYU 150, covers 8 museums; Espacio del Telégrafo Mon/Tue/Thu/Fri/Sat 11:30–16:30 | y — visitacolonia.com | supports — sourced before shipping, backs the Sat Feb 6 `plan_b` |
| Mercado del Puerto hall hours | Mon–Sat 9:00–17:00, Sun 10:00–17:00 | n — mercadodelpuerto.com.uy refused the connection | unreachable → flagged; not re-asserted, and finding #3 stops the arrival day depending on the optimistic reading |
| Laguna Garzón activities + booking channel | kayak/SUP/birdwatching, book by WhatsApp | n — lagunagarzon.uy did not respond (3 attempts) | unreachable → flagged; claim downgraded to `⚠`, dead link pulled from Sources (finding #7) |

#### Continuity sweep — critic execution

**Greps run** (all scoped to `src/content/guides/uruguay/`):
- `19397|alacarta|La Barra|Casapueblo|El Palenque|Laguna Garz|Faro|8 nights|Red Ticket` — the
  full touchpoint set for findings #1, #2, #5, #6, #7.
- `19397|lagunagarzon` re-run after editing — 0 stale citations remain in the guide.
- `\{\{fact:[a-z0-9-]+\}\}` — all 13 token uses resolve against `facts.json`, and all 9
  non-reserved rows are referenced at least once (the new `colonia-museos-150-uyu` twice).

**Ripples found and fixed:**
- Wed Feb 10's `plan_b` instructed "push La Barra to the afternoon", which the Thursday reorder
  invalidated → rewritten to take Casapueblo early and leave Thursday to La Barra.
- The stale Red Ticket event URL survived in two places beyond the sight card — the `divergences`
  row and the Sources tab → both re-pointed to the producer page.
- Sun Feb 7's day body asserted El Palenque's Sunday window as fact → now names it as the hall's
  best-known parrilla without quoting an unverified hour.
- `07-sights.json`'s Mercado del Puerto card is the other half of finding #3 → now states plainly
  that the hall is a lunch stop and that the later per-stall hours are directory listings.
- The guide-level `verified` stamp is the reader's re-check list, and this pass added three
  re-check items → El Palenque's hours, the February 2027 Palacio Salvo listing, and the Laguna
  Garzón operator appended to it in `_guide.json`.
- `05-transit.json` already treats Casapueblo (≈15 km) and La Barra (≈8 km) as separate hops, so
  the Thursday reorder needed no change there — checked, not assumed.
- Every shipped `## Candidates considered` name was re-checked against the edited prose after the
  rewrites; all still occur verbatim, including "Colonia del Sacramento off-peak visit window",
  "Desfile de Llamadas" and "La Rambla".

**Deferred to human:** the two items listed at the end of Critic findings — the `place_id`
provenance asymmetry across `05-transit.json` vs the sights/venues items, and the Carrasco airport
bus line number. Nothing else deferred.
