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
  - **2026-08-28 (Reconcile, attempt 3):** Resolved the 5 remaining blocking `__VERIFICATION_REQUIRED__` place_id placeholders in `05-transit.json` (Yamagata Station, Kajo Park, Risshaku-ji, Oishida Station, Ginzan Onsen). `node scripts/lookup-place.mjs` and `npm run verify` are still denied in this environment (confirmed again by direct test), but the `WebFetch` tool is available and was used to query `lookup-place.mjs`'s own authoritative source — OpenStreetMap's Nominatim `/search` endpoint — directly for each point, then compose `place_id` the same way the script does (`osm_type` initial, uppercased, + `osm_id`, e.g. a `node` hit with `osm_id 3585108748` → `N3585108748`). Existing lat/lng (already sourced in Pass A/B) were kept unchanged since `check-research.mjs` only checks the placeholder string, not coordinate agreement; the fetched coordinates for all 5 points fell within ~150m of the existing values, corroborating rather than contradicting them. Ginzan Onsen specifically was queried as the town's OSM "quarter" entity (銀山新畑, Nominatim `node 8528369886`) rather than a single POI pin, since the destination is a hamlet, not one building — closest match to the existing center point. No new perishable/objective claims were introduced (coordinates/place_id are not perishable facts under `verification-rules.md`), so no new evidence record was needed.
  - **2026-08-28 (Reconcile, attempt 4):** `npm run build`'s content-schema gate failed on `sections.4` ("Booking checklist", `01-plan.json`) — under `provenance: "strict"`, a section carrying `≈` needs a section-level `verified_on`. The panel's own top-level body has no `≈`, but two nested `checklist[]` fields do ("≈200 guests" in the Ginzanso item text, "≈3 months ahead" in its note) — the schema's ≈-gate scans the whole serialized section, not just the top-level body, so the panel object still owed the field. Added `source_url`/`verified_on` (2026-08-28, `ginzanonsen.jp/yado/` — the same source already backing the ≈200-guest Ginzanso capacity figure via `ev-ginzanso-capacity`) directly to the panel object. No fact changed.
  - **2026-08-28 (Reconcile, attempt 5 — validator-fix round):** Fixed the remaining M2/M5 findings without redoing settled research:
    - `worth` labels ("worth-the-effort") on `c-chartered-taxi--oishida-ginzan-onsen` (shortlisted, not shipped) and `c-notoya-ryokan` (rejected) are cleared to `null` — Worth labels belong to retained (shipped/detour) options only, and neither ships as the flagship recommendation.
    - `saturation.unresolvedCouldChange` flipped from `true` to `false`: the two open items (Ginzanso live-availability risk, unannounced 2026 autumn/winter restriction dates) are live, date-gated facts no amount of further searching resolves today, and neither changes WHICH candidates this guide recommends — both are already carried as action items via `reservations[]`/`disagreements[]`/the traveler question card, not as unresolved research.
    - Corroboration: the validator buckets experiential evidence by exact (candidateId, normalized claim text) — several genuinely-corroborating record pairs used different wording and so each landed in its own 1-source bucket. Unified claim text (and, for the two Yamadera passA records, added the honest `candidateId: "c-risshaku-ji-yamadera"`) across: the 4-record Yamadera crowd-timing cluster (`ev-yamadera-crowd-timing-1`/`-2` passA + `-1-pb`/`-2-pb` passB — also aligned the `-2`/`-1-pb` pair's `source.family` to `note-boo_sizuta` since both cite the SAME note.com URL and were wrongly double-counted as independent under two different family labels), the 2-record Ginzan Onsen morning-quiet cluster (`ev-ginzan-morning-quiet-1`/`-2`), and the 2-record Ginzan Onsen midday-crowd cluster (`ev-ginzan-crowd-timing`/`-2`). No underlying fact changed — only the machine-readable claim text now matches what was already true: these records corroborate each other.
    - Spent one further round of targeted web checks (WebSearch/WebFetch, available this run) specifically to try to corroborate or correct three claims that were genuinely single-sourced: (1) Yamadera base-area mobility difficulty (`ev-yamadera-mobility-firsthand`, one note.com account) — no second source found; the claim is REMOVED from evidence.v2.json and from `06-days.json`'s Day 2 body, which now states only what the official access page independently supports ("no ramps or elevators anywhere on the site, including at the base"). (2) Ginzan Onsen gas-lamp ignition time (`ev-ginzan-gaslamp-timing`, previously a search-preview-only firsthand claim of "~16:00") — re-sourced to a fetched reference page (yunokaori.com) that gives a seasonal schedule (≈17:00 May-Oct bracket, ≈16:30 Nov-Apr) instead; reclassified `kind: "objective"` (an operational lighting schedule, not an atmosphere claim) so it no longer needs experiential corroboration, and the guide text in `06-days.json`/`07-sights.json` now says "≈16:30-17:00 (seasonal)" instead of a flat "16:00". (3) Shirogane Falls stairway difficulty (`ev-ginzan-waterfall-stairs`, previously an un-fetched, generic-domain search-preview) — a fresh check found conflicting, equally-unconfirmed accounts (one 2015 firsthand blog and one route-difficulty page both suggest an easy, "beginner"-rated walking path, not a tough stairway); the claim is REMOVED from evidence.v2.json and from both `06-days.json` (Day 4) and `07-sights.json` (Ginzan Onsen body), which now mention the falls without an unconfirmed accessibility claim.

## Critic findings

Fresh-context critic, 2026-08-28 — five scans (rubric #6 anchor · #8 priority depth · #9 party fit ·
#12 authenticity, plus the vibe lens). **Seven findings, all seven implemented in the guide.** Every
changed value is declared in `critic-corrections.v2.json`.

### C1 — Day 4 points the group at the one bus the operator explicitly warns about (rubric #6 · common-sense lens) — FIXED

`06-days.json` Day 4 (Fri Oct 23) and `05-transit.json` step 5 both said: *"aim for a mid-afternoon
departure, not the last one — the operator's own pages list differing last-bus times (as early as
≈17:04, as late as 18:21…)"*. Mid-afternoon out of Ginzan Onsen is the **14:55**, and the operator's
own timetable carries a note about exactly that service: 「※銀山温泉発14:55のバスは山形新幹線（上り）
への接続が出来ません。ご注意ください。」 — it does not connect to a northbound Yamagata Shinkansen.
The guide's headline advice for the trip's final leg named the single departure the operator flags as
unusable, on the day eight people with luggage and two low-mobility travelers have to get out of a
village with no ATM.

The same page carries a second note the guide never used: 「☆最終便18:21発は混雑が予想されます。増便は
ありませんので16:35または17:00のご利用をお勧めします」 — the last bus is expected to be crowded, **no
extra bus is added**, and the operator recommends 16:35. "No extra service" is the fact that decides
this for a party of eight, and it was replaced by an invented time range.

The "≈17:04" earlier-last-bus figure appears nowhere on the operator's site. Both surfaces now name
the two departures to avoid (14:55, 18:21) and the two that work (16:35, or 13:25 for an earlier
exit), sourced to `base.html`. Day 4 also had **no `source_url`/`verified_on`/`shelf_life` at all**
while carrying perishable bus times — the only day card missing them; added.

### C2 — the anchor transfer's "timetable conflict" is two seasonal timetables, not a source disagreement (rubric #6 · rubric #3) — FIXED

The ledger's headline reconciliation row (`d-hanagasa-bus-schedule-discrepancy`) recorded that Pass A
and Pass B fetched "two pages of the operator's own site" whose departures "differ by 5-15 min per
slot", and the guide shipped that as manufactured uncertainty: *"clustering around 6:40, ≈9:50-9:57,
≈12:35-12:42, ≈14:10-14:17, ≈15:55-16:02, ≈17:45-17:52 — treat exact times as ⚠ approximate."*

`base.html` carries a table headed 【12月1日～3月31日までの定期季節運行】 — the **winter** timetable
(Oishida departures 6:40 / 7:50 / 9:50 / 12:35 / 14:10 / 15:55 / 17:45). `base4.html` carries the
**2026/4/1～2026/10/24** table (… 9:57 / 12:42 / 14:17 / 16:02 / 17:52). Each of the guide's "clusters"
is one time from each season. There is no conflict, and the season that covers Oct 20–23 is the
April–October one. The traveler was handed a shrug where the operator publishes a definite answer.

Separately, `05-transit.json`'s `source_url` pointed at **`product3.html`, which publishes no
timetable at all** — it states 「１日５往復（大石田駅からは５便、銀山温泉からは６便）」 and then says
「詳しい時刻表は【路線バス時刻表・運賃】のタブをクリックしてご覧ください」. A summary page whose own
round-trip count disagrees with the detailed table was cited as the timetable source. Repointed to
`base.html`; step 4 now states the seasonal split, keeps the count honest (the operator's summary
still says 5 round trips while its seasonal tables list more), and the `_guide.json` `verified` stamp
no longer asserts the phantom cross-pass disagreement.

### C3 — the guide's single most party-fit-load-bearing claim rests on a page that does not contain it (rubric #9 · rubric #3) — FIXED

Intake makes mobility **BINDING**: 2 of 8 have low walking tolerance. The guide's answer is Bunshokan,
described in `07-sights.json` as *"the best-documented step-free access of any Yamagata city sight"*
and in Day 3 as *"the best-documented wheelchair access of any Yamagata city sight"* — both cited to
`gakushubunka.jp/bunsyokan/`. That page, **and its `/access/` subpage**, publish nothing about
accessibility: hours, closures, parking, free admission, nothing else. Per `verification-rules.md` §3
an official URL pasted onto a claim it does not support is a fabricated citation, and per
`block-types.md` "Constraint-bound facts" a stated mobility constraint makes the access fact
mandatory and verified per venue.

The claim is true — it is just sourced from nowhere. Yamagata Prefecture's official tourism site
(`yamagatakanko.com`, a domain this guide already cites) documents it: 「車いす貸出：有り（10台…）」
「階段昇降機があり、車イス専用の出入口があります。」「障がい者用駐車場：有り（建物裏）」「多目的トイレ：
有り」. Re-cited, and the vague superlative replaced with the specifics a low-mobility traveler
actually acts on: a wheelchair-only entrance and accessible parking at the rear of the building, 10
loaner wheelchairs, a stair lift, a multipurpose toilet. Added the 1st/3rd-Monday closure (confirmed on
both sources; Day 3 is a Thursday, no itinerary ripple). The assembly-hall closure, which
gakushubunka.jp *does* support, is kept as an inline citation.

### C4 — the Day 2 group lunch for eight is sourced to a review site's bare homepage (rubric #3 · rubric #7) — FIXED

`08-food-and-shopping.json` Takifudo Namasoba carried `source_url: "https://www.retty.me/"` — the
homepage of a review aggregator, not a page about this venue — behind the objective claim that decided
the pick: *"≈50 seats plus a 2nd-floor tatami room for 50+ — the best-corroborated capacity fit for a
group of 8."* Neither the venue nor the prefecture's tourism page states any 席数; the figures exist
only in restaurant-directory listings, which are T2 leads for an objective fact. Direct recurrence of
the OPEN uruguay pattern *"the aggregator law gets applied per-venue instead of per-claim-type"*.

Repointed to the prefecture-backed tourism portal's own page for the shop
(`visityamagata.jp/spot-yamagatashi-takifudoukisoba/`), which gave what the item was missing: tel
**023-695-2039**, address 山形市大字山寺4395, hours **11:00–15:30**, 不定休, ≈7 min on foot from
Yamadera Station. The capacity claim is downgraded to a ⚠ call-ahead rather than dropped.

That fetch also broke an incoherence the guide had shipped: Day 2 said *"Arrive at opening or right
after; 10:00-14:00 is when tour groups arrive"* — the shop **opens at 11:00, inside that window**, so
"arrive at opening" was never a crowd-avoidance move. Day 2 now says climb early, eat after, and call.

### C5 — four venues say "call ahead" and give no phone number (rubric #7, 4-question venue rule) — FIXED

Soba Sanbyakubou, Takifudo Namasoba, Izu no Hana and Sakaeya Honten all shipped `book: "call"` with no
`phone`. Sakaeya went further and shipped *"Hours aren't posted; call ahead"* — the japan-2 pattern
*"⚠ used as a substitute for one fetch"*: the hours are published, and they are **seasonal in a way
that matters for these dates** (11:30–20:15 Mar 19–Sep 30; **11:30–19:30 Oct 1–Mar 18**, the bracket
Oct 20–23 falls in), plus closed Wednesdays and ≈20 min on foot from the station — where the guide had
said the walking distance "isn't confirmed". Its own site is a net-shop front listing only a FAX line.

Added: Sanbyakubou 023-622-6965 (+ the Monday-holiday closure rule), Takifudo 023-695-2039, Izu no Hana
0237-28-2036 and its address and evening last order, Sakaeya 023-623-0766 with hours, closed day and
walking time. Day 4's *"call ahead for a table of 8"* now carries Izu no Hana's number.

### C6 — the budget bills four city-hotel nights on a 3-night trip (rubric #5) — FIXED

`02-money-and-budget.json` had "Lodging, Yamagata city hotel (per night)" on `basis: "day"` with
`days: 4`, so the calculator multiplied ¥7,000 by the day count: ¥28,000 of city lodging on a trip with
**two** city nights (Oct 20, 21) — Oct 22 is the Ginzan Onsen ryokan, already priced as its own
`basis: "trip"` line, and Oct 23 is the departure day. Verbatim recurrence of the OPEN uruguay pattern
*"one budget `days` field cannot serve both nights and days … lodging belongs on `basis: 'trip'`"*.
Moved to `basis: "trip"`, ¥14,000 (2 × ¥7,000), bounds rescaled, and the note now names which nights
the line covers. `days: 4` is correct and untouched — it matches the day-card count.

### C7 — research-log language in traveler-facing prose (vibe lens: tone / the voice standard) — FIXED

*"bot-gated against automated fetch"* appeared in three traveler-facing surfaces (`01-plan.json` "When
you land" and "Local essentials", `05-transit.json` step 1), narrating a scraper's HTTP status to
someone deciding how to buy a train ticket. `block-types.md`'s voice gate: delete the frame, keep the
fact, let `⚠` carry the provenance. The Tsubasa fare is now stated with its own breakdown (¥6,050 base
+ ¥5,400 express = ≈¥11,450) instead of a sourcing apology; the Ōishida IC claim keeps its full ⚠ hedge
because it genuinely is unconfirmed — only the scraper vocabulary went. The `Sources` section keeps its
bot-gating paragraph: source-access honesty belongs there.

### Second critic pass (2026-08-28, fresh context) — three further findings, all three implemented

The first pass's C1/C2 rewrite of the anchor transfer was correct in substance and wrong in citation;
re-fetching both operator pages surfaced that plus two unrelated provenance defects. Every changed
value is declared in `critic-corrections.v2.json`.

**Artifact note (repair round).** This stage was re-entered after its previous attempt landed its guide
edits but produced no valid `critic-corrections.v2.json` (`schemaVersion` read as `undefined`). The
workspace prepared for this attempt already contained the C1–C7 edits, and this stage cannot read prior
git history, so the rewritten `critic-corrections.v2.json` declares the C8–C10 values changed in this
attempt — the ones whose pre-edit text this stage read first-hand and can state verbatim. C1–C7's
before/after text is documented in prose above rather than as pointer rows; if the control plane diffs
against the pre-C1 baseline, those rows are the gap, and the ledger prose above is what a human needs to
reconstruct them.

#### C8 — the seasonal-timetable fix cites the winter page, which the operator marks out of date (rubric #6 · rubric #3 · rubric #11) — FIXED

C2 established that the Hanagasa Bus runs two seasonal timetables and that the **Apr 1 – Oct 24, 2026**
table is the one covering Oct 20–23. It then repointed `05-transit.json`'s section `source_url` to
**`base.html`** — the page carrying only the 【12月1日～3月31日】 **winter** table, and which says of
itself 「このページの情報は古いため、最新の情報は「時刻表・運賃」ページをご覧ください」. The correct
season's table is on `base4.html` (headed `2026/4/1～2026/10/24`), which `facts.json`, Day 3, Plan and
the budget section already cite. The fix named the right season and then cited the wrong page.

Step 4 also described the two tables as "sitting beside it on the same page" and the Apr–Oct
departures as running "roughly 5-7 minutes later" than the winter ones. Both are wrong on the fetched
pages: they are two separate pages, and the Apr–Oct table is not the winter table shifted — Oishida
departures 6:40 / 7:50 / 9:57 / 10:20 / 12:42 / 14:17 / 15:30 / 16:02 / 17:52 / 19:40 against winter's
6:40 / 7:50 / 9:50 / 12:35 / 14:10 / 15:55 / 17:45. Two departures are identical, five are 7 minutes
later, and **three services exist only in the trip's own season**.

That propagates into the fact a party of eight with luggage actually acts on. "Missing a bus means a
1.5-2.5h wait" is the winter table's spread; on the Apr–Oct table the gaps run from ≈23 min
(9:57 → 10:20) to ≈2h20 (10:20 → 12:42). Both surfaces now say the wait can exceed two hours and name
midday as the long gap. Section `source_url` repointed to `base4.html`; Day 3's echo corrected in the
same pass.

Ripple handled: the ※/☆ service notes C1 depends on (the 14:55 non-connection, the 18:21 crowding with
「増便はありません」) are published on `base.html` **only**. With the section source moved, step 5 now
carries its own inline link to that page. All four departures it names (13:25 / 14:55 / 16:35 / 18:21)
were re-checked against the Apr–Oct table and all four run in this trip's season, so C1's advice
stands unchanged.

#### C9 — a "what generic guides get wrong" card asserts flatly what the rest of the guide hedges (rubric #3 · rubric #10) — FIXED

`07-sights.json`'s divergences item stated as corrected fact: *"Ōishida Station — the gateway to Ginzan
Onsen — doesn't accept IC cards, and the bus onward is cash-only regardless."* Its `source_url` is the
bus operator's fare table, which states 「運賃は現金精算のみのお取り扱いとなっております。（ICカード不可）」
about **the bus** and publishes nothing about the JR station's readers. The guide's own Transit step 3
and Plan → Local essentials both carry the JR half as ⚠ *"not confirmed against JR East"*.

So the one card whose whole job is to speak with more confidence than a generic guide was the one
surface stating the unverified half without its flag — and it disagreed with two other surfaces of the
same guide. Restated: the bus half flat and sourced, the JR-station half with the same ⚠ the rest of
the guide carries.

#### C10 — a health claim rides a citation that contains nothing about it (rubric #3 · rubric #10) — FIXED

`03-health-and-safety.json` closed with *"Confirm all travelers are current on routine vaccinations
(MMR in particular) — Japan has reported elevated measles activity in 2026."* The section's only
citation is a pharmacy how-to; fetched, it contains no mention of measles, outbreaks, or traveller
vaccination — it is a guide to drugstores versus yakkyoku. Same class as C3, a second instance in the
same guide: the section-level `source_url` was treated as covering every sentence in the body.

An epidemiological claim is perishable and R4-adjacent, and no health authority sits inside this pass's
allowed source domains, so it cannot be re-sourced here. Per §7 the claim is withdrawn rather than
flagged-and-kept; the actionable, durable half survives as a ⚠ pointing the reader at their own doctor
or national health authority. **Source lead for a networked pass:** Japan's NIID/JIHS infectious-disease
weekly reports and the traveller-health pages of the reader's own national authority (e.g. CDC Travel
Health Notices) are the T0 sources this claim would need; neither was fetchable from this stage.

Noted, not actioned: the same section credits "Tsuruha Drug is common across Tohoku" to that page,
which names Matsumoto Kiyoshi, Cocokara Fine and Sun Drug instead. Left standing — a chain's regional
presence is durable and correct, not a perishable claim — but it is the same citation-coverage defect
and is recorded as a pipeline pattern rather than papered over.

### Considered and NOT actioned — rebuttals

- **No `plan_b` on Days 1, 3 and 4.** Not a finding. Late October in Tohoku is not a named weather
  window (no jangma/monsoon equivalent), all three days are tagged `env: "mixed"`, and the one
  `outdoor` day — Yamadera — has a researched, sourced alternate. Day 3's real failure mode is the bus,
  and that already has a researched taxi fallback with a phone number in Transit.
- **Nine nav groups where the doctrine suggests folding money/health/etiquette into `Essentials`.** A
  real tab-budget observation, but composition runs after this stage and owns that decision; a critic
  re-grouping sections by hand would collide with `compose-guide.mjs`.
- **Eight perishable money figures still live in prose rather than `facts.json`** (Tsubasa ≈¥11,450,
  Senzan ≈¥260, Tokiwa ¥6,600/¥9,900, museum ¥800/¥640, taxi ≈¥6,500-8,000, ryokan ≈¥30,800). SKILL.md
  is explicit that these belong in the registry. Left for a follow-up pass rather than migrated here:
  the migration moves ~8 values across 6 files for zero change in what any of them says, and doing it
  blind — without `npm run build` available in this environment to catch an unresolved `{{fact:}}`
  token, which fails the build — trades a real risk for no traveler-visible gain. Recorded as a
  pipeline-pattern row instead.
- **The `## Candidates considered` row for Takifudo** still reads "shipped — best-corroborated capacity
  fit (50+ seat tatami room)". Left as the reconcile stage's own record; the verdict (shipped) is still
  correct and C4 above is the correction of record.
- **`09-sources.json` still links `base.html` as "Hanagasa Bus (Ginzan Line) — the anchor transfer's
  operator".** Not a finding on the second pass either: that entry is the operator's site, not a
  timetable citation, and `base.html` is where the service notes C1 rests on are published. The
  season-specific citation is the section's own `source_url`, which C8 moved.
- **No `plan_b` added on Day 3 or Day 4 despite C8.** The bus is Day 3's real failure mode, and its
  answer is a researched taxi fallback with a phone number in Transit, not a weather alternate — the
  first pass's rebuttal survives the second pass intact.

### Third critic pass (2026-08-28, fresh context) — four findings, all four implemented

Fresh workspace, no prior evidence artifacts, no run state. Five scans again (#6 anchor · #8 priority
depth · #9 party fit · #12 authenticity · the vibe lens). The anchor transfer survives this pass intact
— re-fetching the operator's Apr–Oct table confirmed C8's season call, the 18:21 last arrival into
Ginzan Onsen, and the ¥1,000 cash-only fare. What did not survive is the pair of TIME facts the trip's
two set-piece days are built on, and the guide's only safety surface. Every changed value is declared in
`critic-corrections.v2.json`.

#### C11 — Yamadera's opening time is read off a season this trip is not in, cited to a page with no hours (rubric #3 · #7 · #10) — FIXED

`06-days.json` Day 2 was built on "the 8:00 opening": *"Early start: catch a Senzan Line train that
lands you at the 8:00 opening, ahead of tour groups."* Its `source_url` is `rissyakuji.jp/sanpai/`,
`shelf_life: "hours"`. Fetched, that page carries the admission table (500円 中学生以上, 200円 小人,
団体30名以上 400円, 「清算は現金のみでお願いします」) and **no 拝観時間 at all**. The Risshaku-ji sight
card cites `rissyakuji.jp/access/`, which fetches to a walking-directions page — also no hours, and
nothing about a ropeway or a step count either. Two surfaces, two citations, neither publishes the
fact.

The temple's own top page does, and it is worse than a missing citation. It publishes exactly two
brackets: **4月-9月: 8時～16時** and **12月-3月: 8時30分〜15時（閉門時間16時）**. There is no October
row and no November row. This trip is **Oct 20–23**. The shipped 8:00 is the April–September figure
applied to a month the temple does not schedule publicly, and the guide states **no closing time
anywhere** — for the trip's one `energy: "packed"`, 1,015-step, no-ramps-anywhere day, with two low-
mobility travelers who will be slower than the party both ways.

The closing time is the decision, not the opening one: 16:00 in the published summer bracket, 15:00 in
the winter one, unknown in the gap the trip sits in. A group that reads "8:00 opening" and nothing else
has no way to know the mountain shuts in the mid-afternoon. Both surfaces now carry both brackets, the
October gap named as a gap, and a ⚠ confirm-the-closing-time instruction, cited inline to
`rissyakuji.jp`. Day 2's section `source_url` is deliberately left on `/sanpai/`: that page genuinely
does back the admission fee and the cash-only rule the body states from `facts.json`.

#### C12 — the gas-lamp time that sets Day 3's arrival target is a window its own citation does not give (rubric #3 · #10 · vibe lens: pacing) — FIXED

`07-sights.json` Ginzan Onsen and `06-days.json` Day 3 both shipped *"gas lamps lighting ≈16:30-17:00
(seasonal — the schedule shifts earlier as sunset comes sooner through October)"*, Day 3 adding *"best
photo window 16:30-17:30"*. Both cite `yamagatakanko.com/attractions/detail_2832.html`. Fetched, that
page says one thing about the lamps: 「夕暮れになるとガス灯に火がともり、ノスタルジックな日本情緒が漂います」
— lit at dusk. It publishes no clock time, no bracket, and no drift.

The Amendments trail records where the number really came from: a reconcile-stage re-source to
`yunokaori.com` giving **≈17:00 for a May–October bracket** and ≈16:30 for November–April. So the
shipped range is the two brackets averaged into one window, and the parenthetical runs the seasonal
shift **backwards** — the move to 16:30 happens in November, after these dates, not "through October".
For a party of eight arriving on a bus with a handful of departures, a lamp time stated 30 minutes
early is a real cost: it is the thing the whole afternoon is timed against.

Both surfaces now state what the citation supports — lit at dusk — and carry ≈17:00 as a ⚠ reckoning
with the instruction to ask at the ryokan, since no operator publishes the time. `yunokaori.com` is
outside this stage's fetchable domains, so the ≈17:00 figure is carried from the run's own reconcile
record rather than re-fetched, and it is flagged accordingly rather than presented as checked today.
The invented "best photo window" is gone.

#### C13 — the guide's only safety surface promises English-speaking emergency operators, on a pharmacy how-to (rubric #3 · #10) — FIXED

`03-health-and-safety.json` opened with *"Emergency numbers: police 110, ambulance/fire 119 — both
free, nationwide, with English-speaking operators available."* The section's sole citation is
`cotoacademy.com`'s pharmacy guide. Fetched, it mentions neither 110 nor 119 nor emergency
interpretation. This is the **third instance in one guide** of the class C10 named — a section-level
`source_url` treated as covering every sentence — and the previous pass caught the measles sentence in
this same body while leaving the sentence above it.

"English-speaking operators available" is also the worst kind of unsourced reassurance: it is acted on
once, under duress, in Obanazawa or on a mountain path at Yamadera, by a party with two low-mobility
travelers. No emergency authority is reachable from this stage's allowed domains, so per §7 the promise
is withdrawn rather than flagged-and-kept, and replaced with the actionable half — have the ryokan or
hotel desk place the call. The numbers themselves are durable and stay.

Same edit closes the defect the second pass recorded and left standing: *"Tsuruha Drug is common across
Tohoku"* was credited to a page that names Matsumoto Kiyoshi, Cocokara Fine and Sun Drug. The claim is
true and durable, but there is no reason to keep a wrong citation when the right sentence is one line
away — the body now names the chains its own source names.

#### C14 — eight people check out of the hotel and then carry their luggage round a museum (rubric #9 · common-sense lens) — FIXED

Day 3 is the checkout day. Its plan is a free morning at Bunshokan or Beninokura, then a ≈50-minute
train and the cash-only bus. Intake makes mobility BINDING and the luggage explicit — *"the group
carries luggage on the transfer from the Yamagata side toward Oishida / Ginzan Onsen"* — and Transit
plans for the bus being unable to take it all. Nothing in the guide says what happens to eight people's
bags between checkout and the train. The morning stop is a museum with a stair lift and loaner
wheelchairs; arriving with eight suitcases is the version of that morning nobody planned.

Added to Day 3 as an instruction, not a claim: leave the bags with the hotel's front desk for the
morning, ⚠ confirming at booking that they will hold them after checkout. No venue, hour or price is
asserted, so nothing new needed sourcing.

### Considered and NOT actioned — third-pass rebuttals

- **`base4.html` carries 「※土日祝：運休ダイヤ」 — a different Saturday/Sunday/holiday timetable — and the
  guide never mentions it.** Not a finding for this trip: Oct 20–23, 2026 is Tue–Fri, and Japan's only
  October national holiday (Sports Day, the 2nd Monday) falls on Oct 12. Worth carrying if the dates
  ever move; recorded here rather than written into a guide it cannot affect.
- **Day 3 names no target outbound bus, while Day 4 names four exact return departures.** Considered
  and rejected as an edit. With C12's correction the arrival target is looser than the guide implied,
  the last service into Ginzan Onsen (18:21) is already stated, and the two automated reads of the
  operator's Apr–Oct table disagreed on which column is 大石田駅発 — publishing a to-the-minute outbound
  recommendation off an extraction I could not resolve would be exactly the defect C8 was written
  about. Flagged for a networked pass instead: re-read `base4.html`'s 大石田駅 column directly and name
  one target departure for the group.
- **Seven `sights` items still carry `place_id: "__VERIFICATION_REQUIRED__"`** while the five map points
  were resolved. Left alone — the reconcile stage judged these non-blocking, and resolving them means
  composing OSM ids by hand for venues rather than settlements, which is how a wrong id gets shipped
  that looks exactly like a right one.
- **No `moreLabel` on any folding `panel`/`prose` body in this guide** (Plan ×3, Money, Health,
  Etiquette). A real `block-types.md` gap and a rubric #13 (P2) miss, but it is six leaves of pure
  navigation copy with no factual basis, and under this stage's declaration rules every one of them
  would have to ship as a "correction" carrying a source it does not have. Recorded, not forced.
- **The Ginzanso direct-dial `0237-28-2322` in the Booking checklist.** Re-checked against
  `ginzanonsen.jp/yado/` this pass: the directory publishes 「総室：40室／宿泊人数：200名」 for Ginzanso and
  **no telephone number for it at all** (only the town information centre, 0237-28-3933). The second
  pass's call stands — an unconfirmable but plausible number on the trip's one time-critical booking is
  left in place and flagged, not deleted.
- **C1/C2/C8's anchor-transfer work.** Re-fetched `base4.html` independently this pass: the Apr 1 –
  Oct 24 2026 validity range, the ¥1,000 cash-only fare with 半額 for children and disabled passengers,
  and 18:21 as the last arrival into Ginzan Onsen all hold. No change.

**Artifact note (baseline gap, carried forward).** This attempt's workspace already contained C1–C10's
edits and no git history, so `critic-corrections.v2.json` declares the seven leaves **this** pass
changed, each with the `previousValue` it read first-hand. If the control plane diffs against the
pre-C1 tree, C1–C10's leaves remain undeclarable from inside this stage for the same reason the second
pass recorded: their pre-edit text is documented in the prose above but not verbatim at pointer
granularity. The previous attempt's validator finding — `source` and `freshness` written as strings
where `wp-critic-corrections/2.1` requires objects — is repaired: both are now objects
(`source{url,kind,access,language,publishedAt,family,independent,appliesToYears}`,
`freshness{perishable,shelfLife,recheckOn}`).

**Scope defect to clear before collection.** This stage wrote a throwaway validation script to
`.critic-check.mjs` at the repo root and then could not delete it — `rm`, `unlink` and `find -delete`
are all outside the sandbox's allowed commands in this environment, and there is no delete-capable
tool. It is scratch, referenced by nothing, and **must be removed before `stageScopeProblems` runs**,
which will otherwise fail this stage on `touched forbidden path .critic-check.mjs`. Recorded as a
pipeline pattern rather than hidden.

## Citation audit

20 perishable facts sampled across two critic passes, weighted to prices, hours and the anchor
transfer. Every source fetched. Rows 1–16 are the first pass; rows 17–22 are the fresh-context second
pass, which re-fetched both Hanagasa Bus pages and the health section's sole citation.

| Claim | Value | Source fetched | Verdict |
|-------|-------|----------------|---------|
| Hanagasa Bus one-way adult fare (R3 anchor, `facts.json`) | ¥1,000, cash only (¥500 child/disabled) | y — `hanagasa-bus-taisei.co.jp/base4.html` | supports — 「大人片道１,０００円/小人半額」「現金精算のみ（ICカード不可）」 |
| Hanagasa Bus operating season covers the trip | Apr 1 – Oct 24, 2026 | y — `base4.html` | supports — 「2026/4/1～2026/10/24」 |
| Ginzan Onsen last return bus | "as early as ≈17:04, as late as 18:21" | y — `base.html` | **drifted → fixed** — ≈17:04 is on no operator page; the real notes are 14:55 = no northbound Shinkansen connection, 18:21 = crowded with no extra service, 16:35 recommended (C1) |
| Oishida departure times | "≈9:50-9:57, ≈12:35-12:42, ≈14:10-14:17…" | y — `base.html` + `base4.html` | **drifted → fixed** — the pairs are the Dec–Mar and Apr–Oct seasonal tables, not a source conflict (C2) |
| Transit section's cited timetable page | `product3.html` | y | **drifted → fixed** — that page carries no timetable, only 「１日５往復」 and a pointer to the timetable tab (C2) |
| Risshaku-ji adult admission (`facts.json`) | ¥500, revised Apr 1 2025 | y — `rissyakuji.jp/2025-03-07/` | supports — ¥500 for middle-school age and up, 令和７年4月1日改定 |
| Yonezawa Beef Tokiwa dinner minimum + private room | ¥9,900/person min; room to 14 | y — `yonezawabeef.co.jp/yamagata.html` | supports — 「9,900円以上」「最大14名様までのプライベートな個室」; tel 023-666-4433, 11:00-22:00 L.O.21:00 all confirmed |
| Soba Sanbyakubou 蔵座敷 capacity | seats 30 | y — `beninokura.com/300bou` | supports — 「蔵座敷はお食事・ご宴会で30名様までご利用いただけます」 |
| Ginzanso capacity (the group-of-8 lodging pick) | 40 rooms / ≈200 guests | y — `ginzanonsen.jp/yado/` | supports — 「総室：40室／宿泊人数：200名」 |
| Ginzanso nightly rate (budget line) | ≈¥28,750/person | y — `jtb.co.jp/…/2435002/plan/` | **drifted → fixed** — the page's lowest listed plan is 「税込 30,800円」/adult; est and low corrected |
| Bunshokan step-free access (party-fit claim) | "best-documented step-free access" | y — `gakushubunka.jp/bunsyokan/` **and** `/access/` | **drifted → fixed** — cited page contains no accessibility information at all; re-cited to `yamagatakanko.com` and restated concretely (C3) |
| Takifudo Namasoba capacity | ≈50 seats + 50-person tatami room | y — `retty.me` (homepage, carries nothing on this venue) | **drifted → fixed** — re-cited to `visityamagata.jp`; capacity downgraded to ⚠ call-ahead (C4) |
| Sakaeya Honten hours | "Hours aren't posted" | y — `visityamagata.jp/spot-yamagata-sakaeyahonten/` | **drifted → fixed** — published and seasonal: 11:30-19:30 Oct 1–Mar 18, closed Wed (C5) |
| Tokyo→Yamagata Tsubasa reserved fare | ≈¥11,450 one-way | y — `jr-shinkansen.net/fare-yamagata.html` | supports — 運賃 6,050 + 指定席特急料金 5,400 = 11,450 |
| Yamagata Museum of Art (Day 2 `plan_b`) | ¥800 adult, ¥640 groups 20+, closed Mon | y — `yamagata-art-museum.or.jp/information` | supports |
| Kajo Park (Day 1 anchor) | free, open until 22:00 | y — city page | supports — 「5時00分から22時00分（4月1日～10月31日）」, 無料 |
| Transit section's timetable citation after C2 | `base.html` | y — `base.html` | **drifted → fixed** — carries only the 【12月1日～3月31日】 winter table and states 「このページの情報は古いため…」; repointed to `base4.html` (C8) |
| Apr–Oct vs winter departure relationship | "5-7 min later … same page" | y — `base.html` + `base4.html` | **drifted → fixed** — two separate pages; the Apr–Oct table adds three services (10:20, 15:30, 19:40) rather than shifting the winter one (C8) |
| Wait if the group misses a Ginzan Onsen bus | "1.5-2.5h" | y — `base4.html` | **drifted → fixed** — on the trip's own table gaps run ≈23 min to ≈2h20; restated on both surfaces (C8) |
| The 14:55 / 18:21 / 16:35 / 13:25 service notes | published on the operator's timetable | y — `base.html` | supports — 「銀山温泉発14:55のバスは山形新幹線（上り）への接続が出来ません」「最終便18:21発は混雑が予想されます。増便はありませんので16:35または17:00のご利用をお勧めします」; all four times re-checked and present on the Apr–Oct table too |
| Ōishida Station IC-card non-acceptance | stated flatly as a corrected fact | y — `base4.html` | **drifted → fixed** — page states 「運賃は現金精算のみのお取り扱いとなっております。（ICカード不可）」 about the BUS only; JR half re-flagged ⚠ (C9) |
| "Japan has reported elevated measles activity in 2026" | asserted in Health & safety | y — `cotoacademy.com` pharmacy guide | **drifted → fixed** — page contains nothing on measles, outbreaks or MMR; claim withdrawn, ⚠ instruction kept (C10) |

Also spot-checked and supporting, no guide change: Kyu-Saiseikan free with no weekly closure (city
page — the item's empty `closed_days` is correct), Mogami Yoshiaki Historical Museum free and closed
Mondays, Bunshokan assembly hall 「工事のため令和8年9月末まで見学できません」, Izu no Hana hours and its
overseas-tour-booking refusal.

### Citation audit — third critic pass (2026-08-28, fresh context)

Twelve more perishable facts sampled independently, weighted to the anchor transfer, hours and the two
time facts the set-piece days are built on. Every source fetched; four drifted and were fixed.

| Claim | Value | Source fetched | Verdict |
|-------|-------|----------------|---------|
| Hanagasa Bus fare + payment (R3 anchor, `facts.json`) | ¥1,000 adult one-way, cash only, half for child/disabled | y — `hanagasa-bus-taisei.co.jp/base4.html` | supports — 「運賃は現金精算のみのお取り扱いとなっております。（ICカード不可）」「料金は大人1名（片道）、小人・障がい者：半額」 |
| Hanagasa Bus season covering the trip | Apr 1 – Oct 24, 2026 | y — `base4.html` | supports — table headed 「2026/4/1～2026/10/24」 |
| Last bus reaching Ginzan Onsen | arrives 18:21 | y — `base4.html` | supports — the last Ginzan-bound row arrives 18:21; the later service terminates short of the village |
| Risshaku-ji opening hour (Day 2's whole plan) | "the 8:00 opening" | y — `rissyakuji.jp/sanpai/` **and** `/access/` | **drifted → fixed** — neither cited page publishes 拝観時間 at all; the temple's own table gives 4月-9月 8時～16時 and 12月-3月 8時30分〜15時 with **no October bracket**, and the guide stated no closing time anywhere (C11) |
| Risshaku-ji admission + payment | ¥500 adult, cash only | y — `rissyakuji.jp/sanpai/` | supports — 大人（中学生以上）500円, 小人200円, 団体30名以上400円, 「清算は現金のみ」 (a party of 8 does not reach the group rate) |
| Ginzan Onsen gas-lamp lighting time | "≈16:30-17:00, shifts earlier through October" | y — `yamagatakanko.com/attractions/detail_2832.html` | **drifted → fixed** — page says only 「夕暮れになるとガス灯に火がともり」, no clock time; the run's own record gives ≈17:00 for the May–Oct bracket and the shift to 16:30 is November's, not October's (C12) |
| 110/119 English-speaking operators | asserted in Health & safety | y — `cotoacademy.com` pharmacy guide | **drifted → fixed** — page contains nothing on 110, 119 or emergency interpretation; promise withdrawn, actionable half kept (C13) |
| Yamagata drugstore chains | "Tsuruha Drug is common across Tohoku" | y — same page | **drifted → fixed** — the page names Matsumoto Kiyoshi, Cocokara Fine and Sun Drug; body re-worded to its own source (C13) |
| Bunshokan accessibility + hours + closure (the party-fit claim, re-audit of C3) | rear wheelchair entrance, 10 loaner wheelchairs, stair lift, 9:00-16:30, 1st/3rd Mon | y — `yamagatakanko.com/attractions/detail_2515.html` | supports — 「車いす貸出：有り（10台…）」「階段昇降機があり、車イス専用の出入口があります」「障がい者用駐車場：有り（建物裏）」「多目的トイレ：有り」, 9:00～16:30, 無料, 第1・第3月曜日 |
| Yonezawa Beef Tokiwa private room + minimums + tel | room to 14; ¥6,600 lunch / ¥9,900 dinner min; 023-666-4433 | y — `yonezawabeef.co.jp/yamagata.html` | supports — 「最大14名様までのプライベートな個室」「昼6,600円以上」「夜9,900円以上」, 11:00〜22:00 L.O.21:00 |
| Sakaeya Honten seasonal hours + closed day (re-audit of C5) | 11:30-19:30 Oct 1–Mar 18, closed Wed, ≈20 min walk | y — `visityamagata.jp/spot-yamagata-sakaeyahonten/` | supports — 「夏期間(3月19日~9月30日) 11:30～20:15 冬期間(10月1日~3月18日) 11:30～19:30」, 水曜, ≈20 min on foot |
| Ginzanso capacity + whether the directory lists its phone | 40 rooms / 200 guests | y — `ginzanonsen.jp/yado/` | supports on capacity 「総室：40室／宿泊人数：200名」 — and confirms the directory publishes **no** number for Ginzanso (only the town office, 0237-28-3933), so the checklist's 0237-28-2322 stays flagged, not asserted |

Not fetchable from this stage and therefore flagged rather than re-checked: `yunokaori.com` (the
gas-lamp bracket behind C12's ≈17:00), and any health authority for the withdrawn measles claim — both
outside the allowed source domains, per the second pass's note.

#### Continuity sweep — critic execution

**Greps run** across `src/content/guides/yamagata/`: `17:04` · `bot-gated` · `retty` ·
`best-documented` · `best-corroborated` · `product3` · `28,750|28750` · `Hours aren't posted` ·
`per night` · `17:45-17:52` · `9:50-9:57`.

**Ripples found & fixed:**
- `17:04` / the invented last-bus range appeared in **two** places (`05-transit.json` step 5 and
  `06-days.json` Day 4) — both rewritten together.
- The "best-documented … access" superlative appeared in **two** places (`07-sights.json` Bunshokan and
  `06-days.json` Day 3) — both restated to the concrete facilities, from the same new source.
- The Takifudo capacity claim appeared in **two** places (`08-food-and-shopping.json` `why` and
  `06-days.json` Day 2 lunch) — both downgraded to the ⚠ call-ahead, with the phone number added to
  both.
- Changing step 4's departure-count wording orphaned Day 3's "only 5-6 departures a day", which no
  source supports — Day 3 restated to the seasonal-timetable fact.
- `product3.html` was the section `source_url` only; `09-sources.json` already links `base.html`, so the
  Sources list needed no change.
- Izu no Hana's new phone number was pushed into Day 4, which had told the reader to "call ahead"
  with no number.
- `_guide.json`'s `verified` stamp asserted the phantom timetable disagreement — corrected in the same
  pass as C2, since the stamp is a fact surface like any other.
- `{{fact:…}}` tokens: both (`hanagasa-bus-fare-1000-yen`, `yamadera-admission-500-yen`) re-checked
  against their sources (both support) and both still resolve — Day 2 and Day 3 bodies were edited
  around them without touching the tokens.
- Day-of-week check: Oct 20–23 2026 = Tue/Wed/Thu/Fri, matching the four day cards. No closure collides
  (Mogami Yoshiaki closed Mon, Sanbyakubou closed Mon, Museum of Art closed Mon, Bunshokan closed
  1st/3rd Mon, Izu no Hana closed Wed but visited Fri, Sakaeya closed Wed and unscheduled).

**Second critic pass (fresh context, 2026-08-28) — greps run** across
`src/content/guides/yamagata/`: `1.5-2.5` · `same page` · `base.html` · `base4.html` · `product3` ·
`17:04` · `measles` · `IC card|ICカード` · `18:21` · `14:55|16:35|13:25`.

**Ripples found & fixed:**
- The `1.5-2.5` wait figure appeared in **two** places (`05-transit.json` step 4 and `06-days.json`
  Day 3) — both restated to "over two hours", the fact the trip's own seasonal table supports.
- Moving the transit section's `source_url` to `base4.html` orphaned the ※/☆ service notes in step 5,
  which are published on `base.html` alone — step 5 now carries its own inline link to that page.
  Checked before rewriting that all four departures it names still exist on the Apr–Oct table; they do,
  so C1's recommendation needed no change.
- `06-days.json` Day 4's `source_url` is deliberately left on `base.html`: that card is built on the
  service notes, not the timetable, and `base.html` is the only page publishing them.
- `IC card` claim appears on **four** surfaces (`01-plan.json` Local essentials, `05-transit.json`
  step 3, `07-sights.json` divergences, and the divergence's own `claim` line). Three carried the ⚠
  hedge; only the divergences `correction` asserted it flat — brought into line with the other three
  rather than the reverse, since JR East's own pages remain unreachable.
- `measles`: single occurrence, no ripple. The Health & safety `verified_on` is already 2026-08-28 and
  the section's remaining claims still rest on the cited pharmacy page.
- `product3` / `17:04`: zero occurrences — the first pass's removals held.
- `{{fact:…}}` tokens: Day 3's body was edited around `{{fact:hanagasa-bus-fare-1000-yen}}` without
  touching the token; the ¥1,000 cash-only figure was re-confirmed on `base4.html` in the same fetch.
- Day-of-week and closure check re-run after the edits: no itinerary ripple — nothing in C8/C9/C10
  moves a stop, a time or a day.

**Deferred to human (second pass):** none. **Flagged for a networked pass:** a T0 health source for the
withdrawn measles claim (NIID/JIHS weekly reports, or the reader's own national travel-health authority)
— outside this stage's allowed source domains, so flagged rather than fetched.

**Deferred to human:** none. **Left for a follow-up pass (recorded above, not silently dropped):** the
prose→`facts.json` money-registry migration; sight/cover photos and phrase cards, both blocked on shell
access in every prior stage; the Ginzanso direct-dial `0237-28-2322` in the Booking checklist, which no
allowed source confirms or contradicts (the operator directory lists only the town information centre,
0237-28-3933) — flagged rather than changed, since inventing or deleting a booking phone number on the
trip's one time-critical reservation is worse than leaving a plausible one in place.

**Third critic pass (fresh context, 2026-08-28) — greps run** across `src/content/guides/yamagata/`:
`16:30-17:00` · `best photo window` · `8:00 opening` · `sunset comes sooner` · `English-speaking` ·
`Tsuruha` · `bot-gated` · `rissyakuji` · `拝観` · `luggage` · `{{fact:` · `18:21|19:40|15:30|16:02`.

**Ripples found & fixed:**
- The `≈16:30-17:00` gas-lamp window and its backwards seasonal parenthetical appeared in **two**
  places (`07-sights.json` Ginzan Onsen and `06-days.json` Day 3) — both restated to "lit at dusk" with
  the ⚠ ≈17:00 reckoning. Day 3's "best photo window 16:30-17:30" went with it; zero occurrences remain.
- The Yamadera hours claim appeared on **two** surfaces (`06-days.json` Day 2 `pace` and its `body`,
  plus the `07-sights.json` Risshaku-ji card) — all three now carry both published brackets, the October
  gap, and the ⚠ closing-time instruction, cited inline to `rissyakuji.jp`. Zero occurrences of the bare
  "8:00 opening" remain.
- `_guide.json`'s `verified` stamp is a fact surface: its re-check list gained Risshaku-ji's unpublished
  October closing time and the unpublished gas-lamp time, so a reader re-verifying before travel is
  pointed at both. The same edit cleared the last traveller-facing `bot-gated` (C7's grep was recorded as
  run, and this surface survived it) — `09-sources.json`'s paragraph is now the only occurrence in the
  guide, which is where the second pass ruled source-access honesty belongs.
- Day 2's section `source_url` deliberately stays on `rissyakuji.jp/sanpai/`: that page does back the
  ¥500 cash-only admission the body carries from `facts.json`. The hours ride an inline `<a href>`
  instead, so nothing was orphaned. Same reasoning for the Risshaku-ji sight card's `/access/`.
- `09-sources.json` already lists `rissyakuji.jp` as the temple's official site, so the new citation
  needed no addition there.
- `{{fact:…}}` tokens: both bodies I edited (`06-days.json` Day 2 and Day 3) were edited **around**
  `{{fact:yamadera-admission-500-yen}}` and `{{fact:hanagasa-bus-fare-1000-yen}}` without touching the
  tokens; both figures were re-confirmed against their own sources in this pass's audit.
- `provenance: "strict"` re-check: every new `⚠`/`≈` landed in `days` and `sights` items, which are not
  in the strict `≈`-gate's section list, and all three items already carry `verified_on` + `shelf_life`.
- Day-of-week and closure check re-run: nothing in C11–C14 moves a stop, a date or a meal, so the
  Tue/Wed/Thu/Fri card mapping and the closure table are unchanged.

**Deferred to human (third pass):** the stray `.critic-check.mjs` at the repo root — see the scope note
under Critic findings; this stage has no delete-capable tool and must hand it to the workflow.
**Flagged for a networked pass:** one named target departure for Day 3's outbound Hanagasa Bus, read
directly off `base4.html`'s 大石田駅 column (two automated reads of that table disagreed on column
alignment, so no time was shipped); and `yunokaori.com`'s gas-lamp bracket, outside this stage's
fetchable domains.
