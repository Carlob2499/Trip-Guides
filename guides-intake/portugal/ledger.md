# Research ledger — Portugal

> Everything research produces for this guide. The traveler's own intent lives beside this in
> `intake.md` and is frozen after scaffold — record a research-forced change of plan under
> "## Amendments" here, never by rewriting the intake.

## Spec Summary (fill after intake, before research)
- Section types to include / exclude (and why): standard backbone (Plan · Money & budget · Health & safety · Etiquette & language · Transit · Days · Sights · Food & shopping · Sources) — 9 groups, no trip-specific anchor tab needed (no anchor event stated).
- The 2–3 priorities driving depth: Food & dining (1), Culture/history (2), Nature/outdoors (3, thin by geography — Lisbon/Porto/Sintra is fundamentally an urban-and-palace trip; Monserrate's gardens are the one strong nature-forward pick).
- Hard filters applied to every entry: none stated in intake (no dietary/mobility/sensory constraints given — the constraint fields were left blank, meaning none were stated, not that none exist).
- Verification focus (most perishable / most important to get right): the anchor-adjacent facts — Pena Palace's mandatory timed entry and the "closed Tuesdays" myth, Belém Tower's new post-2026-reopening capacity cap, Jerónimos' current €18 price, Aerobus's 2022 discontinuation, and ETIAS's unresolved 2027 launch window.

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

### Priority 1: Food & dining

| Candidate | Verdict | Shortlist |
|-----------|---------|-----------|
| Pastéis de Belém | shipped | y |
| Manteigaria | shipped | y |
| Time Out Market Lisboa | shipped | y |
| A Ginjinha do Rossio | shipped | y |
| Mercado do Bolhão | shipped | y |
| Café Santiago | shipped | y |
| Brasão (Aliados, Porto) | rejected: hours/price only confirmed via aggregator snippets — no official page fetched successfully | y |
| Cufra (Porto) | rejected: official domain identified (cufra.pt) but never fetched — aggregator-only | y |
| Sandeman (Vila Nova de Gaia) | shipped | y |
| Taylor's (Vila Nova de Gaia) | shipped | y |
| Graham's (Vila Nova de Gaia) | rejected: official site returned HTTP 403 on every attempted URL | y |
| Cálem (Vila Nova de Gaia) | rejected: official fetch returned only contact info, no hours/price | y |

### Priority 2: Culture / history

| Candidate | Verdict | Shortlist |
|-----------|---------|-----------|
| Belém Tower | shipped | y |
| Jerónimos Monastery | shipped | y |
| São Jorge Castle | shipped | y |
| Tram 28 | shipped | y |
| Praça do Comércio | shipped | y |
| MAAT | shipped | y |
| Alfama | shipped | y |
| LX Factory | shipped | y |
| Pena Palace | shipped | y |
| Quinta da Regaleira | shipped | y |
| Moorish Castle | shipped | y |
| National Palace of Sintra | rejected: lower priority than Pena Palace + Regaleira within one balanced day | y |
| Livraria Lello | shipped | y |
| Torre dos Clérigos | shipped | y |
| Sé do Porto | shipped | y |
| Dom Luís I Bridge | shipped | y |
| São Bento train station | shipped | y |
| Ribeira | shipped | y |
| Porto Card | considered: pulled from sale since Jul 2026, no relaunch date — not recommended to buy yet | y |
| Lisboa Card | considered: priced and covered, but only pays off on 3+ paid-entry days — this itinerary spreads sights out, so not a blanket recommendation | y |

### Priority 3: Nature / outdoors

| Candidate | Verdict | Shortlist |
|-----------|---------|-----------|
| Monserrate Palace and gardens | shipped — the strongest nature-forward pick this destination offers | y |
| Cabo da Roca | rejected: the Sintra day is already anchored by Pena Palace + Regaleira; reaching continental Europe's westernmost point needs a second Sintra day this itinerary doesn't budget for | y |

> Nature/outdoors is honestly thin for this trip shape — Lisbon/Porto/Sintra is a city-and-palace itinerary, not a nature destination, and the intake didn't name a specific outdoor interest (hiking, beaches, etc.) to research toward. Monserrate's gardens are the one strong fit; a future pass could look at Sintra-Cascais Natural Park or a Douro Valley day trip if the traveler confirms interest in extending the nature priority.

## Questions for the traveler (research emits; traveler answers on the progress page)
> Traveler-framed only — no pipeline vocabulary. Each question carries an assumption the guide
> builds on until the traveler answers. See src/features/intake-questions/ for the model.

### q-portugal-1
- **Q:** How would you like to split your 10 days between Lisbon and Porto, and would you rather fly into one city and home from the other, or fly round-trip through a single airport?
- **Assumed:** 5 nights based in Lisbon (including the Sintra day trip), 4 nights in Porto, flying open-jaw — into Lisbon (LIS), home from Porto (OPO) — since TAP Air Portugal flies both routes direct from Newark, which avoids backtracking to Lisbon just to fly home.
- **Context:** Sets the whole day-by-day plan (06-days.json) and the departure-day logistics.
- **Status:** open

### q-portugal-2
- **Q:** Sintra's Moorish Castle and Cabo da Roca (the westernmost point of mainland Europe) are both reachable from Sintra but didn't fit the single day trip planned — would you want a second Sintra day, or are Pena Palace and Quinta da Regaleira enough?
- **Assumed:** One Sintra day covering Pena Palace + Quinta da Regaleira, with the Moorish Castle as a time-permitting add-on and Cabo da Roca left out entirely — a second full Sintra day would mean cutting a Lisbon or Porto day instead.
- **Context:** Day 4 (Tue Apr 13) and the nature/outdoors priority, which is otherwise thin for this trip shape.
- **Status:** open

## Amendments (append-only — record every research-forced re-plan)
> When research changes the plan (an anchor moved, a neighborhood beats the intended one, a day
> collapsed), log it here with the reason. `intake.md` stays the ORIGINAL intent; this is the
> diff. (Korea/Denmark were "corrected three times by running it" — that history now has a home.)

- **2026-08-22 — night split & flight routing assumed, not stated.** Intake left "Number of nights/cities" blank. Research assumed 5 nights Lisbon / 4 nights Porto with an open-jaw LIS→OPO flight (see q-portugal-1) to build a concrete day-by-day plan; proceeding on this assumption per the traveler-questions protocol rather than blocking research.
- **2026-08-22 — Belém and São Jorge Castle days reordered around closures.** Jerónimos Monastery and Belém Tower both close Mondays; the itinerary places the Belém day on Sunday (Apr 11) and moves São Jorge Castle — one of the few major Lisbon sights open every day — to Monday (Apr 12) instead of the reverse.
- **2026-08-22 — no researched rain/plan_b alternate added to any day.** This pass's scope was the backbone/sights/food research, not a dedicated weather-contingency sweep. April in Lisbon/Porto has no identified seasonal rain-window in the sources checked (Sintra's documented closure risk is a Jun–Sep wildfire pattern, not April), so no day is anchored on a known weather window under the block-types.md rule. Every sightseeing day (Belém, Sintra, Porto sights) is anchored on a closable venue, though, and none currently carries a researched `plan_b` — flagged here as an honest gap for a future pass rather than an invented alternate.
