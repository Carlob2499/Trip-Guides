# PLAN — Design Reconciliation (the three Claude Design projects ⇄ the shipped site)

> **Status: ACTIVE.** This is the only design work order. `PLAN_ATLAS_MIGRATION.md` and the R5
> build order are DONE and ARCHIVED — do not re-read them except to answer "how did X get its
> shape". When every box here is ticked, move this file to `docs/archive/` and record the
> closeout in `docs/handoff.md`. A finished plan is referenced when asked for, never re-read
> by default.

**Written:** 2026-08-12 · **By:** the survey session that read all three live projects.
**Executor:** future Claude Code sessions (interactive or headless), one workstream chunk at a
time. Every session that picks this up: read this file, run the Clarifying-Questions ritual
(§8), do a chunk, tick its boxes, update HANDOFF.

---

## 0. Sources and authority

The three Claude Design projects (readable via `DesignSync get_file`; IDs are stable):

| # | Project | ID | Maps to repo |
|---|---------|----|--------------|
| P1 | WayPoint Globe Guide Hub Initial Design | `4d62dfbc-1f00-4bab-85f6-a8a42ab2adb7` | `docs/design-handoff/` (DESIGN.md, prototype/, screenshots/, enforcement/ = its `waypoint_anchors/`) |
| P2 | WayPoint Mobile App Design | `dc9dd778-097b-4f2e-9a15-de44d9d1dd24` | `docs/design-handoff/prototype/atlas-mobile-home/` |
| P3 | # WayPoint Guide UI Redesign | `dbfd3129-6517-40de-9e6e-5d77ad9566fc` | `docs/design-handoff/design_handoff_guide_ui/` |

**Authority order (creator ruling, 2026-08-12, this arc):**

1. **CONTEXT.md recorded Decisions** — standing rulings SURVIVE this migration. Where a
   prototype contradicts one (hub tools door, KST abbreviation, sheet numbers on guide
   surfaces, Trip Split seeding), the ruling wins and the divergence is *by design* — record
   it as `KEEP-RULING` in the audit table, never "fix" it toward the prototype.
2. The prototypes/screenshots (per surface: P1 for hub, P2 for mobile home, P3 for guide UI).
3. `docs/design-handoff/enforcement/SPEC-COMPONENTS.md` → `ANTIPATTERNS.md`.
4. Your judgment.

**Scope guards (unchanged from R5 FALLBACKS §4):** design work never edits
`src/content/guides/` JSON. The projects contain stale copies of guide content (P1 has whole
guide trees; P3 has `src/content/guides/korea/02-essentials.json`) — these are workspace
props, NOT content sources. Never mine them; the repo's guide dirs are the only content truth.

**Survey verdicts already established (do not re-derive):**

- P2 is **fully absorbed** — every file has an identical-provenance repo copy.
- P1 is absorbed except `waypoint_anchors/CLAUDE-SNIPPET.md` (largely evolved into CLAUDE.md's
  Design Fidelity section; one value to verify — §B3).
- P3 is absorbed except top-level `SKILL.md`, `shots/` (~45 working screenshots), and
  `HANDOFF.md` (the R5 work-order predecessor of the 13 committed docs; diff-check §B2).
  P3's top-level design-system files are byte-identical to the committed snapshot — no newer
  design hides there.
- The projects now **lag the repo**: commit `5928f9f` fixed the kit's pre-R5 daylight palette
  (`#783319` aink, lifted raws) in the repo and the "Design System" ds-project
  (`ef8458ac-…`), but P1/P3's own token copies still carry the stale values. §C4 syncs them.
- The shipped site passes all gates as of `5928f9f`: build/lint/typecheck clean, 1734 vitest,
  225 Playwright, drift 150 vs baseline 153.

---

## A. Workstream — Fidelity audit (shipped site vs the three projects)

Goal: a complete divergence table, then fixes. Every row gets one of three verdicts:
`FIX` (site falls short of design — repair it) · `KEEP-RULING` (divergence is a recorded
decision — cite it) · `ASK` (a genuine fork — put it to the creator, never guess).

### A1. Method (every audit session)

1. `npm run build && npx astro preview --port 4322` — audit the **production** build, never dev.
2. Drive with the ui-checker lane (or Browser pane): capture at **375px, 744px, 1440px**, in
   **day AND night** (`data-field`), and once with `prefers-reduced-motion: reduce`.
