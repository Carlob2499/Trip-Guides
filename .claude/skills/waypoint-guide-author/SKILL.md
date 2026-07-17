---
name: waypoint-guide-author
description: >-
  Author, research, and verify Waypoint travel-guide content to this repo's
  verified standard. Use this skill whenever the task involves producing or
  verifying guide FACTS — creating a new guide, researching or filling a draft
  ("Guide-to-be"), running a research pass, or editing/updating facts in an
  existing guide (prices, hours, venues, restaurants, itineraries, transit,
  events) — even when the user doesn't name the skill and even for a one-line
  fact change, because every fact edit carries verification and continuity
  obligations. Do NOT use it for code-layer work: Astro components, CSS,
  build scripts, schemas, or site tooling.
---

# Waypoint Guide Author

The research/authoring layer for Waypoint guides — and the **operational home**
for the guide-content standards. `CLAUDE.md` auto-loads and is binding for the
universal principles (the four properties Verified/Personal/Actionable/Honest;
**"The bar"**; **"Editing a Guide — Continuity Is Mandatory"**) plus the
code-layer guardrails — don't re-Read it; it points *here* for guide-content
detail. This
skill and its references carry that detail: source-tiering a fact, the `≈`/`⚠`
states, verification stamps, the 4-question venue rule, photo/section rules, the
helper scripts, and the done gate.

## Read first
1. **`references/verification-rules.md`** — the binding fact decision layer
   (perishable-vs-durable, source tiers, ship/flag/omit, stopping conditions,
   the §8 self-check). Read before writing any fact.
2. The **target guide** — `src/content/guides/<slug>/`; read only the group file
   the fact lives in, per CLAUDE.md's Operational Habits. Also read its
   **intake** `guides-intake/<slug>.md` if it exists (ranked priorities decide
   which sections get depth); else infer general scope and say so.
   `docs/NEW_GUIDE_INTAKE.md` explains intake → spec.
3. **`references/block-types.md`** — when choosing or creating a section type.
4. **The `denmark/` and `korea/` guide dirs** — the gold standard to match or beat.
5. **`docs/TRAVELER_PATTERNS.md`** — how these travelers *actually* travel, learned from
   past trips (pace, heat, commute clustering, fixed-event anchors, food preferences,
   whether the group forks). Plus `learnings/<slug>.md` for any prior trip with the
   same travelers. **Consult these during intake and research** so a new guide starts
   personalized instead of generic — they are the answer to "could a generic AI have
   written this without knowing this traveler?".
   **Establish WHICH PARTY the new guide is for, first, and use only that party's section
   plus Cross-party.** The file is split by party (A = the Korea three, walkers, gaming
   anchors; B = the Denmark five, family, walking is the binding constraint). They are
   different travelers and their patterns contradict each other on pace and transit.
   Applying the wrong party's patterns is not a small error — it is how Denmark's itinerary
   ended up rated "marginally useful" by the people carrying it. If intake doesn't say who's
   going, **ask** — don't infer from the last guide.
   Respect the provenance tags: plan around **[stated]** / **[observed]** /
   **[reported]** patterns; treat **[hypothesis]** as a question to test, never a fact.
   An empty section there means no evidence exists — do not invent one. Every pattern
   currently rests on one data point per trip; weight accordingly.

## Modes
- **New guide** — intake first, then scaffold (`node scripts/scaffold-guide.mjs
  --country "..."`) or a grounded Groq draft (`npm run create-guide -- --location
  "City, Country"`, every fact still unverified), then research.
- **Research / fill a draft** — the main mode. Depth on the intake's top 2–3
  priorities; light touch elsewhere. If told to target one section, do only it.
- **Edit an existing guide** — verify the new/changed fact per the rules
  (update its verification date as written), then run the continuity sweep from
  CLAUDE.md's **"Editing a Guide — Continuity Is Mandatory"**: grep the whole
  guide for every touchpoint the change ripples into, fix what's in scope,
  stop-and-ask when it forks the plan.

