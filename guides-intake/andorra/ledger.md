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
Not run this pass — Pass A's stage contract stops after research + `evidence.v2.json` are complete; the citation-audit spot-check (`references/verification-rules.md` §8's REQUIRED artifact) belongs to the done-gate pass that runs the full verify loop, not to this stage.

## Known gaps carried forward (honest, not silent)
- **Caldea's exact admission price and daily hours** — caldea.com returns HTTP 403 to every automated fetch tried (home page, `/en/timetable`, `/en/rates`); bot-blocked per the fetch-discipline doctrine, two-attempt budget spent, no different primary exists for Caldea's own pricing. The guide ships Caldea without a specific price (`08-food`/`02-money` note to confirm at caldea.com) rather than shipping an aggregator-sourced figure on an official-tier claim.
- **US State Department travel-advisory level** — travel.state.gov is Cloudflare-gated against every plain fetch (confirmed on three separate sub-pages), resolvable only through an interactive browser tool this environment doesn't have. Widely reported elsewhere as Level 1 (Exercise Normal Precautions), but not independently fetched, so the guide-level `advisory` field is left unset rather than shipped on a blocked source. Needs an interactive/browser-tool pass to close.
- **`lookup-place.mjs` / `lookup-tz.mjs` / `search-commons.mjs` were unavailable this session** (shell tool calls required approval that never resolved). Coordinates were instead sourced directly from OpenStreetMap Nominatim via `WebFetch` (same underlying data source the script wraps, address-matched against each venue's official listing) — every `map`/`place_id` field still carries `__VERIFICATION_REQUIRED__` rather than a guessed Place ID. `tz: "Europe/Andorra"` was set from general geography (Andorra sits entirely inside one zone with no Hawaii/Arizona-style boundary ambiguity) rather than the script's boundary-accurate resolution — low risk, but flagged here rather than silently assumed. No sight/venue photos were sourced (`img.file`/`cover`) since Commons search wasn't available — the guide ships with the Painted Atlas default cover, which is an honest default, not a gap. Església de Santa Coloma (added at reconcile) similarly ships without map coords for the same reason.
- **The EES land-border carve-out for short-stay tourists at the Andorra–Spain/France crossing** — Pass B's own fetch of govern.ad's EES guidance page returned only nav-menu content, not the substantive text, so whether Andorra's resident-only carve-out or the "random vs. systematic checks" reporting applies to this party's road crossing (as opposed to their first Schengen entry at the Barcelona/Girona/Toulouse airport, which is unambiguously covered) stays unresolved this pass — see `evidence.v2.json`'s `disagreements[].d-ees-tourist-exemption`. Bounded, not blocking: it affects a buffer note, not which candidates ship.

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
| Museu Nacional de l'Automòbil | Rejected — Encamp, redundant with Caldea | Not researched | Rejected, unchanged | A-only |
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
| Museu Nacional de l'Automòbil | rejected: located in Encamp, a bus trip beyond the Andorra la Vella base; redundant indoor pick once Caldea already covers a cold/wet-weather contingency | n |

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
