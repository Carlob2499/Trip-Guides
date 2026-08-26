# Research ledger — Japan

> Everything research produces for this guide. The traveler's own intent lives beside this in
> `intake.md` and is frozen after scaffold — record a research-forced change of plan under
> "## Amendments" here, never by rewriting the intake.

## Spec Summary (fill after intake, before research)
- Section types to include / exclude (and why): standard backbone (Plan/Money/Health/Etiquette/Transit/Days/Sights/Food/Sources) — no trip-specific tab earned; the anchor is a transfer, not an event, so it's woven into Transit + Day 2, not a new group.
- The 2–3 priorities driving depth: Culture/history (#1) and Food & dining (#2) per intake; the anchor transport transfer (Kurayoshi↔Misasa bus) gets R3+ depth regardless of ranked priority because the intake requires it explicitly (physical feasibility, luggage, 2 low-mobility travelers).
- Hard filters applied to every entry: no rental car assumed (intake default); every venue/stop reachable by the San'in Line + Hinomaru Bus + walking; anything requiring a car-only detour (Mount Daisen) rejected on scope; mobility constraint (2 of 8 low walking tolerance) checked per venue where relevant (Nageiredo climb vs. the free viewing-platform alternative).
- Verification focus (most perishable / most important to get right): the Kurayoshi–Misasa bus schedule/last-departure (anchor), Nageiredo's weather/footwear/2-person rules, crab season timing (matsuba vs beni-zuwai), Jinpukaku's closure status, Yakiniku Masashige's real party-of-8 capacity vs. its online booking cap.

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

Every Pass B find gets a verdict below, including the 3 excluded from `evidence.v2.json` outright
(see "Amendments"). AGREE = corroborates Pass A. B-ADOPT = new Pass B fact folded into the guide.
CONFLICT = the two passes disagreed; resolution noted. B-ONLY-REJECTED = a real Pass B finding kept
as a ledger lead but not shipped (single-sourced, or superseded by fresher evidence).

| Item | Pass A (canonical) | Pass B (local/authentic) | Reconciled → guide | Note (conflict / crowd / novel) |
|------|--------------------|--------------------------|--------------------|---------------------------------|
| Kurayoshi↔Misasa transfer — bus schedule confirmability | Fetched hinomarubus.co.jp's own HTML timetable directly; confirmed the ~100-min midday gap and 19:08 last downbound departure (`ev-bus-downbound-schedule`, `ev-bus-upbound-last`). | Tried NAVITIME (403) and the operator's PDF (unreadable); concluded the schedule was unconfirmable and defaulted to the ryokan shuttle/jumbo taxi for the return leg (`ev-bus-infrequent-advisory`). | Pass A's fetched schedule stands as confirmed. | CONFLICT, minor impact, resolved — see `d-bus-schedule-confirmability`. `ev-bus-infrequent-advisory` is also >24 months old (published 2020-12-02) and was excluded from `evidence.v2.json` on the freshness rule; kept here as the record of Pass B's reasoning. |
| Kurayoshi↔Misasa transfer — ryokan reserved shuttle | Not found. | Misasakan and similar ryokan run a free reserved shuttle from Kurayoshi Station, fixed pickup times, advance booking only (`ev-ryokan-shuttle`). | B-ADOPT — folded into 05-transit.json, the Day 2 `plan_b`, and a new reservation record. | Novel: directly answers the intake's binding mobility constraint (2 of 8 low walking tolerance). |
| Kurayoshi↔Misasa transfer — 9-seat jumbo taxi | Only a solo/pair taxi fallback, fare undated to 2009 (`ev-bus-fare-unreadable`'s sibling note in the transport finding). | Hinomaru Hire's 9-seat jumbo taxi, published current metered tariff, advance reservation (`ev-jumbo-taxi`). | B-ADOPT (replace) — supersedes Pass A's weak fallback as the primary reserved option in the transport finding and Day 2 `plan_b`; Pass A's original taxi operators kept as a secondary walk-up mention. | Novel + fixes an honest gap (Pass A's fallback was unconfirmed/dated). |
| Kurayoshi Station accessibility | Not researched. | Fully step-free station, elevators (no escalators) to all 3 platforms (`ev-kurayoshi-station-accessible`). | B-ADOPT — folded into 05-transit.json's transfer bullet and the transport finding's `doorToDoor`. | Novel, directly relevant to the mobility constraint. |
| Nageiredo climb access rules | ¥1,200 total, 8:00-15:00 reception, 2-person minimum, footwear check (`ev-mitokusan-fees-rules`). | Same figures, plus: closed for snow roughly Dec-Mar, rental waraji ¥800, ¥1,150/adult group rate for 20+ (`ev-mitokusan-nageiredo-rules`). | AGREE + B-ADOPT — the season-closure and waraji-rental facts are new; folded into the sights entry and the anchor reservation's `deposit`/`foreignFriction` fields (also fixing a pre-existing gap — see Amendments). | Corroboration + extension, no conflict. |
| Nageiredo Yohaijo viewing platform | Free platform, ~600m, partial view, "designated accessible parking" (`ev-yohaijo-details`). | Same platform; adds Nikon telescopes, "only other viewing point besides climbing" (official wording), exact parking count (2 standard + 1 accessible) (`ev-nageiredo-viewing-platform`). | AGREE + B-ADOPT — folded into the sights entry. | Corroboration + extension. |
| Sand Dunes — dawn crowd reality | Not researched (Pass A shipped the dunes as free/no-ticket only). | Two independent 2025 firsthand accounts: dawn is quietest but no longer empty, a shift attributed to social media (`ev-dunes-crowd-current-1`, `ev-dunes-crowd-current-2`); a 2018 account describing dawn as fully empty is >24 months stale (`ev-dunes-crowd-2018-stale`, excluded from evidence.v2.json). | B-ADOPT — claim text of the two 2025 records consolidated to their shared substance (see Amendments) and folded into the Sand Dunes sights entry plus a new "what generic guides get wrong" divergence. | Novel, off-the-beaten-path per the intake's travel-style ask. The 11:00-15:00/tour-group detail unique to one source was left unshipped (not independently corroborated). |
| Sand Dunes — camel commute path | Not researched. | Official Tottori City feature: a lesser-known ~20-min approach path, camels visible ~9:15am (`ev-dunes-camel-path`). | B-ADOPT — folded into the sights entry; candidate carries `worth-the-detour`. | Novel, official source. |
| Crab season (matsuba-gani out, beni-zuwaigani in) | Confirmed matsuba-gani opens Nov 6 2026 via a reference-tier source (matsubishi.online); beni-zuwaigani in season via marutsu.jp (`ev-crab-season-matsuba`, `ev-crab-season-benizuwai`). | Same conclusion, matsuba-gani confirmed via torican.jp (official Tottori City tourism site, `ev-matsuba-gani-season`); beni-zuwaigani confirmed via the identical marutsu.jp URL Pass A used (`ev-beni-zuwaigani-season`). | AGREE (beni-zuwaigani, same source) + B-ADOPT (matsuba-gani citation upgraded to the official torican.jp source, cite-up-the-ladder). | No conflict; citation-tier improvement — the "what generic guides get wrong" divergence now cites torican.jp. |
| Menya Hachibee — seating/crowding | Venue details (price, founding year, past Michelin note) from na-na.media; no seating/capacity detail (`ev-hachibee-details`). | Two independent 2025 firsthand accounts: small counter/table/tatami space, gets crowded at lunchtime (`ev-hachibee-seating-1`, `ev-hachibee-seating-2`); a 2020 account calling it unsuited to large groups is >24 months stale (`ev-hachibee-no-reservation-2019-stale`, excluded from evidence.v2.json). | B-ADOPT — claim text of the two 2025 records consolidated to their shared substance (see Amendments) and folded into the Food tab's `crowd_tip` field plus a new casual reservation record. | Novel — directly answers the intake's ask #8 (a second, real party-of-8 feasibility decision besides Yakiniku Masashige). |
| Kissa Sante (local coffee shop, natto-rice dish) | Not researched. | Local-favorite framing, single-sourced (na-na.media only) (`ev-kissa-sante`). | B-ONLY-REJECTED | Genuinely novel lead, but fails the 2-source corroboration bar for an experiential/local-favorite claim — kept shortlisted for a future pass, not shipped. |
| Santo Mato (local supermarket) | Not researched. | Local, non-tourist shop, 200+ dried-fruit varieties, single-sourced (na-na.media only) (`ev-santo-mato`). | B-ONLY-REJECTED | Same reason as Kissa Sante — single-sourced, kept as a lead. |
| Sand Dunes (the sight itself) | Shipped (`c-tottori-sand-dunes`, free entry, official source). | Anti-default: recognized as Pass A's obvious anchor pick and deliberately not re-shipped as a duplicate candidate; contributed only the branch-tagged crowd-timing and camel-path finds above. | AGREE (no new candidate record — see Amendments for the id-collision it would have created). | By design, not a gap. |
| Nageiredo climb (the sight itself) | Shipped (`c-sanbutsu-ji-nageiredo-climb`). | Anti-default: recognized as Pass A's anchor pick; own candidate `c-mitokusan-sanbutsuji-nageiredo-climb` kept (rejected status, different id) purely to carry its evidence. | AGREE | By design. |
| Kurayoshi Shirakabe Dozo-gun (the sight itself) | Shipped (`c-kurayoshi-shirakabe-dozogun`). | Anti-default: recognized as Pass A's pick; a single-source "declining tourist numbers" anecdote was not pursued further (wouldn't change the recommendation). | AGREE | By design. |

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

### Anchor event: the consequential public-transport transfer

| Candidate | Verdict | Shortlist |
|-----------|---------|-----------|
| Hinomaru Bus, Kurayoshi Station ↔ Misasa Onsen (Kamii-Misasa/Misasa Line 72/73) | shipped — official schedule fetched, midday gap up to ~100min, last weekday departure 19:08, genuinely consequential for a party of 8 with luggage and 2 low-mobility travelers | y |
| Taxi, Kurayoshi Station ↔ Misasa Onsen (walk-up, Nikko/Chuo/Kurayoshi Kotsu) | shipped as a secondary fallback only — ≈20min, only fare figure found dates to 2009 and is flagged unconfirmed | y |
| Ryokan reserved shuttle (Pass B) | shipped — free, ryokan-arranged, fixed pickup times, directly answers the party's mobility constraint | y |
| 9-seat jumbo taxi, Hinomaru Hire (Pass B) | shipped, tagged worth-the-effort — published current tariff, single vehicle for the whole party; promoted to the primary reserved fallback over the undated 2009 taxi figure | y |

### Priority 1: Culture / history

| Candidate | Verdict | Shortlist |
|-----------|---------|-----------|
| Tottori Sand Dunes | shipped — free, official confirmation of no admission fee | y |
| Sand Museum | shipped — hours/price/current exhibition fetched from operator | y |
| Uradome Coast — San'in Matsushima sightseeing cruise | shipped — official operator schedule/fare fetched; resolved a fare discrepancy against a second page from the same operator (see disagreement d-cruise-fare) | y |
| Kurayoshi Shirakabe Dozo-gun | shipped — free warehouse district, access + info center confirmed | y |
| Sanbutsu-ji — the Nageiredo climb | shipped, tagged worth-the-effort — National Treasure hall, official rules (2-person minimum, footwear, weather cancellation) fetched | y |
| Nageiredo Yohaijo (viewing platform) | shipped — the accessibility answer for the 2 low-mobility travelers; free, weather-independent, official confirmation of completion/parking | y |
| Tottori Castle Ruins (Kyusho Park) | shipped — free park; folded in the finding that Jinpukaku itself is closed | y |
| Jinpukaku | rejected: closed for preservation work Dec 2023–~2028, exterior currently sheeted; only the garden/teahouse on the same grounds remain open (folded into the Castle Ruins entry instead of shipping standalone) | y |
| 20th Century Pear Museum | rejected: thin connection to the trip's ranked priorities; time better spent at Sanbutsu-ji given the party's pace budget | n |
| Mount Daisen | rejected: 90min–2hr outside the compact Tottori–Kurayoshi–Misasa loop; would eat a full day this 4-day balanced-pace trip doesn't have | n |
| No longer an undiscovered secret (Sand Dunes, Pass B) | shipped — 2 independent 2025 firsthand sources; a 2018 source is stale and kept as a re-verify lead only | y |
| Camel commute (Sand Dunes, Pass B) | shipped, tagged worth-the-detour — official Tottori City feature | y |
| Nageiredo climb access rules (Pass B, own candidate id) | rejected as a standalone candidate (anti-default — Pass A already shipped the climb); its evidence (seasonal snow closure, waraji rental) folded into the shipped candidate | n/a (evidence-only) |
| Nageiredo Yohaijo (Pass B detail: telescopes, exact parking count) | shipped — corroborates + extends Pass A's viewing-platform pick | y |
| Kurayoshi Shirakabe Dozo Townscape (Pass B, own candidate id) | rejected — anti-default, Pass A already shipped this district; no independently-corroborated new angle found beyond the food pick shipped separately | n |

### Priority 2: Food & dining

| Candidate | Verdict | Shortlist |
|-----------|---------|-----------|
| Yakiniku Masashige (Kurayoshi) | shipped — Tottori Wagyu, official hours/price/room-capacity fetched; resolved a real party-of-8 booking-capacity disagreement (see d-masashige-party-size) — this is the trip's party-size feasibility decision the intake asked for | y |
| Menya Hachibee (gyukotsu ramen) | shipped, flagged — Michelin-noted local specialty; hours/closed-day could not be confirmed against a qualifying primary source, shipped with ⚠ | y |
| Kanikichi (かに吉) | rejected: tourist-oriented crab specialist in central Tottori, and moot anyway — matsuba-gani season doesn't open until Nov 6, after this trip | n |
| Iwamoto Shokudo (Kurayoshi yoshoku) | rejected: redundant with the wagyu pick for the trip's one Kurayoshi dinner slot; kept as a lead for a longer future visit | y |
| Matsuba Gani Crab Dinner, Oct 2026 (Pass B) | rejected: out of season, ministerial-order confirmed via a higher source tier than Pass A's original citation | n |
| Beni-zuwaigani (Pass B) | shipped — the in-season crab, independently confirmed from the same operator source Pass A used | y |
| Getting crowded at lunchtime (Menya Hachibee, Pass B) | shipped — 2 independent 2025 firsthand sources on capacity/crowding; a 2020 source is stale and kept as a re-verify lead only | y |
| Kissa Sante (local coffee shop, Misasa) | rejected: single-sourced (na-na.media only), not independently corroborated within budget — kept as a lead | y |
| Santo Mato (local supermarket, Misasa) | rejected: single-sourced (na-na.media only), not independently corroborated within budget — kept as a lead | y |

## Questions for the traveler (research emits; traveler answers on the progress page)
> Traveler-framed only — no pipeline vocabulary. Each question carries an assumption the guide
> builds on until the traveler answers. See src/features/intake-questions/ for the model.

### q-tottori-1
- **Q:** Which passport(s) is the group traveling on?
- **Assumed:** All 8 travelers hold US passports (visa-free, up to 90 days for tourism).
- **Context:** The Entry & documents card in the Plan tab, and the guide-level entry requirements.
- **Status:** open

### q-tottori-2
- **Q:** Where's everyone flying in from — which airport should this guide plan the arrival/departure leg around?
- **Assumed:** No specific airport — the guide presents two realistic options (Tottori Airport via Haneda, or Shinkansen + limited express via Okayama/Shin-Osaka) without committing to either, and the Budget tab leaves the flights line at ¥0 rather than guessing.
- **Context:** Plan tab ("When you land", Booking checklist) and the Budget tab's flights line.
- **Status:** open

## Amendments (append-only — record every research-forced re-plan)
> When research changes the plan (an anchor moved, a neighborhood beats the intended one, a day
> collapsed), log it here with the reason. `intake.md` stays the ORIGINAL intent; this is the
> diff. (Korea/Denmark were "corrected three times by running it" — that history now has a home.)

- **Reconcile pass (2026-08-26), structural fixes to the merged `evidence.v2.json`** — no
  recommendation changed, but the following corrections were needed to pass the evidence
  artifact's own structural/research-rule validation now that Pass A + Pass B are merged into
  one document (`scripts/pipeline/v2/evidence.mjs` + `research-rules.mjs`):
  - **3 Pass B evidence records excluded from `evidence.v2.json` outright** (freshness rule —
    experiential evidence older than 24 months is a re-verify lead, not current evidence, no
    shipped-candidate exception in the validator): `ev-dunes-crowd-2018-stale` (2018 firsthand
    account), `ev-hachibee-no-reservation-2019-stale` (2020 firsthand account), and
    `ev-bus-infrequent-advisory` (2020 blog advisory). All three are recorded in the
    reconciliation table above with their substance; they simply don't carry a
    `reconciliation[]` disposition since they were never folded into `evidence[]`.
  - **1 Pass B candidate dropped as a duplicate id**: Pass B's own "Tottori Sand Dunes" (no
    branch) candidate derives the identical id as Pass A's already-shipped one
    (`c-tottori-sand-dunes`) — folding both in would have been a duplicate-id validation
    failure. Pass B's plain entry carried no evidence of its own (only its branch-tagged
    sub-candidates did), so nothing was lost by dropping it; the anti-default intent is
    preserved in the reconciliation table.
  - **Claim-text consolidation for the 2-source corroboration rule**: `ev-dunes-crowd-current-1`
    / `-2` and `ev-hachibee-seating-1` / `-2` originally carried distinct (non-identical) claim
    text per source. The corroboration validator matches on exact claim text, so each pair's
    `claim` field was rewritten to the shared substance both independent sources actually
    support — never stretching one source's specific detail onto the other's citation. Detail
    unique to a single source (the dunes' 11:00-15:00/tour-group note) was left unshipped.
  - **2 pre-existing Pass A schema-rule gaps fixed** (present in Pass A's own artifact before
    this pass touched it, surfaced only now because `researchRuleProblems` runs at the reconcile
    gate, not the passA gate): `ev-hachibee-details`'s `source.kind` was `"press"` (not a valid
    objective-claim source kind) — reclassified `"reference"`, an honest description of
    na-na.media's role here (a general local-content site, not wire journalism), no change to
    the underlying fact. `ev-sand-museum-spain-exhibit` and `ev-crab-season-matsuba` both name a
    year (2027) beyond their `appliesToYears` list — both amended to `[2026, 2027]`, matching
    what the claim text already said.
  - **1 pre-existing Pass A reservation gap fixed**: the Nageiredo-climb anchor reservation was
    missing required `deposit` and `foreignFriction` fields. Both filled honestly (no deposit
    exists because there's no advance booking to deposit against; no foreign-user friction
    exists because there's no online/phone system to navigate) rather than left null.
  - **Pass B's own `shortlisted` bookkeeping fixed**: every Pass B candidate with
    `status: "shipped"` or `status: "shortlisted"` arrived with `shortlisted: false`, which
    violates the shipped-implies-shortlisted funnel invariant. Corrected to `true` for the 10
    affected candidates; purely a bookkeeping fix, no candidate's real status changed.
  - None of the above changed which candidate ships, which venue is recommended, or any figure a
    traveler reads — they are artifact-integrity fixes, recorded here per the continuity
    discipline (any touched fact re-enters the source+date/continuity checks).

- **Reconcile pass (2026-08-26), attempt 2 — 3 P0-blocking D2 provenance findings fixed in the
  guide content.** `npm run verify`'s readiness check (`scripts/audit/check-research.mjs`, D2
  rule) flagged 3 item-level facts as undated hour/price figures under this guide's
  `provenance:"strict"` — blocking under strict because a precise-looking figure with no
  `verified_on` is exactly the "could a generic AI have written this" shape the rule exists to
  catch, even though every figure involved was already researched and cited elsewhere in the
  guide:
  - `02-money-and-budget.json`'s "Sights & activities, per day" budget item (¥ figures in its
    `note`) — added `source_url`/`verified_on` (mitokusan.jp, 2026-08-26; the figure it calls out
    by name, the Nageiredo climb day cost, is `ev-mitokusan-fees-rules`).
  - `06-days.json`'s Day 1 ("Arrive Tottori — dunes at golden hour") item body cites the Sand
    Museum's ¥800/9:00–18:00 hours — added `source_url`/`verified_on` (sand-museum.jp,
    2026-08-26; `ev-sand-museum-hours-price`).
  - `06-days.json`'s Day 3 ("Misasa Onsen — Nageiredo, the onsen town, and crab") item body cites
    Nageiredo's ¥1,200/8:00–15:00 climb rules and Kabuyu's ¥400 admission outside its `plan_b`
    (which already carried its own dated citation) — added the same top-level
    `source_url`/`verified_on` (mitokusan.jp, 2026-08-26; `ev-mitokusan-fees-rules` /
    `ev-mitokusan-nageiredo-rules`).
  No figure, recommendation, or claim changed — every value cited was already verified and
  present elsewhere in the guide/evidence artifact; this closes a provenance-metadata gap only.