## Research workflow
- Climb the source ladder with web search/fetch — reach a **T0 primary source**
  for every specific fact; **try to disprove it** before trusting it (details in
  `verification-rules.md` §3).
- Keep a **verification ledger while researching** — one row per perishable
  fact, captured as you go, not reconstructed after:

  | Claim | Value | Source (tier + URL) | Checked | Flag |
  |-------|-------|---------------------|---------|------|
  | Museum X admission | ≈ €12 adult | T0 — official site /visit | 2026-07-01 | ≈ |

- Every fact lands in exactly one **legal state** — clean · `≈` sourced-approx ·
  `⚠` known-gap · omitted · `__VERIFICATION_REQUIRED__` (unverified map
  place_id). **Zero bare perishable facts.** Full rules — including what each
  state does and doesn't license: `verification-rules.md` §4.
- **Structured provenance — MANDATORY on anything you write or edit.** Sections and
  items accept `source_url` + `verified_on` (YYYY-MM-DD) + `shelf_life`
  (`fx` 7d · `transit` 90d · `hours` 90d · `venue` 180d · `default` 90d, from
  `src/lib/staleness.ts`). Set **all three** on every new/edited perishable fact whose
  block supports them. They are not decoration: `verified_on` + `shelf_life` drive the
  ⚠ re-check pill travelers actually see (client clock, so it can't freeze "fresh"),
  and `source_url` is what the pill links to and the weekly recert re-checks. Pick the
  `shelf_life` that matches the fact, not the section's title — a currency figure is
  `fx` even inside a general "Money" panel. Inline `<a href>` citations stay valid;
  `verified_on` without `source_url` is lint-flagged.
- **New guides are born `provenance: "strict"`** (guide-level field). Under strict the
  build REJECTS any `panel`/`prose`/`list`/`routes` section that uses `≈` without a
  `verified_on` — because `≈` asserts *sourced-and-approximate*, and a claim to have
  checked something owes the date it was checked. If you can't produce a date, the
  figure was never confirmed: downgrade it to `⚠` or omit it. Do not add `strict` to an
  existing guide without doing the backfill first — a half-dated guide flipped to strict
  just fails the build.

## Never guess what a script can verify
- **coords / place_id** → `node scripts/lookup-place.mjs "<place>" --cc XX`
- **`sights` photos** → `node scripts/search-commons.mjs "<subject>"` — only a
  Commons-confirmed filename in `img.file`; if none fits, omit the image.
- **grounding text** → `node scripts/fetch-wikivoyage.mjs "<City, Country>"`
  (treat its output as T2 leads to verify, not citable fact).

## Done gate — all of it, before calling anything finished

**CLAUDE.md's Ship Loop governs every change and is not optional here** — build,
`npm test`, verify in `astro preview`, grep compiled `dist/`. When you grep
`dist/`, confirm the fact(s) you changed compiled through; on edits, also grep
for the **stale** string to prove none survived.

Then these guide-content gates, on top of it:
1. `node scripts/audit/check-research.mjs --slug <slug>` — clean, or every
   finding explained in the report.
2. The **`verification-rules.md` §8 self-check**, line by line.
3. **`verified` stamp** — `Checked [date] for [trip] · re-check before travel:
   [most perishable items]`; keep it `⚠`-prefixed on drafts and keep
   `draft: true` — graduating a guide is a human decision, never yours.
4. **Recert pass** — any fact you touched that sits past its shelf life
   (`src/lib/staleness.ts` categories) is re-sourced from a primary source and
   re-dated, or visibly downgraded to `⚠` — never silently left presenting as
   verified.

## Completion report
End every pass with: `built ✓ (N sections, build + linter clean) · flagged ⚠
for re-check: […] · omitted for lack of source: […] · conflicts recorded: […]`
plus the ledger. This makes the Honest gate auditable and tells the next pass
what to close.

## Scope
Edit **only** the target guide (+ its intake notes) — never other guides; leave
`map`/`weather`/`holidays` sections intact (live data). Every field validates
against `src/content.config.ts`. An honest "couldn't confirm — check before you
go" is a passing outcome; a smooth, confident, unverified paragraph is not.
