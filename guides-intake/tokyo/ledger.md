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
- **Coords/place_id**: not set on any sight/venue `map` field this pass rather than guess from memory — an honest gap, not a guessed pin. A future pass with script access should backfill.
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
| Tsukiji Outer Market | shipped (Sunday morning graze) |
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
