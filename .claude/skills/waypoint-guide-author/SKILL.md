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
2. **`references/research-efficiency.md`** — the binding model-economy + search-budget
   rules (research runs on **Sonnet**, light Opus only for contested judgment; scripts
   before web; two search rounds then ship/flag/omit; checkpoint often — the backbone
   must be sustainable on Claude Pro). Follow it instead of rediscovering it.
3. The **target guide** — `src/content/guides/<slug>/`; read only the group file
   the fact lives in, per CLAUDE.md's Operational Habits. Also read its
   **intake** `guides-intake/<slug>.md` if it exists (ranked priorities decide
   which sections get depth); else infer general scope and say so.
   `docs/NEW_GUIDE_INTAKE.md` explains intake → spec.
4. **`references/block-types.md`** — when choosing or creating a section type.
5. **The `denmark/` and `korea/` guide dirs** — the gold standard to match or beat.
6. **`docs/TRAVELER_PATTERNS.md`** — how these travelers *actually* travel, plus
   `learnings/<slug>.md` for any prior trip with the same travelers. **Consult during intake
   and research** so a new guide starts personalized, and **establish WHICH PARTY the guide
   is for FIRST** — use only that party's section plus Cross-party (the file's header
   explains why; parties A and B contradict each other on pace and transit, and applying the
   wrong one is how Denmark landed "marginally useful"). If intake doesn't say who's going,
   **ask** — never infer from the last guide. Respect the provenance tags
   ([stated]/[observed]/[reported]; [hypothesis] is a question, never a fact); an empty
   section means no evidence — do not invent one.