## Critic findings

Fresh-context critic pass, 2026-08-26. Eight findings; all eight implemented in the guide. Three
residual gaps are flagged rather than fixed (below), and one candidate finding was rebutted on
second look rather than edited.

### 1. The anchor transfer was built on the wrong bus line — rubric #6 (anchor coverage, P0), #7
**Where:** `05-transit.json` step 3 · `06-days.json` Day 2 (`pace`, `body`, `plan_b`) ·
`_guide.json` verified stamp.
The guide's anchor — "Kurayoshi Station → Misasa Onsen, Hinomaru Bus route 72/73, last weekday
departure **19:08**" — cited `hinomarubus.co.jp/timetable_route/3455/?tab=2`. Re-fetched: that page
is the **(72)(73)三朝線**, whose stop list does not contain 倉吉駅 at all. It originates at 生田車庫
(Ikuta depot) in west Kurayoshi, and 19:08 is that depot's last departure — a bus the party cannot
board where the guide tells them to stand. The entire day was timed against it.
**Replacement (T0, the operator's own timetable `hinomarubus.co.jp/timetable_route/3450/?tab=2`):**
the line serving Kurayoshi Station is the **(70)(71)上井三朝線**. Weekday departures from 倉吉駅 run
7:45–**19:25**; 19:25 is the last, reaching 三朝車庫 at 19:52. Journey time is variant-dependent —
≈20–27 min on the direct runs, ≈40–50 min on those routed via Kosei Hospital / Kurayoshi East High —
so the single "≈20–26 min" figure was wrong too. The largest daytime hole is **13:20 → 14:40
(80 min)**, not "~100 min at 12:22 → 14:04" (that gap belonged to the depot line as well). All four
surfaces corrected and re-cited; a Transit step now warns that the 72/73 timetable is the easy one
to find and the wrong one to use.

### 2. No car-free way to reach the trip's #1 culture stop — rubric #7, #9 (party fit)
**Where:** `06-days.json` Day 3 · `07-sights.json` "Sanbutsu-ji — the Nageiredo climb" and
"Nageiredo Yohaijo".
Day 3 opened "Early start for the mountain" and never said how eight people with no rental car get
from Misasa Onsen to Mitokusan. Fees, footwear, the 2-person minimum and the weather rule were all
researched; the transport — the thing that actually gates the day — was absent. Worse, the Yohaijo
entry, the guide's stated accessibility answer for the two low-mobility travelers, discussed
**parking spaces**, which a car-free party cannot use.
**Replacement (same T0 timetable):** the 70/71 line continues past Misasa to the **三徳山駐車場**
stop. Weekday runs dep. Kurayoshi Station 8:35 / 9:40 → Misasa Onsen bus centre 8:55 / 9:59 →
Mitokusan 9:10 / 10:14 (≈15 min from the onsen town). Weekday returns from 三徳山駐車場: 10:25,
11:40, 12:50, 14:08, 15:19, 16:12, 17:23 (last). Written into Transit, Day 3 and both Mitokusan
sights entries; the Yohaijo entry now leads with the bus and demotes the parking to context.

### 3. The viewing platform's details hung off a source that carries none of them — rubric #3
**Where:** `07-sights.json` "Nageiredo Yohaijo" · `06-days.json` Day 3 body.
The entry cited `town.misasa.tottori.jp/1593/31543.html` for "coin-free Nikon telescopes",
"roughly 600m away — partial view, some obstruction by trees", and "2 standard spaces plus 1
accessible space". Fetched: that page mentions no telescope, no distance and no space count.
**Replacement:** the telescopes and the 2 + 1 accessible count ARE published — on
`misasaonsen.jp/sightseeings/sightseeing-12431/`, Misasa Onsen's official portal. Re-cited there.
The **600 m is not the platform's viewing distance at all**: it is the climb's trail length from the
registration office (≈600 m, ≈200 m of ascent, 1.5–2 h round trip). A trail length re-attributed to
a viewpoint is a fabricated figure, so it was removed rather than reassigned, along with the
uncorroborated "partial / obstructed by trees" characterisation. The distance is now conveyed
without a number ("the hall is a long way up a cliff from here").

### 4. A fixed crab date outlived the source that only gave a month — rubric #3, #11
**Where:** `07-sights.json` divergence #2 · `06-days.json` Day 3 · `08-food-and-shopping.json` intro.
The guide asserted matsuba-gani "doesn't open until **Nov 6**", citing
`torican.jp/feature/gourmet_crab`. That page says 松葉ガニの解禁は毎年**11月上旬** — early November, no
specific date — and does not mention beni-zuwaigani at all, though the same divergence card made a
beni-zuwaigani in-season claim on its authority. (`research-depth.md`: a recurring event's
future-year date ships only from a current official announcement.)
**Replacement:** both halves re-sourced to `marutsu.jp`, which publishes both seasons — 松葉がに
11月～3月 and 紅ズワイガニ 9月～6月 — so one cited source now supports the whole card. The
traveler-facing conclusion is unchanged and now unambiguous: matsuba-gani is a November–March catch
and is not landed during Oct 20–23; beni-zuwaigani runs September–June and is.

### 5. The budget invoked a "cruise day" the itinerary does not contain — rubric #5, #7
**Where:** `02-money-and-budget.json` "Sights & activities" note · `07-sights.json` Uradome entry.
The note read "the Nageiredo climb day (≈¥1,200) and **cruise day** (¥1,800) run above this on their
own days". There is no cruise day: the Uradome cruise is a shipped candidate that appears on no day
card and answers no "when it fits".
**Replacement:** re-verified against the operator (`tottori-tours.com` — ¥1,800, Mar–Nov, hourly
9:30–15:30, ≈40 min afloat / ≈1 h total). The last sailing at 15:30 rules out the arrival afternoon
and Wednesday is the luggage-and-transfer day, so it genuinely doesn't fit four days. The budget
note now says so, and the sights entry states the constraint, names the swap (trade the
castle-ruins morning) and flags the access gap (R2 below).

### 6. The guide's only map showed one of its three towns — geography lens, rubric #13
**Where:** `05-transit.json` map section.
`center 35.5011,134.2351 / span 0.08` renders — per `MapBlock.astro`, lng ± span and lat ± span×0.6
— a box of lng 134.155–134.315: Tottori city only. Kurayoshi (≈133.85) and Misasa sat off the edge,
i.e. two of three towns and the whole anchor transfer. The same section is also the coord source the
`weather` strip reads at runtime.
**Replacement:** `center 35.47,134.04 / span 0.21` → lng 133.83–134.25, lat 35.34–35.60, framing the
dunes, Kurayoshi and Misasa together. Derived from coordinates the guide already holds (Sand Dunes
35.5416/134.2286 east, Yakiniku Masashige 35.4496/133.8479 west) — no new coords invented.
**Trade recorded:** the weather strip now anchors on the loop's midpoint rather than Tottori city.
Deliberate — a guide sleeping one night in Tottori and two in Misasa has no single honest weather
point, while a map omitting two of its towns is unambiguously wrong.

### 7. Eight people's luggage had nowhere to be on the transfer day — common-sense lens, #9
**Where:** `06-days.json` Day 2.
The day correctly called the bus "the one point where the whole group needs to move together with
all its bags", then routed those bags through a warehouse-district afternoon and a yakiniku dinner
onto a fare-box bus with no luggage hold. The intake makes luggage on this leg binding.
**Replacement:** no new fact needed — the guide already held the lever. The ryokan's reserved
shuttle has fixed afternoon pickups from Kurayoshi Station, so the bags and the two low-mobility
travelers go over on an afternoon run and the rest of the party catches the 19:25 unencumbered.
Written into Day 2 with a ⚠ to confirm at booking that the ryokan will split luggage and passengers
across runs; the shuttle's times stay in Transit rather than being duplicated into the day.

### 8. A shipped food pick sat on no day, and Etiquette pointed at a phrase card that doesn't exist
**Where:** `06-days.json` Day 2 · `04-etiquette-and-language.json`. Rubric #7, #10.
Menya Hachibee is a rank-2 shipped venue on no day card — no answer to "when it fits" — while
Etiquette closed with "the phrase card in the Trip kit tab is worth using", and `_guide.json` has no
`phrases` block at all. A guide that sends the traveler to a card it never built is the opposite of
an honest blank.
**Replacement:** Hachibee placed at Day 2 lunch — minutes from Kurayoshi Station, on the day the
group is already there — carrying its unconfirmed-hours ⚠ and the two-sittings-for-eight tactic
across from the Food tab rather than restating them as fact. The phrase-card sentence is replaced by
the three native-script stop names the trip actually turns on — 倉吉駅, 三朝温泉観光商工センター前,
三徳山駐車場 — taken verbatim from the operator's own stop list, which is the "show it to a driver"
function the missing card was standing in for.

### Flagged, not fixed (source or tooling out of this stage's reach)
- **R1 · `map.points[]` absent.** `block-types.md` makes named map points with `local_script_name`
  effectively mandatory where a language barrier matters, and this guide leans on phoned taxi and
  shuttle bookings. Adding them needs authoritative coords from `scripts/lookup-place.mjs` (no
  key/approval in this stage) for Kurayoshi Station, Misasa Onsen and Mitokusan. Guessing coords is
  forbidden, so this is left for a networked pass; the verified native-script names are already
  recorded in finding 8 and in the Transit steps.
- **R2 · Uradome Coast cruise access.** The operator's page publishes only the departure address
  (岩美郡岩美町大谷2182); no allowed-domain source carries the transit connection from Tottori
  Station. Flagged inline in the sights entry and added to the Sources tab's still-flagged list
  rather than guessed.
- **R3 · Nageiredo climb effort figures.** ≈600 m of trail, ≈200 m ascent, 1.5–2 h round trip would
  be a real party-fit fact for a group with two low-mobility travelers, but
  `misasaonsen.jp/mitokuclimb/` explicitly does not publish them on fetch and no other allowed
  domain carried them. Not shipped. Source lead for the next pass: the figures surface in
  Mitokusan-trail search results — find the page that actually publishes them.

### Rebutted on second look (no edit)
- **Menya Hachibee's "online widget won't take 8 / 116 seats" note.** `masashige55.com` was
  re-fetched and supports the hours, closed days, phone, address, the four course prices and the
  2–60 private-room capacity, but publishes no party-size cap — so the widget claim looked uncited.
  It isn't: the ledger records it as the resolved disagreement `d-masashige-party-size` against the
  booking page, a different URL from the venue homepage this entry cites. The claim stands as
  written.

### Second fresh-context critic pass, 2026-08-26

The first critic pass's output failed the build's `provenance:"strict"` gate, so this stage ran
again from a clean context. The two schema errors are repaired below (finding 13), and the
re-scan that came with them produced twelve further findings. All thirteen are implemented in the
guide. One candidate finding was rebutted rather than edited; three residual gaps stay flagged.

The recurring shape this pass: **the previous pass corrected the citations it had reason to
doubt, and the untouched ones were the ones that were wrong.** Four separate items cited a page
that does not publish the fact hanging off it, and one of those facts was actively contradicted
by the official source.

#### 1. A map pin 600 km outside the guide — rubric #2 (no fabrication, P0)
**Where:** `02-sights.json` → "Uradome Coast — San'in Matsushima sightseeing cruise".
The entry carried `map { lat 38.3696558, lng 141.0628391 }` and `place_id
ChIJoSP545-biV8R3osIv7T_43E`. Those coordinates are **Matsushima in Miyagi Prefecture** — the
Tohoku bay the operator's trade name borrows — roughly 600 km from Tottori and in the wrong half
of the country. The operator's own page (`tottori-tours.com`, re-fetched this pass) publishes the
departure address as 岩美郡岩美町大谷2182, in Iwami town, Tottori. A name-match lookup had
resolved to the famous Matsushima and nothing downstream compares a sight's pin against the
guide's own bbox.
**Replacement:** `scripts/lookup-place.mjs` is not runnable in this stage, and guessing
coordinates is forbidden, so the pin is **removed** rather than replaced. The verified departure
address and the operator's phone (050-5433-9129) are written into the entry instead, and both the
entry and the Sources tab say plainly why there is no pin. Recorded as R4 below.

#### 2. The 9-seat jumbo taxi was priced as an ordinary cab — rubric #3, #7, #9
**Where:** `03-transit.json` step 7 · `04-days.json` Day 2 `plan_b`.
Both surfaces sold the jumbo taxi as the party-of-eight answer "at published metered rates (¥740
flagfall + ¥90/279m)". Re-fetched `hinomaru-hire.com/taxi/`: ¥740 / ¥90 per 279 m is the
**regular car**. The 9-seat jumbo has its own tariff — **¥840 for the first 1.5 km, then ¥100 per
179 m**. On the ≈10 km Kurayoshi→Misasa run that is roughly ¥5,600, not the ≈¥3,500 the guide's
figures implied: a ~60% understatement on the fallback a group of eight is most likely to reach
for, after dark, with luggage.
**Replacement:** both surfaces now carry the jumbo's own tariff with the regular-car rate beside
it for contrast, and the Transit step links `hinomaru-hire.com/taxi/` inline (the section's single
`source_url` is the bus timetable and never supported the tariff).

