# Research ledger — Japan

> Everything research produces for this guide. The traveler's own intent lives beside this in
> `intake.md` and is frozen after scaffold — record a research-forced change of plan under
> "## Amendments" here, never by rewriting the intake.

## Spec Summary (fill after intake, before research)
- Section types to include / exclude (and why): Full backbone (Plan/Money/Health/Etiquette/Transit/Days/Sights/Food/Sources) — intake asked for a full pass, all sections. Depth is concentrated on Food & shopping (the only stated priority); Sights/Transit/Health/Etiquette are light-touch per SKILL.md's "depth on top priorities, light touch elsewhere."
- The 2–3 priorities driving depth: Only priority #1 (Food & dining) was named; priorities #2/#3 were left blank in `intake.md`. No priority was invented to fill the gap.
- Hard filters applied to every entry: party size 6 — any anchor-dinner or group-meal candidate whose real seating/booking rules make 6 implausible is rejected or caveated (see Candidates below). Casual meals must stay low-friction (walk-in or one-tap booking, not a reservation project).
- Verification focus (most perishable / most important to get right): The Saturday anchor dinner (venue, booking window, party-of-6 capacity, price) — the trip's one non-negotiable, unselected at intake. Also: Toyosu/Tsukiji market open/closed-day status against the actual trip dates, and Shinjuku Gyoen's Monday closure landing inside the trip.

## Party & travelers note
This run's `intake.md` comments block states this is "Combined Research Run A — V01 validation trial... Operational validation data, not a live traveler request," for a frozen 6-adult food scenario. It does not match `docs/evidence/traveler-patterns.md` Party A (3 mid-20s friends) or Party B (5-person family) — treated as a standalone party per the intake's own frozen numbered intent (1)-(7), not mapped to prior-trip patterns.

## Methodology note — deterministic lookup scripts unavailable this run
`node scripts/*.mjs` (lookup-place, lookup-venue, lookup-tz, search-commons, fetch-wikivoyage) could not be executed in this environment (command execution blocked at the sandbox level, confirmed via repeated attempts including a trivial `node -e` no-op). Routed around via direct WebFetch/WebSearch instead:
- **Coords/place_id**: *(superseded — a later pass did populate `map` coords and Google `place_id`s on the sights and venues; the critic pass sanity-checked every pair against the named neighbourhood and found no misplacement, and reused those same coords for the orientation map's `points[]`.)* Originally: not set on any sight/venue `map` field rather than guess from memory.
- **Commons photos**: none set — `img.file`/`img.src` omitted on every sight rather than guess a filename. No image is a fine outcome per `image-sourcing.md`.
- **Venue status/hours**: substituted with direct WebFetch of each venue's own official/operator page, which is arguably the more thorough substitute (reads the actual page rather than a Places API status flag).
- **Time zone**: confirmed durable fact (JST, UTC+9, no DST) via web reference instead of the zero-network script; not itself perishable so low risk.
- **Wikivoyage grounding leads**: not pulled; discovery instead ran via WebSearch + the destination's own `t0Domains` (src/data/destinations/japan.json).

## Anchor — verified first
The trip's anchor is not a calendrable event (no festival/concert with a fixed T0 date) but "one Saturday anchor dinner (Sat Oct 17, 2026)," venue unselected at intake. Verified first, before any other research:
- **Sat Oct 17, 2026 is in fact a Saturday** (confirmed via `date -d`).
- **No Japanese national holiday falls in the Oct 16–20, 2026 window** — nearest is Sports Day (Oct 12, before) and Culture Day (Nov 3, after), confirmed against the Cabinet Office's own CSV (already in `src/data/holidays/JP-2026.json`, sourced 2026-08-08).
- Anchor-restaurant discovery then ran broad-then-narrow across cuisines (see Candidates below) — **Nihonryori RyuGin shipped as the anchor**, Ginza Ukai-tei as the low-friction fallback, Aragawa preserved as Worth the Effort.

## Cover art — footage candidates (research fills the shortlist; the CREATOR signs)
> The research pass's footage scout records 0–2 licensed, hot-linkable clips here — stable-URL
> libraries only (e.g. Mixkit `assets.mixkit.co` asset URLs; Coverr temp-URLs are forbidden).
> Publishing is the creator's call alone: a clip must be FRAME-VERIFIED to show the actual place
> (no invented geography) before `cover.video` is set in `_guide.json`. Until then the photo
> cover / Painted Atlas stands — an empty table is a fine outcome, not a gap.

| Clip URL | License | Claims to show | Matches cover geography? | Frame-verified by |
|----------|---------|----------------|--------------------------|-------------------|
| (none — see note) | | | | |

Mixkit's Tokyo collection (mixkit.co/free-stock-video/tokyo/) surfaced 3 plausible candidates (IDs 4403 "Senso-ji, low-angle timelapse", 4405 "Senso-ji entrance", 30137 "Shibuya crosswalk time lapse night") but the direct `assets.mixkit.co/videos/{id}/{id}-720.mp4` download URL could not be independently confirmed this pass (the CDN domain wasn't fetchable, and the landing pages only exposed thumbnail URLs, not the mp4 asset link). Left the table empty rather than ship an unverified asset URL — a future pass or the creator can confirm the mp4 link via a real browser before this table is filled.

## Research reconciliation (fill during the dual-pass — see the guide-author skill)
> Pass A = canonical/verified (official, anchors, logistics). Pass B = local/authentic/crowd-aware
> (resident + blog knowledge, off-peak timing, novel alternatives). Record what each pass found and
> how conflicts resolved — this is the corroboration trail behind the guide.