## Modes
- **New guide** — intake first (establish the **party** and the **anchor event** before
  anything — see Read-first #6), then scaffold (`node scripts/scaffold-guide.mjs
  --country "..." --dates "YYYY-MM-DD to YYYY-MM-DD"`, or the "New guide" issue form which
  scaffolds automatically) — the scaffold pre-wires the map/weather/holidays live sections and
  an empty backbone, every fact still unverified. Then research it via the **two-pass procedure**
  below (Pass A canonical → Pass B local/authentic → reconcile), and run the self-correction loop
  (`npm run verify -- --slug <slug>` + `npm run build` → fix → repeat until PASS).
- **Research / fill a draft** — the main mode. Depth on the intake's top 2–3
  priorities; light touch elsewhere. If told to target one section, do only it.
- **Edit an existing guide** — verify the new/changed fact per the rules
  (update its verification date as written), then run the continuity sweep from
  CLAUDE.md's **"Editing a Guide — Continuity Is Mandatory"**: grep the whole
  guide for every touchpoint the change ripples into, fix what's in scope,
  stop-and-ask when it forks the plan. This mode is what `modify-guide.yml` runs headlessly for
  a scoped "Request a change" issue (any guide page's **✎ Request a change** button) — same
  discipline, just triggered by the owner's `modify-approved` label instead of an interactive
  session, and landed via `scripts/land-branch.sh` instead of a hand-merged PR.
- **Recert a published guide** — the self-freshening / maintenance mode (the scheduled
  `recert.yml`, or manual). Get the punch list with `npm run recert -- --slug <slug>` —
  every fact past its shelf life + the `source_url` to re-check it against. Re-verify EACH
  against a primary source: if it changed, update it and re-date `verified_on` to today; if
  you can't confirm it, downgrade to `⚠` or omit — never leave a stale value presenting as
  verified, never invent a fresh figure. Then the continuity sweep (above) and the verify
  loop. This is a scoped edit: **touch only the flagged facts, keep the guide published**
  (never set `draft: true`). It follows the done gate's **Recert pass** step (#4).
- **Reflect on a trip** — when writing a `learnings` block, tag each `skipped[]` stop with
  the content `group` it belonged to where that's unambiguous, and **leave `group` off when
  it isn't**. It powers the Learnings tab's "what didn't survive contact" tally and the
  section-ranking table in `TRAVELER_PATTERNS.md`. An ungrouped stop sits the tally out;
  a guessed group teaches the next guide something false.

## Tab budget — enforced, not advisory
`_guide.json`'s `tabBudget` (default 10) caps distinct content `group`s; the build fails
past it and lists the groups. Don't raise it to make a build pass — that inverts the point.
Raise it only when the guide has genuinely earned the tab (Korea's 11 exist because two
anchor events and a solo fork demand them), and prefer merging two thin groups first. Note
the reader also sees 4 tool tabs on top of whatever you declare.

**Cite evidence, not just doctrine.** `docs/telemetry/summary.md` (auto-generated weekly from
anonymous tab-open counts, PII-free) ranks which tabs travelers actually opened on past guides.
Consult it when deciding a new guide's groups and their order: a tab nobody opened is a merge
candidate; a consistently top-ranked one earns prominence. Absent or thin data (a new deployment,
a just-published guide) means no signal yet — fall back to the ranking rules above, don't invent one.

## Research workflow — TWO passes, then reconcile

**Model economy first:** the budgets and model assignments in
`references/research-efficiency.md` are binding — plan-mode the pass, checkpoint each stage,
two search rounds per fact then ship/flag/omit.

A guide is **generated twice, from two independent angles, then reconciled into one** — not
written once and merely error-corrected afterward. The second generation is what *corroborates*
the first; without it, a shallow or biased single pass ships unchallenged (the readiness loop
only fixes detectable errors — it can't tell you a well-formed guide is thin or generic). Both
passes obey the same fact discipline (ledger, legal states, provenance) further down; they
differ only in **what they go looking for**.

### Pass A — canonical & verified
Primary/official sources first. The **anchor event — verify its date + venue against a T0 source
before anything else** — then the must-dos, entry/visa, transit, hours, prices: the backbone.
This is the classic research pass. Climb the source ladder with web search/fetch to a **T0
primary source** for every specific fact, and **try to disprove it** before trusting it
(`verification-rules.md` §3).

### Pass B — local, authentic, crowd-aware
Researched **independently from the intake** — do NOT produce it by editing Pass A, or you lose
the second angle that makes reconciliation mean anything. Come at the destination from the
resident / blog / forum / reddit side and ask *different* questions: When is each marquee sight
actually empty — the off-peak hour, the side entrance, the day the tour buses skip? Where is the
obvious pick a tourist trap, and what do locals do instead? What's the non-obvious neighborhood,
the authentic version of the experience the guidebooks flatten? **Pass B's finds are T2 leads —
each must be verified against a primary source before it enters the guide.** Authenticity never
smuggles in an unverified fact; it changes *what* you research, not the bar it clears.

### Reconcile → ONE guide, with a ledger
Merge the two passes item by item into the single guide, and record the merge in the
**`## Research reconciliation`** table of the intake doc (`guides-intake/<slug>.md`):
- **AGREE** (both passes land on it) → high confidence; include.
- **A-only** → is it a trap Pass B routed around? Add a crowd + best-time note, or swap to the
  authentic version B found.
- **B-only** → verify against a T0 source, *then* include.
- **CONFLICT** (hours differ, "best X" differs) → resolve to the truth; record which source won
  and why.

The ledger is the durable proof the itinerary was corroborated, not single-sourced — it sits
beside the plan like the Amendments log. When reconciliation forces a re-plan (an anchor moved, a
neighborhood beats the intended one), also append it to the intake's **`## Amendments`** section.

### Checkpoint each stage — the run is resumable
The pipeline tracks progress in `guides-intake/<slug>.state.json` (stages: scaffold → passA → passB
→ reconcile → verified) so a long run that gets interrupted resumes instead of restarting. **Start
by running `npm run pipeline -- --slug <slug> --status`** — it shows which stages are already cleared
and the exact next action; do only the un-done ones. After you FINISH a stage, record it —
`npm run pipeline -- --slug <slug> --checkpoint <stage>` (add `--note "…"` for the trail) — and, in
the headless Action, commit so the checkpoint persists. Never redo a cleared stage; the committed
work is the resume point. (The scaffolder clears `scaffold`; you clear `verified` only once
`npm run verify` PASSes — see the done gate.)

### Authenticity & crowd-awareness — woven, not a new tab
Every marquee sight / food recommendation carries a **crowd reality + best-time (off-peak) note**,
and where the obvious pick is a tourist trap, a **novel local alternative**. Write these into the
existing `sights` / `days` bodies — no new section type, no tab-budget cost. This is the antidote
to "reads AI-generated": a guide that knows *when* the famous canal is a wall of selfie sticks and
where locals actually go is one a generic model couldn't have written. The **Travel style** intake
field sets how hard Pass B leans here (off-the-beaten-path → aggressive; bucket-list → the must-see
stays, but with the timing that makes it bearable). Judged by rubric row **#12 (authenticity &
crowd-awareness)** plus #9 (party fit) and the bar test — not a hard auto-gate.

### Fact discipline — applies to BOTH passes
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

- **Structured day tags** — when writing `days` items, set `energy`
  (packed/balanced/slow → the Low-Energy toggle) and `env` (outdoor/indoor/mixed →
  the weather day-swap advisory: rain on an `outdoor` day + a dry `indoor` day
  nearby suggests the swap). Explicit tags only — the features stay silent on
  untagged days rather than guessing from prose.
