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

The research/authoring layer for Waypoint guides — and the **single source of truth** for the
guide-content standards. `CLAUDE.md` auto-loads and binds the universal principles (the four
properties Verified/Personal/Actionable/Honest; **"The bar"**; **"Editing a Guide — Continuity Is
Mandatory"**) plus the code-layer guardrails; don't re-Read it, it points *here* for
guide-content detail.

**The headless pipeline runs THIS file.** `research-pass.yml`'s four agents (Pass A · Pass B ·
Reconcile · Critic) read this skill and execute their stage from it. Each stage's I/O contract
(paths, checkpoints, forbidden reads, STOP conditions) lives in its own prompt file under
`prompts/` — that is the ONE home for stage contracts, and this skill is the one home for what
"good" means. Editing either edits the pipeline directly.

## Read first
1. **`references/verification-rules.md`** — the binding fact decision layer
   (perishable-vs-durable, source tiers, ship/flag/omit, stopping conditions, the §8 self-check).
   Read before writing any fact.
2. **`references/research-efficiency.md`** — the binding model economy, entity-batched and
   risk-scaled search budgets, the **adaptive discovery stopping rule** (no fixed candidate
   quotas — stop when new searches mostly duplicate/weaken the set AND unresolved evidence is
   unlikely to change the recommendation), plus **social/video lead rules** (yt-dlp, TikTok/IG
   indirect) and the **Research-skill discovery layer** (interactive only). Follow it instead of
   rediscovering it.
3. **`references/research-depth.md`** — the binding decision-impact scaling layer: disagreement
   investigation, reservation depth by importance (with labeled unconfirmed booking leads),
   Worth-the-Effort/Worth-the-Detour retention, transport robustness by risk, contingency
   depth, category freshness + recurring-event year safety, and research memory ("memory
   proposes, current research verifies").
4. The **target guide** — `src/content/guides/<slug>/`; read only the group file the fact lives
   in, per CLAUDE.md's Operational Habits. Also read its **run-state directory**
   `guides-intake/<slug>/` if it exists — `intake.md` is the traveler's frozen intent (ranked
   priorities decide which sections get depth) and `ledger.md` is everything research has
   produced so far (reconciliation, candidates, questions, amendments); else infer general scope
   and say so. `docs/standards/new-guide-intake.md` explains intake → spec.
5. **`references/block-types.md`** — section types, tab budget, typed features
   (phrases/entry/advisory), voice standard, facets, covers. **`references/image-sourcing.md`** —
   binding photo layer (Commons vs royalty-free `src`, attribution, forbidden sources, R18
   honesty, pre-ship checklist).
6. **The `denmark/` and `korea/` guide dirs** — the gold standard to match or beat.
7. **`docs/evidence/pipeline-patterns.md`** — what critics keep catching, distilled; read the
   OPEN rows first so a known miss-class is avoided upstream, and **append this pass's own
   distilled rows before landing** (including the honest-blank row on a clean run) — that file's
   own Rules section governs the format and the ≥2-recurrence promotion trigger. Process evidence
   only — never learnings or traveler patterns.
8. **`docs/evidence/traveler-patterns.md`** — how these travelers *actually* travel, plus
   `learnings/<slug>.md` for any prior trip with the same travelers. **Consult during intake and
   research** so a new guide starts personalized, and **establish WHICH PARTY the guide is for
   FIRST** — use only that party's section plus Cross-party (the file's header explains why;
   parties A and B contradict each other on pace and transit, and applying the wrong one is how
   Denmark landed "marginally useful"). If intake doesn't say who's going, **ask** — never infer
   from the last guide. Respect the provenance tags ([stated]/[observed]/[reported]; [hypothesis]
   is a question, never a fact); an empty section means no evidence — do not invent one.

