# Research ledger — Andorra

> Everything research produces for this guide. The traveler's own intent lives beside this in
> `intake.md` and is frozen after scaffold — record a research-forced change of plan under
> "## Amendments" here, never by rewriting the intake.

## Spec Summary (fill after intake, before research)
- Section types to include / exclude (and why): Full backbone (panel/budget/routes/map/weather/holidays/days/sights/divergences/venues/prose) for a 5-day, single-city (Andorra la Vella) trip. No anchor event (intake states none) — no T0 anchor-event check owed. No `entry` for a second passport country (party's stated passports: United States only) and no `phrases`/`advisory` shipped this pass (advisory blocked — see below; phrases skipped as optional and out of this pass's scope).
- The 2–3 priorities driving depth: 1) Culture/history, 2) Food & dining, 3) Nature/outdoors — per intake's ranked list. Depth concentrated on these three; Essentials/Transit/Health got backbone-level research only.
- Hard filters applied to every entry: Car-free (no rental car mentioned in intake) and Andorra la Vella-based — any candidate needing a private car with no bus alternative was rejected on that basis alone (Roc del Quer). November-safety filter on anything above ~1,700 m (official guidance restricts those routes to Jun–Sep).
- Verification focus (most perishable / most important to get right): Casa de la Vall's Nov–Apr hours (closed Sun+Mon — directly determines which days it's visitable against the fixed Nov 5–9 dates), the Direct Bus schedule/fare (the trip's one R3 transport leg, no rail/air alternative exists), and the Engolasters/altitude seasonal-safety question (a real disagreement between an aggregator lead and the official trail authority — see Amendments and `evidence.v2.json`'s `disagreements[]`).

## Citation audit
Run by the critic stage, 2026-08-20. Thirteen perishable facts sampled, weighted to prices, hours and
the trip's two load-bearing logistics claims (the Direct Bus leg and the Engolasters day). Every row's
own `source_url` was fetched.

| Claim | Value in guide | Source fetched (y/n) | Verdict |
|-------|----------------|----------------------|---------|
| Casa de la Vall general admission | €5 (`facts.json`) | y — museus.ad/museus/casa-de-la-vall | supports — page reads "Normal: 5 €"; also confirms €2,5 reduced, the €1,5 guided supplement, and Oct–Dec hours 10–14 / 15–18 closed Sun+Mon |
| Casa de la Vall admission is reservation-only | reservation-only, +376 839760 / museusandorra@gmail.com | y — casadelavall.ad visits form | supports — "Admission: by reservation only", both contacts present |
| Direct Bus BCN airport → Andorra la Vella fare | ≈€31.50–35 one-way | y — andorradirectbus.es route page | supports — "Prices from €31,50" and "Tickets to Andorra cost from €35"; `approx` state is the right one |
| Direct Bus departures | 7 per terminal, T1 07:30–23:00, return 06:15–22:15 | y — andorradirectbus.es/en/schedules | supports — T1 and T2 lists match exactly; return leg is 8 departures, and the guide only claims its first and last |
| Andorra IGI general rate | 4.5% | y — e-tramits.ad | supports — "Tipus de gravamen general: 4,5%" |
| MiraKbé weekday lunch set menu | €12 incl. water/wine/beer | y — mirakbe.com/menu_diari_andorra | supports — "12€ IGI/Inclòs", "Aigua, vi o canya", served "Dilluns a Divendres de 13 a 15.15 h" |
| MiraKbé opening hours | was "10:00–16:00 & 19:00–23:00 Mon–Sat, closed Sundays" | y — mirakbe.com menu + home | **drifted → fixed** — that window is when the restaurant answers CALLS; the site publishes no opening hours. Hours field rewritten to the sourced lunch service with a ⚠ on the rest (finding F6) |
| Església de Santa Coloma admission + hours | €7, Tue–Sat 10–14 / 15–18, closed Sun+Mon, audioguide needs no booking | y — museus.ad/monuments/santa-coloma | supports — all four confirmed; the page additionally gave the Carrer Major address, the Line 1 bus and the reduced-mobility note now carried on the card |
| Llac d'Engolasters route stats | 1.9 km, +350/−45 m, ≈2 h, rated Easy | y — visitandorra.com route page | **drifted → fixed** — the numbers are right but belong to a LINEAR route starting in Encamp opposite the Automobile Museum; the guide attached them to a "lakeside loop" reached by taxi, which the page does not describe (finding F2) |
| Llac d'Engolasters altitude | was "1,616 m" | y — visitandorra.com route page + lakes page | **drifted → fixed** — no metre figure is published; the lakes page says only "the only great lake in Andorra at an altitude of less than 2,000m". Figure removed from all three places rather than swapped for another unsourced number (finding F3) |
| Above-1,700 m season restriction | end-June to end-September, May–Oct if conditions allow | y — visitandorra.com circuit-de-les-fonts | supports — quoted verbatim on the page; the same page carries the May–October extension |
| Andorra la Vella city buses | was "Cooperativa Interurbana Andorrana city buses (L1–L6, É, LC) … L1: Caldea ↔ La Riberola" | y — andorradirectbus.es/en/schedules | **drifted → fixed** — the cited page contains no city-bus content whatsoever. Replaced with visitandorra.com's national-routes list, which is Lines 1–7 plus an Express and a Night bus (finding F4) |
| Caldea facilities + "water shoes mandatory" | plan_b body | n on andorra-tours.com as an authority — replaced; visitandorra.com/en/nature--sports/caldea/ fetched instead | **drifted → fixed** — a third-party tour site was carrying an objective venue rule the official tourism page does not state. Re-sourced; the footwear claim dropped (finding F7) |
| Borda Estevet hours + price bands | 13:00–16:00, 20:00–23:00 daily; starters €14.50–39, mains €21–29 | n — bordaestevetandorra.com returns a bot-verification interstitial | **unreachable → flagged** — the figures were fetched at `verified_on` 2026-08-20 and are left as researched, but the site is not re-checkable by automated fetch, which belongs on the record for recert |

