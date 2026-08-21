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
- **2026-08-21 (critic) — Manzoku Ramen Bar's street address resolved from its own already-cited source; the ⚠ came off.** See critic finding C1. `_guide.json`'s `verified` re-check list dropped the Manzoku-address item and gained the Pfaffenthal lift's published maintenance dates in its place. The venue's `place_id` stays `__VERIFICATION_REQUIRED__` — it still carries no `map` field, so the reconcile pass's reasoning on that point is unchanged.
- **2026-08-21 (critic) — Saturday lunch and Sunday dinner given a named, already-verified meal.** See C2. No new venue entered the guide: both paragraphs are built from facts already shipped and re-fetched this pass (Mousel's Cantine Sun 12:00–16:00, Kaito Ramen daily to 21:30, the Place Guillaume II food-stall village 10:30–14:00).
- **2026-08-21 (critic) — Pfaffenthal lift maintenance corrected from "the first Monday of each month" to the operator's published date list.** See C4. vdl.lu — the city, which runs the lift — publishes explicit dates (3 Aug, 14 Sep, 5 Oct, 2 Nov, 7 Dec 2026), and 14 Sep is the *second* Monday of September, so the "first Monday" rule the tourist-office pages repeat is wrong as a rule. None of the published dates falls inside Oct 16–19.

## Critic findings

Fresh-context pass, 2026-08-21. Five scans: rubric #6 (anchor — not applicable, the intake names
no anchor event), #8 (priority depth), #9 (party fit), #12 (authenticity & crowd-awareness), and
the vibe lens. Six findings fixed in place, one flagged.

**C1 — `⚠` standing in for a fetch the cited source already answers.**
`08-food-and-shopping.json`, Manzoku Ramen Bar. The `area` field read `⚠ Exact street address not
independently confirmed this pass — check manzoku.lu before going`, and the guide-level `verified`
stamp carried the same item as a pre-trip re-check. The venue's own cited `source_url`
(manzoku.lu) publishes both addresses on the page: Ramen Bar at **153, Avenue du Dix Septembre,
L-2551 Luxembourg**, shop at no. 162. Violates rubric row #10 (honest gaps — `⚠` flags what can't
be sourced, never what wasn't looked up) and row #7 (the "where" question). Same class as the OPEN
`japan-2` row of 2026-08-14 in `pipeline-patterns.md`. **Fixed:** real `address` added, `area`
restored to a location label, the ⚠ removed, and `_guide.json`'s re-check list updated.

**C2 — the itinerary names a meal on two of four days, and the silent day is the one its own picks
are shut.** `06-days.json`, Sun Oct 18 (and Sat Oct 17). Vibe lens — **meals & energy**. Day 3
leaves at ≈09:00 for Vianden, returns early afternoon, walks the valley to ≈17:00, and names no
food at all. On that Sunday the market doesn't run (Wed & Sat only), Oberweis is closed Sundays,
Manzoku is Wed–Sat, and Mousel's Cantine serves only 12:00–16:00. The guide holds the answer and
never states it: Kaito Ramen is open daily 11:30–21:30. Saturday had the mirror problem — the
market card's own `why` calls it "the easiest, most casual lunch in the old town", but the day
plan visits it at 09:00 for coffee and then names no lunch. **Fixed:** a Sunday-evening paragraph
naming Kaito with the closures that make it the pick, and a Saturday paragraph pointing back to
the food-stall village (10:30–14:00, five minutes from the MNHA). Both facts re-fetched to T0 this
pass — see the citation audit. The venues `intro` now carries the same Sunday summary.

**C3 — the day plan books the traveler into the one slot the guide itself says needs a call.**
`06-days.json`, Fri Oct 16, and `08-food-and-shopping.json`, Mousel's Cantine. Vibe lens —
**common sense**; rubric row #7 ("book?"). The venue card says "dinner fills up, especially
Fri–Sat — call ahead or use the online booking form if arriving after 19:00", and the Booking
checklist in `01-plan.json` repeats it. The day-1 body sent the traveler there with no mention of
it, and its own waypoint time is ≈19:30 on a Friday. Two correct facts, never connected — the same
class as the `japan-2` "states two facts and never connects them" row. **Fixed:** day 1's dinner
paragraph now names the call, the number already in the venue card, and the ≈19:30 arrival it
applies to.

