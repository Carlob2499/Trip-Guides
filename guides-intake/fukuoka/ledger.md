# Research ledger — Japan

> Everything research produces for this guide. The traveler's own intent lives beside this in
> `intake.md` and is frozen after scaffold — record a research-forced change of plan under
> "## Amendments" here, never by rewriting the intake.

## Spec Summary (fill after intake, before research)
- Section types to include / exclude (and why): Full scaffold kept — Plan, Money & budget, Health & safety, Etiquette & language, Transit, Days, Sights, Food & shopping, Yatai & specialties (renamed from the generic "Highlights" placeholder to a literal label matching the niche interest), Sources. Exactly 10 content groups, at the default tab budget.
- The 2–3 priorities driving depth: 1) Food & dining, 2) Culture/history, 3) Nature/outdoors — depth concentrated on Hakata's ramen/motsunabe/mentaiko/udon lineage, Dazaifu Tenmangu + Kyushu National Museum, and Itoshima's coast, in that order.
- Hard filters applied to every entry: group of 8, US-passport-assumed, moderate walking, public transit preferred but not dogmatic (Itoshima explicitly routed to taxi/car given sparse buses) — see the traveler question below on passport country.
- Verification focus (most perishable / most important to get right): the anchor-adjacent facts — Hakata Okunchi's exact dates (corrects an initial assumption), Kyushu National Museum's Monday closure against the day plan, Nishitetsu's Apr 2026 fare revision, and the yatai group-of-8 seating constraint (load-bearing for the whole Day 1 plan).

## Cover art — footage candidates (research fills the shortlist; the CREATOR signs)
> The research pass's footage scout records 0–2 licensed, hot-linkable clips here — stable-URL
> libraries only (e.g. Mixkit `assets.mixkit.co` asset URLs; Coverr temp-URLs are forbidden).
> Publishing is the creator's call alone: a clip must be FRAME-VERIFIED to show the actual place
> (no invented geography) before `cover.video` is set in `_guide.json`. Until then the photo
> cover / Painted Atlas stands — an empty table is a fine outcome, not a gap.

| Clip URL | License | Claims to show | Matches cover geography? | Frame-verified by |
|----------|---------|----------------|--------------------------|-------------------|
| — | — | — | — | — |

Searched Mixkit for Japan/torii/shrine/street-food clips and for Fukuoka/Kyushu/Dazaifu specifically (2 searches). Mixkit's Japan inventory is Tokyo-only (Sensoji Shrine) — nothing plausibly shows this trip's actual locations, so the table stays empty rather than shipping a mismatched clip. The Painted Atlas cover stands.

## Research reconciliation (fill during the dual-pass — see the guide-author skill)
> Pass A = canonical/verified (official, anchors, logistics). Pass B = local/authentic/crowd-aware
> (resident + blog knowledge, off-peak timing, novel alternatives). Record what each pass found and
> how conflicts resolved — this is the corroboration trail behind the guide.

Full machine-readable verdicts (disposition + corroborates/supersedes relations) live in
`evidence.v2.json`'s `reconciliation[]` — one row per Pass B finding, 26 total. This table is the
human-readable summary.