## Known gaps carried forward (honest, not silent)
- **Caldea's exact admission price and daily hours** — caldea.com returns HTTP 403 to every automated fetch tried (home page, `/en/timetable`, `/en/rates`); bot-blocked per the fetch-discipline doctrine, two-attempt budget spent, no different primary exists for Caldea's own pricing. The guide ships Caldea without a specific price (`08-food`/`02-money` note to confirm at caldea.com) rather than shipping an aggregator-sourced figure on an official-tier claim.
- **US State Department travel-advisory level** — travel.state.gov is Cloudflare-gated against every plain fetch (confirmed on three separate sub-pages), resolvable only through an interactive browser tool this environment doesn't have. Widely reported elsewhere as Level 1 (Exercise Normal Precautions), but not independently fetched, so the guide-level `advisory` field is left unset rather than shipped on a blocked source. Needs an interactive/browser-tool pass to close.
- **`lookup-place.mjs` / `lookup-tz.mjs` / `search-commons.mjs` were unavailable in Pass A/B's session** (shell tool calls required approval that never resolved). Coordinates were sourced directly from OpenStreetMap Nominatim via `WebFetch` (same underlying data source the script wraps, address-matched against each venue's official listing). At reconcile, the same Nominatim endpoint was fetched directly (again via `WebFetch`, `lookup-place.mjs` itself still unavailable) to resolve `place_id` fields using the script's own `<osm_type-initial><osm_id>` convention, only where the fresh lookup's lat/lng matched the guide's already-recorded coordinate exactly: the three `map` points (Casa de la Vall → `W512803160`, Estació Nacional d'Autobusos → `N7264739214`, Caldea → `R14119593`) plus the same Casa de la Vall sight card, Sant Esteve Church (`W191582655`) and Borda Estevet (`N8967965640`). Llac d'Engolasters was left `__VERIFICATION_REQUIRED__` on purpose — Nominatim's best match for the query returned the lake polygon centered ≈500 m from the guide's recorded trailhead/viewpoint coordinate, and assigning that place_id to the wrong point would be worse than the honest placeholder; needs a more specific query (or the script's disambiguation) on a future pass. `tz: "Europe/Andorra"` was set from general geography (Andorra sits entirely inside one zone with no Hawaii/Arizona-style boundary ambiguity) rather than the script's boundary-accurate resolution — low risk, but flagged here rather than silently assumed. No sight/venue photos were sourced (`img.file`/`cover`) since Commons search wasn't available — the guide ships with the Painted Atlas default cover, which is an honest default, not a gap. Església de Santa Coloma (added at reconcile) similarly ships without map coords for the same reason (it isn't one of this guide's three plotted map points).
- **The EES land-border carve-out for short-stay tourists at the Andorra–Spain/France crossing** — Pass B's own fetch of govern.ad's EES guidance page returned only nav-menu content, not the substantive text, so whether Andorra's resident-only carve-out or the "random vs. systematic checks" reporting applies to this party's road crossing (as opposed to their first Schengen entry at the Barcelona/Girona/Toulouse airport, which is unambiguously covered) stays unresolved this pass — see `evidence.v2.json`'s `disagreements[].d-ees-tourist-exemption`. Bounded, not blocking: it affects a buffer note, not which candidates ship.
- **Per-night lodging estimate (Budget & daily costs)** — no single primary source quotes a per-night rate; "€70–120/night total in low season" is a market-range estimate, not a fetched figure, so it ships `⚠`-flagged rather than dated against a source it doesn't have. The Food & drink and Sights & activities budget lines, by contrast, are now dated and sourced to Borda Estevet's own menu page and Casa de la Vall's own admission price respectively — both figures were already fetched T0 sources during Pass A, just not yet threaded onto the budget item itself.

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
| Casa de la Vall | Shipped — open Tue-Sat, self-guided admission implied walk-in-able | Shipped — same hours, but **reservation-only, no walk-ups** (casadelavall.ad) | Shipped, reservation-only | CONFLICT (A missed the booking requirement) — resolved to B's finding; sight card, Day 2 body, Booking checklist, and a new divergence item all updated |
| Església de Santa Coloma | Not found | Shipped — free-of-reservation audioguide alternative to Casa de la Vall, oldest church in the parish | Shipped (new sight) | B-only, adopted — genuine priority-1 depth plus a practical fallback for Casa de la Vall's reservation slots |
| Sant Esteve Church | Shipped | Not researched | Shipped, unchanged | A-only, no B corroboration needed (durable historical fact) |
| Barri Antic | Shipped | Not researched | Shipped, unchanged | A-only |
| Museu Nacional de l'Automòbil | Rejected — Encamp, redundant with Caldea | Not researched | **Shipped (critic reversal)** — sight card + Day 3 body | A-only rejection overturned at critic: A's own Day 3 sends the traveller to Encamp, where this museum sits opposite the trailhead. Hours/price re-verified to museus.ad before shipping (finding F2) |
| Borda Estevet | Shipped — worth-the-effort | Shipped — same venue, adds no-deposit/no-walk-in-policy detail | Shipped, unchanged | AGREE — both passes independently landed on it; B's extra detail merged into the single reservations[] record |
| MiraKbé | **Rejected** — thin, aggregator-only sourcing | **Shipped** — climbed to the venue's own site (mirakbe.com) for hours/menu/price, plus 2 independent firsthand accounts on it sitting off the touristy main street | Shipped (new venue) | CONFLICT — resolved in B's favor: B closed exactly the sourcing gap that made A reject it |
| Borda d'Erts | Rejected — too far from base | Not researched | Rejected, unchanged | A-only |
| Espícula | Rejected — no official site | Not researched | Rejected, unchanged | A-only |
| Mercat de la Vall | Rejected — out of season (May-Oct only) | Not researched | Rejected, unchanged | A-only |
| Celler d'en Toni | Not researched | Rejected — weak wine list/value vs. MiraKbé and Borda Estevet | Rejected, unchanged | B-only, agree |
| El Crostó | Not researched | Considered, not shipped — likely above budget as an everyday pick, possible splurge lead | Not shipped this pass | B-only, agree — flagged as a future splurge-night lead, not filled in generically |
| Bar-Restaurant La Sardana | Not researched | Rejected — single uncorroborated aggregator mention | Rejected, unchanged | B-only, agree |
| Llac d'Engolasters | Shipped — altitude/season safety analysis | Shipped — same pick, adds official route stats (1.9 km, +350/-45 m, ~2h) | Shipped, enriched | AGREE — B's route detail folded into the sight card, Day 3 body, and transit routes |
| Caldea | Shipped — wet-weather plan_b for the nature day | Rejected as a standalone candidate — priority fit unclear, B's own corroboration attempts (tripbytrip.org, actividadesenandorra.com) were 403-blocked | Shipped, unchanged | CONFLICT — resolved to keep A's ship decision: Caldea remains the trip's only verified wet-weather contingency, which B's own note anticipated ("reconcile may still want a one-line crowd-timing note if Pass A carries Caldea") |
| Madriu-Perafita-Claror Valley | Rejected — altitude/season safety | Rejected — same reasoning, independently reached | Rejected, unchanged | AGREE — both passes independently reached the same safety conclusion |
| Roc del Quer / Roc del Quer Viewpoint | Rejected — car-only access, no bus | Shipped (under a separately-named candidate id) — open daily/year-round, but didn't check bus access | Rejected under both ids | CONFLICT — resolved to A's transport-access finding, which B's own hours data doesn't contradict; divergence item strengthened with the hours detail and its source_url corrected from a blog to the operator page A's own evidence had already climbed to |
| Naturlandia | Not researched | Rejected — 2026 autumn-weekend calendar not confirmed to a primary source, winter season historically opens after this trip's window | Rejected, unchanged | B-only, agree |