**C4 — a perishable rule generalized past what the operator publishes, on a citation that doesn't
cover it.** `05-transit.json`, the Pfaffenthal lift step. The guide read "closed for maintenance
the first Monday of each month 09:00–05:45". The lift's operator, the Ville de Luxembourg,
publishes explicit dates instead — 3 Aug, 14 Sep, 5 Oct, 2 Nov, 7 Dec 2026 — and **14 Sep 2026 is
the second Monday of September**, so "the first Monday" is a tourist-page paraphrase, not the
rule. Compounding it, the step's only provenance is the section `source_url`
(`mobiliteit.lu/en/tickets-page/fares/`), which was fetched and says nothing about the lift, about
bus 16/29, or about bus 181 — an official URL sitting over a claim it does not support
(verification-rules §3); rubric rows #11 and #3. No itinerary impact: the trip uses the lift on
Sun Oct 18 and none of the published dates falls inside Oct 16–19. **Fixed:** wording corrected to
"one Monday a month … usually the first, but not always", the operator's date page linked inline,
and the Oct 16–19 clearance stated; the bus-181 step also gained an inline link to the
mobiliteit.lu line page that actually carries it.

**C5 — the four-question rule skipped "how do I get there".** `08-food-and-shopping.json`, Kaito
Ramen and Manzoku Ramen Bar. Both `how` fields restated the `book` field ("Walk-in /
first-come-first-served…", "No reservation system exists at all…") instead of answering how to
reach the venue — rubric row #7, question 2. **Fixed:** `how` now carries the route (Kaito: off
Place de Paris, minutes from the central station; Manzoku: no. 153 opposite the shop at no. 162,
outside the old town, a free bus ride each way), and the booking mechanics moved to `crowd_tip`,
where Manzoku's waitlist-app reality now sits. Manzoku's exact bus line is not named: no source
within this stage's fetchable domains carries it, and a guessed line number is worse than the
address plus "free bus".

**C6 — a cross-valley leg described as a short walk.** `06-days.json`, Sat Oct 17. Vibe lens —
**geography**. "Bock Casemates is a short walk back from there" describes the Fort Thüngen → Bock
leg, which crosses the Pfaffenthal valley: from the guide's own coordinates (49.61640/6.13930 →
49.61166/6.13669) the walking route runs ≈1.7 km via the Pont Grande-Duchesse Charlotte, ≈20
minutes — not the few minutes "short walk" implies. The 14:30 → 16:30 schedule absorbs it, so this
is wording, not a broken day. **Fixed:** "about 20 minutes on foot back toward the old town", plus
the Bock's 19:00 last admission — the latest of the day's sights, which is what makes it the right
closing stop.

**C7 — FLAGGED, not fixed: marquee sights carry no crowd-reality or off-peak note.** Rubric row
**#12**. Of nine `07-sights.json` items only Vianden Castle carries a crowd/timing observation
(the Schiessentumpel alternative). Bock Casemates, the Chemin de la Corniche, the MNHA and the
Grund — the four the traveler will actually queue for or share — carry hours and price only. The
reconciliation table records an honest reason for Bock specifically ("investigated an off-peak
crowd claim but found no dated firsthand source"), and that justification is accepted here; it
does not extend to the other three, which were never investigated. Closing this needs experiential
corroboration (≥2 recent, independent, firsthand sources per verification-rules §3), and the
sources that carry it sit outside the domains this stage may fetch — so it is flagged with leads
rather than filled, never invented. **Drift:** rubric #12's "crowd reality + off-peak best-time
note on every marquee sight" is unmet for 8 of 9 sights. **Source leads for a follow-up change
run:** r/Luxembourg and r/europetravel threads on Bock Casemates queueing at coach-tour hours; the
Luxembourg City Tourist Office's own guided-tour departure times (luxembourg-city.com) as a proxy
for when the tunnels fill; the MNHA's free-entry windows (Thu 17:30–20:00 and the last hour before
closing, already in the guide) as a documented crowd *driver* rather than an off-peak slot. One
partial mitigation did ship inside the day plan — the Bock last-admission note in C6.