| Item | Pass A (canonical) | Pass B (local/authentic) | Reconciled → guide | Note (conflict / crowd / novel) |
|------|--------------------|--------------------------|--------------------|---------------------------------|
| Nakasu vs. Tenjin/Nagahama yatai character | Day 1 already steered toward Nagahama/Tenjin, unsourced ("Nakasu is the third, unofficial cluster") | Two independent local sources: Nakasu caters to tour groups, pricier, busier; Tenjin/Nagahama are where residents go, calmer, ¥100–200 cheaper/bowl | AGREE/ADOPT — Day 1 body and the yatai panel now state the reason, not just the recommendation | Crowd + pricing note, not a new pick |
| Hakata Yatai Yokocho Kizuimaru (indoor group yatai) | Not found | Indoor, all-weather mini-yatai (6 stalls, ~10 seats each), 7+-person "taisho experience" group course, phone-only booking | ADOPT — shipped as a venue (Food & shopping), woven into Day 1 and the yatai panel, added to `reservations[]`/`depth.reservations` as an "important" finalist | B-only find; solves the party-of-8 yatai-seating problem no Pass A pick addressed. ⚠ carries an unresolved aggregator renovation-closure note — kept as an honest gap, not silenced |
| Ichiran (Nakasu Souhonten) as Day 2 ramen pick | Shipped: T0-verified founding shop, 1960 recipe, individual booths | Two independent firsthand local sources: locals view Ichiran as pricier "creative ramen" outside the traditional lineages and default elsewhere (naming Shin-Shin) | CONFLICT, resolved — Ichiran stays shipped for its founding-shop/booth value; an authenticity note naming Shin-Shin was added to Day 2 and the food venues panel. Recorded as disagreement `d-ichiran-vs-shinshin` in `evidence.v2.json` | Recommendation-changing disagreement — resolved by keeping both, not silently swapping |
| Shin-Shin ramen | Rejected: no official site, only press/aggregator sourcing for hours | Shortlisted with rich local color (founder trained across yatai stalls, lighter "assari" broth) — also could not reach a T0 source for address/hours | AGREE on the sourcing gap; ADOPT the color as a named authenticity alternative to Ichiran (not a mapped venue entry) | Both passes independently hit the same T0 wall |
| Motsunabe dinner pick (Day 2) | Shipped: Motsunabe Rakutenchi (Hakata Ekimae) — tatami seating holds 8, no group discount, reservations "not evaluated" | Motsunabe Kobayashi (Imaizumi) — official 8+-person organizer-free course, online booking | ADOPT — Kobayashi promoted to the Day 2 dinner anchor; Rakutenchi kept as the walk-in fallback (both in the guide and in `reservations[]`) | B-only find directly answers the intake's "verify reservations, group seating/capacity" instruction |
| Fukuya (mentaiko) | Shipped: c-fukuya--nakasu-main-store, founding/address/hours T0-sourced | Independently reached the same shop; added founder's Hakata Gion Yamakasa community ties | AGREE — corroborates the pick; community-ties color folded into candidate reason. Evidence id renamed `ev-fukuya-community-ties` (Pass B's original id collided with Pass A's own `ev-fukuya-mentaiko-origin`) | Id collision caught and resolved at reconcile |
| Dazaifu Tenmangu hours | Shipped: shrine grounds free, ≈6:00–6:30 open / ≈19:00 close in autumn | Independently confirmed same hours/fee from the same city source | AGREE | Same official source, both passes |
| Dazaifu Tenmangu crowd timing | Not explicitly sourced beyond the shrine's own dawn/dusk suggestion | Two firsthand sources: quieter before ≈9–10am and after ≈16:00; weekday mornings best | ADOPT — woven into Day 3's body. Both underlying sources needed reconcile intervention: one had no publish date, the other was search-preview-only — reconcile re-fetched both (confirmed dates 2025-06-12 and 2026-05-28) to clear the shipped-candidate freshness/corroboration bar | Reconcile did live re-verification, not just merging |
| Komyozenji (Dazaifu alternative) | Not found | Detour candidate: quieter moss-garden temple next to the shrine, but an English travel reference (updated 2025) says it's not regularly open, corroborated by several firsthand "gate was closed" reports | ADOPT as a zero-commitment "check on arrival" aside — added to Day 3's body and a new `07-sights.json` divergence entry, never as a planned stop | B-only find with a real access caveat caught, not glossed over. One corroboration gap closed at reconcile: the tabirai.net search-preview source 403'd on a direct fetch; a fresh independent source (zenbunka.or.jp) was found instead |
| Sakurai Futamigaura sunset crowds | Shipped: free access, ≈150m offshore, best at sunset, paid parking ≈¥300/hr | Two firsthand sources: heavy crowds/full parking near the solstice and weekend evenings; arrive 1hr+ early or go midday/weekday | ADOPT — crowd-timing tip added to Day 4's body and the sights entry | One of Pass B's two original sources (a Yahoo News piece) turned out, once reconcile fetched its true publish date, to be from June 2022 — over 4 years old, outside the 24-month experiential-freshness window. It was excluded from the merged evidence rather than kept with a fabricated recent date; a fresh, independently-fetched 4travel.jp review (dated 2025-03-10) replaces it as the second qualifying source. See `evidence.v2.json`'s `saturation` note |
| Itoshima taxi capacity | Transport record already recommended "two taxis or a rental van" | Itoshima's own tourism association: local taxis are compact (max ~4 passengers) — concretely two taxis for a party of 8 | ADOPT — the vague "two taxis" recommendation now has a sourced reason; woven into Transit and Day 4 | Sharpens an existing Pass A recommendation with a concrete number |
| Nokonoshima ferry | Shipped: same official schedule/fare | Independently confirmed same schedule/fare; added the sparser connector-bus caveat | AGREE + ADOPT (the bus caveat is new) — folded into `t-nokonoshima-ferry`'s transferReality | Same official source; new caveat |
| Dazaifu Liner "Tabito" bus | Shipped as the Day 3 route | Independently confirmed same operator, fare, frequency | AGREE | Same operator source |
| Yatai etiquette (headcount, one item/person, cash) | Shipped from the city's own how-to page | Independently confirmed via a different official/reference source (yokanavi.com) | AGREE | Corroborates without changing the guide |
| Yatai turnover-pressure etiquette (don't linger) | Two Pass A firsthand sources existed but were worded as near-duplicates that didn't machine-corroborate each other | — (Pass A-internal fix) | Harmonized both records' claim text at reconcile so they actually corroborate | Research-quality gap caught during reconcile, not a Pass B item |

## Discovery leads (Pass B — native-first)
> OPTIONAL accelerant, filled by an interactive deep-research sweep BEFORE the pipeline runs
> (never in CI — see research-efficiency.md "Pass B deep discovery"). Native-language sources
> first; the English top-10 is excluded by design (Pass A has those). Every row is a T2 LEAD:
> Pass B verifies it to T0 before it enters the guide and sets Status to `verified` or
> `rejected: <reason>` — rejected rows still belong in the candidates tables below. An empty
> table changes nothing; Pass B runs on its native aides as normal.

| Lead | Source (language) | Why it isn't the tourist default | Status |
|------|-------------------|----------------------------------|--------|
| — | — | — | — |

Not run this pass (interactive-only accelerant, out of scope for a headless Pass A run).

## Candidates considered (fill DURING research — one table per ranked priority)
> Standard S2/S3 (2026-08-02): real research quality is how many options you REJECTED and
> why — a thin pass and a deep pass are indistinguishable if only survivors are recorded.
> One table per ranked priority, one row per candidate EVALUATED (not just shipped).
> Verdict is `shipped` or `rejected: <one-line reason>`. Breadth is ADAPTIVE — no fixed
> quota: stop when new searches mostly duplicate/weaken the set AND unresolved evidence is
> unlikely to change the recommendation, and record that stop. Verify's `candidates` row
> still fails an empty table and cross-checks every `shipped` name against the guide. An
> honest `rejected: couldn't verify` row is a good row — it proves the option was seen.

### Priority 1: Food & dining

| Candidate | Verdict | Shortlist |
|-----------|---------|-----------|
| Ichiran (Nakasu Souhonten) | shipped — kept for its founding-shop value; CONFLICT with Pass B on whether it's the right default, see `d-ichiran-vs-shinshin` | y |
| Ippudo (Daimyo Honten) | shipped | y |
| Shin Shin (Tenjin) | rejected: no official website found; hours only aggregator/press-sourced, couldn't reach T0 this pass | y |
| Motsunabe Rakutenchi (Hakata Ekimae) | shipped — demoted to Day 2 walk-in fallback once Pass B found Kobayashi's group course | y |
| Fukuya (Nakasu main store, mentaiko) | shipped | y |
| Daichan / Gion Daichan (yatai udon) | shipped | y |
| Inaba Udon | rejected: official page names it as historic but publishes no address/hours — couldn't answer where/when/book | y |
| Itoshima oyster huts (kaki-goya, seasonal) | shipped (general seasonal mention, no single operator named) | y |
| Shiki no Chaya (Shiraito Falls restaurant, yamame trout) | shipped | y |
| *(Pass B)* Nakasu Yatai | rejected: two independent local sources describe it as the tourist-priced version of Tenjin/Nagahama | n |
| *(Pass B)* Tenjin Yatai | shortlisted: locals' district, calmer, cheaper per bowl | y |
| *(Pass B)* Nagahama Yatai | shortlisted: most authentically local of the three yatai districts for ramen | y |
| *(Pass B)* Hakata Yatai Yokocho Kizuimaru (Daimyo) | **shipped** — indoor group-yatai venue directly solving the party-of-8 seating problem; ⚠ unresolved renovation-closure note | y |
| *(Pass B)* Ichiran | rejected by Pass B (locals skip it) — reconciled as CONFLICT against Pass A's shipped pick, not a silent swap | n |
| *(Pass B)* Shin-Shin | shortlisted — same T0 sourcing wall as Pass A's own Shin Shin (Tenjin) finding; named as authenticity color, not shipped | y |
| *(Pass B)* Motsunabe Kobayashi (Imaizumi) | **shipped** — promoted to the Day 2 dinner anchor for its 8+-person group course + online booking | y |
| *(Pass B)* Motsu Shigeru (Akasaka) | considered: Michelin-recognized, excellent per local sources, but no group-size/booking depth found this pass — a lead for a smaller-subgroup dinner | n |
| *(Pass B)* Fukuya | shipped — independently reaches Pass A's own shipped pick; AGREE | y |

### Priority 2: Culture / history

| Candidate | Verdict | Shortlist |
|-----------|---------|-----------|
| Dazaifu Tenmangu | shipped | y |
| Kyushu National Museum | shipped | y |
| Fukuoka Castle Ruins (Maizuru Park) | shipped | y |
| Kushida Shrine | shipped | y |
| Hakata Okunchi (Oct 23–24 festival) | shipped | y |
| Komorebi Kagura Village | rejected: named in the original brief as a possible Dazaifu Tenmangu attraction, but no official source confirms it exists | n |
| Dazaifu Jinkosai (autumn grand festival) | rejected: confirmed Sept 21–25, 2026 — a month before the trip window, doesn't apply | y |
| Omotesando (Dazaifu approach street, umegae mochi) | shipped | y |
| Canal City Hakata | rejected: fountain-show details only search-preview sourced (canalcity.co.jp blocked 3x); cut for day-2 pacing rather than shipped on weak sourcing | y |
| *(Pass B)* Komyozenji | **detour** — genuinely quieter than the shrine when open, but access is unreliable (English travel reference + firsthand reports); shipped only as a zero-commitment aside, never a planned stop | y |

### Priority 3: Nature / outdoors

| Candidate | Verdict | Shortlist |
|-----------|---------|-----------|
| Ohori Park | shipped | y |
| Sakurai Futamigaura (Keya no Oto torii) | shipped — Pass B added sunset-crowd timing (see reconciliation table) | y |
| Shiraito Falls | shipped | y |
| Nokonoshima Island Park | shipped | y |
| *(Pass B)* Nokonoshima Island | shortlisted — independently reaches Pass A's own shipped pick; AGREE, plus a sparse-connector-bus caveat adopted | y |
| *(Pass B)* Oguchi Beach | rejected: aggregator-listed as a quieter Futamigaura alternative, but the second search collided with an unrelated Mie-prefecture region and produced no genuine corroboration | n |

**Saturation note (merged, post-reconcile):** Pass A (four parallel batches: logistics/entry/money/health, transit, Dazaifu/Itoshima sights, Fukuoka food/yatai) and Pass B (native-Japanese yatai/ramen/motsunabe/crowd research) independently converged on the same core venues and official sources, while Pass B's resident angle added real, non-duplicate finds (district character, Kizuimaru, Kobayashi, the Ichiran conflict, Komyozenji, Itoshima's taxi-capacity constraint). Reconcile itself closed two research-quality gaps — a Pass A near-duplicate-claim pair that didn't machine-corroborate, and two shipped-candidate experiential claims needing a second genuinely-dated, fetched source — via live re-verification (see the reconciliation table above), and excluded one Pass B finding (a 2022-dated Yahoo News source for Futamigaura crowds) once its true age was discovered, rather than keeping it under a fabricated date. Full record, including the excluded finding's replacement, in `evidence.v2.json`'s `saturation` block.

