# Research ledger — Luxembourg

> Everything research produces for this guide. The traveler's own intent lives beside this in
> `intake.md` and is frozen after scaffold — record a research-forced change of plan under
> "## Amendments" here, never by rewriting the intake.

## Spec Summary (fill after intake, before research)
- Section types to include / exclude (and why): Standard backbone (Plan, Money & budget, Health & safety, Etiquette & language, Transit, Days, Sights, Food & shopping, Sources) — no event-specific tab, since the intake names no anchor event. `divergences` added under Sights (Grand Ducal Palace summer-only tours, the stale "bus 570" route, museum pricing) because the research surfaced enough corrected claims to earn it.
- The 2–3 priorities driving depth: 1) Culture/history (old fortifications + upper-town museums, explicitly named in the intake's comments) 2) Food & dining (eat well, no formal booking) 3) Nature/outdoors (the valley walk the traveler explicitly wants, plus the one half-day trip out).
- Hard filters applied to every entry: no stated mobility/dietary/sensory constraint in intake (field left blank — treated as none stated, not none exist), so no constraint-bound venue facts were mandatory. The traveler's "eat well without booking anything formal" preference was treated as a soft filter on food picks (walk-in viability weighed directly into ship/reject decisions — see Um Plateau and Mousel's Cantine below).
- Verification focus: the Vianden day-trip transit route (a stale "bus 570" claim in circulation vs. the current official line 181, further complicated by a 10 May 2026 Ettelbrück hub reorganization), museum hours/prices (all of which sit right at the trip's Oct 16–19 dates), and the Grand Ducal Palace's summer-only interior tours (a generic-guide trap for an October visit).

## Cover art — footage candidates (research fills the shortlist; the CREATOR signs)
> The research pass's footage scout records 0–2 licensed, hot-linkable clips here — stable-URL
> libraries only (e.g. Mixkit `assets.mixkit.co` asset URLs; Coverr temp-URLs are forbidden).
> Publishing is the creator's call alone: a clip must be FRAME-VERIFIED to show the actual place
> (no invented geography) before `cover.video` is set in `_guide.json`. Until then the photo
> cover / Painted Atlas stands — an empty table is a fine outcome, not a gap.

| Clip URL | License | Claims to show | Matches cover geography? | Frame-verified by |
|----------|---------|----------------|--------------------------|-------------------|
|          |         |                |                          |                   |

## Research reconciliation (fill during the dual-pass — see the guide-author skill)
> Pass A = canonical/verified (official, anchors, logistics). Pass B = local/authentic/crowd-aware
> (resident + blog knowledge, off-peak timing, novel alternatives). Record what each pass found and
> how conflicts resolved — this is the corroboration trail behind the guide.

| Item | Pass A (canonical) | Pass B (local/authentic) | Reconciled → guide | Note (conflict / crowd / novel) |
|------|--------------------|--------------------------|--------------------|---------------------------------|
| Bock Casemates hours/price | €11, 09:45–19:00 daily (fetched luxembourg-city.com) | Independently fetched the same page, same figures; investigated an off-peak crowd claim but found no dated firsthand source | AGREE — shipped as-is | Two independent fetches of the same T0 source is strong corroboration; Bock's own crowd timing stays unclaimed rather than sourced to SEO content |
| Pfaffenthal Panoramic Elevator | Free, daily 05:45–01:00 (fetched vdl.lu + luxembourg-city.com) | Same facts, independently fetched from visitluxembourg.com | AGREE — shipped as-is | Cross-domain corroboration of the same official fact |
| Free nationwide public transport | Free since 1 Mar 2020 (fetched mobiliteit.lu) | Identical claim, same source URL | AGREE — shipped as-is | — |
| Chemin de la Corniche / Wenzel Circular Walk | Described the Corniche as "the spine of the Wenzel Circular Walk," not separately sourced | Found and fetched the walk's own official page (visitluxembourg.com) | AGREE (B-only citation) — no guide text change, evidence.v2.json now carries the direct T0 source | B closed a citation gap rather than surfacing new content |
| Vianden Castle vs. Mullerthal/Echternach as the one half-day trip | Shipped Vianden Castle (fortifications, priority #1), full T0 hours/price + R3 transport depth + reservation check, corrected the stale "bus 570" claim to line 181 | Independently proposed Echternach/Mullerthal instead (direct low-risk bus, corroborated quiet-at-opening waterfall) — partly reasoning from the same stale "bus 570" figure A had already disproven | CONFLICT, resolved → Vianden Castle kept as the built trip; Mullerthal/Echternach retained as a flagged alternative (status: detour) on the Vianden sights card | Recommendation-changing disagreement — see `dis-vianden-vs-mullerthal-halfday` in evidence.v2.json and traveler question q-luxembourg-1 |
| Walk-in dining matching "no formal booking" | Shipped Mousel's Cantine (dinner needs a call), Oberweis, the market; rejected Um Plateau/Brasserie Guillaume for booking friction | Independently found and T0-verified two genuinely walk-in-only spots — Kaito Ramen (daily) and Manzoku Ramen Bar (Wed–Sat), each corroborated on crowd timing by ≥2 independent firsthand sources; rejected Um Dierfgen/Beim Siggy/Chiggeri for the same reasons A would have | B-only, ADOPT — both added to `08-food-and-shopping.json`; Manzoku's exact address flagged ⚠ (not in B's evidence) | B's native French-language sweep surfaced these; English-only search in Pass A did not |
| Languages spoken / practical visitor language | ~80% English backup (search-preview Wikipedia) | Same facts with a fetched, more detailed source (lingoda.com) naming French as the most practically useful single language | AGREE — no guide text change; stronger citation available for a future edit | — |

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

## Candidates considered (fill DURING research — one table per ranked priority)
> Standard S2/S3 (2026-08-02): real research quality is how many options you REJECTED and
> why — a thin pass and a deep pass are indistinguishable if only survivors are recorded.
> One table per ranked priority, one row per candidate EVALUATED (not just shipped).
> Verdict is `shipped` or `rejected: <one-line reason>`. Breadth is ADAPTIVE — no fixed
> quota: stop when new searches mostly duplicate/weaken the set AND unresolved evidence is
> unlikely to change the recommendation, and record that stop. Verify's `candidates` row
> still fails an empty table and cross-checks every `shipped` name against the guide. An
> honest `rejected: couldn't verify` row is a good row — it proves the option was seen.

### Priority 1: Culture / history

| Candidate | Verdict | Shortlist |
|-----------|---------|-----------|
| Bock Casemates | shipped | y |
| Chemin de la Corniche | shipped | y |
| Musée National d'Histoire et d'Art (MNHA) | shipped | y |
| Musée Dräi Eechelen (Fort Thüngen) | shipped | y |
| Villa Vauban | shipped | y |
| Notre-Dame Cathedral | shipped | y |
| Grand Ducal Palace (exterior — interior tours are summer-only) | shipped | y |
| Wenzel Circular Walk (Pass B — official self-guided route, already reflected in the Corniche card) | shipped | y |
| Vianden Castle (half-day trip) | shipped | y |

### Priority 2: Food & dining

| Candidate | Verdict | Shortlist |
|-----------|---------|-----------|
| Marché Place Guillaume II (Wed/Sat market) | shipped | y |
| Mousel's Cantine | shipped | y |
| Oberweis (Grand-Rue) | shipped | y |
| Am Tiirmschen | rejected: permanently closed (end of Nov 2023, per its own manager's account to local press) | y |
| Um Plateau | rejected: its own listing pushes online table reservations, against the traveler's stated no-booking preference | y |
| Brasserie Guillaume | rejected: couldn't confirm walk-in policy against an official source within budget | y |
| Kaito Ramen (Pass B) | shipped | y |
| Manzoku Ramen Bar (Pass B) | shipped | y |
| Konrad Cafe & Bar (Pass B) | rejected: only one directly-fetched firsthand source secured within budget, short of the ≥2-independent corroboration bar for a "locals go here" claim | y |
| Beim Siggy (Pass B) | rejected: couldn't corroborate firsthand within the two-attempt fetch budget (dead blog, TripAdvisor 403 on every attempt) | n |
| Chiggeri (Pass B) | rejected: consistently upscale fine dining — wrong register for "no formal booking" | n |
| Um Dierfgen (Pass B) | rejected: consistent secondary reports describe it as effectively needing a reservation at lunch and dinner; operator site itself returned 403 | n |

### Priority 3: Nature / outdoors

| Candidate | Verdict | Shortlist |
|-----------|---------|-----------|
| Pfaffenthal panoramic lift | shipped | y |
| Grund & the Alzette valley | shipped | y |
| Neumünster Abbey (cloister/courtyard, doubles as rain plan_b) | shipped | y |
| Pétrusse Valley | shipped | y |
| Vianden Chairlift | rejected: couldn't confirm current price against a fetched official source — conflicting search figures (€6.50 / €9 / €16-per-couple) | n |
| Echternach & Müllerthal (alternative half-day/day trip) | rejected: a real option, but the traveler wants at most one worthwhile trip out, and Vianden Castle scores higher on the trip's top-ranked culture/history priority | y |
| Mullerthal Trail — Echternach loop (Pass B, independently researched) | conflict-resolved: direct low-risk bus (line 201) and corroborated quiet-at-opening Schiessentumpel waterfall — a genuinely strong alternative to Vianden for the trip's thinnest priority, but Vianden was kept as the built trip (priority #1 alignment + complete depth research); retained as a flagged alternative, not shipped as the day plan | y |
| Schengen (Moselle tripoint) | rejected: more a photo-op than a culture/history or nature-depth stop, further out with a weaker transit connection than Vianden | n |

## Questions for the traveler (research emits; traveler answers on the progress page)
> Traveler-framed only — no pipeline vocabulary. Each question carries an assumption the guide
> builds on until the traveler answers. See src/features/intake-questions/ for the model.

### q-luxembourg-1
- **Q:** We built in one half-day trip out of the city — Vianden Castle (about an hour away by free train + bus), since fortifications/history is your #1 priority. Our second research pass also turned up a genuinely good alternative for a more outdoors/hiking-focused half day: the Mullerthal Trail's Echternach loop, a direct free bus with no transfer, and reportedly much quieter right at opening. Happy to swap if hiking through a beech-wood gorge and waterfall appeals more than another castle — otherwise we'll leave it as Vianden.
- **Assumed:** Building in Vianden Castle on Sunday (day 3) morning, with the valley walk filling the same afternoon; Mullerthal/Echternach noted as the alternative if you'd rather swap.
- **Context:** Day 3 (Sun Oct 18) and the Sights tab's Vianden Castle card.
- **Status:** open

### q-luxembourg-2
- **Q:** What city will you be flying out of? It's the one detail we can't research — it decides your flight cost line and the route the trip map draws.
- **Assumed:** Left unset — no flight cost estimated, and the map doesn't draw an origin line until this is confirmed.
- **Context:** `facts.json` (traveler-origin) and the Budget tab's flights line.
- **Status:** open

## Amendments (append-only — record every research-forced re-plan)
> When research changes the plan (an anchor moved, a neighborhood beats the intended one, a day
> collapsed), log it here with the reason. `intake.md` stays the ORIGINAL intent; this is the
> diff. (Korea/Denmark were "corrected three times by running it" — that history now has a home.)

- **2026-08-21 — `src/data/countries.mjs` has no "Luxembourg" entry (code-layer gap, out of this pass's scope).** This guide's `country: "Luxembourg"` won't resolve an accent colour, currency, timezone fallback, or public-holiday ISO code from the shared country table — every other guide in the repo (Denmark, South Korea, Japan, Germany, Portugal, and 20+ European countries) has a row; Luxembourg does not. `_guide.json` works around the accent (explicit `theme` override) and timezone (explicit `tz: "Europe/Luxembourg"`) at the content layer, but currency-conversion and the `holidays` section still depend on the missing table row, and `src/data/countries.mjs`'s own `EU112_COUNTRIES` set (which backstops the emergency-SOS sheet) also omits Luxembourg — an EU member with the same 112 number as every neighbor it does list. Both are one-line additions to a code file, which sits outside this run's `src/content/guides/luxembourg/` + `guides-intake/luxembourg/` scope. **This needs a code-layer fix before the guide can fully render currency/holidays/emergency-SOS — flagging for the reconcile/critic stage or a follow-up change run, not silently working around it in content.**
- **2026-08-21 — Budget denominated in € (local currency), not $ (the intake form's shorthand).** The intake's "$75–150/day" is the scaffolder's generic mid-range label, not a stated currency preference; every other shipped guide (Denmark, Korea) prices its budget section in the destination's own currency. Luxembourg uses the euro, so the budget section and `facts.json` price registry are in €, with `budgetTarget` keeping the original "$75–150/day" label as context only.
- **2026-08-21 — Grand Ducal Palace kept in Sights despite being exterior-only for this trip.** The intake ranks culture/history first and specifically names "the museums in the upper town" — the Palace sits in the same cluster and is worth a walk-by even without an interior tour in October. Its card and a `divergences` entry both say so explicitly, so it doesn't read as a bait-and-switch.
- **2026-08-21 (reconcile) — Two Pass-B-only walk-in restaurants added: Kaito Ramen and Manzoku Ramen Bar.** Both are T0-verified (operator's own site fetched) as genuinely walk-in-only with zero reservation systems, and both were independently corroborated on crowd timing by ≥2 firsthand sources — a stronger match to the traveler's stated "eat well without booking anything formal" preference than anything Pass A shipped. Added to `08-food-and-shopping.json`; Manzoku's exact street address could not be independently confirmed this pass and ships with an explicit ⚠ rather than a guessed address.
- **2026-08-21 (reconcile) — Vianden Castle kept as the trip's one half-day-out over Pass B's independently researched Mullerthal Trail/Echternach alternative.** Pass B proposed swapping to Echternach (direct low-risk bus, corroborated-quiet Schiessentumpel waterfall) to serve the trip's thinner nature/outdoors priority, reasoning partly from the same stale "bus 570" Ettelbrück connection Pass A had already disproven. Vianden was kept given its #1-priority alignment (fortifications) and already-complete transport/reservation depth research; Mullerthal/Echternach is retained as a flagged alternative on the Vianden sights card and the traveler is asked to confirm or swap (see `q-luxembourg-1`). Full investigation recorded as `dis-vianden-vs-mullerthal-halfday` in `evidence.v2.json`.
- **2026-08-21 (reconcile) — Corrected a transcription drift in the Place Guillaume II market hours.** `06-days.json`'s Saturday plan and `08-food-and-shopping.json`'s venue card both read "07:30–13:30", but the actually-verified source (`ev-marche-days-hours`, vdl.lu, fetched) states 07:30–14:00. Both guide files now match the cited source; no new fact, no re-verification needed — this was a same-pass copy error, not a source conflict.
- **2026-08-21 (reconcile) — Candidate-table naming aligned to what actually shipped, three rows in `ledger.md`'s `## Candidates considered`.** "Chemin de la Corniche / Wenzel Circular Walk" → "Chemin de la Corniche" (the Wenzel Circular Walk is already its own separate, correctly-matching row); "Pfaffenthal Panoramic Elevator" → "Pfaffenthal panoramic lift" (the guide consistently calls it a "lift", never "elevator"); "Grund & the Alzette valley walk" → "Grund & the Alzette valley" (matches the shipped sights-card title). No guide content changed — these were pure candidate-table wording mismatches against already-shipped names, caught by the shipped-candidate cross-check.
- **2026-08-21 (reconcile) — resolved the five `05-transit.json` map points' `__VERIFICATION_REQUIRED__` place_id placeholders.** This reconcile pass has no shell tool to run `scripts/lookup-place.mjs` directly, so the same OpenStreetMap Nominatim lookup it performs (`nominatim.openstreetmap.org/search`, one query per venue) was run directly instead — never a guessed ID. Each result's lat/lng landed within meters of the guide's own already-researched coordinates (Bock Casemates and Grund matched to 7 decimal places), confirming the correct venue before accepting its id: Bock Casemates → `N8080240552`, Musée National d'Histoire et d'Art → `W48994767`, Musée Dräi Eechelen/Fort Thüngen → `W26424184`, Grund → `R533322`, Pfaffenthal panoramic lift → `N4315424507` (OSM `<type-initial><osm_id>` format, matching `lookup-place.mjs`'s own convention — not a Google Places `ChIJ...` id, since that requires a keyed API this environment doesn't have configured). The same method resolved the matching `07-sights.json` items (Chemin de la Corniche, Villa Vauban, Notre-Dame Cathedral, Grand Ducal Palace, Vianden Castle — all new lookups; Bock Casemates/MNHA/Musée Dräi Eechelen/Grund reused the ids above) and two `08-food-and-shopping.json` venues that already carried map coordinates (Marché Place Guillaume II, Mousel's Cantine). Oberweis, Kaito Ramen and Manzoku Ramen Bar keep the placeholder — none carries a `map` field to begin with (Manzoku's own street address is separately flagged as unconfirmed this pass), so a lookup would be inventing a coordinate the guide never claimed rather than resolving one it did.
