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
5. **`docs/TRAVELER_PATTERNS.md`** — how this group *actually* travels, learned from
   past trips (pace, heat, commute clustering, fixed-event anchors, food preferences,
   whether the group forks). Plus `learnings/<slug>.md` for any prior trip with the
   same travelers. **Consult these during intake and research** so a new guide starts
   personalized instead of generic — they are the answer to "could a generic AI have
   written this without knowing this traveler?".
   Respect the provenance tags: plan around **[stated]** / **[observed]** /
   **[reported]** patterns; treat **[hypothesis]** as a question to test, never a fact.
   An empty section there means no evidence exists — do not invent one.

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
- **Structured provenance (additive):** sections and items accept optional
  `source_url` + `verified_on` (YYYY-MM-DD). Set BOTH on new/edited perishable
  facts where the block supports them — they feed the weekly recert audit
  (link HEAD-checks + shelf-life flagging; fx ≈7d, hours/transit ≈90d, venues
  ≈180d per `src/lib/staleness.ts`). Inline `<a href>` citations stay valid;
  `verified_on` without `source_url` is lint-flagged.

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
