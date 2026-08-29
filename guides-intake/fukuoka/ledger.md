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

| Item | Pass A (canonical) | Pass B (local/authentic) | Reconciled → guide | Note (conflict / crowd / novel) |
|------|--------------------|--------------------------|--------------------|---------------------------------|
| — | Pass A complete (this run) | Not yet run | — | Awaiting Pass B; this table fills at the Reconcile stage. |

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
| Ichiran (Nakasu Souhonten) | shipped | y |
| Ippudo (Daimyo Honten) | shipped | y |
| Shin Shin (Tenjin) | rejected: no official website found; hours only aggregator/press-sourced, couldn't reach T0 this pass | y |
| Motsunabe Rakutenchi (Hakata Ekimae) | shipped | y |
| Fukuya (Nakasu main store, mentaiko) | shipped | y |
| Daichan / Gion Daichan (yatai udon) | shipped | y |
| Inaba Udon | rejected: official page names it as historic but publishes no address/hours — couldn't answer where/when/book | y |
| Itoshima oyster huts (kaki-goya, seasonal) | shipped (general seasonal mention, no single operator named) | y |
| Shiki no Chaya (Shiraito Falls restaurant, yamame trout) | shipped | y |

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

### Priority 3: Nature / outdoors

| Candidate | Verdict | Shortlist |
|-----------|---------|-----------|
| Ohori Park | shipped | y |
| Sakurai Futamigaura (Keya no Oto torii) | shipped | y |
| Shiraito Falls | shipped | y |
| Nokonoshima Island Park | shipped | y |

**Saturation note:** across four parallel research batches (logistics/entry/money/health, transit, Dazaifu/Itoshima sights, Fukuoka food/yatai), later searches within each topic converged on the same core set of official sources and named venues rather than surfacing new serious contenders. Full record in `evidence.v2.json`'s `saturation` block.

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