3. Compare against the project's own screenshots — P1 `screenshots/01–21`, P2
   `screenshots/01–04`, P3 `shots/` (fetch via `DesignSync get_file`, base64) — **not** just
   the prose spec. (This is the lesson of 2026-08-08: the toggle-bar and contour bugs were
   invisible to the prose and obvious in the pictures.)
4. Log every divergence in the table below (extend it in place). Run
   `node docs/design-handoff/enforcement/check-drift.mjs <path>` on touched styles; its three
   known false-positive classes are documented in CLAUDE.md — do not rediscover them.

### A2. Pre-seeded findings (verified this session — start here, don't re-find)

| Surface | Finding | Verdict | Action |
|---------|---------|---------|--------|
| Guide | `.transit-link` (≤189/guide) and `.dchip` (≤12) under the 44px floor | **ASK** (open since R5) | The density call in `tests/visual/a11y.spec.ts` `TARGET_BASELINE` — creator decides; counts may only shrink |
| Guide | Bottom-bar slots + day chips shipped as full pills; kit mobile shots ambiguous | **ASK** | SPEC rule 1 visual confirm against P3 `shots/` mobile captures |
| Guide | Gap block (`GapBlock.astro`) and "no-cover" plate have **never rendered** | FIX (demonstrate) | Stage a demonstration: one real unconfirmed sight or a cover-less draft; screenshot both states; then revert if staged |
| Tools | Budget sheet prints with no preview ([#47](https://github.com/Carlob2499/Trip-Guides/issues/47)) | FIX | Preview-then-print shell; `window.print()` stays synchronous with the gesture (no await before it — the popup-blocker boundary) |
| Hub | Globe pin click should fly-to + cover-hero popup ([#46](https://github.com/Carlob2499/Trip-Guides/issues/46)) | FIX | Per issue spec; do not re-tune the collision solver (SPEC §8 "do not simplify") |
| Hub/Guide | [#45](https://github.com/Carlob2499/Trip-Guides/issues/45) claims flag chip/gap/prose dots "unbuilt" | Stale issue | Close with verification links: `facts.mjs:74`, `GapBlock.astro`, `provenance-dot.js` |
| Guide | ThumbBar `seat()`/`slotLabel()`/`promoted()` | **No gap** | Verified shipped in `src/features/mobile-nav/model/rank.ts:57-89` — do not re-audit |
| Guide | Tablet model (container queries 744/1180) | **No gap** | Verified shipped `src/styles/guide.css:150-153` |

**KEEP-RULING register** (cite, never "fix"): no hub tools door · `GMT+9` not `KST` · no sheet
numbers on guide surfaces (`sheetOrdinal` lives for the hub index only) · Trip Split never
seeds from budget · coordinates belong to the globe, not the guide masthead · kicker split is
strict (single-city guides keep the whole kicker in the eyebrow).

### A3. Audit chunks (tick when the chunk's table rows are logged AND verdicts assigned)

- [ ] **Hub desktop** vs P1 `screenshots/01–03, 13, 21` (cover, world, table, dark, light)
- [ ] **Hub mobile** vs P2 `screenshots/01–04` (globe home, list scrolled, guide entry)
- [ ] **Guide masthead + panels** vs P1 `04, 05, 14, 15, 17, 19` and P3 `shots/`
- [ ] **Guide mobile chrome** (strip, thumb bar, sheets, journey) vs P3 `shots/` mobile set
- [ ] **Tools** (4 stations) vs P1 `06, 07, 11, 12` — note jetlag is retired as a tool (reads in Plan)
- [ ] **Notation family** vs P1 `16` + P3 the-gap/notation cards — dot, chip, stamp, reading, gap
- [ ] **Tablet pass** at 744–1179 vs P3 `Waypoint Guide Tablet.dc.html` — the least-exercised model
- [ ] **All FIX rows implemented** (each through the full Ship Loop, §7)
- [ ] **All ASK rows put to the creator** and their answers recorded in CONTEXT.md if fork-settling

---

## B. Workstream — Mine the unshipped material

### B1. `SKILL.md` → a repo skill (NEW, highest-value item)

P3 carries a finished, well-written `waypoint-design` skill (brand rules, the five failure
modes, build-start instructions). Nothing like it exists in the repo.

- [ ] Port to `.claude/skills/waypoint-design/SKILL.md` with its `readme.md` +
  `styles.css` + `components/` + `guidelines/` references pointed at
  `docs/design-handoff/design_handoff_guide_ui/design-system/` (the repo copy — do not
  duplicate the asset tree into the skill).
- [ ] Its token values must reference the post-`5928f9f` corrected files (they already live in
  the repo copy).
- [ ] Verify the skill loads and triggers (one throwaway invocation in a test session).

### B2. `HANDOFF.md` (P3 top-level) diff-check

The 13 committed docs (`00-START-HERE` … `TOKENS.md`) were derived from it. Insurance check
that nothing was lost in derivation:

- [ ] Fetch P3 `HANDOFF.md`; diff each numbered section against its committed counterpart
  (§2→COMPONENTS/BEHAVIOR, §7→FALLBACKS, §9→SUPERSEDES, §10→motion tables, §14→TESTS).
- [ ] Anything present in HANDOFF.md but absent from the 13 docs: add to the right doc, same
  commit. Expected result is "nothing lost" — record that explicitly if so.

### B3. `CLAUDE-SNIPPET.md` (P1) absorption check

- [ ] Confirm each of its hard rules has a live home (CLAUDE.md Design Fidelity §, SPEC,
  check-drift, or a test). Known open verify: **"panel collapse is 340ms power2.inOut"** —
  confirm `docs/reference/motion.md` + shipped GSAP call agree; if they drifted, the shipped,
  tested value wins and the docs align to it.

### B4. `shots/` triage (P3, ~45 images)

Working captures from the design iterations (`01-fin`, `02-final`, `night`, `sedona`,
`split-empty`, `sheet`, `nav`…).

- [ ] Fetch and review once; keep any capture that shows a state the committed screenshot sets
  lack (e.g. `split-empty` = Trip Split's empty state, `night` variants, Sedona single-city).
- [ ] Keepers land in `docs/design-handoff/design_handoff_guide_ui/shots/` with one INDEX.md
  line each; the rest are noted as reviewed-and-skipped. Do NOT commit all 45 blindly.

### B5. Prototype deep-read: `Waypoint Arrival.dc.html` + `Waypoint Sedona.dc.html`

Both exist in the repo but neither had a dedicated build ticket in R5's order.

- [ ] Arrival: diff against the shipped hub Cover (CONTEXT "Cover" entry). Log divergences
  into the A-table.
- [ ] Sedona: diff against the shipped single-city guide rendering (strict kicker split,
  no cities row). Log into the A-table.

---

## C. Workstream — Theme polish (the "enhance" half; strictly after A-rows on that surface are verdicted)

Polish serves the shipped doctrine — open-not-crowded, quiet paper/loud marks. It is paydown,
not novelty:

- [ ] **C1. Drift-baseline paydown**: 150 real violations (`scripts/drift-baseline.json`,
  sums 153; two categories already under). Work file-by-file; after each drop, re-run
  `npm run drift` and tighten the baseline with `--update` in the same commit so improvement
  can't regress. Target: guide.css RADIUS(25) and ELEVATION(4) first — highest counts.
- [ ] **C2. The 44px decision implemented** (whichever way the creator ruled in A2) and
  `TARGET_BASELINE` shrunk or removed.
- [ ] **C3. Print**: the #47 preview shell shipped; `PRINT SHEET` force-opens every
  `[data-fold]` and hides every `[data-noprint]` (assert in a Playwright print test).
- [ ] **C4. Sync the projects forward**: push the corrected token files back to P1
  (`waypoint_anchors/tokens.css` if stale) and P3 (both levels of `tokens/colors.css`,
  the two color cards, `readme.md`) via `DesignSync finalize_plan`+`write_files`, so the
  design projects stop lagging the repo. Also fix the residual kit defects found 2026-08-12:
  `--emergency-red-dark: #ef5350` → `#ef8a83`, and the kit serif stack missing the CJK
  fallbacks (`'Literata Variable', Georgia, 'Times New Roman', AppleMyungjo, Batang,
  'Noto Serif CJK KR', serif`) — fix in repo first, then re-upload the touched files to the
  ds-project (`ef8458ac-…`) too.
- [ ] **C5. Final polish walk**: all four guides + hub at 375/744/1440, day+night,
  reduced-motion, keyboard-only — nothing escapes its container, nothing focusable in a
  closed sheet, every control ≥44px or in the (shrunk) baseline with its reason.

---

## D. Fallbacks — where the designs don't account for Waypoint reality

The prototypes show one healthy state of everything (P3 HANDOFF §16 admits this). Junior
sessions MUST apply these rules when the design is silent; they are settled, not open:

| Situation the design omits | The rule |
|---|---|
| Guide with no `learnings` record (Japan, Sedona) | No Field log station renders — absent means not in the DOM |
| Guide with no `days` block, group with no sections, day with no stops | Station/section simply absent; never an empty shell reserving space |
| Single-city kicker | Strict split: no cities row; whole kicker stays in the eyebrow |
| Unconfirmed/absent departure fact | No globe traverse — an honest blank until the booking confirms |
| Live rate fetch fails | Fallback table + label; never silently show a stale number as live |
| Photo 404 / no cover | The no-cover plate (empty plate, not grey box); credit derived from URL or absent |
| Trip Split with no expenses | The empty state IS the design: `$0.00`, no nets, "Nothing recorded yet" |
| Unconfirmed fact where a figure would go | The gap block — reading scale, ochre, WHAT TO DO INSTEAD; never filler prose |
| Container queries unsupported | No `@container` rule matches → phone model (already the shipped fallback, guide.css:180) |
| A fork the design didn't decide and no ruling covers | **ASK. A headless run records the fork and stops; it does not guess** |

---

## E. What is explicitly OUT of scope

- Guide content edits of any kind (facts, prose, JSON) — separate arc, guide-author skill.
- Re-tuning the globe or the pin-card collision solver (SPEC §8).
- A third theme/palette (Glare was built and deleted — stays deleted).
- New tools or new tab groups (doctrine decision, not a design decision).
- Porting prototype `.js` over the shipped TypeScript models (`rank/yield/gesture/settle` are KEEP).

---

## F. Gates — the definition of "finished" (user's standing order for this arc)

A chunk is done only when: **build → lint → typecheck → vitest (1734+) → relevant Playwright →
`astro preview` :4322 walk (375+1440, dark, reduced-motion) → `check-drift` on touched paths →
grep `dist/` for stale strings → commit → push → CI green.** The five named gates from P3
HANDOFF §14 (`var-defined`, `type-scale`, `atlas-tokens`, `a11y` closed-sheet probe,
`mobile-nav` model tests) are all live in the repo suite — if one fails, the design is wrong,
not the test. Polish (C5) is part of done, not an optional coda. The plan itself is done when
every box above is ticked; then archive it (header ritual) and close the loop in HANDOFF.

---

## G. Suggested execution order (flexible — chunks are independent unless noted)

1. **B1** (skill port — small, immediately raises every later session's design quality)
2. **A2 stale-issue hygiene** (#45 close) + the two **ASK** rows put to the creator
3. **A3 audit chunks**, any order; hub and guide can run in parallel sessions
4. **A FIX rows** + **B2/B3/B5** as they surface material
5. **C1–C5** polish, then **C4** project sync-back last (so projects receive the final state)

---

## H. Clarifying questions (per-session ritual — Clarifying-Questions Doctrine)

Open decisions a session must NOT settle alone. Put unanswered ones to the creator via
`AskUserQuestion` at session start; record settlements in CONTEXT.md Decisions:

1. **The 44px density call** (A2): raise `.transit-link` (wraps day-card link rows) and/or
   `.dchip` (gives up whole-trip-in-one-row), or keep both baselined? — *the* open design fork.
2. **SPEC rule-1 pills** (A2): bottom-bar slots + day chips as full pills — confirm or revise
   against P3 shots.
3. **Gap-block demonstration** (A2): stage it on a draft, or wait for a real research gap?
   (Staging conflicts with "never invent a gap"; a staged-then-reverted demo may be
   acceptable as a test fixture only — creator's call.)
4. **`shots/` retention** (B4): which working captures earn a committed home?
5. **Drift-baseline tightening cadence** (C1): per-commit `--update` (recommended, prevents
   giveback) or milestone-only?