## Modes
- **New guide** — intake first (establish the **party** and the **anchor event** before anything
  — see Read-first #8), then scaffold (`node scripts/scaffold-guide.mjs --country "..." --dates
  "YYYY-MM-DD to YYYY-MM-DD"`, or the "New guide" issue form, which scaffolds automatically) —
  pre-wires the map/weather/holidays live sections and an empty backbone, every fact still
  unverified. Then research via the **two-pass procedure** below (Pass A canonical → Pass B
  local/authentic → reconcile), and run the self-correction loop (`npm run verify -- --slug
  <slug>` + `npm run build` → fix → repeat).
- **Research / fill a draft** — the main mode. Depth on the intake's top 2–3 priorities; light
  touch elsewhere. If told to target one section, do only it.
- **Edit an existing guide** — verify the new/changed fact per the rules (update its verification
  date as written), then run the continuity sweep from CLAUDE.md's **"Editing a Guide —
  Continuity Is Mandatory"**: grep the whole guide for every touchpoint the change ripples into,
  fix what's in scope, stop-and-ask when it forks the plan. **Record the sweep** (greps run ·
  ripples found & fixed · "none" stated explicitly) — every headless edit surface hard-gates on
  this record, and it belongs in an interactive completion report the same way. This mode is what
  a **change run** (`change.yml`) does headlessly for a "Request a change" issue — any guide page's
  **✎ Request a change** button, which posts to the site's Worker — same discipline, landed by
  `pipeline land` instead of a hand-merged PR. The requester's own words ride the DATA channel
  (`change.txt`), never the prompt.
- **Recert a published guide** — the self-freshening / maintenance mode. `recert.yml` only
  DETECTS staleness and dispatches a change run per stale guide; the editing below is that run's
  work, or yours by hand. Get the punch list with `npm run recert -- --slug <slug>` — every
  fact past its shelf life + the `source_url` to re-check it against. Re-verify EACH against a
  primary source: if changed, update it and re-date `verified_on` to today; if you can't confirm
  it, downgrade to `⚠` or omit — never leave a stale value presenting as verified, never invent a
  fresh figure. Then the continuity sweep (above) and the verify loop. A scoped edit: **touch
  only the flagged facts, keep the guide published** (never set `draft: true`). Follows the done
  gate's **Recert pass** step (#7).
- **Reflect on a trip** — when writing a `learnings` block, tag each `skipped[]` stop with the
  content `group` it belonged to where that's unambiguous, and **leave `group` off when it
  isn't**. It powers the Learnings tab's "what didn't survive contact" tally and the
  section-ranking table in `docs/evidence/traveler-patterns.md`. An ungrouped stop sits the tally
  out; a guessed group teaches the next guide something false.

## Research workflow — TWO passes, then reconcile

**Model economy first:** the budgets and model assignments in `references/research-efficiency.md`
are binding — plan-mode the pass, checkpoint each stage, research **entity by entity** (a
venue/route/event, one batch — not once per mention), budget scaled by **risk** (R0–R4), then
ship/flag/omit.

A guide is **generated twice, independently, then reconciled into one** — not written once and
error-corrected. The second pass *corroborates* the first; a single pass can be well-formed and
still thin or biased, which readiness can't detect. Both obey the same fact discipline below;
they differ only in **what they go looking for**.

**Independence is enforced, not requested.** In CI, Pass B is a separate agent invocation that
is forbidden to read Pass A's output — and the V2 pipeline (`research-pass-v2.yml`) goes
further: Pass B's prepared input mechanically EXCLUDES Pass A's guide and research artifacts,
so the wall is infrastructure, not a prompt promise. Interactively, honor the same wall — spawn
Pass B as an isolated subagent where the harness allows, or research it from the intake alone
and merge only at reconcile.

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
the authentic version of the experience the guidebooks flatten? **Pass B's finds are T2 leads,
and the bar they clear depends on the CLAIM (`verification-rules.md` §3): every objective fact
in them (hours, prices, booking rules) must climb to a primary source before it enters the
guide; experiential findings (crowd timing, atmosphere, transfer reality, neighborhood feel)
are verified by corroboration instead — ≥2 recent, independent, firsthand sources, never an
official URL pasted onto a subjective claim it does not support.** Authenticity changes *what*
you research, never the bar it clears. **Native-language research is adaptive** — lean on it
hardest where English results are generic, tourist-heavy, thin, or contradictory (Japan/Korea
usually qualify); search the way locals describe the problem, never word-for-word translations
of English queries; strong local-language evidence is valid even with little English coverage.
Keep the light audit trail — what kinds of native searches, why, and what useful new
information they produced (V2: `passB.nativeLanguage` in `evidence.v2.json`) — never every
query or result. Video/social sourcing is part of this pass's toolkit — YouTube transcripts via
`yt-dlp` (never media) and web-indexed TikTok/IG roundups: `research-efficiency.md` "Social &
video lead sourcing" (leads-only, objective claims still climb to T0, viral = crowd warning,
failures never block).

### Discovery before either pass — interactive sessions only
Pass A may open with ONE Standard-mode call to the global `Research` skill (backbone landscape).
**Pass B is the one place a full deep-research sweep is sanctioned** — native-first
(destination-language queries; local platforms over the English web), anti-default (the English
top-10 excluded by the sweep's own prompt — Pass A has those), dossier out (`## Discovery leads
(Pass B — native-first)` in the intake doc; the headless Pass B consumes it as T2 leads when
present, unchanged when it isn't). Rules, limits, and the never-in-CI constraint:
`research-efficiency.md` "Discovery layer" + "Pass B deep discovery". Output is T2 leads either
way — the bar never moves.

### Reconcile → ONE guide, with a ledger
Merge the two passes item by item into the single guide, and record the merge in the **`##
Research reconciliation`** table of the research ledger (`guides-intake/<slug>/ledger.md` — never
`intake.md`, which is frozen intent):
- **AGREE** (both passes land on it) → high confidence; include.
- **A-only** → is it a trap Pass B routed around? Add a crowd + best-time note, or swap to the
  authentic version B found.
- **B-only** → already T0-verified on arrival (Pass B's contract: every entry carries
  `source_url` + `verified_on`, and anything it couldn't verify was omitted, not passed on).
  Carry the citation across as-is — do NOT re-fetch what B already sourced. Re-verify only when
  you have a reason to doubt it: the value is implausible, the source is an aggregator rather
  than the venue's own page, or `verified_on` is older than this pass.
- **CONFLICT** (hours differ, "best X" differs) → resolve to the truth; record which source won
  and why.

**Coverage is machine-checked** (`scripts/check-passb-coverage.mjs`, hard-gated in CI): every
`passB.json` entry must have a written verdict in this table — including a **rejected** row when
a B lead is disproved; a silently dropped find fails the run. Name each B item in the table as
`passB.json` spells it (the matcher forgives phrasing, not absence).

The ledger proves the itinerary was corroborated, not single-sourced. A re-plan forced by
reconciliation also gets appended to the ledger's **`## Amendments`** section — that section
exists precisely so a research-forced change of plan never has to rewrite the frozen intake.

### Checkpoint each stage — the run is resumable
The pipeline tracks progress in `guides-intake/<slug>/state.json` (stages: scaffold → passA →
passB → reconcile → verified) so a long run that gets interrupted resumes instead of restarting.
**Start by running `npm run pipeline -- --slug <slug> --status`** — it shows which stages are
already cleared and the exact next action; do only the un-done ones. After you FINISH a stage,
record it — `npm run pipeline -- --slug <slug> --checkpoint <stage>` (add `--note "…"` for the
trail) — and, in the headless Action, commit so the checkpoint persists. Never redo a cleared
stage; the committed work is the resume point. (The scaffolder clears `scaffold`; you clear
`verified` only once `npm run verify` PASSes — see the done gate.)

### Authenticity & crowd-awareness — woven, not a new tab
Every marquee sight/food pick carries a **crowd reality + best-time (off-peak) note**, and a
**novel local alternative** where the obvious pick is a tourist trap — written into the existing
`sights`/`days` bodies (no new section type, no tab-budget cost). The **Travel style** intake
field sets how hard Pass B leans here (off-the-beaten-path → aggressive; bucket-list → must-see
stays, with the timing that makes it bearable). Judged by rubric row **#12** plus #9 (party fit)
and the bar test.

### Candidates considered — the consideration set is evidence (S2/S3, 2026-08-02; D3 funnel)
Record every venue/experience you EVALUATE for a ranked priority in the intake doc's `##
Candidates considered` tables, AS you research, as a 3-column row: `| Candidate | Verdict |
Shortlist |` — verdict `shipped` or `rejected: <one-line reason>`; Shortlist `y`/`n` for whether
it survived past first-pass discovery to deep verification. The funnel is broad discovery →
shortlist → deep-verify → shipped, and **shipped ⊆ shortlist ⊆ considered**: every `shipped` row
MUST also be marked shortlisted, or the gate fails naming it — shipped is never a side door
around the shortlist stage. The rejections are the point: "rejected: tourist-priced chain,
locals rank Shin Shin above it" is research evidence a survivors-only guide destroys. **Breadth
is adaptive, not a quota** (V2 — DECISIONS.md "Research breadth" supersedes the old 16/10/6
per-priority floors): research scales to the destination, and discovery stops only when new
searches mostly produce duplicates or clearly weaker options AND unresolved evidence is
unlikely to change the recommendation — a stop the run RECORDS (V2: the `saturation` record in
`evidence.v2.json`, with the trend and the unresolved-evidence answer). Verify still
cross-checks every `shipped` name against the guide and the funnel invariant, so padding the
table is expensive and an honest `rejected: couldn't verify` row is a good row. Pass B owes
coverage, not a find-count: every find still gets a written reconcile verdict, but no fixed
minimum exists — a small town's honest six finds beat a padded eight.

### Traveler questions — research never blocks on a fork
When research or reconciliation hits a REAL fork — a decision only the traveler can make (dates,
lodging style, splurge-vs-save) — emit a question card to the research ledger
(`guides-intake/<slug>/ledger.md`) under `## Questions for the traveler`, in exactly this shape
(the progress page parses it, and `scripts/pipeline.mjs questions` reads it):

```
### q-<slug>-<n>
- **Q:** <traveler-framed question — NO pipeline vocabulary>
- **Assumed:** <what you'll build if they don't answer>
- **Context:** <which section/day this affects>
- **Status:** open
```

Then PROCEED on the assumption — research never waits for an answer, and the traveler answers on
the guide's progress page whenever they get to it. **`**Assumed:**` is load-bearing**: it is what
actually ships, and what the traveler is asked to confirm or correct. Emit questions only for
genuine forks, never for facts you can research yourself. (Interactive sessions ask the creator
directly via `AskUserQuestion` instead — same bar for what counts as a fork.)

## Fact discipline — applies to BOTH passes
- Keep a **verification ledger while researching** — one row per perishable fact, captured as you
  go, not reconstructed after:

  | Claim | Value | Source (tier + URL) | Checked | Flag |
  |-------|-------|---------------------|---------|------|
  | Museum X admission | ≈ €12 adult | T0 — official site /visit | 2026-07-01 | ≈ |

- Every fact lands in exactly one **legal state** — clean · `≈` sourced-approx · `⚠` known-gap ·
  omitted · `__VERIFICATION_REQUIRED__` (unverified map place_id). **Zero bare perishable
  facts.** Full rules — including what each state does and doesn't license:
  `verification-rules.md` §4.
- **Perishable MONEY facts go in the registry, not in prose.** A guide directory carries
  `facts.json`: one record per perishable figure — `claim` · `value` · `source_url` ·
  `verified_on` · `shelf_life` · `state` (`clean` | `approx`) — and prose references it as
  `{{fact:<id>}}`. Write the row as you verify the figure, then reference it; don't type the
  number into three places and leave the next pass to reconcile them. What this buys: one edit
  updates every mention (the numeric half of the continuity sweep stops being a grep hunt), the
  citation audit walks ALL facts instead of sampling, and recert lists the stale one by id.
  Rules: **`≈` is DERIVED from `state: "approx"`** — never type it into `value`; `value` is
  inline text only (markup would bypass the prose tag allowlist); provenance is REQUIRED (a fact
  earns a row *because* it is perishable); an unresolved token FAILS the build. Ids are kebab and
  should carry the figure (`transit-passes-589-dkk`, not `transit-7`). Clock times inside a day
  plan are itinerary structure, not registry facts — leave them in prose. An existing guide is
  migrated with `node scripts/migrate-facts.mjs --slug <slug>` (propose) then `--write`; it lifts
  values VERBATIM and the built site must stay byte-identical.
- **Three more fields, optional, D2 (`docs/archive/INDEX.md → PLAN_EVIDENCE_FIRST`).** `entity` — every row from
  the SAME research batch (a venue/route/event) shares one kebab id; what a batched entity visit
  produces, not something added after the fact. `risk` (0–4) — sets the search budget
  (`research-efficiency.md`'s table); populate it as you research, from the destination's own
  weight, not by guessing after. `evidence` — a short quoted locator phrase from the source,
  required once `risk` is R3+ (a wrong plan-critical/safety fact needs a snippet a later drift
  check can search for, not just a URL that might still 200).
- **`traveler-origin` is the ONE reserved id in the registry** (D14/ADR 0001+0003,
  docs/archive/INDEX.md → PLAN_ATLAS_MIGRATION Stage B) — a different shape from every other row: `value`
  is a 3-letter IATA code, `state` is `confirmed` | `unconfirmed` (not `clean`/`approx` — "do we
  know this yet", not a sourced-approximate figure), and `source_url`/`verified_on` are optional
  UNLESS `state` is `confirmed` (a personal booking has no public URL — use `source` free text
  instead; `confirmed` still owes `verified_on` + one of the two). Never reference it as
  `{{fact:traveler-origin}}` in prose — the Atlas hub's guide-record derivation
  (`src/features/atlas/model/guide-record.ts`) reads it directly via `src/data/airports.mjs`, and
  `unconfirmed`/absent draws no globe route — honest absence, never a guessed traverse. New
  guides: capture the departure airport at intake so this row is born with the guide.
- **Structured provenance — MANDATORY on anything you write or edit.** Sections and items accept
  `source_url` + `verified_on` (YYYY-MM-DD) + `shelf_life` (`fx` 7d · `transit` 90d · `hours` 90d
  · `venue` 180d · `default` 90d, from `src/lib/staleness.ts`). Set **all three** on every
  new/edited perishable fact whose block supports them — not decoration: `verified_on` +
  `shelf_life` drive the ⚠ re-check pill travelers see, `source_url` is what it links to and what
  the weekly recert re-checks. Pick `shelf_life` by the fact, not the section title — a currency
  figure is `fx` even inside a general "Money" panel. Inline `<a href>` citations stay valid;
  `verified_on` without `source_url` is lint-flagged.
- **New guides are born `provenance: "strict"`** (guide-level field). Under strict the build
  REJECTS any `panel`/`prose`/`list`/`routes` section that uses `≈` without a `verified_on` —
  because `≈` asserts *sourced-and-approximate*, and a claim to have checked something owes the
  date it was checked. If you can't produce a date, the figure was never confirmed: downgrade it
  to `⚠` or omit it. Do not add `strict` to an existing guide without doing the backfill first —
  a half-dated guide flipped to strict just fails the build.
- **Typed guide-level features carry their own rules** — day `energy`/`env` tags, phrase cards,
  entry requirements (schema-required provenance; official immigration pages only), travel
  advisory (browser-only fetch; record even Level 1): `block-types.md` "Guide-level typed
  features" + the `days` per-type note. Research them like any fact.

## Never guess what a script can verify
- **coords / place_id** → `node scripts/lookup-place.mjs "<place>" --cc XX`
- **"is this venue still open?" / its hours / its address** → `node scripts/lookup-venue.mjs
  "<venue>, <city>" --cc XX [--check hours]` — Google Places, authoritative. `--check status`
  (default) answers *does it still exist* and is the cheap call; add `--check hours` ONLY when
  you need posted hours, since that tier has 5× less monthly headroom (script header has the SKU
  math). This is the MangoPlate guard: a venue that closed years ago reads perfectly plausible
  from training data. Returns `still_operating`, and on an hours check the venue's own site as a
  `source_url` candidate — still verify the fact against that page. No key configured → clean
  error, skip it. **Not optional at the gate (S1):** `verify --network` status-checks every
  `venues[]` item and named map point and BLOCKS on `CLOSED_PERMANENTLY` — check status when you
  ADD the venue, not at the gate.
- **time zone** → in the SAME step the coords are established (not a separate round), `node
  scripts/lookup-tz.mjs <lat> <lng>` — offline, boundary-accurate. Set the guide's `tz` field
  explicitly **for every guide, not just odd-looking ones**: the country-table fallback is a
  guess dressed as a default and fails silently (Hawaii and Arizona both shipped wrong local
  times before this script). One zero-network call — no efficiency excuse to skip it.
- **`sights` photos** → `node scripts/search-commons.mjs "<subject>"` — only a Commons-confirmed
  filename in `img.file`; if none fits, either a royalty-free `img.src` (https, `credit` +
  `license` schema-required) or no image at all. **Binding detail:
  `references/image-sourcing.md`** — read it before sourcing any photo.
- **grounding text** → `node scripts/fetch-wikivoyage.mjs "<City, Country>"` (treat its output as
  T2 leads to verify, not citable fact).

## The Living Atlas pass — after reconcile, before the verify loop
Research FEEDS the visual system. Four duties on every pass, headless or interactive (full
mechanics: `block-types.md` "Composer facets" · "Group labels & the voice standard" · "Cover
art"):
1. **Facets** — tag every authored section: `theme` (only when it differs from the group),
   `phase`, and `rank` on the intake's ranked priority themes.
2. **Descriptors** — RARE and informational-only; standard groups get NONE.
3. **Cover** — set a Commons photo only if a signature, seasonally-honest one exists; the Painted
   Atlas is the honest default.
4. **Footage scout** — candidates ONLY in the intake doc's table; never set `cover.video`.

Composition auto-applies exactly once, in the done gate — after the networked verify PASS, while
the guide is still a draft (`compose-guide.mjs --write`); once it is published it is
proposal-only, forever.

## Done gate — all of it, before calling anything finished

**The bar is `docs/standards/guide-rubric.md`** — the 13-dimension standard every guide is judged
against (P0 blocks publishing; P0+P1 = Korea-tier). `readiness` + `build` auto-enforce the P0
mechanical half; the P1 rows (venue completeness, priority depth, party fit, honest gaps) are
your judgment via the §8 self-check below. A `readiness` PASS means "no detectable errors,"
**not** "good."

**CLAUDE.md's Ship Loop governs every change and is not optional here** — build, `npm test`,
verify in `astro preview`, grep compiled `dist/`. When you grep `dist/`, confirm the fact(s) you
changed compiled through; on edits, also grep for the **stale** string to prove none survived.

Then these guide-content gates, on top of it:
1. **The self-correction loop — iterate, don't one-shot.** Run `npm run verify -- --slug <slug>`
   — the rolled-up gate (docs/reference/pipeline.md, VERIFY stage): readiness (fabrication ·
   provenance · completeness · itinerary) + a **recency** row + (with `--network`) a **content**
   row (dead links · missing Commons photos), printed as a `docs/standards/guide-rubric.md`
   scorecard with a `PASS`/`NEEDS WORK` verdict (exit 0/1). On `NEEDS WORK`, do NOT
   explain-and-move-on: fix each blocking (⚠) finding *by re-researching that fact against a
   primary (T0) source* — never silence a flag you can't source; downgrade to `⚠` or omit.
   **Re-run verify until it PASSes** (or every remaining item is a deliberately-explained `⚠`
   gap). Recency is advisory; the `citations` line is context, not a target. `npm run build` is
   the separate schema gate — both must be clean. Run `--network` before the guide can publish.
2. **The bar test — recorded, never silent.** Read the whole merged guide against the bar: "would
   this appear in ANY generic AI guide, unresearched, without knowing this traveler?" (rubric
   rows #6/#9/#12). Replace what fails it or justify it explicitly; a replacement re-enters the
   SAME ledger + continuity sweep. Log the outcome always, even "none" — see
   `verification-rules.md` §8 item 1. In CI this judgment belongs to the critic agent;
   interactively it is yours.

   **The vibe lens — how the finished trip FEELS.** The rubric scores facts; this scans flow, and
   it is the half a passing verify cannot see. Read the guide the way a well-travelled friend
   would:
   - **PACING ARC** — does the trip breathe? A packed jet-lagged arrival day? Three museum days in
     a row? A "slow" day listing six stops?
   - **GEOGRAPHY** — does any day zigzag across the city when reordering stops would halve the
     transit?
   - **MEALS & ENERGY** — are food picks where the day actually puts the traveler at mealtimes? A
     late night followed by a dawn start?
   - **TONE** — does any copy read like a brochure or a model? Flat, useful, human.
   - **INCLEMENT COVER** — does every day inside a known weather window (jangma, monsoon, rainy
     season) or anchored on a closable venue carry a researched `plan_b`, or an explicit "no good
     alternate" note in the ledger? A rain-window day with neither is a finding: the traveler will
     stand in the rain with a guide that has no answer. Never resolve this by INVENTING an
     alternate — an unverifiable one gets the honest note instead.
   - **COMMON SENSE** — whatever a friend would catch: thin buffers, a "backup" worse than
     nothing, a plan that ignores the party's stated pace.

   Judge boldly — a reorder or a swap you can justify is worth proposing even when nothing is
   factually wrong. **Judgment never lowers the bar:** a reorder or swap keeps every fact's
   provenance intact, and anything NEW it introduces (a venue, a time, a claim) is verified
   against a primary (T0) source before it ships, or it doesn't ship. A finding you judge WRONG on
   second look gets a one-line rebuttal written beneath it instead of an edit — **disagreement is
   allowed; silence is not.**
3. **Citation audit — the fidelity spot-check (REQUIRED artifact).** Sample **≥5 verified
   perishable facts** (or all of them if fewer), weighted toward prices, hours, and the anchor
   event. Fetch each fact's own `source_url` and confirm the page still supports the stated
   value. Write the result as a **`## Citation audit`** table in the intake doc — one row per
   sampled fact: claim · value · source fetched (y/n) · verdict (`supports` / `drifted → fixed` /
   `unreachable → flagged`). A drifted value is corrected and re-dated on the spot; an
   unreachable source downgrades the fact per ship/flag/omit. **A pass that ends without this
   table is not done** — the pipeline greps for it before publishing, and "sampled 5, all
   support" is the normal, short outcome. This catches the failure `verify` structurally can't: a
   live link whose page no longer says what the guide says.
4. When verify PASSes AND the bar test + citation audit are recorded: `npm run extract-palette --
   --slug <slug>` (commit the generated palette; harmless no-op without photos), then — while the
   guide is still a draft — `node scripts/compose-guide.mjs --slug <slug> --write` (the one
   moment composition auto-applies; a compose ERROR is a real finding, fix its cause), then `npm
   run pipeline -- --slug <slug> --checkpoint verified`.
5. The **`verification-rules.md` §8 self-check**, line by line.
6. **`verified` stamp** — `Checked [date] for [trip] · re-check before travel: [most perishable
   items]`; keep it `⚠`-prefixed on drafts and keep `draft: true` — you never flip that flag. The
   landing step does, after the evidence gate, and only when the gate is green.
7. **Recert pass** — any fact you touched that sits past its shelf life (`src/lib/staleness.ts`
   categories) is re-sourced from a primary source and re-dated, or visibly downgraded to `⚠` —
   never silently left presenting as verified.

## Completion report
End every pass with: `built ✓ (N sections, build + linter clean) · flagged ⚠ for re-check: […] ·
omitted for lack of source: […] · conflicts recorded: […] · citation audit: [N sampled / N
support / drift fixed]` plus the ledger. This makes the Honest gate auditable and tells the next
pass what to close.

## Scope
Edit **only** the target guide (+ its intake notes) — never other guides; leave
`map`/`weather`/`holidays` sections intact (live data). Every field validates against
`src/content.config.ts`.

