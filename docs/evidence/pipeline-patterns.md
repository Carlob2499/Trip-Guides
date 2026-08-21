# Pipeline Patterns — what the critic keeps catching

**What this is.** The process analog of `TRAVELER_PATTERNS.md`: a cross-run memory of what
the fresh-context critic actually found across all five of its scans, distilled into
patterns so the NEXT research pass starts smarter. TRAVELER_PATTERNS teaches the pipeline about the travelers;
this file teaches the pipeline about itself. Together they close the virtuous loop the
creator ruled on 2026-07-30: whatever a critic catches must compound, not evaporate.

**What this is NOT (binding).** This is process evidence, never reality evidence. Critic
findings happen BEFORE any traveler travels — they must never enter `learnings/<slug>.md`,
a guide's `learnings` block, or `TRAVELER_PATTERNS.md`, whose provenance tags
([stated]/[observed]/[reported]) assert lived experience. Nothing in this file is ever
rendered on the site.

## Rules

1. **Distill, never paste.** One row per finding-CLASS, not per finding — the same
   summarize-into-patterns rule that governs freeform trip critiques. Raw finding text
   stays in the run's intake doc where it was recorded.
2. **Every research-pass run appends** — the critic writes its rows before landing,
   including the honest-blank row when a run was clean. Interactive full passes follow the
   same rule.
