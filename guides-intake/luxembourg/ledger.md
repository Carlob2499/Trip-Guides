# Research ledger — Luxembourg

> Everything research produces for this guide. The traveler's own intent lives beside this in
> `intake.md` and is frozen after scaffold — record a research-forced change of plan under
> "## Amendments" here, never by rewriting the intake.

## Spec Summary (fill after intake, before research)
- Section types to include / exclude (and why): Standard backbone (Plan, Money & budget, Health & safety, Etiquette & language, Transit, Days, Sights, Food & shopping, Sources) — no event-specific tab, since the intake names no anchor event. `divergences` added under Sights (Grand Ducal Palace summer-only tours, the stale "bus 570" route, museum pricing) because the research surfaced enough corrected claims to earn it.
- The 2–3 priorities driving depth: 1) Culture/history (old fortifications + upper-town museums, explicitly named in the intake's comments) 2) Food & dining (eat well, no formal booking) 3) Nature/outdoors (the valley walk the traveler explicitly wants, plus the one half-day trip out).
- Hard filters applied to every entry: no stated mobility/dietary/sensory constraint in intake (field left blank — treated as none stated, not none exist), so no constraint-bound venue facts were mandatory. The traveler's "eat well without booking anything formal" preference was treated as a soft filter on food picks (walk-in viability weighed directly into ship/reject decisions — see Um Plateau and Mousel's Cantine below).
- Verification focus: the Vianden day-trip transit route (a stale "bus 570" claim in circulation vs. the current official line 181, further complicated by a 10 May 2026 Ettelbrück hub reorganization), museum hours/prices (all of which sit right at the trip's Oct 16–19 dates), and the Grand Ducal Palace's summer-only interior tours (a generic-guide trap for an October visit).

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

### Priority 1: Culture / history

| Candidate | Verdict | Shortlist |
|-----------|---------|-----------|
| Bock Casemates | shipped | y |
| Chemin de la Corniche / Wenzel Circular Walk | shipped | y |
| Musée National d'Histoire et d'Art (MNHA) | shipped | y |
| Musée Dräi Eechelen (Fort Thüngen) | shipped | y |
| Villa Vauban | shipped | y |
| Notre-Dame Cathedral | shipped | y |
| Grand Ducal Palace (exterior — interior tours are summer-only) | shipped | y |
| Vianden Castle (half-day trip) | shipped | y |

### Priority 2: Food & dining

| Candidate | Verdict | Shortlist |
|-----------|---------|-----------|
| Marché Place Guillaume II (Wed/Sat market) | shipped | y |
| Mousel's Cantine | shipped | y |
| Oberweis (Grand-Rue) | shipped | y |
| Am Tiirmschen | rejected: permanently closed (end of Nov 2023, per its own manager's account to local press) | y |
| Um Plateau | rejected: its own listing pushes online table reservations, against the traveler's stated no-booking preference | y |
| Brasserie Guillaume | rejected: couldn't confirm walk-in policy against an official source within budget | y |

### Priority 3: Nature / outdoors

| Candidate | Verdict | Shortlist |
|-----------|---------|-----------|
| Pfaffenthal Panoramic Elevator | shipped | y |
| Grund & the Alzette valley walk | shipped | y |
| Neumünster Abbey (cloister/courtyard, doubles as rain plan_b) | shipped | y |
| Pétrusse Valley | shipped | y |
| Vianden Chairlift | rejected: couldn't confirm current price against a fetched official source — conflicting search figures (€6.50 / €9 / €16-per-couple) | n |
| Echternach & Müllerthal (alternative half-day/day trip) | rejected: a real option, but the traveler wants at most one worthwhile trip out, and Vianden Castle scores higher on the trip's top-ranked culture/history priority | y |
| Schengen (Moselle tripoint) | rejected: more a photo-op than a culture/history or nature-depth stop, further out with a weaker transit connection than Vianden | n |

## Questions for the traveler (research emits; traveler answers on the progress page)
> Traveler-framed only — no pipeline vocabulary. Each question carries an assumption the guide
> builds on until the traveler answers. See src/features/intake-questions/ for the model.

### q-luxembourg-1
- **Q:** We found one strong half-day trip out of the city — Vianden Castle, about an hour away by free train + bus. Want it built into the plan, or would you rather stay in Luxembourg City the whole time?
- **Assumed:** Building it in, on Sunday (day 3) morning, with the valley walk filling the same afternoon.
- **Context:** Day 3 (Sun Oct 18) and the Sights tab's Vianden Castle card.
- **Status:** open

### q-luxembourg-2
- **Q:** What city will you be flying out of? It's the one detail we can't research — it decides your flight cost line and the route the trip map draws.
- **Assumed:** Left unset — no flight cost estimated, and the map doesn't draw an origin line until this is confirmed.
- **Context:** `facts.json` (traveler-origin) and the Budget tab's flights line.
- **Status:** open

## Amendments (append-only — record every research-forced re-plan)
> When research changes the plan (an anchor moved, a neighborhood beats the intended one, a day
> collapsed), log it here with the reason. `intake.md` stays the ORIGINAL intent; this is the
> diff. (Korea/Denmark were "corrected three times by running it" — that history now has a home.)

- **2026-08-21 — `src/data/countries.mjs` has no "Luxembourg" entry (code-layer gap, out of this pass's scope).** This guide's `country: "Luxembourg"` won't resolve an accent colour, currency, timezone fallback, or public-holiday ISO code from the shared country table — every other guide in the repo (Denmark, South Korea, Japan, Germany, Portugal, and 20+ European countries) has a row; Luxembourg does not. `_guide.json` works around the accent (explicit `theme` override) and timezone (explicit `tz: "Europe/Luxembourg"`) at the content layer, but currency-conversion and the `holidays` section still depend on the missing table row, and `src/data/countries.mjs`'s own `EU112_COUNTRIES` set (which backstops the emergency-SOS sheet) also omits Luxembourg — an EU member with the same 112 number as every neighbor it does list. Both are one-line additions to a code file, which sits outside this run's `src/content/guides/luxembourg/` + `guides-intake/luxembourg/` scope. **This needs a code-layer fix before the guide can fully render currency/holidays/emergency-SOS — flagging for the reconcile/critic stage or a follow-up change run, not silently working around it in content.**
- **2026-08-21 — Budget denominated in € (local currency), not $ (the intake form's shorthand).** The intake's "$75–150/day" is the scaffolder's generic mid-range label, not a stated currency preference; every other shipped guide (Denmark, Korea) prices its budget section in the destination's own currency. Luxembourg uses the euro, so the budget section and `facts.json` price registry are in €, with `budgetTarget` keeping the original "$75–150/day" label as context only.
- **2026-08-21 — Grand Ducal Palace kept in Sights despite being exterior-only for this trip.** The intake ranks culture/history first and specifically names "the museums in the upper town" — the Palace sits in the same cluster and is worth a walk-by even without an interior tour in October. Its card and a `divergences` entry both say so explicitly, so it doesn't read as a bait-and-switch.
