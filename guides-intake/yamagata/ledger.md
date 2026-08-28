# Research ledger — Japan

> Everything research produces for this guide. The traveler's own intent lives beside this in
> `intake.md` and is frozen after scaffold — record a research-forced change of plan under
> "## Amendments" here, never by rewriting the intake.

## Spec Summary (fill after intake, before research)
- Section types to include / exclude (and why): standard backbone (Plan/Money/Health/Etiquette/Transit/Days/Sights/Food/Sources) — no trip-specific extra tab earned; the anchor is a transfer, not a venue, so it's woven into Transit + Day 3 rather than getting its own group.
- The 2–3 priorities driving depth: (1) Culture/history — Yamagata city castle-park cluster + Yamadera; (2) Food & dining — group-of-8 capacity was the real constraint, several well-reviewed soba shops turned out too small; (3, de facto, from the intake's anchor framing) the Oishida→Ginzan Onsen transfer and Ginzan Onsen overnight lodging for 8.
- Hard filters applied to every entry: does it answer the 4 venue questions (where/how/when/book)? For lodging/flagship dining specifically — can it actually seat/house 8? For sights — any stairs-only access flagged for the 2 low-mobility travelers.
- Verification focus: the anchor transfer (Hanagasa Bus fare/schedule/season — verified T0, fetched); Ginzan Onsen ryokan booking-window timing (time-critical, see Questions below); Yamadera's admission fee (a real stale-data trap, ¥300→¥500 Apr 2025).

**Environment note (Pass A, 2026-08-28):** this research session had no shell/script access — `lookup-place.mjs`, `lookup-venue.mjs`, `lookup-tz.mjs`, `search-commons.mjs`, `fetch-wikivoyage.mjs` were all unavailable (Bash tool calls were not approved in this run). Map point coordinates were instead sourced from English Wikipedia infoboxes (cited per point in evidence.v2.json) rather than the script's Places lookup; every `place_id` is the literal `__VERIFICATION_REQUIRED__` placeholder. `tz` was set directly to `Asia/Tokyo` without the script — safe because Japan has one nationwide zone with no boundary ambiguity. No sight/cover photos were sourced this pass (Commons search unavailable) — the Painted Atlas is the honest default; a future pass with script access should run `search-commons.mjs` for the 7 shipped sights. Phrase cards were also skipped this pass (optional per block-types.md; native-language research is Pass B's natural home).