Pass B ran independently (food-priority scope only, per SKILL.md's depth-on-top-priority rule) and returned 7 candidates + 12 evidence records + 2 reservation findings. Every Pass B item gets a verdict below; the machine-checked disposition for each Pass B evidence record lives in `evidence.v2.json`'s `reconciliation[]` array.

| Item | Pass A (canonical) | Pass B (local/authentic) | Reconciled → guide | Note (conflict / crowd / novel) |
|------|--------------------|--------------------------|--------------------|---------------------------------|
| Anchor dinner slot | Nihonryori RyuGin shipped as anchor; Ginza Ukai-tei fallback; Aragawa Worth-the-Effort | Kobikicho Ohno (single-seating-per-day tea-kaiseki) shipped as Pass B's own top pick; Koumoto (soba-kappo) shipped as its second pick | RyuGin stays the shipped anchor; **Kobikicho Ohno added as a second Worth-the-Effort alternative**; Koumoto kept shortlisted, not shipped | Not a factual conflict — two independent passes found disjoint, non-overlapping candidate sets for the same slot. Reconciled by ROLE: RyuGin has the deepest, best-documented booking route (confirmed concierge path, 6–8 buffer capacity); Ohno is a genuinely exceptional but harder-to-book alternative (single seating/day, exact-fit-6, less-established foreign booking) — preserved per the intake's own instruction (constraint #6) rather than silently dropped. Koumoto's role (flexible, self-service-adjacent fallback) is already covered by Ukai-tei, so shipping all three would dilute the Saturday-dinner section rather than strengthen it. |
| Kobikicho Ohno | not found | shipped (Pass B's own anchor pick), Worth-the-Effort | **adopted** — new item in `08-food-and-shopping.json`'s "What to eat" | B-only, carried across as-is (fetched official site + operator cancellation/price terms); no re-fetch needed. |
| Koumoto | not found | shipped (Pass B's own pick) | **not shipped** — kept `shortlisted` in `evidence.v2.json` | B-only, solid evidence (confirmed foreign-card acceptance, flexible capacity to 12) but redundant with Ukai-tei's already-shipped fallback role. Rejected for shipping, not for accuracy. |
| Narukiyo | not found | rejected (own funnel): standing-counter seating wrong for 6, already English-tourist-discovered, phone line found closed | rejected, carried across unchanged | Pass B's own rejection — no Pass A conflict to resolve. |
| Kagayaki (Minowa) | not found | rejected (own funnel): all-you-can-eat buffet format, not a quality-led anchor pick | rejected, carried across unchanged | Pass B's own rejection. |
| Miyabi (Roppongi) | not found | rejected (own funnel): single-blog-only source, generic tourist-district spot | rejected, carried across unchanged | Pass B's own rejection. |
| Kaigen (Tsukiji) | not found | rejected (own funnel): only 1 current (≤24mo) firsthand corroboration, other 2 are 2022 | rejected, carried across unchanged | Pass B's own rejection — a good lead for a future pass per the freshness rule. |
| Tsukiji Outer Market crowd timing | Crowd-timing evidence from 2 search-preview-tier blogs (8–9 AM quiet, 9 AM–1 PM peak); Sunday closures noted | 2 fetched (not search-preview) independent Japanese blogs corroborating the same early-morning window, PLUS a new detail: Wednesdays also run at roughly half-capacity | **AGREE, enriched** — guide's Tsukiji entry now reads "...roughly half the stalls close on Wednesdays as well as Sundays" | Both passes independently converged on the same crowd pattern — strong corroboration. Pass B's sourcing is better (fetched vs. search-preview) and added the Wednesday detail Pass A had only partially sourced. |

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

*(No interactive discovery sweep ran ahead of this headless pass — table intentionally empty; Pass B runs its native aides as normal per research-efficiency.md.)*

## Candidates considered (fill DURING research — one table per ranked priority)
> Standard S2/S3 (2026-08-02): real research quality is how many options you REJECTED and
> why — a thin pass and a deep pass are indistinguishable if only survivors are recorded.
> One table per ranked priority, one row per candidate EVALUATED (not just shipped).
> Verdict is `shipped` or `rejected: <one-line reason>`. Breadth is ADAPTIVE — no fixed
> quota: stop when new searches mostly duplicate/weaken the set AND unresolved evidence is
> unlikely to change the recommendation, and record that stop. Verify's `candidates` row
> still fails an empty table and cross-checks every `shipped` name against the guide. An
> honest `rejected: couldn't verify` row is a good row — it proves the option was seen.

Full detail (reasons, sources, reservation depth) lives in `evidence.v2.json`; this table is the human-readable summary.

### Priority 1: Food & dining — the Saturday anchor dinner (party of 6)

| Candidate | Verdict |
|-----------|---------|
| Nihonryori RyuGin | shipped (anchor) |
| Ginza Ukai-tei | shipped (low-friction fallback) |
| Aragawa | detour — Worth the Effort (≈22-seat capacity risk for 6) |
| Kohaku (Kagurazaka) | shortlisted, not shipped — private-room capacity for 6 unconfirmed, site blocked to fetch |
| Sazenka | shortlisted, not shipped — 2-month booking window already tight; RyuGin/Ukai-tei cover anchor+fallback |
| Yakiniku Ushigoro (Ginza) | shipped (separate Monday dinner, self-booked) |
| Sukiyabashi Jiro | rejected: delisted from Michelin, no public reservations, ~10-seat counter |
| Sushi Saito | rejected: booking gated behind Amex Platinum + Pocket Concierge, 8-10 seat counter |
| Sushi Yoshitake | rejected: no group-of-6 booking path found |
| Sushi Kanda | rejected: no reservation/foreigner-access info found |
| Sushi Masashi (Aoyama) | rejected: 9-seat counter, private room only fits 4 |
| Florilège | rejected: confirmed max party size 4 |
| L'Effervescence | considered, not deep-verified: no group-of-6 data found |
| Narisawa | considered, not deep-verified: extreme booking difficulty, no capacity data |
| Den | rejected: phone-only, "impossible reservation," no confirmed capacity for 6 |
| Kadowaki | considered, not deep-verified: 20 total seats, 6 at counter |
| Ishikawa | considered, not deep-verified: surfaced only as a name |
| Wagyu Yakiniku Isshin (Nakameguro) | considered, not deep-verified: Ushigoro already covers this slot |
| Inakaya (Roppongi Higashi) | rejected: crowd-pleaser pricing/positioning, doesn't meet the anchor's quality bar |
| Gonpachi (Nishi-Azabu) | rejected: tourist-oriented, inconsistent service for the price |
| Unotoki (Nogizaka) | rejected: only 16 total seats |
| Tempura Kondo (Ginza) | considered, not deep-verified: counter format, no group data |
| Sushi Dai (Toyosu) | rejected: ~12 seats, 2-5hr waits, would split a party of 6 |
| Daiwa Sushi (Toyosu) | rejected: same group-splitting problem as Sushi Dai |
| Uogashi Nihon-Ichi | rejected: 6-7 standing spots per branch, no seating |
| Kura Sushi (Oshiage) | rejected: good group option, but Uobei Shibuya already covers the easy-arrival-night slot |
| Uobei Genki Sushi (Shibuya) | shipped (arrival-night dinner) |
| Torien (Omoide Yokocho) | shipped (Sunday dinner) |
| Gyutan Iroha (Omoide Yokocho) | rejected: legitimate alternative to Torien, not needed once Torien shipped |
| Tsukishima Meibutsu Monja Daruma | rejected: hours couldn't be reconciled between 2 sources (10:30-22:30 vs 11:30/11:00-23:00) |
| Fuunji (Shinjuku) | rejected: small-counter tsukemen, 45-90 min queues, poor group fit |
| Tatsunoya (Shinjuku) | rejected: small-counter, near-constant queues |
| Rokurinsha (Tokyo Ramen Street) | rejected: tourist-trap-adjacent, 30-45+ min queue at all hours |
| Ichiran | rejected: solo-booth format defeats a group meal |
| Afuri | rejected: counter-only, too small for 6 |
| Kanda Yabu Soba | shortlisted, not shipped: genuinely group-bookable but day slots already filled |
| Tempura Tsunahachi (Shinjuku Honten) | considered, not deep-verified: no group-seating info found |
| Maisen Tonkatsu (Omotesando) | considered, not deep-verified: no-reservation walk-in, wait risk unknown for 6 |
| Tendon Tenya | considered: reliable chain backup, not shipped as a named stop |
| Isetan Shinjuku (depachika) | considered: strong flex-lunch option, not shipped as a named stop |
| Mitsukoshi Ginza (depachika) | considered: alternative depachika, not shipped |
| Café de l'Ambre | considered: historic kissaten, seating too small for 6 as one stop |
| Fuji Soba (standing soba) | considered: lowest-friction breakfast format, mentioned as a category not a single pick |
| Tsukiji Outer Market | shipped (Saturday morning graze — moved off Sunday by the critic, see Critic findings C1) |
| Toyosu Market | shipped (Monday morning, routes around Sushi Dai/Daiwa's queue) |
| Ameya-Yokocho | shipped (Tuesday morning graze) |
| Kobikicho Ohno (Pass B) | shipped as Worth-the-Effort anchor alternative — single-seating-per-day tea-kaiseki, exact-fit-6 private room, native-language-only discovery |
| Koumoto (Pass B) | shortlisted, not shipped — solid soba-kappo alternative, confirmed foreign-card acceptance, but Ukai-tei already covers the fallback role |
| Narukiyo (Pass B) | rejected: standing-counter seating wrong for a seated 6-top, already English-tourist-discovered |
| Kagayaki, Minowa (Pass B) | rejected: all-you-can-eat buffet format, not a quality-led anchor pick |
| Miyabi, Roppongi (Pass B) | rejected: single-blog-only source, generic tourist-district spot |
| Kaigen, Tsukiji (Pass B) | rejected: only 1 current (≤24mo) firsthand corroboration of 3 found, freshness bar not cleared |

### Priority 2 / 3: not named at intake

No second or third priority was stated in `intake.md` — left blank rather than invented. Sights/Transit/Essentials sections received standard light-touch backbone research (see `evidence.v2.json`'s backbone evidence records) but no dedicated candidate funnel, consistent with SKILL.md's "depth on the intake's top 2-3 priorities; light touch elsewhere."

### Sights (light touch)

| Candidate | Verdict |
|-----------|---------|
| Senso-ji Temple | shipped |
| Meiji Jingu | shipped |
| teamLab Planets (Toyosu) | shipped |
| teamLab Borderless (Azabudai Hills) | rejected: legitimate alternative, but Planets pairs better with the Toyosu food day |
| Shinjuku Gyoen | shipped |
| Tokyo Tower | shipped (over Skytree — cheaper, less crowded per multiple comparisons) |
| Tokyo Skytree | rejected: pricier, 450m deck makes landmarks read as miniatures |
| Yanaka Ginza | shipped |
| Shibuya Crossing | rejected: no admission/content beyond a photo op |
| Akihabara | considered, not deep-verified: light-touch budget already spent on stronger food-adjacent picks |

## Questions for the traveler (research emits; traveler answers on the progress page)
> Traveler-framed only — no pipeline vocabulary. Each question carries an assumption the guide
> builds on until the traveler answers. See src/features/intake-questions/ for the model.

### q-tokyo-1
- **Q:** Which passport(s) is your group traveling on?
- **Assumed:** US passports for everyone — visa-free entry up to 90 days, no current pre-authorization needed.
- **Context:** The Entry & documents card (Plan tab) and the guide-level entry requirement.
- **Status:** open

### q-tokyo-2
- **Q:** Where are you staying, and does it have a concierge?
- **Assumed:** A hotel with concierge service — the anchor dinner (Nihonryori RyuGin) only takes overseas bookings through a hotel concierge or an approved booking partner, and the guide's Booking checklist assumes accommodation is locked in before Sept 1, 2026 so a concierge can call at RyuGin's reservation-window opening.
- **Context:** Booking checklist (Plan tab), Saturday anchor dinner (Food & shopping, Days tab).
- **Status:** open

## Amendments (append-only — record every research-forced re-plan)
> When research changes the plan (an anchor moved, a neighborhood beats the intended one, a day
> collapsed), log it here with the reason. `intake.md` stays the ORIGINAL intent; this is the
> diff. (Korea/Denmark were "corrected three times by running it" — that history now has a home.)

- 2026-08-26: Anchor venue selected via research, per intake's own instruction ("Venue NOT pre-selected — candidate discovery must earn the shortlist"). Nihonryori RyuGin shipped as the anchor (Sat Oct 17, 2026 dinner), with Ginza Ukai-tei as the designated low-friction fallback and Aragawa preserved as a Worth-the-Effort alternative. Not a deviation from intent — this *is* the intent's fulfillment — logged here for traceability since the intake's placeholder text is now superseded by a real pick.
- 2026-08-26: US State Dept travel advisory level left unset in `_guide.json` (no `advisory` block shipped) — travel.state.gov is Cloudflare-gated against automated fetch in this environment (confirmed 403 on repeated attempts), and a search-preview snippet is not a valid citation for a schema-required, source-dated field. Flagged in the Health & safety panel instead. A future pass with real-browser access should complete this.
- 2026-08-26 (Reconcile): Pass B's independent native-language sweep found Kobikicho Ohno, a single-seating-per-day tea-kaiseki restaurant with no English-language coverage — genuinely exceptional and distinct from Pass A's anchor candidates. Not a factual conflict with RyuGin (the two passes simply found different restaurants), so reconciled by role rather than by disproof: RyuGin keeps the shipped anchor slot (its concierge booking route and 6–8 buffer capacity are the best-documented in the guide), and Kobikicho Ohno is added to `08-food-and-shopping.json` as a second Worth-the-Effort alternative, per the intake's own constraint (6) not to silently drop an exceptional-but-inconvenient find. Pass B's second pick, Koumoto, is a solid but redundant alternative (Ukai-tei already covers its fallback role) — kept shortlisted in `evidence.v2.json`, not shipped in guide content. Tsukiji Outer Market's crowd-timing note was enriched with Pass B's better-sourced (fetched, not search-preview) corroboration, adding a Wednesday reduced-stall detail alongside the Sunday one Pass A already had.
- 2026-08-26 (Reconcile, validator-fix pass): The prior reconcile attempt failed offline verify on structural defects, all repaired without new research: (1) `evidence.v2.json` — 6 candidate ids (Sushi Dai, Daiwa Sushi, Fuunji, Tatsunoya, Rokurinsha, Yakiniku Ushigoro) didn't match the deterministic name+branch derivation the validator recomputes; corrected and every cross-reference (evidence `candidateId`, `depth.reservations.requiredCandidateIds`) updated to match. (2) This table's "Kobikicho Ohno" row carried markdown bold (`**...**`) that broke the shipped-name-appears-in-guide cross-check (the guide has no asterisks); bold removed from all Pass-B rows here. (3) Four `verified_on`-without-`source_url` gaps closed with real citations: the Meiji-Jingu-forest divergence (Meiji Jingu's own forest page), Uobei Genki Sushi (HotPepper operator listing — its true official site, uobei.info, didn't return fetchable content), and Ameya-Yokocho (its own site, ameyoko.net). (4) Four undated hour/price figures (two budget rows, "Key transit routes", and the Sun Oct 18 day body) gained `verified_on`+`source_url`. (5) The three R2 airport-transit facts in `facts.json` gained the `tier: "primary"` the risk-gate requires. (6) Japan's Nov 1, 2026 tax-free refund-system switch was registered as a `facts.json` row (was prose-only, so nothing would have re-checked or expired it) and the Money & currency panel now cites it via `{{fact:}}`. (7) Four "this pass" process-language leaks (Phone & data, Health & pharmacy, Sources & further reading, plus the guide-level entry note) rewritten to read as traveler-facing prose. No plan, priority, or shipped/rejected verdict changed — this pass is provenance and validator-compliance only.
- 2026-08-26 (Critic): Saturday and Sunday swapped their mornings. The guide's own Tsukiji entry already said roughly half the outer market's shops close on Sundays, and the Sunday day card nevertheless built the trip's #1-priority grazing breakfast there and called it "the day's only market stop." Re-sourced the closure to T0 (the market's own business-day calendar states its shops run on the Tokyo Central Wholesale Market calendar; the Metropolitan market page confirms Sundays and public holidays are closed), then moved Tsukiji to Sat Oct 17 — a full trading day — and moved Asakusa/Senso-ji to Sun Oct 18. No new venue entered the guide; both mornings keep a food-forward anchor, and Saturday's geography improves (Tsukiji → Ginza → Hibiya is ≈2 km, against Asakusa → Hibiya's ≈7 km). Anchor unchanged.
- 2026-08-26 (Critic): The anchor dinner's price was corrected upward from ≈¥80,500 to ¥88,550 per person. RyuGin's `/en/menu/` page publishes the course at ¥77,000 including tax; the ¥70,000 the prior pass used is the pre-tax figure that appears on `/en/about/` as the same-day cancellation fee. With the private room's 15% service charge the all-in figure is ¥88,550 — ¥48,300 more across six people than the guide claimed. Registered as `ryugin-course-88550-yen` in `facts.json` so the venue pill and the budget line read from one row.
- 2026-08-26 (Reconcile, second validator-fix pass): Prior attempt failed offline verify on evidence sourcing quality, repaired via fresh WebFetch/WebSearch research (not silenced, not invented): (1) **Aragawa's two experiential claim-pairs** (critical reputation, seat-capacity estimate) each had non-identical claim text across their two records, so the validator scored each record as a single-source claim rather than a corroborated pair; claim text unified within each pair (Andy Hayler + Spear's magazine remain the two independent sources behind the reputation claim; the andyhayler/tabelog pair remains behind the capacity estimate) — no new sources needed, a wording fix. (2) **JESTA entry-requirement claim** — the only prior source (a MOJ PDF) was unreadable/blocked and the FY2028/by-March-2029 date carried no `appliesToYears`; re-sourced against `moj.go.jp/isa/01_00643.html` (the Immigration Services Agency's own page on the Reiwa 8 immigration-law amendment), fetched and quoting the exact statutory text ("令和１１年３月３１日までの間において政令で定める日"), `appliesToYears: [2029]` set. (3) **Koyo (autumn-foliage) advisory** — already fetched from the JMC's own site but flagged for naming trip-year 2026 off a 2025-season publication with no `appliesToYears`; tagged `appliesToYears: [2026]` since the claim (no 2026 forecast yet published, trip predates any plausible koyo window regardless) is genuinely about trip-year 2026. (4) **Six undated experiential crowd-timing claims** (Meiji Jingu ×2, Tsukiji Outer Market ×2, Ameya-Yokocho ×2) — the original sources were either dead links, 403-blocked, or simply never carried a `publishedAt`; each pair replaced with two freshly fetched, independently authored, dated sources within the 24-month freshness window (Meiji Jingu: tokyotourism.org 2026-07-28 + karvaantours.com 2026-08-14; Tsukiji: getlostinjapan.com 2026-02-04 + banzokubiology.com 2026-06-07 — the latter's own URL was already cited but undated; Ameya-Yokocho: japansophy.com 2026-06-26 + gofarther.blog 2026-05-14). Claim text tightened to what each fetch actually confirmed — e.g. Meiji Jingu's "a few hundred visitors at 7 AM vs. tens of thousands by midday" and Tsukiji's "30–60 min lines" were specific figures the original sources never substantiated and the replacement sources don't either, so both were softened to the qualitative pattern (quiet at opening / building through the day; calm before ~9 AM, peak toward late morning) that IS corroborated. Guide prose updated to match in `07-sights.json` (Meiji Jingu), `08-food-and-shopping.json` (Tsukiji hours/crowd_tip, Ameyoko crowd_tip), and `06-days.json` (the Sun Oct 18 body's "Meiji Jingu is calmest at 7 AM" line, genericized to "right at gate opening"). No shipped/rejected verdict changed.

## Critic findings

Fresh-context pass, 2026-08-26. Eleven findings; all eleven implemented in the guide. Bar test on the
merged guide: the food spine (party-of-six seating rules per venue, the concierge-only anchor, the
single-seating-a-day Pass B find, the Toyosu queue routed around) is not something a generic AI
writes without this intake — rows #9 and #12 pass. The failures below are in the *joins*: between two
facts the guide already held, between a fact and the day it lands on, and between a figure and the
page it cites.

### C1 — the guide's own Sunday closure fact never reached the Sunday day card
**Where:** `06-days.json` → Sun Oct 18 item; `08-food-and-shopping.json` → "Tsukiji Outer Market".
**Rubric/lens:** vibe lens — meals & energy (recurrence of the 2026-08-23 uruguay row "when the
guide's own two facts conflict, the day plan quietly picks the optimistic one"); rubric #8 (the top
priority's depth).
**What was wrong:** the Tsukiji entry stated that roughly half the outer market's shops close on
Sundays. The Sun Oct 18 body sent the party there for the trip's #1-priority grazing breakfast and
described it as "the day's only market stop," acknowledging only that *Toyosu* was shut. The single
food-priority market morning of the trip was scheduled onto a half-closed market while a fully
trading Saturday slot sat unused.
**Replacement (researched):** the closure is an objective fact and had been carried on two blogs, so
it was re-sourced to T0 — `tsukiji.or.jp/english/calendar/` states the outer market's shops run on
the Tokyo Central Wholesale Market business-day calendar, and
`english.metro.tokyo.lg.jp/w/016-101-003992` confirms that calendar closes Sundays, public holidays
and scheduled closure days. Sat Oct 17 and Sun Oct 18 therefore swapped mornings: Tsukiji to
Saturday (a full trading day), Senso-ji/Nakamise to Sunday (open daily, main hall from 6:30 AM in
October). No new venue was introduced. Saturday's geography improves as a side effect — Tsukiji,
Ginza and Hibiya sit within ≈2 km, so the anchor-dinner day no longer crosses the city from Asakusa.

### C2 — the anchor dinner's price was understated by ¥8,050 per person
**Where:** `08-food-and-shopping.json` → "Nihonryori RyuGin" `price`; `02-money-and-budget.json` →
"Saturday anchor dinner" line.
**Rubric/lens:** rubric #6 (anchor coverage) and #3 (provenance on perishables) — recurrence of the
2026-08-14 japan-2 row "a carried-forward fact carries its source's authority, not its accuracy".
**What was wrong:** the guide read "≈¥80,500/person (¥70,000 course + 15% service)", cited to
`/en/reserve/`. That page publishes no price at all. ¥70,000 appears on `/en/about/` — as the
same-day **cancellation fee**, which is the pre-tax course figure.
**Replacement (researched):** `/en/menu/` publishes the course at "77,000JPY(incl. tax)" with
"Service charge (Table seats 10%, Semi private rooms 15%, Private room 15%)". Private room all-in is
¥88,550 (¥70,000 × 1.10 × 1.15 and ¥77,000 × 1.15 agree exactly). Registered as
`ryugin-course-88550-yen` in `facts.json` (R3, `evidence` quote carried) and referenced from both the
venue pill and the budget note, so the figure now lives in one place. Budget low set to ¥84,700 — the
same course at a table seat, where service is 10%.

### C3 — RyuGin's three hard booking rules were never surfaced
**Where:** `08-food-and-shopping.json` → RyuGin `how`; `01-plan.json` → "Booking checklist";
`06-days.json` → Sat Oct 17 `constraints`.
**Rubric/lens:** rubric #7 (4-question venue rule — "book?") and #10 (honest gaps); vibe lens —
common sense.
**What was wrong:** the guide shipped a party-of-six anchor dinner and a whole allergy phrase card,
and never mentioned that RyuGin's own page says "We are unable to take any reservation from who
appeal food allergies" and "We are unable to serve customers who cannot take fish or any seafood".
It also omits the age-10 minimum and the eight-person party cap. A concierge call on Sept 1 that
discovers this is a call that fails.
**Replacement (researched):** all four rules added from `/en/about/` (fetched, quoted above) to the
venue card, the Saturday day card, the Plan-tab booking checklist body (with `fold: false`, since it
is arrival-critical), and a new checklist item. The panel gained `source_url` + `verified_on`.

### C4 — Monday's dinner cost was invisible to the budget
**Where:** `02-money-and-budget.json`; `08-food-and-shopping.json` → "Yakiniku Ushigoro".
**Rubric/lens:** rubric #5-adjacent (budget integrity) and #7.
**What was wrong:** Ushigoro shipped with no `price` at all, and the budget modelled Monday as a
¥7,000 casual food day. Its own booking page lists courses at ¥16,000/18,000/25,000/32,000 tax
included, plus 10% service — the trip's second-largest meal, absent from the money tab.
**Replacement (researched):** `price` "¥16,000–32,000/person + 10% service" added, a "Monday dinner
(Yakiniku Ushigoro)" budget line added (est ¥19,800, low ¥17,600, high ¥35,200, sourced and dated),
and the Monday day body now says plainly that it is not a casual night.

### C5 — the casual-food budget line multiplied a four-day figure across five days
**Where:** `02-money-and-budget.json` → "Food & drink — casual days (Fri, Sun, Mon, Tue), per day".
**Rubric/lens:** rubric #5 (itinerary integrity) — recurrence of the 2026-08-23 uruguay row "one
budget `days` field cannot serve both nights and days".
**What was wrong:** the label scoped the line to four days, `basis: "day"` multiplied it by the
section's `days: 5`, and Saturday — whose food is the separate ¥88,550 anchor line — was counted
twice, inflating the per-person food total by ¥7,000.
**Replacement:** moved to `basis: "trip"` at ¥28,000 (4 × ¥7,000, low ¥20,000 / high ¥36,000), with
the note stating the daily range and why it is not on a day basis. "Lodging, per night" relabelled
"Lodging, whole trip" to match its own `basis: "trip"`.

### C6 — the orientation map excluded every place in the guide
**Where:** `05-transit.json` → "Orientation map".
**Rubric/lens:** vibe lens — geography; rubric #2 (no fabrication — a recalled centroid standing in
for researched coords).
**What was wrong:** `center` was 35.6762, 139.6503 — the generic "Tokyo" centroid, which lands in
Suginami-ku, somewhere the trip never goes. With `span: 0.08` (MapBlock renders ±span lng, ±0.6·span
lat) the frame covered 139.570–139.730. Every eastern place in the guide fell outside it: Hibiya,
Ginza, Tsukiji, Toyosu, Asakusa, Yanaka, Tokyo Tower. The `weather` block reads these same coords.
**Replacement:** recentred on Tokyo Station (35.6812, 139.7671), which brings the whole footprint
(Meiji Jingu 139.699 → Senso-ji 139.797, Toyosu 35.644 → Yanaka 35.728) inside the frame at the same
span. Added six `points[]` for the places a traveller would need to show a driver, reusing the coords
already verified on the sight/venue records; `local_script_name` set only where the native string was
read off a fetched authority this pass (浅草寺 senso-ji.jp, 明治神宮 meijijingu.or.jp, 築地場外市場
tsukiji.or.jp, 思い出横丁 the HotPepper listing for Torien) and omitted, per `block-types.md`, on
Toyosu Market and RyuGin rather than transliterated.

### C7 — no day carried a `plan_b`, including the one anchored on a venue the guide calls closable
**Where:** `06-days.json` → Mon Oct 19.
**Rubric/lens:** vibe lens — inclement cover.
**What was wrong:** the Monday card is built on teamLab Planets, and the guide's own sight entry says
it "closes for maintenance roughly monthly on irregular dates". No `plan_b`, and no "no good
alternate" note anywhere in the ledger. If Oct 19 is a maintenance day the traveller has a market
morning and nothing after it.
**Replacement (researched):** `plan_b` with `trigger: "closure"` pointing at Tokyo Tower's Main Deck
— verified against `tokyotower.co.jp/fee/` this pass (¥1,200 window / ¥1,500 online, 9:00–23:00, last
entry 22:30, no advance ticket, no listed regular closure), ≈15 minutes from the Ginza dinner. This
also gives Tokyo Tower a home: it was a verified sight sitting on no day at all (the 2026-08-14
japan-2 "already-verified sights went unscheduled" class). The other days' cover is recorded under
the sweep below rather than papered over with an invented refuge.

### C8 — two 4:30-ish closing times on one afternoon, only one of them stated
**Where:** `06-days.json` → Sun Oct 18; `07-sights.json` → "Meiji Jingu".
**Rubric/lens:** vibe lens — pacing arc / common sense; rubric #7.
**What was wrong:** the sight card gave Meiji Jingu's gates only as "roughly 5:00 AM–6:40 PM
depending on season", and the day card named only Shinjuku Gyoen's 4:30 PM close. Both stops are on
the same afternoon.
**Replacement (researched):** `meijijingu.or.jp/en/visit/` gives October as 5:40 AM–4:40 PM. The
sight card now states the October figure in bold, and the day card orders the afternoon —
shrine first, then the garden, with 4:00 PM (Gyoen's last entry) as the hard edge.

### C9 — three venue claims cited to pages that do not carry them
**Where:** `08-food-and-shopping.json` → Ushigoro `crowd_tip`, Ukai-tei `crowd_tip`, Kobikicho Ohno
`price`.
**Rubric/lens:** rubric #3 (provenance) — the uruguay "aggregator law applied per-venue instead of
per-claim-type" class, in its second form: a real T0 URL attached to a claim the page never makes.
**What was wrong and the replacement:** (a) Ushigoro's "reservations accepted for 1–8 people" and "11
private rooms at this branch" — the booking page it cites says "Reservations are accepted for parties
of 2–6 only. For parties of 7 or more, please contact us by phone," and lists no room count. Rewritten
to the page's own rule; six is now correctly described as the largest bookable table, not a
comfortable middle. (b) Ukai-tei's "private rooms are free of extra charge for parties of 4+" — no
fetched page says "free". Its booking form says "Private rooms are prepared when your party has more
than 4 people"; the card now says that, and the `how` field carries the 6-adult online cap.
(c) Kobikicho Ohno's "≈¥15,000/person (Gurunavi operator estimate)" — the cited page is the operator
listing and publishes no course price, only à-la-carte items (濃茶 1320円). Price removed; `how` now
carries an honest ⚠ that no fixed course price is published and that card acceptance isn't either.

### C10 — Tourist PASMO's price and where you can buy it were both wrong
**Where:** `01-plan.json` → "Local essentials"; `facts.json`.
**Rubric/lens:** rubric #3 / #11 — and vibe lens, common sense: the guide recommends Haneda, then
described the card as a Narita product.
**What was wrong:** the registry row read "¥2,000, no deposit, valid 28 days" and the panel said it
"is sold at Narita's Keisei counters". `pasmo.co.jp/tourist-pasmo/` sells the card loaded with
¥1,000–¥10,000 (the amount is the stored value, not a price), at ticket machines and information
centres at **both** Haneda (Keikyu) and Narita (Keisei).
**Replacement:** row re-keyed `tourist-pasmo-1000-to-10000-yen` with the corrected value; the panel
now names both airports and their operators.

### C11 — two `price` values were sentences, on a guide with no prose-shape baseline
**Where:** `08-food-and-shopping.json` → Kobikicho Ohno (101 chars), Uobei Genki Sushi (67 chars).
**Rubric/lens:** rubric #13 (design doctrine); `block-types.md` "a `price` is a value, never a
sentence" (`MAX_PRICE_CHARS` 60).
**What was wrong:** tokyo has no row in `prose-shape-baseline.json`, so both would register as NEW
offenders and fail the gate — the 2026-08-14 japan-2 "a new guide has no baseline, so its offences
invite a baseline bump" class. The correct move on a first-time guide is to split, never `--update`.
**Replacement:** Ohno's price removed entirely (C9); Uobei's reduced to "¥105 per plate" with the
plate-range caveat, the 90 counter seats and the cash-only rule moved into `how` — where the last of
those matters more anyway, since it is the arrival-night dinner for six.

### Rebuttals — findings considered and rejected on second look

- **"Sunday has no rain plan_b and is fully outdoor."** Not a finding. Mid-October Tokyo is not a
  named weather window (tsuyu ends in July), and `plan_b` exists for the case the day-swap advisory
  cannot serve — where no dry day exists to swap with. Sunday is tagged `env: "outdoor"` and Monday
  `env: "indoor"`, so the swap advisory fires. Inventing a refuge to fill the field would be worse
  than the honest tag pair. Recorded in the sweep as a deliberate blank.
- **"Several venues don't answer 'how do I get there'."** Marginal, left alone. Every one of them is
  addressed by a station name that is also its area name (Yotsuya-sanchome, Nishi-Shinbashi,
  Ueno–Okachimachi, Omoide Yokocho), and the guide's transit model is "tap an IC card at any gate",
  which a per-venue route line would only repeat.
- **"The guide never sets an `advisory` block."** Correct as it stands. travel.state.gov is
  Cloudflare-gated against non-browser fetching, the Health & safety panel says so in the open, and
  the Amendments log records it. An omitted schema-required field beats a guessed level.

## Citation audit

21 perishable facts sampled — weighted, per the done gate, toward prices, hours and the anchor. Every
row's own `source_url` was fetched. Six drifted and were fixed on the spot and re-dated; two were
unreachable and are flagged in the guide; thirteen support the stated value.

| Claim | Value as shipped | Source fetched | Verdict |
|-------|------------------|----------------|---------|
| RyuGin tasting course, all-in per person | ≈¥80,500 (¥70,000 + 15%) | y — nihonryori-ryugin.com `/en/menu/`, `/en/about/`, `/en/reserve/` | **drifted → fixed** — course is "77,000JPY(incl. tax)"; ¥70,000 is the same-day cancellation fee (pre-tax). All-in in a private room = ¥88,550. Registry row `ryugin-course-88550-yen`, budget line re-derived |
| RyuGin October reservations open Sept 1, 2026 | Sept 1, 2026 | y — `/en/reserve/` | supports — "Reservations for the following month are accepted from the 1st of the current month" |
| RyuGin private room seats six | Private Room 1 (6–8), Room 2 (5–8) | y — `/en/about/` | supports; same page also yielded three rules the guide had missed (no allergy bookings, no non-seafood eaters, ages 10+, max party 8) → added, see C3 |
| Shinjuku Gyoen Oct 1–Mar 14 hours, last entry, fee, Monday closure | 9:00–16:30, last entry 16:00, ¥500, closed Mondays | y — policies.env.go.jp | supports on all four |
| Meiji Jingu gate hours | "roughly 5:00 AM–6:40 PM depending on season" | y — meijijingu.or.jp `/en/visit/` | **drifted → fixed** — October is 5:40 AM–4:40 PM; the seasonal envelope hid a 4:40 PM close on a day with an afternoon visit |
| Senso-ji main hall hours | 6:00 AM–5:00 PM, 6:30 AM Oct–Mar | y — senso-ji.jp | supports ("午前6時～午後5時", "午前6時30分" Oct–Mar). Reworded so the traveller sees 6:30 applies to *this* trip |
| Tokyo Tower Main Deck price and hours | "from ¥1,500, opens 9:00 AM" | y — tokyotower.co.jp `/fee/` | **drifted → fixed** — ¥1,200 at the window, ¥1,500 booked online; 9:00–23:00, last entry 22:30 |
| teamLab Planets adult admission | ≈¥3,800 weekday / ¥4,200 weekend | y (attempted ×3) — teamlab.art serves no content to a page fetch | **unreachable → flagged** — figures kept as indicative with an explicit ⚠ in the sight card and the budget note; not re-dated |
| Tsukiji Outer Market Sunday/Wednesday closures | "two independent local accounts note roughly half the stalls close on Wednesdays as well as Sundays" | y — tsukiji.or.jp `/english/calendar/` and `/english/how-to-enjoy/`, english.metro.tokyo.lg.jp | **drifted → fixed** — this is an objective fact that had been carried on blogs. T0 chain: the outer market's calendar states its shops run on the Tokyo Central Wholesale Market calendar; that calendar closes Sundays and public holidays. Day plan moved (C1) |
| Tsukiji large-group guidance | "split into pairs or trios while browsing" | y — tsukiji.or.jp `/english/how-to-enjoy/` | supports — "Move in small numbers! ... Please refrain from moving around in large groups" |
| Toyosu Market public hours and closures | ≈5 AM–5 PM, closed Wed and most Sundays | y — english.metro.tokyo.lg.jp | supports — "5:00am-5:00pm every day ... except Sundays, public holidays and other days when the market is closed"; the 2026 grid is a download, so the ⚠ to confirm October stays |
| Tourist PASMO price and terms | ¥2,000, no deposit, 28 days, sold at Narita Keisei | y — pasmo.co.jp | **drifted → fixed** — sold loaded with ¥1,000–¥10,000, at both Haneda (Keikyu) and Narita (Keisei) machines and information centres |
| Seven Bank ATM per-withdrawal limit | ¥100,000 / ¥30,000 magnetic stripe | y — sevenbank.co.jp | supports on both figures |
| Keisei Skyliner Narita→Nippori/Ueno fare | ≈¥2,470 | y — keisei.co.jp | supports — "¥2,470"; page adds ¥2,465 by IC, now carried in the value |
| Tokyo Monorail Haneda→Hamamatsucho IC fare | ≈¥519 | y — tokyo-monorail.co.jp `/english/guidance/train_info.html` | supports — the line's maximum fare, "520 yen (paper ticket) and 519 yen (IC card)", on the Hamamatsucho routes. Source re-pointed from the site root to the fare table itself |
| Keikyu Haneda→Shinagawa fare | ≈¥327 | y — haneda-tokyo-access.com `/en/ride/fares.html` (fare table is a 3.3 MB PDF; PDF fetched, unparseable) | **unreachable → flagged** — journey times (11 min T3 / 14 min T1·2) confirmed on the page and now stated; the fare kept at `state: "approx"` with a ⚠ in the routes step telling the reader to check the gate board |
| Japan tax-free system switch date | November 1, 2026 | y — japan.travel | supports — "From November 1, 2026, the tax-free shopping system ... will be revised" |
| Ginza Ukai-tei prices, service, hours, closures | ¥27,500–38,500 + 13%, LO 19:30, closed Sun + 2 Mon/month | y — ukai.co.jp, tablecheck.com | supports on all four; the card's separate "private rooms free of extra charge for 4+" is on neither page → replaced with the booking form's own wording (C9) |
| Yakiniku Ushigoro bookable party size | "reservations accepted for 1–8 people", "11 private rooms" | y — tablecheck.com | **drifted → fixed** — "accepted for parties of 2–6 only. For parties of 7 or more, please contact us by phone"; no room count published. Courses ¥16,000–32,000 + 10% found and added (C4) |
| Aragawa October course and booking | ≈¥60,500 + 12% service, card required | y — tablecheck.com | supports — October seasonal course ¥60,500 (svc excl./tax incl.), 12% service, "Credit card required to reserve"; online booking takes 1–10 guests, now stated |
| Kobikicho Ohno seats, hours, one-party-a-day | 6-seat horigotatsu room 2–6, 17:00–21:00, one party/day, no fixed closure | y — kobikityouohno.gorp.jp | supports every structural claim ("総席数　6席", "1日1組のみのご予約", "定休日なし（不定休日あり）"), and the address/station too. The ≈¥15,000 price is on no page → removed (C9) |
| Torien seats and group capacity | "150 seats with floor rentals for 30+ people" | y — hotpepper.jp | supports — "150席", 3F private rooms for 20–30, floor rental on consultation; card now states it that way, plus LO 23:00 |
| Uobei Genki Sushi plate price and hours | ¥105 plates, 11:00–23:30 daily | y — hotpepper.jp | supports; page also gives 90 all-counter seats and no card/QR acceptance → both added, since they change how six people eat there |

#### Continuity sweep — critic execution

**Greps run** (over `src/content/guides/tokyo/*.json`): `80,500` · `70,000` · `15,000` ·
`tourist-pasmo-2000` · `1–8 people` · `11 private rooms` · `¥1,500` · `tokyotower.co.jp/en` ·
`reserve/` · `Asakusa` · `Tsukiji` · `Toyosu` · `Sunday` · `Saturday` · `Monday` · `{{fact:[a-z0-9-]*}}`.

**Ripples found and fixed:**
- The Sat↔Sun swap rippled into both days' `title`, `pace`, `tldr`, `body`, `constraints` and
  section-level `source_url`/`verified_on`/`shelf_life`; into the Monday body's "Sunday already
  covers it" back-reference; and into the venues `intro`, which now names which morning belongs to
  which market. `env` tags survive the swap unchanged (Sat mixed, Sun outdoor) and were re-checked
  against the new stop lists.
- The ¥80,500 → ¥88,550 correction rippled into the venue `price`, the budget line's `est`/`low`/
  `high`/`note`/`source_url`, and the guide-level `verified` stamp's re-check list. No stale
  `80,500` or bare `70,000` string survives the guide.
- Re-keying the PASMO registry row rippled into `01-plan.json`'s "Local essentials" token; all seven
  `{{fact:…}}` tokens were re-listed after the edit and every one resolves to a live row, with no
  orphaned rows left in `facts.json`.
- Source-URL moves rippled into `09-sources.json`: RyuGin now cites menu/about/reserve separately,
  Tokyo Tower moved `/en/` → `/fee/`, the monorail moved to its fare table, and the market paragraph
  was split out to carry the Tsukiji business-day calendar. Sources also gained the Ukai-tei booking
  form. `divergences` entries were re-read against the moved facts and none of the three is affected.
- `≈` was removed from three registry `value` strings that also carried `state: "approx"` (Skyliner,
  monorail, Keikyu) — the marker is derived from state, so those rows would have rendered "≈…≈
  approx." Skyliner and monorail are exact published figures and are now `clean`; the unconfirmable
  Keikyu fare keeps `approx`, which is what the ⚠ in the routes step is for.
- Ledger ripples: the "Coords/place_id" methodology bullet claimed no `map` coords were set, which a
  later pass had superseded — corrected, with a note that the critic sanity-checked every coordinate
  pair against its stated neighbourhood before reusing them for the map `points[]`. The Tsukiji
  candidates row's "(Sunday morning graze)" parenthetical was corrected to Saturday; the `shipped`
  verdict token is unchanged, and no shipped name was added or removed, so the funnel invariant
  (shipped ⊆ shortlist) is untouched.

**Deliberate blanks, stated rather than filled:**
- **Sun Oct 18 and Tue Oct 20 carry no `plan_b`.** Mid-October Tokyo is not a named weather window,
  and Sunday's cover is the `env` day-swap against Monday's indoor day, which is the mechanism
  designed for it. Tuesday is a departure morning of open-air grazing with no ticketed commitment to
  lose. No verifiable indoor refuge existed inside this pass's reachable source set, and inventing
  one is explicitly forbidden — so this is the honest note the rule asks for, not an omission.
- **`local_script_name` is set on four of the six map points.** Toyosu Market and RyuGin are pinned
  with coords and a Directions link only, because no authority fetched this pass printed their
  native-script names. Transliterating them from memory is what `block-types.md` forbids.

**Deferred to a human / a networked pass:**
- The **teamLab Planets price** and its **October maintenance calendar** need a real browser —
  teamlab.art returns nothing to a page fetch. Flagged in the guide, in the `verified` stamp, and
  here.
- The **Keikyu Haneda–Shinagawa fare** needs the operator's PDF fare table read by a human or the
  gate board itself.
- The **US State Department advisory level** remains unset for the reason the prior pass recorded
  (Cloudflare-gated); no `advisory` block was invented.
- **`traveler-origin`** is correctly absent — the intake's departure-airport field is blank, and the
  2026-08-14 japan-2 precedent says a reserved row whose intake field is blank should be absent, not
  populated.