#### 3. The Sand Dunes entry's citation supported none of its specifics — and one was wrong
**Where:** `02-sights.json` → "Tottori Sand Dunes" · `04-days.json` Day 1. Rubric #2, #3.
The entry cited `tottori-guide.jp/sakyu/` for free entry, "the dune-side overlook lot (≈180 cars)
is also free parking", a "Dawn (≈5:30–6:00am)" quiet window, and the ≈20-minute camel-commute
path. Fetched twice, including a targeted 入場料/駐車場/ラクダ pass: **the page carries none of
them.** Worse, Tottori City's own visitor guide (`torican.jp/feature/hajimete`) says the opposite
of the parking claim — 鳥取砂丘に一番近い…駐車場は駐車料500円の有料駐車場, with the free lots
at the Sand Center and the adjacent municipal lot. The claim had also propagated into Day 1
("free to enter with free dune-side parking").
**Replacement:** the parking sentence is **deleted** from both surfaces — it was contradicted,
and a party the intake says has no rental car had no use for it. The "≈5:30–6:00am" clock is
removed too: no source carries it, and in late October sunrise here is well after 6am, so it
would have had eight people (two with low walking tolerance) standing on a dune field in the
dark. The entry now says "early morning" with a ⚠ to check the actual sunrise for the date. The
item re-cites to `torican.jp/spot/detail_1064.html` (料金: 無料 — the free-entry claim's first
real source) and the camel walk is inline-cited to `torican.jp/feature/sakyu-morning`, which does
publish it: ≈20 min one way to the Horse's Back, ≈40 return, camels commuting 朝9:15ごろ.

