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
| Guide | `.transit-link` (≤189/guide) and `.dchip` (≤12) under the 44px floor | **DECIDED** (2026-08-12, CONTEXT.md) | Split ruling: `.transit-link` RAISE (touch-target expansion, C2); `.scrub-fit .dchip` KEEP baselined (8-10/row is a load-bearing design constraint, not neglect) — see CONTEXT.md Decisions |
| Guide | Bottom-bar slots shipped as full pills | **No gap** (2026-08-12) | `.botslot` (mobile-nav.css:41-47) matches `prototypes/Waypoint Guide Mobile.dc.html` property-for-property — closed |
| Guide | Day chips (`.dchip`) shipped as filled bordered pills | **FIX** (2026-08-12, DECIDED — CONTEXT.md) | SPEC rule 1 + 3 independent P3 sources agree: no border/radius/fill, `border-bottom` underline instead, active ground `--sunken` not `--accent`. Fix table + contrast re-derivation requirement in CONTEXT.md Decisions — implement in `planner.css` |
| Guide | Gap block (`GapBlock.astro`) and "no-cover" plate have **never rendered** | FIX (demonstrate) | **DECIDED** (2026-08-12, CONTEXT.md): demonstrate via an isolated test fixture (Playwright/vitest, mock unconfirmed-fact data) — never stage on a real/draft guide, even reverted |
| Tools | Budget sheet prints with no preview ([#47](https://github.com/Carlob2499/Trip-Guides/issues/47)) | FIX | Preview-then-print shell; `window.print()` stays synchronous with the gesture (no await before it — the popup-blocker boundary) |
| Hub | Globe pin click should fly-to + cover-hero popup ([#46](https://github.com/Carlob2499/Trip-Guides/issues/46)) | FIX | Per issue spec; do not re-tune the collision solver (SPEC §8 "do not simplify") |
| Hub/Guide | [#45](https://github.com/Carlob2499/Trip-Guides/issues/45) claims flag chip/gap/prose dots "unbuilt" | Stale issue | Close with verification links: `facts.mjs:74`, `GapBlock.astro`, `provenance-dot.js` |
| Guide | ThumbBar `seat()`/`slotLabel()`/`promoted()` | **No gap** | Verified shipped in `src/features/mobile-nav/model/rank.ts:57-89` — do not re-audit |
| Guide | Tablet model (container queries 744/1180) | **CORRECTED to FIX** (2026-08-12, A3 chunk 7 — supersedes this row's earlier "No gap") | The container query never matches: `.shell` names itself `container-name:guide` then `@container guide` tries to style `.shell` through that same name — an element can never query its own container. Tablet's two-column grid has never rendered at any width. Fix + breakpoint centralization: see "A3 Results" below and CONTEXT.md |

**KEEP-RULING register** (cite, never "fix"): no hub tools door · `GMT+9` not `KST` · no sheet
numbers on guide surfaces (`sheetOrdinal` lives for the hub index only) · Trip Split never
seeds from budget · coordinates belong to the globe, not the guide masthead · kicker split is
strict (single-city guides keep the whole kicker in the eyebrow).

### A3. Audit chunks (tick when the chunk's table rows are logged AND verdicts assigned)

- [x] **Hub desktop** vs P1 `screenshots/01–03, 13, 21` (cover, world, table, dark, light)
- [x] **Hub mobile** vs P2 `screenshots/01–04` (globe home, list scrolled, guide entry)
- [x] **Guide masthead + panels** vs P1 `04, 05, 14, 15, 17, 19` and P3 `shots/`
- [x] **Guide mobile chrome** (strip, thumb bar, sheets, journey) vs P3 `shots/` mobile set
- [x] **Tools** (4 stations) vs P1 `06, 07, 11, 12` — note jetlag is retired as a tool (reads in Plan)
- [x] **Notation family** vs P1 `16` + P3 the-gap/notation cards — dot, chip, stamp, reading, gap
- [x] **Tablet pass** at 744–1179 vs P3 `Waypoint Guide Tablet.dc.html` — the least-exercised model
- [ ] **All FIX rows implemented** (each through the full Ship Loop, §7)
- [x] **All ASK rows put to the creator** — 4 genuine forks surfaced (trip ordering, panel-title
  size, route-order picker, breakpoint scope); all answered and recorded in CONTEXT.md. Lower-
  stakes ASKs from the audit (glyph shape, motion-duration deltas, wording nits) had a sane
  default and were resolved inline per the Doctrine's own carve-out — see "A3 Results" below

### A3 Results — consolidated findings (2026-08-12, all 7 chunks, run as 7 parallel `opulent:coder`
agents against the built `dist/` — see task-notification log for full per-agent method notes:
the Browser pane didn't composite frames in this headless run, shared across all 7 agents, so
every finding below is DOM/computed-style/geometry evidence, not a screenshot. Two agents proved
their findings mechanically (forced `transition:none`, injected `@container` probe rules) rather
than resting on the unconfirmed pane — those are called out below. Ordered by severity so §7 can
work top-down; each item is independently actionable without re-reading the original reports.

#### Tier 0 — critical functional bugs (site is materially broken for a reader)

| # | Bug | File(s) | Root cause | Fix |
|---|-----|---------|------------|-----|
| T0.1 | Mobile day-scrubber shows 8 identical clipped numerals — no active day, no date, ever | `mobile-nav.css:175` `.scrub-fit .dchip{transition:flex-grow}` | The transition pins computed `flex-grow` at its base value (`planner.css:9` `.dchip{flex:none}`); only `transition:none` releases it — proven live (6.8px → 32.5px) | Remove/scope the transition so `flex-grow` resolves. **Must land before or with C2a** — C2a's re-measurement step will produce garbage numbers against a collapsed rail |
| T0.2 | Desktop + tablet tab rail (`.grail`) never sticks — scrolls fully off screen | `flight.css:51` `[data-hint-anchor]{position:relative}` vs `guide-rail/styles.css:22` `.grail{position:sticky}` | Equal specificity (0,1,0); `flight.css` loads later, `relative` wins the tie. The surviving `top:58px` displaces the box instead of sticking, so the rail also paints over the content's first 58px | Raise `.grail`'s sticky rule's specificity, or drop `position:relative` from `[data-hint-anchor]` — its own comment says it only needs a positioning context for `.nav-hint`, which `sticky` already provides |
| T0.3 | Tablet two-column layout never renders at any width | `guide.css:146,150` — `.shell{container-name:guide}` then `@container guide(min-width:744px){.shell{…}}` | An element can never match its own container query — proven by injecting a probe rule where a child received the query's value and `.shell` did not | Move the grid rule onto `.shell`'s **parent**, or rename the container so `.shell` isn't both namer and target. Same pass as the breakpoint-centralization decision below (CONTEXT.md) |
| T0.4 | 140 Korea reminder items show literal `&lt;b&gt;…&lt;/b&gt;` text instead of bold | `ReminderRow.astro:13` uses `{item.text}` | `ListBlock.astro:5` correctly uses `set:html` for the same allowlisted-`<b>` data; `ReminderRow.astro` double-escapes it | Switch `ReminderRow.astro:13` to the same `set:html` pattern |
| T0.5 | No per-section `✓ CHECKED <date>` stamp renders anywhere — 28 of 29 verified `.block`s show no evidence of verification | `staleness-ui.js:28` only draws on the unhealthy path | The per-section stamp CLAUDE.md names as enforced is unconditional; shipped code only ever surfaces staleness, never freshness | Render the stamp on the healthy path too — needs a small design pass (glyph, placement) before implementing, not a one-line fix |

#### Tier 1 — real gaps (fidelity + minor behavior), by area

**Hub** — toggle `aria-pressed` on cold load doesn't match the rendered view (`index.astro:229-230`
ships TABLE `true` while the page renders WORLD — wrong AT state pre-hydration, permanently wrong
with JS off) · quick-card CTA is a bare text link on both desktop and mobile (`atlas.css:129-132`
— should be a filled pill, breaks "no bare-text tap targets") · trip ordering to current-trip-first
— **DECIDED**, implement (CONTEXT.md) · `atlas-world.css:5-7` comment claims mobile "widens the
switch back to a full-bleed row," contradicting the shipped, correctly-ruled compact-header
behavior — fix the comment before it misleads someone into "fixing" a non-bug · P2's own
`02-home-list-scrolled.png` reference is byte-identical to `01` (md5 match) — the scrolled-state
reference this chunk was chartered against never existed · `a11y.spec.ts:840`'s entire 9-device
44px sweep only loads `/guides/korea/` — the hub has zero touch-target coverage at any width,
extend the sweep to `/`.

**Guide desktop** — panel `box-shadow` (`features/panel/styles.css:13`) — both P1 §1 and P3's
`Panel.jsx` say none, remove · missing header→body hairline inside panels (`.panel__rule`, P1 §1 +
P3 `Panel.jsx:58` agree), add · hardcoded non-token radii inside panels: `.anchor-btn` 3px
(`guide.css:625`, ×12), `.copy-addr` 4px (`guide.css:630`), `.hol-clear` 7px (`guide.css:567`) — P3
uses only 999px/50%/0, convert · grid column floor (304px vs spec 340px) and the missing >1100px
18px-gap step — no visible difference at 1440px today, align while the file's open.

**Guide mobile** — `.botbar-ind` radius `0px 0px 3px 3px`/`3px 3px 0 0` (`mobile-nav.css:84,225`)
against the binary-radius rule, flatten to 0 · bottom-bar slot height 48px vs P3's 52-54px (not a
44px-floor violation, worth matching while T0.1 touches this file) · contradictory code comments
on slot count (`mobile-nav.css:15` says five, `:32` says four; three actually render) — fix
whichever comment is wrong.

**Tools** — route order missing the SUPERSEDES §5-required Maps handoff links (`OPEN IN MAPS ↗`
per leg + one whole-day link) — `dayRouteLink()` already exists and works in the itinerary
(`DaysBlock.astro:150`), just isn't called from the tool panel (distinct, decided-scope gap —
**not** the held interactive-picker question below) · 5 radius violations: `.rm-new` 12px,
`.rm-in-label`/`.rm-in-text` 8px, `.rm-privacy` `0 6px 6px 0`, `.tools-more` 6px (inherited from a
**global** `guide.css:703 details{border-radius:6px}` hitting 17 elements site-wide — fix the
global rule, not just `.tools-more`) · hardcoded `#d98a00` (`features/firebase/styles.css:30,49,52`,
near-duplicate of `--warn` `#d9923f`) — replace with a token · dead jetlag CSS (`tools.css:77-81`)
— housekeeping, remove.

**Notation** — popover label rows (`.prov-popover dt`) render in Literata serif at
11.52px/.04em/600 with no border where SPEC §2 wants Source Sans 3 `.82rem`/`.08em`/640/1px
own-ink border — `.prov-popover` sets no `font-family` so it inherits prose serif; scope the fix to
`dt` only (`.prov-claim` is correctly Literata already) · flag chip missing
`text-transform:uppercase` (`FlagChip.jsx:15` has it, shipped doesn't — tracking without uppercase
reads as a mistake per SPEC rule 4) · flag-chip pill splits a price range on Korea
(`₩33,000 ≈ approx.–35,000 pp` — `facts.mjs:85-86` appends the pill after the value; the settled
pill ruling never covered a token that's the first half of a range) · provenance dot
`border-radius:50%` vs `ProvenanceDot.jsx`'s `999px` (visually identical on a square, but
`check-drift.mjs` doesn't catch `%` radii — switch for consistency and checker coverage) ·
stale-pill wording mismatch (popover uses SPEC wording, inline pill says
`⚠ verified <date> — re-check` — pick one, apply everywhere) · missing `✓` glyph on the CHECKED
stamp (SPEC + `notation.card.html:23`) · `.mast-stamp` border uses `--rule` where SPEC wants "1px
of its own ink" (`currentColor`) · `.cal-badge` (`DaysBlock.astro:84`) `border-radius:4px` +
`opacity:.85` over `--accent`/`--on-accent` — the opacity voids the measured contrast contract,
fix radius and drop the opacity (or re-measure at .85 and record it if kept) · flag chip's `≈`/`⚠`
glyph isn't `aria-hidden` (`FlagChip.jsx:17` has it, shipped doesn't — screen readers announce
"almost equal to approx.").

#### Tier 2 — gate/tooling hardening (fix the checkers, not just the CSS)

- `no-device-checks.test.mjs`'s `PATTERN` (`:19`) doesn't match `matchMedia(...)` — three real
  device-check violations (`day-scrub.js:20`, `mobile-nav/index.js:65`, `swipe-tabs.js:29-30`, all
  branching the navigation model on a 899px viewport query) are invisible to the gate that exists
  specifically to catch this class of bug — verbatim the regression its own header warns against.
  Add `matchMedia` to the pattern.
- `check-drift.mjs` doesn't catch `%`-radii (only literal px/rem) — the provenance-dot finding
  above would've been silent otherwise. Extend the checker, or accept `50%` on a proven-square
  element as an allowed radius synonym.
- Extend CLAUDE.md's documented false-positive class 2 (box-shadow on FAB/menu-sheet/ping-sheet)
  to explicitly name popovers — same overlay class, currently undocumented, so `.prov-popover`'s
  elevation reads as an open question on every future audit pass.

#### Open investigation — not yet a FIX row
- Route-order **interactive picker** (the stop-picker + solver, distinct from the Maps-links gap
  above) — **held**, see CONTEXT.md. Needs both surfaces (Tools station, itinerary mount) reviewed
  together before choosing a direction.

#### Backlog — content/research, not a code fix
- `closed_days` is absent from every guide in the repo — half the Closures tool renders an honest
  blank on every guide. Backfill is a research task (primary-source hours); route through
  B-workstream / the guide-author skill, not this plan's A-workstream.
- Sources tab content shape diverges across guides: US uses `<ul><li>`, Korea/Japan/Denmark use
  `<br>`/`·`-separated prose. Only US matches the P1 reference. `<ul>` is the recommended canonical
  shape (matches both the reference and the accessible-list pattern) — migrating the other three
  guides' JSON is a content edit, route through the guide-author skill's continuity discipline.
- `.gtab` (Sources tab chrome) is radius-0/no-fill where P1 shows pill tabs — this is the same
  desktop spine-rail redesign that already superseded §4's pill-tab prose elsewhere (KEEP-RULING);
  logged only so Sources isn't mistakenly reported as conforming to the stale P1 prose.
- `.mast-credit` (photo credit) uses an `rgba()` literal outside the token system — minor, batch
  with other token-literal cleanup (C1).

#### Confirmed correct — do not re-touch
Bottom-bar slots (999px pills) · SOS control · `.botslot`/`.bslot-mark` geometry · masthead plate
frame, corner ticks, text column, chip geometry · accent identity (`--accent` never re-mapped,
per-guide via `accent-tokens.ts`) · missing masthead coordinates (removed by ruling) · missing
plate-stamp number (removed by ruling) · desktop spine rail replacing the old pill-tab row · panel
radius (all 83 panels, both themes) · panel span/sort logic (`FULL_WIDTH_PANEL_TYPES`,
`panelRank()`) · collapsed-panel title kept — **DECIDED**, CONTEXT.md · panel-title size 20.8px —
**DECIDED**, CONTEXT.md · GapBlock absence (test-fixture-only, by ruling) · provenance-dot 44px
exemption (notation, not a control) · Three Jobs Rule / 18% tint ceiling (enforced by a test) ·
tablet thumb-bar-as-centred-pill · tablet station count (13, exact) · trip-split empty-state
behavior (copy wording differs from `SUPERSEDES.md` §4's quoted text, but shipped copy is
arguably better — amend the doc to match code, not the reverse) · Closures merged-panel layout
(recommend ratifying against P1's two-panel reference, not reverting — low stakes, no live ASK
needed).

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

### B2. `HANDOFF.md` (P3 top-level) diff-check — RESOLVED 2026-08-12

The 13 committed docs (`00-START-HERE` … `TOKENS.md`) were derived from it. Insurance check
that nothing was lost in derivation:

- [x] Fetch P3 `HANDOFF.md`; diff each numbered section against its committed counterpart
  (§2→COMPONENTS/BEHAVIOR, §7→FALLBACKS, §9→SUPERSEDES, §10→motion tables, §14→TESTS).
- [x] Anything present in HANDOFF.md but absent from the 13 docs: add to the right doc, same
  commit. Expected result is "nothing lost" — record that explicitly if so.

  **Nothing lost.** Fetched P3's raw top-level `HANDOFF.md` and diffed it (CRLF-normalized)
  against the committed `docs/design-handoff/design_handoff_guide_ui/HANDOFF-R5-NARRATIVE.md`:
  byte-identical, zero diff lines. The 13 derived docs already carry everything HANDOFF.md
  states.

### B3. `CLAUDE-SNIPPET.md` (P1) absorption check — RESOLVED 2026-08-12

- [x] Confirm each of its hard rules has a live home (CLAUDE.md Design Fidelity §, SPEC,
  check-drift, or a test). Known open verify: **"panel collapse is 340ms power2.inOut"** —
  confirm `docs/reference/motion.md` + shipped GSAP call agree; if they drifted, the shipped,
  tested value wins and the docs align to it.

  **Found a real drift, now corrected.** The panel-collapse claim ("GSAP, 340ms
  `power2.inOut`") never lived in `motion.md` — it lived in `BEHAVIOR.md`, `COMPONENTS.md`,
  and `Panel.prompt.md` (all P3-derived). Checked against the shipped implementation
  (`src/features/panel/ui/collapse.js` + `styles.css`): there is **no GSAP** in Panel
  collapse — it's a pure CSS transition on `grid-template-rows` + opacity, using
  `--dur-reveal: 350ms` and `--ease-out-expo: cubic-bezier(.16,1,.3,1)` (`src/styles/base.css`),
  and the grid re-sorts on the body's `transitionend` (with a hidden-tab timeout fallback in
  `ui/grid.js`) — not on a GSAP "update" tick, which doesn't exist here. Per this task's own
  rule, the shipped/tested value wins: corrected all three docs (`BEHAVIOR.md`'s motion table,
  `COMPONENTS.md`'s "Collapse motion" prose, `Panel.prompt.md`'s bullet) to state 350ms
  `cubic-bezier(.16,1,.3,1)` CSS transition, re-sort-on-transitionend, no GSAP.

  Every other hard rule in the snippet already has a live home: colour tokens + radius +
  typeface + safe-area + transform/opacity-only motion are all machine-checked by
  `check-drift.mjs`; `ANTIPATTERNS.md` covers "entrance animations on the table view," "never
  re-tune the globe/pin-card solver," and "never port `prototype/trip-split.js` back into the
  repo"; the Honest-property doctrine (never invent a fact, never soften a gap block) is the
  project's own core "What Waypoint Is" rule in `CLAUDE.md`; `ACCEPTANCE.md`'s phase gates are
  already the Ship Loop's own drift/test gates.

### B4. `shots/` triage (P3, ~45 images)

Working captures from the design iterations (`01-fin`, `02-final`, `night`, `sedona`,
`split-empty`, `sheet`, `nav`…).

- [ ] Fetch and review once; keep any capture that shows a state the committed screenshot sets
  lack (e.g. `split-empty` = Trip Split's empty state, `night` variants, Sedona single-city).
- [ ] Keepers land in `docs/design-handoff/design_handoff_guide_ui/shots/` with one INDEX.md
  line each; the rest are noted as reviewed-and-skipped. Do NOT commit all 45 blindly.

### B5. Prototype deep-read: `Waypoint Arrival.dc.html` + `Waypoint Sedona.dc.html` — RESOLVED 2026-08-12

Both exist in the repo but neither had a dedicated build ticket in R5's order.

- [x] Arrival: diff against the shipped hub Cover (CONTEXT "Cover" entry). Log divergences
  into the A-table.

  **No gap.** Compared the prototype's Cover frame (desktop + mobile) against
  `src/features/atlas/ui/cover.js` + `src/styles/atlas-cover.css` + the markup in
  `src/pages/index.astro:269-278`. Mark, wordmark, subline copy ("VERIFIED FIELD GUIDES"),
  CTA copy ("Enter the atlas"), and scroll indicator are byte-identical to the prototype.
  The prototype's own annotation ("The wordmark... FLIPs... over 620ms") matches the shipped
  `.62s cubic-bezier(.22,1,.36,1)` FLIP transition in `cover.js` exactly.
  One low-severity divergence worth a follow-up, not a ticket-blocking gap: the prototype's
  caption claims the cover dismisses on "any click, scroll or wheel," but the shipped
  listeners are only `click` and `wheel` (`cover.js:101-102`) — a touchscreen swipe/scroll
  gesture (as opposed to a tap) won't dismiss it, since `wheel` doesn't fire from touch
  scrolling. In practice this is low-impact: the whole full-viewport cover is a tap target,
  and the 4200ms auto-open timer bounds the wait either way — but if touch-swipe-to-dismiss
  is wanted, `cover.js` needs a `touchstart`/`touchmove` listener alongside `wheel`.

- [x] Sedona: diff against the shipped single-city guide rendering (strict kicker split,
  no cities row). Log into the A-table.

  **No gap — confirms the shipped behavior, doesn't match the prototype's own demo data.**
  The real shipped `us` guide's kicker (`src/content/guides/us/_guide.json`) is
  `"Sedona, Arizona — Sep 2–8, 2026"`, which `cityLine()` returns `null` for (this exact
  string is a named test case in `src/lib/plate-line.test.ts`) — so `GuideLayout.astro`
  renders no `.mast-cities` row and keeps the whole kicker in the eyebrow, exactly as the
  plan describes. The Sedona *prototype*, however, mocks a richer multi-stop trip and shows
  a "Sedona · Oak Creek · Phoenix" cities row (prototype line 86) styled like Korea's — that
  never shipped; the guide's real authored content is simpler than the prototype's demo data
  turned out to be. Categorized as prototype-only noise (illustrative placeholder superseded
  by the real content decision), not a code gap.

  The prototype's "What is absent" panel (9 honest-absence states: no cover photo, no field
  log station, no present-moment band, no day walked, nothing ticked shows its denominator,
  Trip Split reads $0.00 without seeding from the budget forecast, no resume line, no
  sourced rate, gaps rendered in ochre boxes) all map to doctrine already recorded elsewhere
  in this plan/CONTEXT.md rather than new findings — most directly, `GapBlock.astro` and the
  no-cover plate are already confirmed shipped and unit-tested (CONTEXT.md, 2026-08-12,
  §H3, this same reconciliation arc) even though no real guide has exercised the no-cover
  state in production yet. No further action.

---

## C. Workstream — Theme polish (the "enhance" half; strictly after A-rows on that surface are verdicted)

Polish serves the shipped doctrine — open-not-crowded, quiet paper/loud marks. It is paydown,
not novelty:

- [~] **C1. Drift-baseline paydown**: IN PROGRESS. `guide.css` (the named first target) is DONE
  — RADIUS 26→0, ELEVATION 6→0, 21 hand-classified radius fixes (pill/circle → 999px per the
  system's own established convention on every other `*-chip`/`*-pill`/`*-badge`/cursor:pointer
  selector in the codebase, content container → 0) plus three real box-shadows removed
  (`.cat-title`'s decorative double-line, `.card`'s resting shadow, `.card:hover`'s lift —
  edges are 1px rules, the border already carries the affordance). Found and fixed two Tier-2
  gate bugs along the way (`scripts/drift-real.mjs`): `radius-brace-capture`'s exemption regex
  accepted ANY trailing text after a valid first token, silently hiding a real asymmetric-radius
  violation (`guide.css`'s `.day-planb`, `0 6px 6px 0` — now `0`); and the single-selector
  `station-dot-ring-is-not-elevation` exemption is generalized to `ring-shadow-is-not-elevation`,
  a structural check (zero offset AND zero blur on every comma-separated layer = geometrically a
  ring, not a drop shadow) — found the identical unexempted pattern in `guide.css`'s `.day-today`
  and `mobile-nav.css`'s `.bslot-mark`/`.sheet-cat.active::before`. Re-running `--update` after
  both fixes correctly picked up stale baseline entries system-wide (categories other sessions
  had already fixed in CSS, or that the pre-existing `overlay-shadow-is-approved`/`drag` keyword
  already covered, but nobody had re-tightened): real count 153→109. Remaining, file-by-file,
  same cadence: `budget-sheet.css`/`divergences.css` COLOUR(6/5), `flight.css`/`intake.css`/
  `jetlag.css`/`map.css`/`painted-atlas.css`/`panel-preview/`/`mobile-nav.css` RADIUS+ELEVATION,
  `sights.css`/`atlas-map.js`/`firebase/styles.css`/`gmaps-render.js`/`PwaHead.astro`/
  `GuideLayout.astro`/`og`+`recap` pages/`util.js`/`accent-tokens.ts` COLOUR.
- [x] **C2a. Day-chip pill→underline fix** — DONE. `planner.css`'s `.dchip` lost `border-radius`,
  `border`, and `background:var(--card)` (→ `border:0;border-bottom:2px solid transparent`,
  `background:transparent`); `.dchip-active` ground moved from `var(--accent)` to `var(--sunken)`
  with `border-bottom-color:var(--accent)` replacing the accent border. `.dchip-active .dchip-num`
  re-derived against the new `--sunken` ground: `--accent-ink`, not `--on-accent` — `--sunken` is
  a page-family surface (`var(--bg2)`) and `--accent-ink` is base.css's own "text on a page
  surface" token, already derived (and tested, `accent-tokens.test.ts`) to hold >=4.5:1 against
  `--bg2` specifically, so this holds contrast by construction, no separate measurement needed;
  the old 3.58:1/2.56:1 comment measured the wrong pairing (`--accent-ink` on an `--accent` FILL)
  and is replaced, not left stale. `mobile-nav.css`'s `.scrub-fit .dchip` override needed no
  change — confirmed it only touches flex/padding. Verified: 1748 vitest, 18/18 a11y Playwright,
  visual walk at 375px/1440px × light/dark.
- [x] **C2b. The 44px decision implemented** — DONE. `.transit-link` (guide.css:371) got a
  touch-target expansion: real `getBoundingClientRect()` measurement (not assumed math) found
  every rendered pill's WIDTH already clears 44px (min 88.2px, icon+text content) — only height
  was short, fixed at 30.3px by `padding:.24rem .55rem` — so a padding-block-only increase to
  `.68rem .55rem` (measured 44.375px) reaches the floor with zero width growth, meaning
  `.transit-links{gap:.35rem}`'s row-wrap point is untouched and the "wraps to three lines"
  concern the original baseline comment raised never applied. Measured 0 violations across both
  target pages (`korea guide`, `hub`) and all nine devices — `TARGET_BASELINE.transit-link`
  removed from `a11y.spec.ts` entirely (not shrunk to 0), so a regression here is a real test
  failure again. `.scrub-fit .dchip`: re-measured after C2a shipped, per CONTEXT.md's §H2 update
  note — real ceiling is unchanged (8, was ≤12), since the pill→underline shape touches only
  border/fill/radius, not the `flex:1 1 0;min-width:0` math that narrows these chips.
  `TARGET_BASELINE.dchip.max` shrunk 12→8 (the real measured ceiling); the entry stays, with the
  drag/scrub-gesture rationale from CONTEXT.md, since the violation itself persists — resolving
  it is still the creator's 'whole trip at a glance' vs. 44px-floor call. CONTEXT.md's §H2 update
  note is now answered (does NOT reopen the ruling) and removed.
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

Open decisions a session must NOT settle alone. Per the 2026-08-12 creator instruction ("Execute
the plan. Judge the design forks."), items 1/3/5 were explicitly delegated to session judgment
and are now DECIDED (recorded in CONTEXT.md Decisions — do not re-litigate). Item 2 was judged by
the A3 visual/DOM-confirmation pass, now **complete** (all 7 chunks — see "A3 Results" under §A
above); its verdict is DECIDED (bottom-bar slots No-gap, day chips REVISE). Item 4 was never a
real fork — B4 already states the retention criterion; sessions apply it, they don't re-decide it.

**Round 2 — 4 new forks surfaced mid-execution by the A3 audit itself** (2026-08-12), triaged
down from ~20+ raw ASK verdicts per the Doctrine's own "one sane default doesn't need asking"
carve-out, put to the creator via `AskUserQuestion`, all now DECIDED and recorded in full in
CONTEXT.md Decisions — do not re-litigate:
6. ~~Hub trip-list ordering~~ — **DECIDED**: current-trip-first, not alphabetical.
7. ~~Panel title size (20.8px shipped vs SPEC's 1.45rem/23.2px)~~ — **DECIDED**: keep shipped
   20.8px; SPEC's guide-page prose has proven stale twice before.
8. ~~Route-order interactive picker's home~~ — **DECIDED to HOLD**: review Tools station +
   itinerary mount together before choosing a direction; logged as an open investigation in
   "A3 Results," not a FIX row.
9. ~~Tablet `@container` breakpoint fix scope~~ — **DECIDED**: centralize now, in the same pass —
   one shared breakpoint source for both the ~744px tablet threshold and the 899px mobile cutoff
   (currently hardcoded across 10 files), not a narrow scoped fix.

1. ~~The 44px density call~~ — **DECIDED**, CONTEXT.md Decisions (2026-08-12): `.transit-link`
   raises, `.scrub-fit .dchip` stays baselined. See §A2/§C2.
2. ~~SPEC rule-1 pills~~ — **DECIDED**, CONTEXT.md Decisions (2026-08-12): bottom-bar slots
   confirmed as-is (No gap); day chips REVISE (pill → underline, exact fix in CONTEXT.md and
   §A2/§C2a). Note: DesignSync is not reachable from subagents — this verdict was built from the
   repo's vendored `docs/design-handoff/design_handoff_guide_ui/` copy (prototypes, COMPONENTS.md,
   TOKENS.md), not P3's live `shots/`, since those are DesignSync-only and unreachable to a
   subagent. Sufficient evidence (3 independent sources) to decide without them.
3. ~~Gap-block demonstration~~ — **DECIDED**, CONTEXT.md Decisions (2026-08-12): isolated test
   fixture only, never a staged-then-reverted live guide edit.
4. **`shots/` retention** (B4): not a fork — apply B4's stated criterion (keeps a state the
   committed screenshot sets lack) mechanically during the triage pass.
5. ~~Drift-baseline tightening cadence~~ — **DECIDED**, CONTEXT.md Decisions (2026-08-12):
   per-commit `--update`, every commit that improves a category.