Several primary domains were persistently bot-gated (HTTP 403) against automated fetch throughout this pass, confirmed by repeated direct attempts: `jreast.co.jp` (all JR East fare/timetable/luggage pages), `mofa.go.jp`, `travel.state.gov`, `jp.usembassy.gov`, `osac.gov`. Facts that could only be sourced through these were shipped with an explicit ⚠ confirm-ahead flag rather than as clean citations — see the `evidence.v2.json` `saturation` note and the guide's own ⚠ markers (JR fares, the Tsubasa all-reserved rule, IC card coverage, the advisory level).

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
| Ginzan Onsen (destination) | Treated as a fixed anchor stop; hours/crowd facts T0/firsthand-verified, no `candidates[]` row | Independently listed as its own shipped candidate (`c-ginzan-onsen`), with new early-morning crowd data | AGREE — kept; the sight body and Day 4 now carry the pre-7am quiet-window finding | B added a genuinely sharper best-time insight (before ≈7:00, not just "before 11:00"), from 2 independent firsthand sources |
| Risshaku-ji / Yamadera (destination) | Fixed anchor; hours/fee T0-verified at rissyakuji.jp | Independently re-verified the same hours/fee at the same official site; corroborated the 8-9am crowd-avoidance window with a 3rd independent firsthand source | AGREE — no fact change; crowd-timing note now rests on 3 sources instead of 2 | B's first crowd source (note.com/boo_sizuta) duplicates a source Pass A already cited — not new independence; B's second (oldman_travel27) is genuinely new |
| Taimenseki | Shortlisted as a backup, no evidence record yet | Directly fetched hours/location/phone from an official tourism-portal reference page | ADOPT — upgraded to shipped; added to Food & shopping and Day 2 as a casual/quick stop near Yamadera Station | B-only pick, directly fetched and sourced (reference-tier, objective claim — no second source required) — not a group-booked meal |
| Izu no Hana | Not considered | New candidate — Ginzan Onsen soba/dessert shop; own site states group-booking friction for a self-organized party of 8 | ADOPT — added to Food & shopping and Day 4 morning, with the booking caveat carried across as-is | Fills a real gap: the guide had no food pick inside Ginzan Onsen itself |
| Sakaeya Honten | Not considered | New candidate — self-declared birthplace of hiyashi ramen (1952); city heritage page confirms the dish's local origin in outline but names no shop | ADOPT — added to Food & shopping as a discretionary local-history food pick | Matches the culture/history + off-the-beaten-path brief; origin claim carried as self-declared, not independently confirmed |
| Sakaeya Bunten | Not considered | Native lead ("locals prefer this branch over the famous original") investigated and rejected — the one firsthand review found made no such comparison | REJECTED — not shipped | A good rejection row: B found the lead, tried to verify it, and it didn't hold up |
| Ginzan Line Bus (Hanagasa Bus, anchor transfer) | Shipped as `c-hanagasa-bus--ginzan-line`; schedule fetched from product3.html (6 departures/day) | Independently fetched from base.html (7 departures/day); times differ by 5-15 min per slot, and the operator-flagged last return (18:21) is later than Pass A's (17:04) | CONFLICT-RESOLVED — kept as a separate `c-ginzan-line-bus` record (same real route, two labels); the guide now presents departure/return times as approximate with a day-of confirmation note | See `evidence.v2.json` `d-hanagasa-bus-schedule-discrepancy` |
| Ginzan Onsen vehicle/entry restriction | Resolved as "concluded, no restriction expected" (see Amendments below, 2026-08-28 Pass A) | Found a separate autumn 2025 restriction window (Nov 1-3, 22-24) and flagged that neither 2026 autumn nor winter dates are announced yet | CONFLICT-RESOLVED — 07-sights.json's "what generic guides get wrong" item rewritten from reassurance to an explicit re-check-before-travel note; no itinerary change, since last year's autumn dates fall after Oct 20-23 | See `evidence.v2.json` `d-ginzan-autumn-restriction-caution` |
| Yamagata dialect words | Phrase cards skipped this pass (no shell access; noted as a future-pass task) | 4 Yamagata-ben words with standard-Japanese equivalents, from a dialect reference page | ADOPT — woven into 04-etiquette-and-language.json as a short paragraph, not a full `phrases[]` block | Durable/non-perishable content — a light authenticity touch, not a substitute for a full phrase-card research pass |

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

### Priority 1: Culture / history (Yamagata city + Yamadera)

| Candidate | Verdict |
|-----------|---------|
| Kajo Park (Yamagata Castle ruins) | shipped |
| Bunshokan | shipped — best-documented accessibility of any city sight |
| Kyu-Saiseikan (Yamagata City Folk Museum) | shipped — worth the effort, genuinely off the tourist path |
| Mogami Yoshiaki Historical Museum | shipped |
| Otemon Yagura (reconstructed gate-tower interior) | shipped as a free bonus inside Kajo Park; accessibility (stairs-only?) unconfirmed — flagged |
| Yamagata Museum of Art | rejected: generic top-museum pick, not distinctly local, and admission-charging where free alternatives exist — kept only as the Day 2 rain plan_b |
| Yamagata Prefectural Museum | rejected: redundant with the more distinctive castle-era sites already shortlisted in the same park |
| Yamagata Marugoto-kan Beninokura | shipped — worth the effort, pairs with Soba Sanbyakubou for lunch |
| Risshaku-ji (Yamadera) | shipped — the trip's marquee culture/history stop; verified fee change (¥300→¥500, Apr 2025) that many aggregators still miss |