#### 4. The rank-1 marquee sight had no car-free access — rubric #7
**Where:** `02-sights.json` → "Tottori Sand Dunes" · `04-days.json` Day 1 · `03-transit.json`.
This is a **recurrence of the previous pass's own finding 2** (Nageiredo shipped with fees, rules
and weather policy but no transport), one guide later and on the arrival day. The dunes carried a
fee, a dwell time, crowd timing and a novel walking route, and never said how eight people
without a rental car get there.
**Replacement (same T0 page as finding 3):** ≈20 minutes by bus from JR Tottori Station's bus
terminal, alighting at 鳥取砂丘（砂丘会館）; the weekend-only Loop Kirin Lion bus (≈30 min) is
named and dismissed, because this is a Tuesday-to-Friday trip. Written into the sights entry, Day
1, and a new first step in Transit.

#### 5. Two figures attributed to pages that do not publish them — rubric #3, #10
**Where:** `02-sights.json` → "Sanbutsu-ji — the Nageiredo climb" · `05-food-and-shopping.json` →
Yakiniku Masashige `crowd_tip`.
`mitokusan.jp` publishes only わらじ（有料） — "sandals, chargeable". The guide priced them at
**¥800**. `masashige55.com` publishes the private-room range 2名様から最大60名様 and no total seat
count; the guide asserted **"116 total seats"**. Both were re-fetched with targeted prompts to be
sure. Note that the previous pass's citation audit recorded both of these sources as
`supports` — the audit row was written against the fact it expected, not the figure on the page.
**Replacement:** the ¥800 is removed and the waraji now carry an honest ⚠ ("the temple publishes
no price — bring cash and ask"); the 116 is removed and the capacity argument rests on the
published 2–60 room range, which is what it always actually rested on.

#### 6. One source, one page, two confidence markers — rubric #3, #10
**Where:** `05-food-and-shopping.json` → Menya Hachibee.
`hours` and `closed` both ship ⚠ "not confirmed against a qualifying primary source"; the `price`
from the identical `na-na.media` page shipped as **≈¥780** — the sourced-and-approximate marker, a
tier the guide had just disclaimed for the same page. Re-fetched: the page publishes 780円,
昼10:30~14:00 / 夜17:30～20:00, and Thursdays closed from 2025 — so the treatment is defensible for
all three fields or none.
**Replacement:** the price is downgraded to ⚠ with the same wording as its neighbours, and the
Sources tab's still-flagged list now names the bowl price alongside the hours.

#### 7. The party splits by ability; the return bus was written as one decision — rubric #9
**Where:** `04-days.json` Day 3 · `03-transit.json` step 8. Common-sense lens.
Day 3 correctly makes Mitokusan two experiences — a real climb for some, the free Yohaijo
platform for the two low-mobility travelers — then tells the whole group to "pick the bus you're
coming back on". The platform party's own `dwell_min` is 20 minutes; the climbers are up there for
hours. One shared return means half the party waits at a mountain car park with a handful of
services a day.
**Replacement (from the timetable already fetched and shipped):** the platform-and-main-hall party
takes the 10:25 or 11:40, the climbers the 12:50 or 14:08 — three to four hours on the mountain
from either morning arrival. Re-fetching `misasaonsen.jp/mitokuclimb/` confirmed the previous
pass's R3: **no round-trip time is published**, so the day carries a ⚠ saying so and steering to
the later bus rather than inventing a duration. The same fetch surfaced two earlier northbound
runs (8:27, 9:15) the guide's return list omitted; both leave before either morning arrival, and
the Transit step now says that instead of presenting a silently partial list.

#### 8. The anchor day's deadline left out the trip back to the station — rubric #9, common sense
**Where:** `04-days.json` Day 2.
The day's whole architecture is "be done well before 19:25". Yakiniku Masashige is at Yamane —
the guide's own Food entry calls it "≈10–15 min bus or short taxi from Kurayoshi Station" — so
"done" at 19:20 is a missed bus. No new fact needed; the guide already held both halves and never
subtracted one from the other.
**Replacement:** the day now counts backwards explicitly — leave the table by about 18:45, and
have the taxi arranged rather than trusting an evening city bus nobody has checked (an honest
unknown, not a claim).

#### 9. The arrival night has no dinner — rubric #8, #10; meals & energy lens
**Where:** `04-days.json` Day 1 · `07-sources.json`.
Food is the intake's **#2 ranked priority**. Both shipped venues are in Kurayoshi; the party
sleeps night 1 in Tottori city and night 2–3 on ryokan half-board. Day 1 ended at the Sand Museum
at 18:00 and said nothing about the evening meal for eight people. The candidates table shows
Tottori-city dining WAS considered (Kanikichi, rejected on season and tourist pricing) — it just
left no survivor, and nothing said so.
**Not fixed by invention — flagged.** Verifying a replacement means a Tottori-city restaurant's
own site, a domain outside this stage's permitted fetch set (see R5). Day 1 now states the gap in
the traveler's own terms and gives the actionable fallback (have the hotel book it, don't walk
eight people around looking), and the Sources tab records it as a deliberate absence.