**Scans that came back clean.** Rubric #6 — no anchor event in the intake, so the row does not
apply; the guide correctly declares no event tab. Rubric #8 — depth tracks the ranked priorities
(culture/history carries nine sights plus a `divergences` section; food five venues; nature the
valley, the Pétrusse and the one half-day out), and the `## Candidates considered` tables carry
twelve rejections with reasons. Rubric #9 — party fit holds: free transit over car hire,
walk-in-first food selection, stairs-and-hills routing, a US-passport entry row, and the upper-town
museums the intake named by hand. Vibe lens **pacing arc** — slow / balanced / balanced / slow
across four days, one committed morning out, no three-museum run, and the arrival day correctly
tagged `energy: slow`. Vibe lens **tone** — no process language, no self-referential framing, no
brochure copy found. Vibe lens **inclement cover** — the only day whose anchor is outdoor-committed
(Sun, `env: "outdoor"`) carries a researched `plan_b` with provenance; October in Luxembourg is not
a named weather window, and the other three days are `mixed` with indoor anchors.

## Citation audit

Fifteen perishable facts sampled across twelve sources, weighted to prices, hours, and the
plan-critical transit legs. Every `source_url` was fetched live on 2026-08-21.

| Claim | Value in guide | Source fetched (y/n) | Verdict |
|---|---|---|---|
| Bock Casemates — adult admission | €11 | y — luxembourg-city.com/…/bock-casemates | supports ("Adults €11,00") |
| Bock Casemates — hours | daily 09:45–19:00 last admission, closed 25 Dec & 1 Jan | y — same page | supports ("Access 7 days a week, every 15 min, from 09:45 a.m. to 7:00 p.m. (final admission)") |
| Vianden Castle — October hours | daily 10:00–17:00, last entry 16:30 | y — castle-vianden.lu/gb/besuch | supports ("from 01.10 – 31.10 from 10.00 to 17.00 –> Last entry at 16.30") |
| Vianden Castle — adult / student admission | €13 incl. €1 tourist tax / €7 | y — same page | supports ("Adults: 13 €", "Students (+13 years) … 7 €"); closure dates 01.01, 02.11, 25.12 also match |
| MNHA — admission + Monday closure | €7, closed Mondays, Thu to 20:00 | y — nationalmusee.lu/…/opening-times-and-admission | supports |
| Musée Dräi Eechelen — admission + combined ticket | €7, or €12 combined same-day, closed Mondays | y — m3e.public.lu/en/infos-pratiques.html | supports ("Every day except Monday 10.00 to 18.00", "€12") |
| Villa Vauban — adult admission | €5 | y — villavauban.lu/…/general-informations | supports ("Adults 5 €") |
| Villa Vauban — open Mondays, closed Tuesdays (load-bearing: all of day 4) | Mon/Wed/Thu/Sat/Sun 10:00–18:00, Fri to 21:00, closed Tue | y — villavauban.lu returned only a JS-rendered "Today" line, so resolved on the operator's own vdl.lu museum page | supports ("Wednesday to Monday From 10:00 to 18:00", "Friday From 10:00 to 21:00") |
| Place Guillaume II market — days & hours | Wed & Sat 07:30–14:00 | y — vdl.lu/…/markets-luxembourg-city | supports; also yields the food-stall village 10:30–14:00, now used in the Saturday plan |
| Free nationwide public transport since 1 Mar 2020 | free on bus, tram, 2nd-class rail | y — mobiliteit.lu/en/tickets-page/fares | supports ("Since March 1, 2020, public transport has been free throughout the entire territory of Luxembourg") |
| RGTR bus 181 Ettelbrück ↔ Vianden (the corrected "bus 570" claim) | line 181, Ettelbrück – Vianden – Obereisenbach | y — mobiliteit.lu/en/line/bus-181-rgtr-2 | supports |
| Pfaffenthal lift — daily hours | 05:45–01:00 daily | y — vdl.lu/…/elevators | supports ("open 7 days a week from 5:45 to 1:00") |
| Pfaffenthal lift — maintenance closure | was "the first Monday of each month 09:00–05:45" | y — vdl.lu/…/elevators (the in-guide fares citation carries none of this) | **drifted → fixed** — operator publishes 3 Aug, 14 Sep, 5 Oct, 2 Nov, 7 Dec 2026; 14 Sep is the second Monday. Corrected and re-cited (C4) |
| Mousel's Cantine — Sunday hours & booking | Mon–Sat 11:45–14:00 & 18:00–22:00; Sun 12:00–16:00; call/online | y — mouselscantine.lu | supports ("Dimanche de 12:00 a 16:00"); online booking via Zenchef confirmed |
| Kaito Ramen — hours + walk-in policy | daily 11:30–21:30; online booking only for 8+ | y — kaito.lu/about-us | supports ("Monday – Sunday : 11:30 AM – 9:30 PM"); also yields the Place de Paris address, now shipped |
| Manzoku Ramen Bar — days/hours + address | Wed–Sat pattern as written; address was ⚠ unconfirmed | y — manzoku.lu | hours **support** exactly; address **drifted → fixed** — the page publishes 153, Avenue du Dix Septembre, L-2551 (C1) |

