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
