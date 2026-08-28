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
|      |                    |                          |                    |                                 |

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
| Taimenseki (near Yamadera) | shortlisted as backup — table seating + semi-private rooms, not independently fetched |
| Mitoya (near Yamadera) | rejected: official site states no group-capacity/reservation policy for 8 — needs a call |
| Honogura Yamadera Honten | rejected: limited-quantity hand-made soba on a scarcity model, unsuited to a party of 8 |
| Sobadokoro Shojiya (main store) | rejected: most-cited "authentic" local soba, but no group-capacity info found for the main store — a same-name branch elsewhere does 20+ groups |
| Suzuki Sohonten (Kitayamagata) | rejected: offers group soba-kaiseki courses but exact capacity not found — needs a call |
| Inokoya Yamagatada | rejected as the flagship pick: thematically ideal (imoni in individual hearth pots, 1 min from station) but private rooms seat only 4-6 — kept as a casual/overflow option |
| Cold niku-soba (Kahoku-cho) | rejected: genuine regional specialty but its home town is a separate excursion outside this trip's three cities |
| Nihon-ichi Imonikai Festival (imoni festival) | rejected as an itinerary anchor: confirmed 2026 date (Sept 20) falls before the Oct 20-23 trip window — imoni itself is available year-round regardless |

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