**Sampled 15 · 13 support · 2 drifted → fixed · 0 unreachable → flagged.**

#### Continuity sweep — critic execution

**Greps run**, all across `src/content/guides/luxembourg/`: `Manzoku|Mousel|Kaito`, `first
Monday`, `Pfaffenthal`, `short walk`, `not independently confirmed`, and `07:30–13:30` (the market
drift the reconcile pass fixed — confirmed zero survivors).

**Ripples found & fixed:**
- Manzoku's ⚠ address lived in two places — `08-food-and-shopping.json`'s `area` and the
  guide-level `verified` re-check list in `_guide.json`. Both updated; the post-edit grep for `not
  independently confirmed` returns zero hits.
- The Mousel's-dinner call requirement existed in `08-food-and-shopping.json` (`crowd_tip`) and
  `01-plan.json` (Booking checklist plus panel body) but not in the day that needs it. Day 1 now
  states it, and the phone number matches the venue card exactly (+352 27 67 23 42).
- Kaito's Sunday availability now appears in three consistent places — the venue card `why`, the
  section `intro`, and the day-3 body — all reading daily 11:30–21:30 off one fetched source.
- `first Monday` now returns exactly one hit: the corrected "usually the first Monday, but not
  always" in `05-transit.json`. The lift's `place_id`, coordinates and day-3 waypoint were left
  untouched — the maintenance correction changes no location fact.
- Prose shape: the two day bodies edited were split rather than extended (day 1 → three
  paragraphs, day 2 → four), keeping each paragraph inside the ≤60-word house shape rather than
  growing a first-time guide's baseline.
- Nothing edited touched a `map`, `weather` or `holidays` section, and no `facts.json` row changed
  (no price or figure moved), so the registry and its `{{fact:…}}` references are untouched.

**Deferred to human — two items, and no others.** (1) C7: rubric #12 crowd notes on the remaining
marquee sights, which needs experiential sources outside this stage's fetchable domains; leads
recorded above. (2) The reconcile pass's open `src/data/countries.mjs` amendment — no Luxembourg
row, so currency conversion, the `holidays` section's ISO code, and the `EU112_COUNTRIES`
emergency-SOS set are all unresolved. It is a code-layer fix outside this run's scope and is
unchanged by anything above.