3. **Provenance per row:** `[critic]`, the slug, the date, and the rubric row **or lens**
   it violated (the vibe lens is scan 5 of the critic's protocol, so a pacing/geography/
   tone finding is still a `[critic]` row — name the lens in the row's own column). A row
   missing these is noise, not signal. Rows tagged `[vibe]` predate the 2026-08-02 critic
   merge; they stay as history and no new ones are written.
4. **The promotion rule (the loop's whole point).** A pattern recurring across **≥2 runs**
   is no longer a pattern — it is a defect in the pipeline's law. Promote it: write the
   rule into the skill file or reference it indicts (or a deterministic gate where one is
   possible — doctrine that proves sore becomes a gate), then mark the row `→ promoted
   <where, date>`. Promoted rows stay as history; the ledger should trend toward empty as
   the skill absorbs its lessons.
5. **Consulted at research time.** The guide-author skill's Read-first list points here —
   Pass A/B agents read the OPEN (un-promoted) patterns before researching, so a known
   miss-class is avoided upstream instead of caught downstream again.

## Finding ledger (append-only; newest first)

| Date | Slug | Source | Rubric row / lens | Pattern (distilled) | Status |
|------|------|--------|-------------------|---------------------|--------|
<!-- The critic appends rows here each run. A clean run appends:
     | YYYY-MM-DD | slug | [critic] | — | clean run — no findings | open |
     Example of a real row (the lens column names which of the five scans caught it):
     | 2026-08-02 | japan | [critic] | pacing arc | arrival days keep getting packed despite jet lag — Pass A should default arrival day to `energy: slow` | open |
-->
<!-- pipeline-v2:luxembourg-20260821-99c13e -->
| 2026-08-21 | luxembourg | [critic] | row 10 (honest gaps) | **`⚠ not confirmed` shipped on a field the item's OWN cited source publishes** — a venue's address was flagged unconfirmed while the `source_url` already on that item carried it in plain text. Second run in a row for this class (japan-2, 2026-08-14), and it recurs because the flag is written during discovery and never re-tested after the T0 fetch that resolves it. Candidate gate: before shipping, re-read every `⚠ … not confirmed` item against its own `source_url` — a hedge on a cited item is a defect until the citation is shown not to answer it. | open |
| 2026-08-21 | luxembourg | [critic] | row 3 (provenance) | **a `routes`/multi-claim section carries ONE section-level `source_url`, and claims accrete under it** — a transit section cited an operator's fares page while its steps asserted a lift's hours, an airport bus frequency, and a bus line number that the fetched page mentions nowhere. Section-level provenance reads as covering every step, so nobody re-checks. Any step asserting a fact outside the section source's subject owes its own inline `<a href>` citation. | open |
| 2026-08-21 | luxembourg | [critic] | row 11 (recency) | **a "rule" paraphrased from a tourist page where the operator publishes explicit dates** — a monthly maintenance closure shipped as "the first Monday of each month"; the operating authority's own page lists the actual dates, one of which is a second Monday. When a T0 source publishes an enumerated list, the guide states the list (or the trip-window clearance), never the pattern someone inferred from it. | open |
| 2026-08-21 | luxembourg | [critic] | meals & energy (vibe lens) | **day plans name meals only where the good pick is obvious, so the hardest day goes silent** — the one day when the guide's own market, bakery and two restaurants were all closed or half-closed was the only day naming no food at all, while the answer (the single 7-day venue) was already shipped and verified. Sweep the day plans against every food item's `hours`/`closed` before landing: the day with the fewest open picks needs the named meal most. | open |
| 2026-08-21 | luxembourg | [critic] | row 7 (4-question venue rule) | **`how` gets filled with the booking answer, duplicating `book`** — both Pass-B venues answered "how do I get there" with walk-in policy, so question 2 of the four went unanswered on exactly the items reconcile had just adopted. Newly-adopted Pass-B venues inherit B's framing (why it's a find) and skip the logistics fields Pass A items get by habit. | open |
| 2026-08-21 | luxembourg | [critic] | row 12 (authenticity) | **one honest "no firsthand source" verdict gets read as covering every sight** — the reconciliation recorded a justified crowd-note blank for the single marquee sight it investigated; seven other sights shipped with no crowd/off-peak note and no verdict at all. A recorded justification covers the item it names, never the category — the #12 scan needs a per-sight answer, even if the answer is a blank. | open |
| 2026-08-21 | luxembourg | [critic] | common sense (vibe lens) | **the venue card states a booking caveat and the day card walks straight into it** — a "call ahead if arriving after 19:00" note sat in the venue card and the booking checklist while the day plan scheduled that dinner at ≈19:30 and said nothing. Where a day card schedules a venue INTO its own stated caveat window, the day card must repeat the caveat; cross-surface consistency is not the reader's job. | open |
| 2026-08-14 | japan-2 | [critic] | row 3 (provenance) | **a carried-forward fact carries its source's authority, not its accuracy** — a price re-used from an earlier pass on the same trip was 47% under the operator's published figure, and the page it was credited to carried no such figure at all. When a pass reuses an earlier guide's already-sourced rows, the reuse is a *lead*: the citation audit must sample carried-forward rows, not just this pass's new ones. Recurrence of the same class as the 2026-08-08 `[stage E]` "aggregator is a lead, not the fact" row — the source was never read, only trusted. | open |
| 2026-08-14 | japan-2 | [critic] | row 2 (no fabrication) | **a scaffolded placeholder can outlive the honest gap it was standing in for** — the reserved `traveler-origin` row shipped with a real IATA code the intake never supplied, while three other surfaces correctly said "unconfirmed". A schema that forbids an empty value makes deletion the only honest state; a pass that fills the field instead invents a traveler fact. Any reserved/seeded row whose intake field is BLANK should be absent, not populated. | open |
| 2026-08-14 | japan-2 | [critic] | row 10 (honest gaps) | **`⚠` used as a substitute for one fetch** — a scheduled rank-2 venue shipped with no address/hours/source and "⚠ check current hours, markets often skip Sundays", echoed into the day card; the hours are published on the prefecture's own tourism portal. `⚠` is for what can't be sourced, never for what wasn't looked up. Candidate gate: a venue that appears in a DAY card owes the full 4-question set, not a hedge. | open |
| 2026-08-14 | japan-2 | [critic] | row 5 (itinerary integrity) | **split-party budgets drop a day at the seam** — two budget sections whose `days` summed to 26 against 27 day cards, each titled with a range that contradicted its own count, because the fork day (Nov 2) belonged to neither. Multi-section budgets need one explicit statement of which section owns the transition day. | open |
| 2026-08-14 | japan-2 | [critic] | pacing arc | **"flex day" is where research quietly stops** — three of four open days named something concrete; the fourth said "revisit anything missed" and sat inside the stated peak window for the party's #1 priority, while two already-verified sights went unscheduled on any day. An open day still owes one researched anchor the traveler can decline. | open |
| 2026-08-14 | japan-2 | [critic] | common sense | **the guide states two facts and never connects them** — a splurge overnight placed the night before day 1 of the trip's one non-negotiable anchor, with the ≈2 hr return and the "arrive early" advice sitting in separate cards. Not wrong, but the traveler is left to notice the trade themselves. Where a discretionary booking collides with an anchor, the card that loses time should say so and name the lever. | open |
| 2026-08-14 | japan-2 | [critic] | common sense | **compose's fold destination is decided by `phase`, and nobody checks it** — an over-budget guide folded its Health & safety group into Days purely because the panel was tagged `phase: "daily"`, burying emergency numbers and a controlled-substance warning under 27 day cards. A panel's `phase` is a routing decision, not a label: before graduating, check where each foldable unit would LAND, not just that compose exits 0. (Related tooling gap: compose renames groups but leaves `_guide.json.panelGroups` stale, which fails the build after compose's own write.) | open |
| 2026-08-14 | japan-2 | [critic] | tone | **a new guide has no prose-shape baseline, so its offences read as "NEW" and invite a baseline bump** — japan-2 shipped five >120-word paragraphs, three of them run-on link lists in Sources. The correct move for a first-time guide is always to split, never `--update`: growing the baseline on a guide that never had one launders new debt as grandfathered. Candidate gate: block `prose-shape --update` when the added rows are for a slug with no prior baseline entry. | open |
| 2026-08-08 | japan | [creator] | verified facts | a guide's **holiday data file is a research-pass deliverable**, not build infrastructure — japan shipped with a `holidays` section and no `JP-2026.json` behind it, so the block rendered nothing and nobody noticed. A research pass must confirm every derived data file its guide's sections depend on actually exists. | open |
| 2026-08-08 | japan | [stage E] | source hierarchy | **the aggregator is a lead, not the fact** — Nager.Date's JP-2026 had 16 rows against the Cabinet Office CSV's 18: it dropped Constitution Memorial Day (May 3), put that name on the May 6 substitute instead, and omitted the Sep 22 bridge day. Two closed days would have read as open. Any auto-fetched dataset needs one spot-check against the issuing body before it is trusted for a trip. | open |