**Cross-cutting Pass B finds not tied to a single candidate:** the EU's Entry/Exit System (EES) became fully operational 10 April 2026 at Schengen external borders (home-affairs.ec.europa.eu) — a new fact Pass A's entry research predates; adopted into Entry & documents, When You Land, and the transit buffer note. Pass B's 2022 Catalan/Spanish/French/Portuguese language-survey percentages (ca.wikipedia.org) were folded into Etiquette & language as one sentence. Pass B's more granular Direct Bus timetable (7 departures/terminal/day, same andorradirectbus.es source Pass A used) replaced Pass A's vaguer "roughly every 2 hours" framing in Key transit routes and When You Land.

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
| Casa de la Vall | shipped | y |
| Sant Esteve Church | shipped | y |
| Barri Antic (old quarter walk) | shipped | y |
| Església de Santa Coloma | shipped — Pass B find; reservation-free alternative to the now-reservation-only Casa de la Vall | y |
| Museu Nacional de l'Automòbil | shipped — critic reversal: the rejection assumed Encamp was off-plan, but the Engolasters trailhead is directly opposite this museum, so the Nov 7 day already goes there. Hours/price deep-verified to museus.ad at the reversal (finding F2) | y |

### Priority 2: Food & dining

| Candidate | Verdict | Shortlist |
|-----------|---------|-----------|
| Borda Estevet | shipped (worth-the-effort — reservation-only, 250-seat borda grill) | y |
| MiraKbé | shipped — Pass A rejected on thin sourcing; Pass B climbed to the venue's own site and reversed the verdict | y |
| Borda d'Erts (Erts, La Massana) | rejected: too far from the Andorra la Vella base; Borda Estevet already covers the borda/mountain-grill experience within easy reach | n |
| Espícula (bakery) | rejected: no official site found; hours are aggregator-sourced only, could not climb to a primary source | n |
| Mercat de la Vall | rejected: official page confirms first-Saturday-of-the-month, May–October only — out of season for a November trip | y (verified to official source before rejecting) |
| Celler d'en Toni | rejected: Michelin-listed but firsthand reviews flag the wine list and price-to-quality ratio; MiraKbé and Borda Estevet cover the same niche at better value | y |
| El Crostó | considered: intimate fine-dining spot, likely above the stated mid-range budget as an everyday pick; a possible future splurge-night lead, not shipped this pass | n |
| Bar-Restaurant La Sardana | rejected: single aggregator listicle mention only, no independent corroboration | n |