#### 10. An outdoor-anchored day with no `plan_b` — inclement-cover lens
**Where:** `04-days.json` Day 1.
Days 2 and 3 both carry a `plan_b`; Day 1, whose anchor is an open dune field, carried none.
**Replacement:** no new fact — the cover is already on the day. Rain gives the whole slot to the
Sand Museum (indoors, already verified) and moves the dunes to Wednesday morning, the one early
slot the four days contain and the slot Day 1 already names.

#### 11. The same ATM guidance shipped flagged on one tab and clean on another — rubric #10
**Where:** `01-plan.json` "Local essentials" · `06-money-and-budget.json` "Money & currency".
Money & currency honestly ⚠-flags the 7-Eleven ATM advice as resting on a search summary rather
than a fetched source. Local essentials stated the same thing as plain fact, in more detail
(Visa/Mastercard/Maestro/UnionPay/Amex, 24 hours nationwide), with no flag and no source. A reader
comparing the two tabs learns the guide doesn't know what it thinks.
**Replacement:** Local essentials now carries the same ⚠ and points at the Money tab, and the
duplicated FX reference rate is dropped from it — one home for the rate, which also removed the
strict-mode failure in finding 13.

#### 12. Day 4 quoted a departure time with no provenance — rubric #3
**Where:** `04-days.json` Day 4.
"Departures from the Misasa Onsen bus centre start before 7:40" is a transit figure on an
undated, unsourced day card, while Days 1–3 all carry item-level provenance for exactly this
reason (see the reconcile pass's own amendment). Added `source_url` (the same route-3450
timetable that publishes it) + `verified_on`.

