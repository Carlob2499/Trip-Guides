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

### Anchor event: the consequential public-transport transfer

| Candidate | Verdict | Shortlist |
|-----------|---------|-----------|
| Hinomaru Bus, Kurayoshi Station ↔ Misasa Onsen (Kamii-Misasa/Misasa Line 72/73) | shipped — official schedule fetched, midday gap up to ~100min, last weekday departure 19:08, genuinely consequential for a party of 8 with luggage and 2 low-mobility travelers | y |
| Taxi, Kurayoshi Station ↔ Misasa Onsen | shipped as the bus's fallback only, not a standalone anchor — ≈20min, only fare figure found dates to 2009 and is flagged unconfirmed | y |

### Priority 1: Culture / history

| Candidate | Verdict | Shortlist |
|-----------|---------|-----------|
| Tottori Sand Dunes | shipped — free, official confirmation of no admission fee | y |
| Sand Museum | shipped — hours/price/current exhibition fetched from operator | y |
| Uradome Coast — San'in Matsushima sightseeing cruise | shipped — official operator schedule/fare fetched; resolved a fare discrepancy against a second page from the same operator (see disagreement d-cruise-fare) | y |
| Kurayoshi Shirakabe Dozo-gun | shipped — free warehouse district, access + info center confirmed | y |
| Sanbutsu-ji / Nageiredo climb | shipped, tagged worth-the-effort — National Treasure hall, official rules (2-person minimum, footwear, weather cancellation) fetched | y |
| Nageiredo Yohaijo (viewing platform) | shipped — the accessibility answer for the 2 low-mobility travelers; free, weather-independent, official confirmation of completion/parking | y |
| Tottori Castle Ruins (Kyusho Park) | shipped — free park; folded in the finding that Jinpukaku itself is closed | y |
| Jinpukaku | rejected: closed for preservation work Dec 2023–~2028, exterior currently sheeted; only the garden/teahouse on the same grounds remain open (folded into the Castle Ruins entry instead of shipping standalone) | y |
| 20th Century Pear Museum | rejected: thin connection to the trip's ranked priorities; time better spent at Sanbutsu-ji given the party's pace budget | n |
| Mount Daisen | rejected: 90min–2hr outside the compact Tottori–Kurayoshi–Misasa loop; would eat a full day this 4-day balanced-pace trip doesn't have | n |

### Priority 2: Food & dining

| Candidate | Verdict | Shortlist |
|-----------|---------|-----------|
| Yakiniku Masashige (Kurayoshi) | shipped — Tottori Wagyu, official hours/price/room-capacity fetched; resolved a real party-of-8 booking-capacity disagreement (see d-masashige-party-size) — this is the trip's party-size feasibility decision the intake asked for | y |
| Menya Hachibee (gyukotsu ramen) | shipped, flagged — Michelin-noted local specialty; hours/closed-day could not be confirmed against a qualifying primary source, shipped with ⚠ | y |
| Kanikichi (かに吉) | rejected: tourist-oriented crab specialist in central Tottori, and moot anyway — matsuba-gani season doesn't open until Nov 6, after this trip | n |
| Iwamoto Shokudo (Kurayoshi yoshoku) | rejected: redundant with the wagyu pick for the trip's one Kurayoshi dinner slot; kept as a lead for a longer future visit | y |

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

- (none yet)