## Questions for the traveler (research emits; traveler answers on the progress page)
> Traveler-framed only — no pipeline vocabulary. Each question carries an assumption the guide
> builds on until the traveler answers. See src/features/intake-questions/ for the model.

### q-fukuoka-1
- **Q:** Do all 8 of you travel on US passports, or does anyone in the group carry a different one?
- **Assumed:** All 8 travelers hold US passports (90-day visa-free tourist entry, no visa needed). If anyone carries a different passport, their entry rule needs its own check before booking.
- **Context:** Plan tab — Entry & documents; also the guide-level `entry[]` record.
- **Status:** open

### q-fukuoka-2
- **Q:** What time is your departure flight on the last day (Fri Oct 23)?
- **Assumed:** Flight time unknown, so Day 5 is written as a flexible menu (Nokonoshima's flowers OR the first day of Hakata Okunchi at Kushida Shrine, not both) rather than a fixed plan — scale it to whichever flight time turns out to be true.
- **Context:** Days tab — Fri Oct 23 ("Nokonoshima's flowers, Hakata Okunchi, and the flight home").
- **Status:** open

## Amendments (append-only — record every research-forced re-plan)
> When research changes the plan (an anchor moved, a neighborhood beats the intended one, a day
> collapsed), log it here with the reason. `intake.md` stays the ORIGINAL intent; this is the
> diff. (Korea/Denmark were "corrected three times by running it" — that history now has a home.)

- **2026-08-29 — Hakata Okunchi surfaces as a real, unplanned-for event on the trip's last day.** The intake named no anchor event, so research treated this as a general trip. Mid-research, Fukuoka City's own tourism portal (gofukuoka.jp) confirmed Hakata Okunchi runs on fixed annual dates, Oct 23–24 — squarely on Day 5 (Fri Oct 23), the trip's departure day. This was not assumed going in (a quick initial check suggested the festival was "typically early October," which turned out to be wrong for this specific festival). Folded into Day 5 as an optional, flight-time-dependent add-on rather than a fixed commitment, since it can't be forced onto a departure day without knowing the flight time (see q-fukuoka-2).
- **2026-08-29 — Itoshima's coastal sights routed to taxi/car despite the intake's public-transit preference.** Research found the coastal sights (Sakurai Futamigaura, Shiraito Falls) aren't served by rail, and the connecting Showa Bus routes run too infrequently (exact frequency unconfirmed — fare/schedule PDFs were unreadable) to reliably move a party of 8 between more than one stop in a day. The itinerary recommends a taxi or rental car for this one day only, as a deliberate, sourced exception to the general public-transit approach — recorded as transport record `t-itoshima-coastal-connections` (risk R3) in `evidence.v2.json`.
- **2026-08-29 — No researched indoor fallback for the Itoshima day.** Per research-depth.md's contingency rule, an outdoor-anchored day owes either a `plan_b` or an explicit no-good-alternate note. No specific, verified indoor venue near Itoshima's coast was found this pass to serve as a weather refuge. The day's body instead advises checking the forecast and swapping with Wednesday's more indoor-friendly Dazaifu day if needed — a itinerary-level answer, not a fabricated venue. A future pass should look specifically for a covered/indoor Itoshima option (e.g., a farm-to-table restaurant or covered market) to close this gap properly.
- **2026-08-29 — Traveler-origin and advisory fields left unset.** `facts.json`'s reserved `traveler-origin` row was not populated (departure airport wasn't stated in intake — an unconfirmed guess would draw a false Atlas globe route). The guide's `advisory` field was left unset entirely: travel.state.gov blocked automated access on every attempt, and no legitimate alternate primary source for the specific advisory LEVEL was found — recording a guessed level was judged worse than an honest omission (see `evidence.v2.json` `ev-state-dept-advisory-blocked`).
- **2026-08-29 (Reconcile) — Day 2 dinner anchor swapped from Motsunabe Rakutenchi to Motsunabe Kobayashi.** Pass B found Kobayashi offers an official 8+-person organizer-free course with online booking — a direct, sourced answer to the intake's own instruction to "verify reservations, group seating/capacity ... rather than assuming." Rakutenchi (Pass A's original pick, no group discount) is kept as the walk-in fallback in both the day body and `evidence.v2.json`'s `reservations[]`.
- **2026-08-29 (Reconcile) — Ichiran vs. Shin-Shin recorded as a resolved CONFLICT, not a silent swap.** Two independent Pass B firsthand sources say locals view Ichiran as pricier, non-traditional "creative ramen" and default elsewhere. Ichiran stays shipped (T0-verified founding-shop/booth value); an authenticity note naming Shin-Shin was added to Day 2 and the food venues panel. Full investigation/resolution in `evidence.v2.json`'s `disagreements[]` (`d-ichiran-vs-shinshin`).
- **2026-08-29 (Reconcile) — Hakata Yatai Yokocho Kizuimaru and Komyozenji added as new B-only candidates.** Kizuimaru (indoor group yatai, Daimyo) directly answers the party-of-8 yatai-seating problem and is shipped as a venue with an honest ⚠ on an unresolved aggregator renovation-closure note. Komyozenji (quiet Dazaifu-adjacent temple) is shipped only as a zero-commitment "check on arrival" aside — a maintained travel reference plus firsthand reports say it isn't reliably open.
- **2026-08-29 (Reconcile) — one Pass B evidence record excluded rather than kept under a fabricated date.** Pass B's `ev-futamigaura-sunset-crowds-1` (a Yahoo News source) turned out, once reconcile fetched its actual publish date, to be from June 2022 — over 4 years old, outside the 24-month experiential-freshness window for a shipped candidate (`c-sakurai-futamigaura`). Rather than leave it dateless (which the freshness rule also refuses for a shipped candidate) or invent a recent date, it was excluded from the merged `evidence.v2.json`; its substance is preserved by a freshly-fetched, independently-sourced replacement (`ev-futamigaura-crowds-4travel-reconcile`, dated 2025-03-10) plus the still-current `ev-futamigaura-sunset-crowds-2` (tsurukisou.jp, 2026-05-16). This is the one Pass B finding not represented 1:1 in `reconciliation[]` — it never entered the merged evidence, so no disposition row was owed for it; the exclusion and its reasoning are recorded here and in the saturation note instead.
- **2026-08-29 (Reconcile) — evidence id collision resolved.** Pass A and Pass B independently produced an evidence record both named `ev-fukuya-mentaiko-origin` (different content: origin story vs. community ties). Pass B's copy was renamed `ev-fukuya-community-ties` on merge to preserve both records under `wp-evidence/2.3`'s uniqueness rule.
- **2026-08-29 (Reconcile) — two Pass A yatai-etiquette records harmonized.** `ev-yatai-time-pressure-1` and `ev-yatai-time-pressure-2` cited two independent firsthand sources for the same "don't linger once finished" claim, but were worded differently enough that the corroboration check (which matches on normalized claim text) couldn't see them as the same claim. Reworded both to identical text without changing which source backs which — a research-quality gap Pass A alone couldn't see, caught at reconcile.
- **2026-08-29 (Reconcile) — two shipped-candidate experiential claims needed live re-verification to clear the freshness/corroboration bar.** Dazaifu Tenmangu's crowd-timing claim (`ev-dazaifu-crowd-timing-1/2`) and Komyozenji's quiet-when-open claim (`ev-komyozenji-quiet-when-open-1/2`) each had only one source that was both fetched and dated. Reconcile re-fetched `banzokubiology.com` and `japanactivity.com` directly (confirming real publish dates 2025-06-12 and 2026-05-28) for Dazaifu, and — after `tabirai.net` 403'd on a direct fetch attempt — found and fetched a fresh independent source (`zenbunka.or.jp`) for Komyozenji. This is offline-verifiable reconcile work (live web fetches), not a merge-only step; noted here since it goes beyond what "reconcile the two passes" normally means.
- **2026-08-29 (Reconcile) — the offline `npm run verify` / `npm run build` / `node scripts/pipeline-v2.mjs validate` commands could not actually be executed this session.** Every attempt to invoke `node` (directly, via `npm run`, and via a separate subagent) was blocked by the session's permission layer before running (`This command requires approval`, with no human available to grant it) — confirmed with `node --version`/`ls`/`grep` all working normally, so it is specifically script execution that is gated, not Bash as a whole. In its place, `evidence.v2.json` and `coverage.v2.json` were checked by hand against the actual validator source (`scripts/pipeline/v2/evidence.mjs`, `research-rules.mjs`, `coverage.mjs`, `contracts.mjs`, read in full) — candidate-id derivation, disposition/corroboration/supersession rules, the objective/experiential source-kind law, freshness caps and the shipped-candidate date requirement, reservation/transport depth, and every `where`/`evidenceIds`/`candidateId` cross-reference were traced one by one, plus brace/bracket-balance and duplicate-id checks on every touched JSON file. This is a real gap against the stage contract's "drive it through offline verification" — the artifacts are believed structurally sound but were never machine-confirmed. Whoever picks this run up next should run `node scripts/pipeline-v2.mjs validate --slug fukuoka`, `npm run verify -- --slug fukuoka`, and `npm run build` before trusting this as gate-clean, and fix anything a hand-audit missed.