### Priority 3: Nature / outdoors

| Candidate | Verdict | Shortlist |
|-----------|---------|-----------|
| Llac d'Engolasters | shipped (with an explicit Nov weather/ice caveat and a Caldea plan_b) | y |
| Caldea (thermal spa) | shipped — the practical November-weather-appropriate pick, doubles as the Engolasters plan_b | y |
| Madriu-Perafita-Claror Valley (high routes) | rejected: official guidance restricts routes above 1,700 m to end-June–end-September; unsafe for a November visit | y (verified to official source before rejecting) |
| Roc del Quer | rejected: mirador is car-only (operator's own site confirms no bus serves the viewpoint alone); impractical for this car-free trip | y (verified to official source before rejecting) |
| Roc del Quer Viewpoint | rejected: same mirador, independently evaluated by Pass B — open daily/year-round, but still reachable only by car; impractical for this car-free trip | y (verified to official source before rejecting) |
| Naturlandia | rejected: 2026 autumn-weekend calendar not confirmed to a primary source; winter toboggan/zipline season has historically opened after this trip's window | n |

## Questions for the traveler (research emits; traveler answers on the progress page)
> Traveler-framed only — no pipeline vocabulary. Each question carries an assumption the guide
> builds on until the traveler answers. See src/features/intake-questions/ for the model.

### q-andorra-1
- **Q:** Are you starting the trip on Thursday, November 5th, or Friday, November 6th?
- **Assumed:** Thursday, Nov 5 arrival — this is what the day-by-day plan and the closed-Monday note for Casa de la Vall are both built around.
- **Context:** Affects the whole `Days` tab — a Nov 6 start would shift every day by one and change which day Casa de la Vall (closed Sun/Mon) is visited.
- **A:** We are starting Thursday, November 5th — dates confirmed.
- **Status:** answered

## Amendments (append-only — record every research-forced re-plan)
> When research changes the plan (an anchor moved, a neighborhood beats the intended one, a day
> collapsed), log it here with the reason. `intake.md` stays the ORIGINAL intent; this is the
> diff. (Korea/Denmark were "corrected three times by running it" — that history now has a home.)

- **2026-08-20 — Nature/outdoors priority (#3) narrowed from "a Pyrenees hike" to a specific low-altitude pick + contingency.** Andorra's own trail authority (visitandorra.com, fetched directly across three trail pages) recommends routes above 1,700 m only end-of-June to end-of-September and names May–October as the general comfortable season even for lower routes. A naive plan for "nature/outdoors" in the Pyrenees could easily have defaulted to a marquee high-altitude hike or the Madriu-Perafita-Claror valley's higher sectors — both would be a real-world mismatch for Nov 5–9. Replanned to Llac d'Engolasters (1,616 m, under the safety line) with an explicit winter-conditions caveat, paired with Caldea thermal spa as the day's `plan_b` on a rain/snow trigger. See `evidence.v2.json`'s `disagreements[].d-engolasters-november-suitability` for the full investigation.
- **2026-08-20 (reconcile) — Casa de la Vall's Day 2 plan corrected from "self-guided walk-in with an optional paid guided tour" to "reservation-only for any visit, no walk-ups."** Pass A's shipped guide implied a same-day self-guided visit was possible; Pass B fetched Casa de la Vall's own visits page (casadelavall.ad) and found admission is reservation-only via phone or email, booked before arrival. Rippled into the Casa de la Vall sight card, Day 2's itinerary body and constraints, the Booking checklist, and a new "what generic guides get wrong" divergence item — this is exactly the kind of research-forced re-plan this section exists to record, since the original Day 2 plan as shipped would have sent the traveler to a locked door.
- **2026-08-20 (reconcile) — Food & dining priority (#2) gained a second shipped pick, MiraKbé, reversing Pass A's rejection.** Pass A rejected MiraKbé for aggregator-only sourcing; Pass B closed that gap by fetching the venue's own site (mirakbe.com) for hours/menu/price, plus two independent firsthand accounts on it sitting off Andorra la Vella's touristy main street. Added to Food & shopping and folded into Day 2's lunch suggestion.
- **2026-08-20 (critic) — Day 3 re-planned around the route that actually exists.** Both passes shipped Llac d'Engolasters with visitandorra.com's official route stats (1.9 km, +350/−45 m, ≈2 h) attached to a "taxi up and walk the lakeside loop" plan. Re-fetching the cited page shows the signed route is LINEAR and starts in Encamp, in front of the Automobile Museum, with the +350 m being the climb up to the lake. The day is now built on that route: Line 2 bus to Encamp (visitandorra.com national routes; museus.ad independently names L2 for the museum), the out-and-back walk, and the honest statement that November is outside the June–September season the same authority recommends for it.
- **2026-08-20 (critic) — Museu Nacional de l'Automòbil un-rejected and shipped.** Its rejection reason was "in Encamp, a bus trip beyond the Andorra la Vella base" — a premise the corrected Day 3 disproves, since the trailhead is opposite its door. Deep-verified before shipping: €5 general / €2.50 reduced, Tue–Sat 10:00–14:00 and 15:00–18:00 Oct–Dec, closed Sun+Mon, Avinguda de Joan Martí 64, served by L2 and L4 (museus.ad). It gives Nov 7 an indoor option that fails differently from the hike and sits at the same bus stop, which Caldea (back in Escaldes-Engordany) cannot.

## Critic findings

Seven findings, all implemented in the guide. Nothing was deferred to the human. Two of the seven
(F1, F4) are citation-integrity defects the machine gates cannot see; F2 is the one that would have
put the traveller on the wrong side of the valley.

**F1 — Two `place_id` values that nothing in this run could have produced.** `07-sights.json` (Barri
Antic) carried `ChIJ-XEPpQ2LpRIRJUOGAtQUFYI` and `08-food-and-shopping.json` (MiraKbé) carried
`ChIJd_PC0dCKpRIRgt02FAwWfFc` — Google Place IDs. This run's own record states `lookup-place.mjs`
was unavailable and enumerates every id it did resolve (Casa de la Vall `W512803160`, the bus station
`N7264739214`, Caldea `R14119593`, Sant Esteve `W191582655`, Borda Estevet `N8967965640`) — all OSM
ids from a direct Nominatim fetch, and Llac d'Engolasters deliberately left as the placeholder rather
than mis-assigned. A Nominatim lookup cannot emit a `ChIJ…` id and no Places call is recorded
anywhere, so these two were recalled, not looked up. **Rubric row 2 (no fabrication), P0**, and the
schema's own comment on both `mapPoint` and `visitable`: "verified-or-flagged, never guessed".
*Replacement:* both set to the literal `__VERIFICATION_REQUIRED__`. Coordinates are untouched, so the
pins and Directions deep-links still work — a place_id upgrade is what is lost, and that is the
honest state. The scripts still require approval in this environment, so this cannot be closed here.

**F2 — Day 3 sold a route that does not exist where it sent the traveller.** `06-days.json` (Sat Nov
7), `07-sights.json` (Llac d'Engolasters) and `05-transit.json` (step 4) all said: taxi to the Ctra.
d'Engolasters access point, walk "the easy loop around the lake", 1.9 km, +350 m/−45 m, two-hour round
trip — every stat cited to visitandorra.com's official route page. That page describes a **linear**
route that **starts in Encamp, in front of the Automobile Museum**, climbing +350 m to the lake in
1 h 15 with a 45-minute descent. There is no lakeside loop on it. Taxi to the lake and the stats are
meaningless; follow the stats and you are in a different town from the one the guide routes you to.
Transit's alternative — "start the longer signed route from the Escaldes-Engordany tourist office" —
is likewise nowhere on the page. **Rubric row 7 (where / how to get there) and row 2**, plus the
geography lens. *Replacement:* all three surfaces rebuilt on the real route — Line 2 bus (Andorra la
Vella ↔ Encamp, visitandorra.com's national-routes page; museus.ad independently names L2 for the
museum at the trailhead), the out-and-back walk with the climb stated plainly, `dwell_min` 90 → 120.
The rejected Automobile Museum was un-rejected in the same edit (see Amendments) — it is at the
trailhead, open Saturday, and is the fallback that keeps the day whole when the trail is iced.

**F3 — A seasonal restriction was inverted into a permission.** The Day 3 `tldr` claimed the walk
"stays inside Andorra's own November safety window", and the sight card and divergence item built the
same argument from an altitude of "1,616 m" being under the 1,700 m line. Two problems. The trail
authority's Engolasters page names **June–September** as this route's season, "May to October" only
where weather and terrain allow — November is outside it either way, so no such window exists; the
>1,700 m rule is a harder restriction on other routes, not a licence for this one. And the 1,616 m
figure is published nowhere: the route page carries no altitude, and the lakes page says only "the
only great lake in Andorra at an altitude of less than 2,000m". **Rubric row 10 (honest gaps).**
*Replacement:* the metre figure is deleted from all three surfaces rather than swapped for another
unsourced number, and the guide now states the season honestly and tells the traveller to decide on
the morning's conditions. The pick survives on its real merit — it is the easiest signed route near
the capital — with two verified alternates behind it.

**F4 — The city-bus paragraph was cited to the airport coach operator's timetable, and got the lines
wrong.** `05-transit.json` step 3 named "**Cooperativa Interurbana Andorrana** city buses (L1–L6, É,
LC) … (L1: Caldea ↔ La Riberola)" under a section `source_url` of `andorradirectbus.es/en/schedules`.
That page was fetched: it contains no city-bus content of any kind. The official listing
(visitandorra.com, transport and mobility) is **Lines 1–7 plus an Express bus and a Night bus**, and
they are national inter-parish routes — Line 1 is Escaldes-Engordany ↔ Sant Julià de Lòria, not a
Caldea shuttle. **Rubric row 3 (provenance) and `verification-rules.md` §3** — an official URL pasted
onto a claim it does not support is a fabricated citation. *Replacement:* step rewritten to the
sourced line set with an inline citation to the national-routes page, naming the two lines this trip
actually uses, and pointing timetables and fares at bus.ad under a ⚠ (visitandorra.com publishes
neither). `03-health-and-safety.json`'s "L1-bus" was renamed "Line 1 bus" to match; Line 1 does serve
Escaldes-Engordany, where the hospital is, so that claim stands.

**F5 — A priority-1 sight with no where, no how and no when.** `07-sights.json` shipped Església de
Santa Coloma as the reservation-free answer to Casa de la Vall's booking wall, and put it on no day
card, gave no address beyond "the Andorra la Vella parish", and no way to reach it — while its own
prose contrasted it with sights that are a two-minute walk apart in the Barri Antic. It is not in the
Barri Antic: museus.ad puts it on Carrer Major in the Santa Coloma quarter and names the **Line 1**
bus for it. Worse for its stated job, it carries the **same Sunday and Monday closure** as the venue
it is meant to back up, so as a fallback it only exists on Thu, Fri or Sat. **Rubric rows 7 and 8.**
*Replacement:* the card now carries the quarter, the Line 1 bus with a ⚠ on the timetable, the
closure parity spelled out, and the museum service's reduced-mobility note (interior not adapted;
Espai Columba next door is step-free). It is threaded into Day 2 as the substitute to use when no
Casa de la Vall slot came through, with a matching day constraint. `dwell_min` 30 → 45.

**F6 — Contact hours printed as opening hours, and a day card that contradicted the venue card.**
`08-food-and-shopping.json` gave MiraKbé `hours: "10:00–16:00 & 19:00–23:00 Mon–Sat, closed Sundays"`.
On mirakbe.com that window is when the restaurant **answers calls**; it publishes no opening hours,
and the Sunday closure is an inference from it. Meanwhile `06-days.json` Day 2 called the place "a
short, walk-in-friendly stop" while the venue card said `book: "call"` and the site offers only a
booking-request form. **Rubric rows 7 and 10** — a `⚠` belongs on what cannot be sourced, and a day
card may not promise what the venue card denies. *Replacement:* `hours` now states the sourced lunch
service (Mon–Fri 13:00–15:15) and flags the rest with a ⚠ naming what the site actually publishes;
`closed` is marked unpublished; `how` carries the phone and the reservation form; Day 2 tells the
traveller to ring in the morning rather than turn up.

**F7 — Objective venue rules sourced to third parties.** Day 3's `plan_b` — the trip's only
wet-weather contingency, and a block whose provenance is schema-required — was sourced to
`andorra-tours.com`, a tour reseller, for Caldea's facilities and for "water shoes (mandatory in the
facility)". A reseller cannot testify to a venue's rules. The same class, milder: the Barri Antic
sight card cited `visitandorra.com/en/culture/churches-in-andorra/` for a paragraph about the old
quarter's lanes. **Rubric row 3 / `verification-rules.md` §3.** *Replacement:* `plan_b` re-sourced to
visitandorra.com's own Caldea page and rewritten to what that page states (indoor, outdoor and
panoramic lagoons, Nordic sauna, hammam, Indo-Roman baths), with the footwear claim dropped and a ⚠
on price and hours, which remain unfetchable behind caldea.com's block. Barri Antic re-pointed to
visitandorra.com's "must-visit spots in Andorra la Vella", and its body trimmed to what that page
supports (11th-century core, granite houses, lanes cut to the slope).