#### 13. Build repair — the two schema errors that failed the previous attempt — rubric #1, #3
**Where:** `facts.json` · `01-plan.json` §1 · `06-money-and-budget.json` §15.
`facts.json`'s `fx-rate-usd-jpy` had `≈` typed into `value` **and** `state: "approx"`. The `≈` is
DERIVED from state (`src/lib/facts.mjs` `renderFactValue`), so the guide would have rendered
"≈¥159 per US$1 ≈ approx." — two markers for one figure — and, because the derived pill puts a
literal `≈` into every section that references the fact, both referring panels tripped the
`provenance:"strict"` gate for carrying `≈` with no `verified_on`.
**Replacement:** `value` is now `¥159 per US$1` (state alone carries the marker). "Money &
currency", whose subject IS the rate, gains `source_url` (XE) + `verified_on` + `shelf_life: fx`.
"Local essentials" no longer references the fact at all (finding 11), so it owes no date — which
is the right fix there: dating that panel to XE would have implied the ATM paragraph was sourced
to a currency converter, the exact mis-citation this pass spent its budget catching.

#### Rebutted on second look (no edit)
- **The Kurayoshi–Misasa bus fare, "secondhand sources put it around ¥340–¥480".** This looked
  like a bare perishable figure from a disqualified tier. It isn't: it is ⚠-flagged, given as a
  range rather than a point, explicitly labelled secondhand, paired with the reason the primary
  source failed (the operator's fare table is an unreadable PDF) and with the actionable
  instruction (pay cash on board). That is precisely what `verification-rules.md` §4 licenses a
  `⚠` to do. Left as written.

#### Flagged, not fixed (source or tooling out of this stage's reach)
- **R1 · `map.points[]` absent** (carried forward, unchanged). Still needs
  `scripts/lookup-place.mjs`, which this stage cannot run.
- **R2 · Uradome cruise transit access** (carried forward). The operator page publishes only the
  address; re-fetched this pass and it still does. The address and phone are now in the entry.
- **R3 · Nageiredo climb effort figures** (carried forward, re-tested). `misasaonsen.jp/mitokuclimb/`
  was re-fetched this pass and explicitly publishes no distance, ascent or round-trip time; it
  refers the reader to `mitokusan.jp`, which publishes none either. Day 3 now states the gap
  rather than leaving it silent. Source lead unchanged: find the page that actually publishes them.
- **R4 · NEW · Uradome cruise coordinates.** The wrong pin is removed (finding 1); a correct one
  needs `scripts/lookup-place.mjs "山陰松島遊覧" --cc JP` on the verified address
  岩美郡岩美町大谷2182. Not runnable in this stage.
- **R5 · NEW · A Tottori-city dinner for eight on the arrival night.** Needs a restaurant's own
  site — a new authority outside this stage's permitted fetch set. Source lead: `torican.jp`'s
  gourmet listings are fetchable here and would give candidate names, but the hours, party-of-8
  capacity and reservation rule must climb to each venue's own T0 page before anything ships.

## Citation audit

Sampled 8 perishable facts, weighted toward prices, hours and the anchor transfer. Each fact's own
`source_url` was fetched and compared against the value the guide states.

| Claim | Value in guide | Source fetched (y/n) | Verdict |
|-------|----------------|----------------------|---------|
| Kurayoshi→Misasa last weekday bus (ANCHOR) | route 72/73, last departure 19:08 from Kurayoshi Station, ≈20–26 min, ~100-min gap 12:22→14:04 | y — `hinomarubus.co.jp/timetable_route/3455/?tab=2` | **drifted → fixed** — the cited page is the (72)(73) depot line and has no 倉吉駅 stop; corrected to (70)(71)上井三朝線, last dep. 19:25 → 三朝車庫 19:52, ≈20–27/≈40–50 min by variant, gap 13:20→14:40, re-cited to route 3450 |
| Nageiredo Yohaijo platform detail | Nikon telescopes; ≈600 m away, partial view; 2 standard + 1 accessible space | y — `town.misasa.tottori.jp/1593/31543.html` | **drifted → fixed** — page carries none of the three; telescopes + 2/1 parking re-cited to `misasaonsen.jp/sightseeings/sightseeing-12431/`, the 600 m (a climb-trail length) removed |
| Matsuba-gani season opening | doesn't open until Nov 6 | y — `torican.jp/feature/gourmet_crab` | **drifted → fixed** — source says 11月上旬 (early Nov), no Nov 6, and no beni-zuwaigani; both crabs re-cited to `marutsu.jp` (松葉がに 11月～3月, 紅ズワイガニ 9月～6月) |
| Sand Museum admission, hours, exhibition | ¥800 adult, 9:00–18:00, last entry 17:30, Spain theme through Jan 3 2027 | y — `sand-museum.jp/information/` | **supports** — 800円 / 9:00～18:00 / 17:30 / 第17期「砂で世界旅行・スペイン」2026年4月24日～2027年1月3日 |
| Nageiredo climb fees + rules | ¥1,200 adult (¥400 without the climb), reception 8:00–15:00, 16:30 descent, 2-person minimum, footwear check, Dec–Mar snow closure, waraji ¥800 | y — `mitokusan.jp` | **supports** — 1,200円 (800+400), 8時～15時, 16時30分, 必ず二人以上, footwear rule, 12月～3月 snow closure, rental sandals |
| Uradome Coast cruise | Mar–Nov, hourly 9:30–15:30, ¥1,800 adult, ≈40 min afloat | y — `tottori-tours.com/plan/saninmatsushimayuran_ogata` | **supports** — 3月〜11月, seven departures 9:30–15:30, 大人1,800円, 約1時間 total with ≈40 min cruising (the ≈1 h total was added to the entry) |
| Kabuyu bath + footbath | ¥400 adult; free footbath and drinking spring alongside, reduced Monday footbath hours | y — `misasaonsen.jp/sightseeings/sightseeing-1072/` | **supports** — 大人400円, free 足湯 8:00～21:00（月曜日のみ10:00～）and a 24 h drinking spring |
| Yakiniku Masashige hours, price, capacity | dinner 17:00–22:30 (L.O. 22:00), weekend-only lunch 11:30–14:30, closed weekday lunch + Dec 31/Jan 1, ¥2,800–¥6,600, rooms 2–60 | y — `masashige55.com` | **supports** — 17:00～22:30 (L.O.22:00), 11:30～14:30, 平日ランチ・12月31日・1月1日, 2,800/3,800/5,500/6,600円, 2名様から最大60名様. Party-size widget cap is not on this page — see the rebuttal above |

Unreachable: none of the sampled sources failed to resolve. `matsubishi.online` (Pass A's original
matsuba-gani citation, already superseded in the guide) sits outside this stage's permitted fetch
set and was not re-checked; no shipped claim depends on it any more.

### Second critic pass — citation audit, 2026-08-26

Fourteen perishable facts sampled, weighted toward prices, hours and the anchor transfer, and
deliberately **including the facts the first pass's audit had already marked `supports`** — that
re-sampling is what caught findings 5 and 3. Every row's own `source_url` was fetched and read
against the value the guide states.

| Claim | Value in guide (before this pass) | Source fetched (y/n) | Verdict |
|-------|-----------------------------------|----------------------|---------|
| Sand Dunes — free entry, dune-side lot ≈180 cars free, dawn ≈5:30–6:00am, ≈20-min camel path | all four, on one citation | y — `tottori-guide.jp/sakyu/` (twice, second time targeting 入場料/駐車場/ラクダ) | **drifted → fixed** — the page carries **none** of the four. Free entry re-cited to `torican.jp/spot/detail_1064.html` (料金: 無料); camel path re-cited to `torican.jp/feature/sakyu-morning` (≈20 min one way, 朝9:15ごろ); parking claim deleted as contradicted (below); dawn clock deleted as unsourced |
| Sand Dunes — dune-side overlook lot is free parking | "(≈180 cars) is also free parking" | y — `torican.jp/feature/hajimete` | **drifted → fixed** — official city guide says the nearest lot is 駐車料500円の有料駐車場 and the FREE lots are the Sand Center / municipal lot. Claim removed from the sights entry and from Day 1; the party has no rental car |
| Sand Dunes — access from Tottori Station | absent entirely | y — `torican.jp/spot/detail_1064.html` | **gap → filled** — バスで約20分「鳥取砂丘（砂丘会館）」下車, plus a weekend-only loop bus at ≈30 min that this Tue–Fri trip can't use |
| Hinomaru Hire 9-seat jumbo taxi tariff (party-of-8 fallback) | ¥740 flagfall + ¥90/279m | y — `hinomaru-hire.com/taxi/` | **drifted → fixed** — that is the REGULAR car (初乗運賃1.5kmまで740円 / 以後279mごとに90円). The jumbo is ¥840 / 1.5 km then ¥100 per 179 m. Corrected in Transit and Day 2 `plan_b` |
| Sanbutsu-ji rental waraji price | ¥800 | y — `mitokusan.jp` (targeted re-fetch) | **drifted → fixed** — the page says only わらじ（有料）; no yen figure is published. Figure removed, ⚠ substituted |
| Yakiniku Masashige total seats | "116 total seats" | y — `masashige55.com` (targeted re-fetch) | **drifted → fixed** — the page publishes the private-room range 2名様から最大60名様 and no total seat count. Figure removed |
| Menya Hachibee bowl price | ≈¥780 | y — `na-na.media/hachibe-kurayoshi/` | **supports the number, drifted on tier → fixed** — page gives 780円, 昼10:30~14:00 / 夜17:30～20:00, 木曜日 closed (from 2025). Same non-primary page the guide already ⚠-flags for hours, so the price's `≈` was downgraded to ⚠ for consistency |
| Kurayoshi→Misasa last weekday bus (ANCHOR) | route 70/71 上井三朝線, last dep. 19:25 → 三朝車庫 19:52 | y — `hinomarubus.co.jp/timetable_route/3450/?tab=2` | **supports** — (70)(71) Kamioi-Misasa line, 17 weekday departures 7:45–19:25, last arriving 三朝車庫 19:52 (27 min) |
| Mitokusan bus runs + returns | dep. Kurayoshi 8:35 → Mitokusan 9:10; returns 10:25/11:40/12:50/14:08/15:19/16:12/17:23 | y — same page | **supports, list completed** — 8:35→9:10 confirmed; northbound also shows 8:27 and 9:15, both before either morning arrival. Transit now names them and says why they're useless here |
| Shirakabe Dozo-gun access from Kurayoshi Station | "≈10–15 minute city bus", stop unnamed, no citation anywhere | y — `kurayoshi-kankou.jp/bus_access/` | **drifted → fixed** — 倉吉駅バスターミナル2番乗り場, 赤瓦・白壁土蔵群 stop, 約12分, 一部時間を除き5〜10分毎. Stand number and frequency added; both surfaces re-cited |
| Shirakabe tourist information centre hours + guided walk | 9:00–17:00, "from ¥3,300" | y — `kurayoshi-kankou.jp/guide` | **supports, sharpened** — 9:00～17:00 and ガイド1人につき1時間以内3,300円 — per GUIDE per hour, so for a party of eight that's one fee, not eight. Wording corrected |
| Uradome cruise fare, season, times, departure point | ¥1,800, Mar–Nov, hourly 9:30–15:30, ≈40 min afloat | y — `tottori-tours.com/plan/saninmatsushimayuran_ogata` | **supports** — 3月〜11月, seven departures 9:30–15:30, 大人1,800円, ≈1 h total. Departure point 〒680-0073 岩美郡岩美町大谷2182 — which is what exposed the Miyagi coordinates (finding 1) |
| Misasakan reserved shuttle pickups | 14:10/15:30/16:20/17:30, advance booking only | y — `misasakan.co.jp/access/` | **supports, sharpened** — お迎え(倉吉駅出発) 14:10、15:30、16:20、17:30 / 要事前予約, and the page warns times shift 5–10 min with the trains. That caveat is now in the guide, because Day 2's luggage plan rides on these runs |
| Sand Museum admission, hours, exhibition | ¥800, 9:00–18:00, last entry 17:30, Spain through Jan 3 2027 | y — `sand-museum.jp/information/` | **supports** — 800円 / 9:00～18:00（最終入館17:30）/ 2026年4月24日～2027年1月3日 |
| Nageiredo climb fees, hours, rules, snow closure | ¥1,200 (¥400 without climb), 8:00–15:00, 16:30 descent, 2-person minimum, footwear check, Dec–Mar | y — `mitokusan.jp` | **supports** (every element except the waraji price, above) |
| Nageiredo climb round-trip time / trail length | not shipped (R3) | y — `misasaonsen.jp/mitokuclimb/` | **unreachable → flagged** — page publishes no distance, ascent or duration and defers to `mitokusan.jp`, which publishes none either. R3 stands; Day 3 now states the gap |
| Yohaijo platform — telescopes, 2+1 parking, "only non-climbing viewpoint" | as written | y — `misasaonsen.jp/sightseeings/sightseeing-12431/` | **supports** — ニコン製の高画質望遠鏡, 駐車場2台・身障者専用1台, 登山以外、唯一見られる場所です, renewed autumn 2022 |
| Kabuyu admission + free footbath | ¥400, free footbath/drinking spring, reduced Monday footbath hours | y — `misasaonsen.jp/sightseeings/sightseeing-1072/` | **supports** — 大人400円, 足湯 8:00～21:00（月曜日のみ10:00～）, drinking spring 24時間 |
| Yakiniku Masashige hours, closed days, course prices | 17:00–22:30 (L.O. 22:00), weekend-only lunch 11:30–14:30, closed weekday lunch + Dec 31/Jan 1, ¥2,800–¥6,600 | y — `masashige55.com` | **supports** (the seat count above is the one element it does not carry) |
| Jinpukaku closure + Horyu-in/Hosen-an hours | closed since Dec 29 2023, ~several more years; garden/teahouse open 9:00–17:00 | y — `torican.jp/spot/detail_1012.html` | **supports** — 2023年12月29日より約5年間…長期休館, 宝隆院庭園と宝扇庵は引き続きご利用いただけます, 9:00～17:00 |
| Crab seasons (matsuba-gani vs beni-zuwaigani) | 松葉がに Nov–Mar, 紅ズワイガニ Sep–Jun | y — `marutsu.jp` | **supports** — 11月～3月 and 9月～6月, one page covering both, as the previous pass re-cited it |

Unreachable / not re-checked: `misasaonsen.jp/mitokuclimb/` resolved but publishes nothing on the
climb's effort (recorded above as the R3 flag, not a dead link). `travel.state.gov` and Japan's
MOFA visa-exemption page remain blocked to this stage's fetches, exactly as the previous pass
recorded; both gaps stay ⚠ in the guide. `eki.jr-odekake.net` (Kurayoshi Station step-free
access) and `xe.com` (the FX reference rate) were not re-sampled this pass — both are carried
forward from earlier passes and are named in the guide's own re-check list.

#### Continuity sweep — critic execution

**Greps run** across the whole guide directory after editing: `19:08` · `Nov 6` · `600m` ·
`phrase card` · `Trip kit` · `cruise day` · `¥1,300` · `12:22` · `14:04` · `route 72/73` ·
`Kamii-Misasa/Misasa`. All clean except two intentional survivors: the new Etiquette sentence
stating that the guide *has* no phrase card, and the `19:08` inside the `_guide.json` verified
stamp, which now names the superseded figure while explaining the correction.

**Ripples found and fixed:**
- `19:08` → `19:25` in four places beyond the Transit step that owned it: Day 2 `pace`, Day 2
  `body`, Day 2 `plan_b` body, and the "build buffer before" luggage step in Transit.
- Route identity `72/73` → `70/71` wherever the Kurayoshi-Station transfer is named, plus a new
  Transit step so the wrong-but-findable 72/73 timetable can't be mistaken for it later.
- Bus `source_url` moved from route 3455 → 3450 on the Transit section, and the same URL added as
  Day 2's item-level provenance — the day quoted the departure time while carrying none.
- `Nov 6` → the November–March season in three places (divergence card, Day 3 body, Food intro);
  divergence `source_url` torican → marutsu; section-level `source_url`/`verified_on` added to the
  Food `venues` section, whose `intro` carried the crab claim with no provenance of its own.
- `600 m` removed from BOTH places it had propagated to — the Yohaijo sights entry and Day 3's body.
- Yohaijo `source_url` town.misasa → misasaonsen, and the ¥400 main-hall figure dropped from that
  entry (it belongs to, and is dated by, the climb entry) rather than left dated to a page that
  doesn't publish it.
- The budget's `cruise day` note corrected, and the matching "when it fits" written into the Uradome
  sights entry, so the two surfaces now agree the cruise is off the plan.
- `_guide.json` verified stamp records the anchor correction and adds the Uradome access gap plus
  "the specific run times you plan around" to the pre-travel re-check list.
- `09-sources.json` still-flagged list gained the Uradome access gap.
- Map recentred — checked that the `weather` section (which reads the FIRST map's coords) is its
  only other consumer; the trade is recorded in finding 6.
- Unsourced `¥1,300` 2-day bus pass removed from the Transit step: no evidence record in this
  ledger, no support on the cited timetable page, not load-bearing — omitted per ship/flag/omit
  rather than shipped as a bare perishable figure.
- Day 1 gained the one-sentence trade-off note that this itinerary spends the dunes' afternoon slot
  rather than the dawn window the Sights tab recommends, and names the only dawn slot the four days
  contain. Itinerary structure only; no new fact.
- Prose shape: the two new paragraphs that ran past 80 words (Day 2 luggage, Uradome) were split
  rather than shipped long, per the open `[critic]` pattern about new guides having no baseline.

**Deferred to human / a networked pass:** R1 (map `points[]` — needs `lookup-place.mjs`), R2
(Uradome transit access), R3 (climb effort figures). No other ripple was left open.

**Second critic pass, 2026-08-26.**

**Greps run** across the whole guide directory after editing: `180 cars` · `dune-side parking` ·
`5:30–6:00` · `Dawn` / `dawn` · `116 total` · `¥740` · `≈¥780` · `waraji, ¥800` · `38.369` ·
`141.062` · `place_id` · `tottori-guide` · `10–15 minute city bus` · `{{fact:` · `≈` (against the
strict-mode gate, section by section). Remaining hits are all intentional and were each read:
`¥740` now survives only as the explicit regular-car contrast in the two jumbo-taxi passages;
`dawn` survives only in the divergence card whose whole subject is the "arrive at dawn" myth (its
correction carries no clock time) and in the `_guide.json` stamp, which names the superseded
figures while explaining the corrections.

**Ripples found and fixed:**
- The dune parking claim had propagated from the sights entry into **Day 1's body**; removed from
  both, not just from the entry that owned it.
- Re-citing the Sand Dunes item moved its `source_url` off `tottori-guide.jp` entirely, which left
  that domain in the **Sources tab's "checked directly against" list supporting nothing** — a
  source list that overstates the guide's evidence. Replaced with the two `torican.jp` pages that
  now carry the facts, described by what each one supports. The same sweep found
  `tottori-tours.com` (the Uradome citation actually in use) **missing** from that list while
  `yourun1000.com` — cited by nothing — was in it; corrected both ways.
- The Shirakabe access fix rippled to **two** surfaces (Transit step 3 and the sights entry), and
  the guided-walk price changed meaning with it: ¥3,300 is per guide per hour, not a per-head
  "from" price, which for a party of eight is a materially different number. Both re-worded.
- The `map.points[]`-free Uradome entry: checked that no other surface pins it. Day cards don't
  schedule the cruise, and the orientation `map` section carries no `points[]` at all, so removing
  the item's coordinates orphaned nothing. The `span 0.21` bbox from the previous pass still frames
  all three towns; the removed pin was never inside it, which is the check that should have caught
  it upstream.
- The Day 3 return-bus split rippled back into **Transit step 8** ("pick two, see Day 3"), so the
  two tabs can't drift apart on it, and the same step gained the 8:27/9:15 runs it had silently
  omitted.
- The jumbo-taxi tariff appeared in **two** places (Transit step 7, Day 2 `plan_b`); both corrected,
  and the Booking-checklist line that names the jumbo was re-read — it carries no fare, so it
  needed no edit.
- Removing the FX token from "Local essentials" left `fx-rate-usd-jpy` referenced exactly once, in
  "Money & currency". Checked it is still referenced at all (an unreferenced registry row is a
  lint nag, an unresolved token is a build failure) — it is, and the panel now carries the
  provenance the strict gate wants.
- The Sources tab's still-flagged list gained the Hachibee bowl price, the waraji price and the
  climb's round-trip time, and a new paragraph records the two DELIBERATE absences (the missing
  Uradome pin, the unresearched arrival-night dinner) so they don't read as oversights.
- `_guide.json`'s verified stamp records this pass's corrections and adds the Hachibee bowl price
  to the pre-travel re-check list.
- Prose shape: every paragraph added this pass was kept under the ~80-word working limit the
  previous pass adopted; the Day 3 return-bus note and the Day 1 dinner note were each written as
  their own short paragraph rather than appended to an existing one.

**Deferred to human / a networked pass:** R1 (map `points[]`), R2 (Uradome transit access), R3
(climb effort figures — re-tested and confirmed unpublished this pass), R4 (correct Uradome
coordinates — needs `lookup-place.mjs`), R5 (a verified Tottori-city dinner for eight on the
arrival night — needs a venue's own site, a new authority). No other ripple was left open.