- **Phrase cards** (guide-level `phrases: {lang, items[]}`, docs/FEATURES.md #6) —
  optional; when the trip warrants it, research 15–20 situational phrases
  (allergy, taxi, help, directions) with the SAME rigor as any other fact: a
  native-script phrase is safety-adjacent (a traveler may show it to a stranger
  mid-crisis), so ship/flag/omit applies per-phrase — verify against a reliable
  bilingual source, never transliterate from memory. `lang` is the BCP-47 tag
  (e.g. `"ko-KR"`) that drives the Trip kit tab's speak button.
- **Entry requirements** (guide-level `entry: [{homeCountry, visa, ...}]`,
  docs/FEATURES.md #7) — one row per traveler home country (a party can mix
  passports; ask during intake if unclear, never assume). `source_url` +
  `verified_on` are SCHEMA-REQUIRED here (not optional like most provenance) —
  research from each destination country's OFFICIAL immigration/entry page only,
  never a paid visa API or an aggregator. A wrong visa claim can mean a denied
  boarding, so omit the whole guide's entry card before shipping an unverified
  one. Recert re-checks this on its normal shelf-life cadence like any other fact.
- **Travel advisory** (guide-level `advisory: {level, title, summary?, source_url,
  verified_on}`, docs/FEATURES.md #9) — the destination's CURRENT US State
  Department advisory (`travel.state.gov/.../ <country-slug>-travel-advisory.html`),
  `source_url` + `verified_on` SCHEMA-REQUIRED. **The page is Cloudflare-gated
  against plain `fetch()`/`curl`/WebFetch (403)** — it only resolves through an
  actual browser tool (navigate, wait out the challenge, read the "Level N:
  <title>" line near the top); never a build-time fetch. Record the level ALWAYS,
  even a normal Level 1 — an omitted field reads as "never checked," a worse claim
  than "checked, nothing elevated." The pill only renders at level ≥ 2
  (honest-blank); Level 1 stays silent by design, not by omission.

## Never guess what a script can verify
- **coords / place_id** → `node scripts/lookup-place.mjs "<place>" --cc XX`
- **time zone** → in the SAME step the coords are established (not a separate round),
  `node scripts/lookup-tz.mjs <lat> <lng>` — offline, boundary-accurate. Set the guide's
  `tz` field explicitly, **for every guide, not just odd-looking ones**: the country-table
  fallback is a guess dressed as a default and fails silently (Hawaii and Arizona both
  shipped wrong local times before this script). One zero-network call — there is no
  efficiency argument for skipping it.
- **`sights` photos** → `node scripts/search-commons.mjs "<subject>"` — only a
  Commons-confirmed filename in `img.file`; if none fits, omit the image.
- **grounding text** → `node scripts/fetch-wikivoyage.mjs "<City, Country>"`
  (treat its output as T2 leads to verify, not citable fact).

## Done gate — all of it, before calling anything finished

**The bar is `docs/GUIDE_RUBRIC.md`** — the 13-dimension standard every guide is judged against
(P0 blocks graduation; P0+P1 = Korea-tier). `readiness` + `build` auto-enforce the P0 mechanical
half; the P1 rows (venue completeness, priority depth, party fit, honest gaps) are your judgment
via the §8 self-check below. A `readiness` PASS means "no detectable errors," **not** "good."

**CLAUDE.md's Ship Loop governs every change and is not optional here** — build,
`npm test`, verify in `astro preview`, grep compiled `dist/`. When you grep
`dist/`, confirm the fact(s) you changed compiled through; on edits, also grep
for the **stale** string to prove none survived.

Then these guide-content gates, on top of it:
1. **The self-correction loop — iterate, don't one-shot.** Run
   `npm run verify -- --slug <slug>` — the rolled-up gate (docs/PIPELINE.md, VERIFY stage):
   readiness (fabrication · provenance · completeness · itinerary) + a **recency** row +
   (with `--network`) a **content** row (dead links · missing Commons photos), printed as a
   `GUIDE_RUBRIC` scorecard with a `PASS`/`NEEDS WORK` verdict (exit 0/1). On `NEEDS WORK`,
   do NOT explain-and-move-on: fix each blocking (⚠) finding *by re-researching that fact
   against a primary (T0) source* — never silence a flag you can't source; downgrade to `⚠`
   or omit. **Re-run verify until it PASSes** (or every remaining item is a
   deliberately-explained `⚠` gap). Recency is advisory (a concluded trip's facts are stale
   by nature; recert acts on live ones); the `citations` line is context, not a target.
   `npm run build` is the separate schema gate — both must be clean. Run `--network` before
   graduating. When verify PASSes: `npm run extract-palette -- --slug <slug>` (commit the
   generated palette; harmless no-op without photos), then
   `npm run pipeline -- --slug <slug> --checkpoint verified`.
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