**Considered and rejected as findings.** The budget section has no `party` field: correct, since every
line is authored per-person and `BudgetBlock` would divide already-per-person figures. The Direct Bus
route page's "16 buses per day" against the schedule page's 7+7+8: different counting of the same
timetable, not a conflict. Casa de la Vall's €2.50/€1.50 and Santa Coloma's €7 sit in prose rather
than `facts.json`: a registry migration would be tidier, but each is sourced and dated where it
stands, so nothing is wrong — not a finding.

#### Continuity sweep — critic execution

**Greps run** (whole guide directory): `Engolasters` · `1,616` · `lakeside` · `loop` · `Ctra.` ·
`walk-in` · `Cooperativa` · `La Riberola` · `andorra-tours` · `ChIJ` · `churches-in-andorra` ·
`Encamp` · `Santa Coloma` · `L1` · `place_id` · `{{fact:…}}` token-to-`facts.json` key reconciliation.

**Ripples found and fixed:**
- `1,616 m` appeared in three places (Day 3 body, the Engolasters sight card, divergence item 3) — all
  three carried the same unsourced figure and the same inverted-restriction argument; all three rewritten.
- The Engolasters route description appeared in three places (Day 3 body, sight card, transit step 4)
  plus the day `title`, `pace`, `tldr` and `constraints` — all rebuilt on the Encamp trailhead.
