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
