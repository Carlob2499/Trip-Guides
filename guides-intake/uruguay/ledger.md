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
|      |                    |                          |                    |                                 |

(Empty — reconciliation happens once Pass B has run independently. This table is Reconcile's stage,
not Pass A's.)

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
| Desfile de Llamadas / Carnival season framing | shipped (as seasonal context — see Amendments on why exact 2027 dates are not asserted) | y |

### Priority 3: Nature / outdoors

| Candidate | Verdict | Shortlist |
|-----------|---------|-----------|
| Isla de Lobos boat excursion | shipped | y |
| Cabo Polonio (wild sea lion colony + dune settlement) | detour (worth-the-detour): the strongest single nature find, but a full-day round trip from Punta del Este (road + 4x4 dune transfer) — presented as an opt-in alternative on the one open day rather than fixed into the itinerary | y |
| La Rambla (Montevideo waterfront) | shipped | y |

**Saturation:** stopped — later searches across all three priorities mostly re-surfaced the same
handful of names across different aggregators (duplicates trend). The one unresolved item (Llamadas'
exact 2027 dates) doesn't change any recommendation — see `evidence.v2.json`'s `saturation` record.

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