- `L1` appeared in `05-transit.json` and `03-health-and-safety.json`; both now read "Line 1", matching
  the official naming.
- Surfacing Santa Coloma on Day 2 falsified `02-money-and-budget.json`'s "museum entries are €5 each"
  — corrected to name the €5 and the €7 separately.
- Shipping the Automobile Museum rippled into `facts.json` (new `automobile-museum-5-eur` row),
  `_guide.json`'s verified stamp, `09-sources.json`'s museus.ad line, and both candidate tables above.
- `_guide.json`'s re-check list gained the bus.ad timetables, which the corrected Day 3 now depends on,
  and its "MiraKbé hours/menu" claim was narrowed to the set-menu price per F6.
- All five `{{fact:…}}` tokens resolve to `facts.json` keys, and every `facts.json` row is referenced.

**Deferred to the human:** none — every finding was implemented in this stage. One item cannot be
closed by anyone in this environment and is left flagged, not deferred: the two `place_id` values from
F1 need `lookup-place.mjs` / `lookup-venue.mjs`, whose shell invocation still requires an approval
this session cannot obtain. They ship as `__VERIFICATION_REQUIRED__`, which is the legal state.

**Not verified here, flagged instead:** `bordaestevetandorra.com` now answers automated fetches with a
bot-verification interstitial (citation audit, last row). `caldea.com` and `travel.state.gov` remain
blocked as the earlier passes recorded. No new authority outside the domains those passes already
verified was needed — every replacement fact came from museus.ad, visitandorra.com, mirakbe.com,
casadelavall.ad, andorradirectbus.es or e-tramits.ad.