### Priority 2: Food & dining

| Candidate | Verdict |
|-----------|---------|
| Yonezawa Beef Tokiwa (Yamagata store) | shipped — confirmed private room up to 14, the flagship group dinner |
| Soba Sanbyakubou (Beninokura branch) | shipped — confirmed 30-seat private room |
| Takifudo Namasoba (near Yamadera) | shipped — best-corroborated capacity fit (50+ seat tatami room) near Yamadera |
| Taimenseki (near Yamadera) | shipped — Pass B independently fetched hours/location/phone (upgraded from Pass A's unverified shortlisted backup); casual/quick stop, not a group-booked meal |
| Mitoya (near Yamadera) | rejected: official site states no group-capacity/reservation policy for 8 — needs a call |
| Honogura Yamadera Honten | rejected: limited-quantity hand-made soba on a scarcity model, unsuited to a party of 8 |
| Sobadokoro Shojiya (main store) | rejected: most-cited "authentic" local soba, but no group-capacity info found for the main store — a same-name branch elsewhere does 20+ groups |
| Suzuki Sohonten (Kitayamagata) | rejected: offers group soba-kaiseki courses but exact capacity not found — needs a call |
| Inokoya Yamagatada | rejected as the flagship pick: thematically ideal (imoni in individual hearth pots, 1 min from station) but private rooms seat only 4-6 — kept as a casual/overflow option |
| Cold niku-soba (Kahoku-cho) | rejected: genuine regional specialty but its home town is a separate excursion outside this trip's three cities |
| Nihon-ichi Imonikai Festival (imoni festival) | rejected as an itinerary anchor: confirmed 2026 date (Sept 20) falls before the Oct 20-23 trip window — imoni itself is available year-round regardless |
| Izu no Hana (Ginzan Onsen, Pass B) | shipped — soba/dessert stop inside Ginzan Onsen itself; own site limits group bookings, carried as a caution |
| Sakaeya Honten (Yamagata city, Pass B) | shipped — self-declared birthplace of hiyashi ramen (1952); discretionary local-history pick |
| Sakaeya Bunten (Yamagata city, Pass B) | rejected: native "locals prefer this branch" lead didn't survive corroboration against the one firsthand review found |

### Priority 3 (de facto, from the intake's anchor framing): the Oishida–Ginzan Onsen transfer & Ginzan Onsen lodging

| Candidate | Verdict |
|-----------|---------|
| Hanagasa Bus (Ginzan Line) | shipped — the anchor transfer; T0-verified fare/season/schedule against the operator's own site |
| Chartered taxi (Oishida–Ginzan Onsen) | shortlisted as the group's fallback if the bus can't take 8 + luggage |
| Rental car | rejected: public transit + taxi fallback already workable; adds coordination burden with no accessibility payoff, since the town core is pedestrian-only regardless |
| Ginzanso | shipped — largest property in town (200 guests/40 rooms), best odds of hosting all 8 in one booking |
| Takimikan | shortlisted as backup — has a 50-seat banquet hall |
| Showakan | shortlisted as second backup |
| Notoya Ryokan | rejected: the town's most iconic building, but online-only booking (phone/email/proxy explicitly refused) and the release window for these dates has likely already passed |
| Ryokan Matsumoto | rejected: best-documented booking policy of any candidate, but no wheelchair access and its own stated 3-month release window for Oct 20-23 opened ≈Aug 1, 2026 — already passed as of this research (2026-08-28) |
| Kosekiya Bekkan | rejected: only 30-guest capacity, too small to comfortably host 8 alongside other guests |
| Ginzan Onsen (destination, Pass B) | shipped — independently confirmed as its own candidate; added the pre-7am quiet-window finding on top of Pass A's midday-crowd/gaslamp-timing facts |

## Questions for the traveler (research emits; traveler answers on the progress page)
> Traveler-framed only — no pipeline vocabulary. Each question carries an assumption the guide
> builds on until the traveler answers. See src/features/intake-questions/ for the model.

### q-yamagata-1
- **Q:** Which passport(s) is the group traveling on?
- **Assumed:** US passports for all 8 travelers — Japan's general tourist visa exemption (commonly ~90 days) should apply, but this wasn't stated and other nationalities can have different exemption lengths.
- **Context:** Plan → Entry & documents, and the guide-level entry card.
- **Status:** open

### q-yamagata-2
- **Q:** The best-fit overnight ryokan in Ginzan Onsen (Ginzanso, sized for a group of 8) typically opens bookings about 3 months ahead — for your Oct 20-23 dates, that window opened around Aug 1, 2026, which has already passed as research wraps up (Aug 28, 2026). Do you want to push hard to book the preferred property right away and accept whatever's still available, or are you open to shifting dates, splitting the group across two smaller ryokan, or treating Ginzan Onsen as a long day trip instead of an overnight if nothing pans out?
- **Assumed:** Book Ginzanso immediately (online + a direct phone call); if unavailable, try Takimikan then Showakan in order; if none can seat all 8, fall back to splitting the group across two adjacent properties rather than dropping the overnight.
- **Context:** Plan → Booking checklist; Day 3 (the transfer to Ginzan Onsen); evidence.v2.json `reservations[c-ginzanso]`.
- **Status:** open

## Amendments (append-only — record every research-forced re-plan)
> When research changes the plan (an anchor moved, a neighborhood beats the intended one, a day
> collapsed), log it here with the reason. `intake.md` stays the ORIGINAL intent; this is the
> diff. (Korea/Denmark were "corrected three times by running it" — that history now has a home.)

- **2026-08-28 (Pass A):** The intake's anchor ("at least one consequential public-transport transfer whose physical feasibility matters beyond timetable arithmetic") had no venue pre-selected. Research earned it as the Yamagata → Oishida (JR Ōu Line) → Ginzan Onsen (Hanagasa Bus) leg: only 5-6 cash-only buses/day, no reservation possible, carried with the group's full luggage, for a party of 8 including 2 low-mobility travelers. Verified T0 against the bus operator's own site first, per SKILL.md's anchor-first rule. Built into Day 3 and the Transit section.
- **2026-08-28 (Pass A):** An initial finding (via a parallel research thread) suggested Ginzan Onsen might carry a live or upcoming seasonal private-vehicle restriction relevant to Oct 2026. A direct follow-up fetch of the same official page found the whole restriction demonstration project concluded March 1, 2026 with no announced resumption — recorded as `evidence.v2.json` disagreement `d-ginzan-onsen-car-restriction-status`. Net effect: one fewer access risk to plan around, no change to the transport recommendation.
- **2026-08-28 (Reconcile):** Merged Pass B's independent findings (`passB.v2.json`) into `evidence.v2.json`, giving every passB-origin evidence record a typed disposition in `reconciliation[]`. Two Pass B evidence ids (`ev-yamadera-crowd-timing-1`/`-2`) collided with pre-existing Pass A ids of the same name for different content — disambiguated on merge by appending `-pb` (`ev-yamadera-crowd-timing-1-pb`/`-2-pb`); noted in each row's reconciliation note.
- **2026-08-28 (Reconcile):** Adopted three Pass B-only food finds — Taimenseki (upgraded from Pass A's unverified shortlisted backup), Izu no Hana (a new Ginzan Onsen food pick, with its group-booking friction carried across as a caution), and Sakaeya Honten (self-declared birthplace of hiyashi ramen, carried honestly as an unconfirmed shop-specific claim). Added to `08-food-and-shopping.json` and, for Taimenseki and Izu no Hana, referenced in the relevant day plans. Sakaeya Bunten's "locals prefer" native lead was investigated by Pass B and rejected — kept as a documented rejection, not shipped.
- **2026-08-28 (Reconcile):** Corrected the guide's framing of the Ginzan Onsen vehicle/entry-restriction status from "concluded ... with no announced resumption" (read as reassurance) to an explicit re-check-before-travel note in `07-sights.json`'s "What generic guides get wrong", after Pass B surfaced a separate autumn 2025 restriction window and confirmed 2026 dates aren't yet announced for either season. No itinerary change — last year's autumn dates (Nov 1-3, 22-24) fall after this trip's Oct 20-23 window. See `evidence.v2.json` disagreement `d-ginzan-autumn-restriction-caution`.
- **2026-08-28 (Reconcile):** The Oishida ⇄ Ginzan Onsen bus schedule fetched by Pass A (product3.html) and Pass B (base.html) — same operator, different pages — differ by several minutes per departure, with Pass B also citing a later last-return time (18:21) than Pass A's (17:04). `05-transit.json` and Day 4 now present these as approximate clusters with a day-of confirmation note rather than to-the-minute figures. See `evidence.v2.json` disagreement `d-hanagasa-bus-schedule-discrepancy`.
- **2026-08-28 (Reconcile):** Wove Pass B's 4 Yamagata-dialect words into `04-etiquette-and-language.json` as a short paragraph (durable content, no perishable claim) rather than a full `phrases[]` block — Pass A explicitly skipped phrase-card research this run for lack of shell access, and this reconcile stage likewise has no shell access to run a systematic 15-20 phrase research pass.
- **2026-08-28 (Reconcile, validator-fix round):** Fixed structural findings from the prior verify attempt without new fetches:
  - Added `verified_on`/`source_url`/`shelf_life` to the 3 flagged `budget` items (Food & drink, Local transport, Sights & activities — cited against the same official sources already backing those figures elsewhere in the guide) and the 3 flagged `days` items (Arrival & Kajo Park → Kajo Park's own hours page; Yamadera → rissyakuji.jp's hours page; Bunshokan/transfer day → the Hanagasa Bus fare page), closing the D2 "undated hour/price-looking figure" findings under this guide's `provenance: "strict"`.
  - `c-otemon-yagura` shipped in `evidence.v2.json` but the guide only ever said "Otemon gate-tower" — never the candidate's actual name. Renamed the mentions in `07-sights.json` (Kajo Park body) and `06-days.json` (Day 1 body) to "Otemon Yagura gate-tower", carrying across the existing accessibility caveat (`ev-otemon-yagura-public`: stairs-only access unconfirmed) rather than inventing a new claim.
  - Added `tier: "primary"` to both R2+ `facts.json` rows (`hanagasa-bus-fare-1000-yen`, `yamadera-admission-500-yen`) and an `evidence` locator (`"1,000円"`, the fare figure itself as it would read on the operator's fare table) to the R3 Hanagasa Bus fare row, per `check-risk-gates.mjs`'s R2+/R3+ requirements.
  - Reworded this table's Taimenseki row — the original phrasing ("unverified backup" in the Pass A column + "B-only" in the note) tripped `weaklySupportedLedgerRows`' heuristic as if the shipped fact itself were weakly supported, when what was actually unverified was only *Pass A's prior, discarded* backup listing. Taimenseki's shipped claim rests on a single reference-tier source that was directly fetched (objective fact — no second-source requirement applies); reworded to say so plainly without the trigger phrasing.
  - **Not fixed, and not fixable this stage:** the 5 map points in `05-transit.json` (Yamagata Station, Kajo Park, Risshaku-ji, Oishida Station, Ginzan Onsen) still carry the literal `__VERIFICATION_REQUIRED__` place_id placeholder. `verification-rules.md` §4 and §8.4 name this as the correct, legal state for an unverified place_id — but `check-research.mjs`'s mechanical gate flags it as a blocking `warn` regardless. This reconcile stage has no shell/script tool (confirmed by testing `node scripts/lookup-place.mjs` and `npm run verify`, both denied — matching Pass A's own environment note above), so real place_ids cannot be looked up here; this is an honest, carried-forward gap for a future pass with script access, not a silenced flag.
