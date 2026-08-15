# Handoff: Research Progress, New-Guide Intake, and Change Requests

## Overview

Three connected surfaces for Waypoint's guide pipeline, designed against this repository's own
tokens, motion doctrine, and stage model:

1. **Progress** — a live status page for a research run (1–2h), from request filed to guide published.
2. **New guide** — a grouped intake checklist that produces the spec a guide is researched against.
3. **Change a guide** — a two-audience surface: a traveller describing what changed, and the owner
   triaging what runs.

They exist because the current `/progress/` page reports a run as a checklist and a bar, and the
intake is a flat form. These designs keep every honest behaviour those surfaces already have and
add the parts a person waiting an hour actually needs: what is being read right now, what the agent
decided and why, and a way to intervene mid-run.

## About the Design Files

**The files in this bundle are design references created in HTML.** They are prototypes showing
intended look and behaviour — not production code to copy. This repository is Astro + vanilla JS
with hand-written CSS in `src/styles/`; these prototypes are single-file streaming components with
inline styles, which is a prototyping format, not a target architecture.

**Your task is to recreate these designs in this codebase's existing environment**: `.astro`
components for structure, a stylesheet in `src/styles/` using the existing token vocabulary, and a
module under `src/features/` for behaviour — the same shape `src/features/pipeline-progress/`
already uses (`model/` pure logic + `ui/` DOM + `gateway.ts` data access). Do not port inline
styles. Do not introduce a framework.

## Fidelity

**Start here:** read Overview -> V2 review revisions -> Integration plan, keep `screens/` open in
a second pane, and open the prototype itself whenever a measurement or state is ambiguous — it is
the ground truth for both breakpoints.

**High-fidelity, desktop and mobile both.** The mobile layout is specified, not left to the
implementer — see the Mobile section.

**High-fidelity.** Colours, typography, spacing, and interaction states are final and are taken
from `src/styles/base.css` — recreate them exactly, but by *referencing the existing tokens*, never
by copying the hex values the prototypes inline. Every value in the Design Tokens section below is
already declared in `base.css`; if you find yourself writing a literal, you have missed a token.

Two exceptions where the prototype is deliberately not authoritative:
- **Layout containers.** Prototype widths (88rem etc.) were tuned in isolation. Use the repo's own
  container models (`--read`, `.atlas-table`'s 1000px, `--gutter`) and judge the result.
- **The category palette.** "Access needs" purple (#7a4fa3) is the one colour in these designs NOT
  in `base.css`. See "Open questions" — it needs a token and a contrast gate, or a different answer.

---

## Where these pages belong — decided, with room to improve

**Implement this placement. Do not come back with questions; if you find a better answer while
you're in the code, take it and note it in the PR.**

| Surface | Entry point | Why this one |
|---|---|---|
| Progress | The Atlas table row itself. A guide mid-build already renders `.atlas-stamp--progress`; make that row link to `/progress/?slug=<slug>` instead of the guide. | Progress is a *state of a guide*, not a fourth destination. Costs zero header space. |
| Progress (return path) | The hub's existing build strip becomes the link to it. | The strip already exists and already pulses for live work. One source of "something is running" — do not add a nav badge as well. |
| New guide | The existing `＋ New guide` header CTA, unchanged. | Already there. Point it at the new intake. |
| Change a guide | The existing "Request a change" button on the guide page, unchanged — deep-link it with the slug and current tab pre-filled. | The reader is on the guide when they notice the problem. Pre-filling removes a step. |
| Owner triage | `/progress/triage/`, reachable from the hub's TOOLS menu only. | Owner-only. It has no business in traveller navigation. |

**Net header change: zero new items.** That is the point — the dense Atlas header
(`atlas-cover.css`) and the five-slot mobile bottom bar both stay as they are, and nothing needs a
responsive redesign.

Mobile follows for free: the Atlas row is already the tap target, the guide page's own button is
already in the bottom-bar flow, and triage is desktop-only by nature.

---

## Screens / Views

### 1. Progress (`Pipeline Dashboard.dc.html`)

**Purpose.** Someone waiting on a 1–2 hour research run sees that it is alive, what it is doing,
what it decided, and can intervene.

**Layout.** Full-viewport column, no page scroll on a normal desktop height (fixed floor ~820px;
below that the page scrolls rather than crushing a panel):

- Header (44px controls, 1px `--rule2` bottom border, `--card` ground)
- Demo strip (dashed bottom border) — **remove entirely in production**
- Main: two columns, `minmax(0,1.08fr) minmax(0,1fr)`, 16px gap, 16px/20px padding
  - Left column: route card (fixed height, SVG capped at 37vh) above a phases card (fills)
  - Right column: sourcing card (fixed) above a judgments log (fills)
- Note panel (fixed, bottom) — hidden entirely when the run completes
- Footer (1px top border)

**Route map.** The one visual flourish, and it is load-bearing: the plane's position IS the cleared-
stage count. Real North-Atlantic geography from `public/data/countries-110m.json`, projected
equirectangular into a `150 20 600 260` viewBox, ocean tinted `--accent` at 6%, graticule at
`--rule` 38%. A quadratic Bézier `M230.5,209.5 Q420,30 629.6,104.1` carries six waypoint stations
at t = .15/.32/.5/.66/.83/1 — the repo's real stages. Cleared stations fill `--green`; the current
one fills `--accent` and emits a 1.8s expanding ring. Flown route: 2.6px `--accent` stroke over a
7px 16%-opacity glow, both drawn by `stroke-dashoffset`; un-flown route: 1.4px `--rule2` dashed,
marching 1.6s linear.

**⚠ Two implementation facts already recorded in `docs/reference/motion.md` — honour them:**
`offset-distance` animates via neither CSS transitions nor WAAPI, so motion along a path must be
driven frame by frame; and rAF/ResizeObserver pause in a hidden tab, so every state change must
also write its exact frame synchronously and re-measure on `visibilitychange`. The prototype
positions the plane with a per-frame `setAttribute("transform", translate/rotate)` and a damped
lerp (0.06/frame) toward the true percentage, with a ±0.0012 sine drift while running. Reduced
motion places the plane at its true stage with no drift, no glow pulse, no ring, no marching dashes.

**Phases card.** Three groups (Pass A official sources · Pass B local knowledge · Critic
cross-checking), each a chip + label + status + a track. **The fill is `transform: scaleX(0..1)`
driven by a custom property — never a percentage width.** `progress.css` already made this fix
once; do not regress it. Footer row: Pages visited · Tokens burned · Kept · excluded.

**Sourcing card.** Current URL with an HTTP status (`--green` 200, `--muted` 304, `--warn` 4xx)
and a breathing dot, over a scrolling 132px `aria-live="polite"` list of recent fetches.

**Judgments log.** `aria-live="polite"`, mixed density: pipeline lines are bare `--font-data` at
.8rem; agent decisions are `--bg2` cards with a 1px `--rule` border in `--font-display` at .88rem.
Auto-scrolls to newest; entries slide up 8px over 350ms.

**Note panel — the three states.** This is the most important interaction on the page.
- *Monitoring*: 1px `--rule` top border, `--card` ground, plain input, `--ink` button.
- *Awaiting input*: 3px `--warn` top border, `--warn`-tinted ground, a warm glow
  (`0 -14px 36px` `--warn` 22%), `--warn` input border, `--warn` button reading "Answer & resume",
  a pulsing state pill, and a question card carrying the assumption ("If you don't answer: …") with
  an accept-the-assumption escape.
- *Resumed*: the same treatment in `--green`, held 3s, then back to monitoring.

**Empty state.** When nothing is running: a ghosted route with a 35%-opacity plane, "Nothing
running.", a `＋ Start a new guide` pill, "Browse guides", and a last-completed line. This is the
state a bookmarked link most often lands on — do not skip it.

**Stalled state.** No checkpoint in 20 minutes (`STUCK_THRESHOLD_MS` already exists in
`model/progress.ts`): every animation stops, the plane holds its frame, an amber notice appears, and
the note panel reframes as filing a nudge. **A pulse over a dead run is the page lying** — this is
`motion.md`'s own rule and the reason the exception for continuous motion is bounded.

### 2. New guide (`Intake and Change.dc.html`, "New guide" tab)

**Purpose.** Collect the spec before research starts, and be honest about what was assumed.

**Layout.** Centred column, max 88rem, 22px/28px padding. A sticky meter bar (completeness + time
estimate, 6px track, `scaleX` fill). Below it, six collapsible sections in a responsive grid
(`repeat(auto-fit, minmax(min(26rem,100%), 1fr))`) — the expanded section spans `1 / -1` so its
fields get full width. Order follows `docs/standards/new-guide-intake.md`: Trip · Who's going ·
Priorities · Budget · Constraints · Tone.

**Each section header:** a 22px square status marker (number → `✓` on `--green` → `!` on `--warn`),
title, one-line summary, a square stamp (done / part done / not started / assumed), and a chevron.

**Each field row:** a two-column grid (`1.35fr / 1fr`) — the control on the left with a
question-style label, an inline example, and an answered/assumed marker; on the right, in
`--font-data` at .72rem behind a 2px `--rule` left border, one short line saying what that answer
changes ("We check the weather, holidays and what's closed on your actual dates"). **Keep these
short and in the traveller's language** — an earlier draft explained the research architecture
instead, and it was rejected.

**Skipping is first-class.** "Skip this for now" stamps the section amber `assumed` and advances.
This mirrors the intake standard's own certainty fields: a bare answer reading as locked is the
documented failure this prevents.

**Priorities are head-to-head.** Five matchups over six categories; wins are tallied and the top 3
render ranked, first place filled `--accent`. Cheaper to answer than a drag-rank and it produces
the ordered top-3 the standard asks for.

**Before dispatch: the fork gate.** Starting a run reveals two clarifying questions with
recommendations, in a `--warn`-bordered card. Only once both are answered does the
"All set — see it running →" link appear. This is `revise-guide.md`'s Clarifying-Questions Doctrine
applied at intake: never silently pick a fork.

### 3. Change a guide (`Intake and Change.dc.html`, "Change a guide" tab)

Two views behind a segmented control — **"I need a change"** and **"Requests to me"**.

**Requester view.** A guide picker row: three cards, each showing that country's real outline from
`countries-110m.json`, auto-fitted to a 64×70 box with cosine-latitude correction, filled in the
guide's accent under a sky tint. The selected card fills at 62% (vs 34%), drifts 24s
`translateY(-1.5px) scale(1.05)` alternating, and pings its real city coordinates on a 2.6s stagger.

Below, two equal-height cards: a textarea ("What needs changing?") with four example starters, and
a live panel ("What we'd update") that as you type shows the affected tabs with a weight stamp
(Quick fix / Bigger job) and a plain time estimate. Each affected tab is removable before sending —
**the person describing the problem gets the last word on scope.**

Under that, "The rest of your guide": all ten tabs, with affected ones lit in their category colour
and a 2px underline drawn in over 450ms, everything else plainly `Untouched`. It answers the
question the diff panel raises — *what does this leave alone?*

**Detection is a keyword map in the prototype** (`RULES`) and is honest about being a suggestion,
not an oracle. In production this should either stay clearly advisory or be replaced by the
planner's own output; do not present a keyword guess as a plan.

**Owner triage view.** A card grid (`minmax(min(25rem,100%),1fr)`), each card colour-striped 5px by
category, carrying the category chip, who asked and when, their words verbatim, a suggested weight,
and two buttons: **Quick fix** / **Full re-check**. The card's border turns `--green` once started.
One card is the auto-filed feedback-driven request, which states plainly that nothing happens until
you decide — the owner's label is the only execution gate, per `revise-guide.md`'s locked decision.

Map the two buttons to the existing labels: Quick fix → `modify-approved`, Full re-check →
`revision-approved`. **Never surface those label strings to a traveller.**

---

## Interactions & Behavior

| Behaviour | Detail |
|---|---|
| Cross-page navigation | `@view-transition { navigation: auto }` — old 200ms, new 350ms on `--ease-out-expo`. Already the pattern in `base.css`; reuse it, don't re-declare it. |
| Page arrival | Staggered `translateY(10px)` + fade, 500ms `--ease-out-expo`, delays .02/.09/.16/.23s. Once per arrival, never on scroll-back. |
| Log entries | Slide up 8px, 350ms, on append only. |
| Route progress | Damped lerp toward true percentage; frame-by-frame plane transform; synchronous frame write on any state change. |
| Section expand | 250ms slide-up on the body; the card's `grid-column` becomes `1 / -1`. |
| Hover | Checklist cards gain a 2px bottom rule; triage cards lift 2px on `--ease-spring`; matchup buttons lift 2px and tint `--accent` 7%. |
| Press | Every control keeps the repo's `scale(.98)` active cue. |
| Theme | Persisted under `wp-theme` in localStorage and applied on mount, so it survives navigation. Production should use `src/scripts/theme.js` instead. |
| Reduced motion | Every finished frame, no entrance, no pulse, no drift. Non-negotiable. |
| Live regions | `aria-live="polite"` on the fetch list, the judgments log, and the "What we'd update" panel. |
| Touch targets | 44px minimum on every control; the prototypes hold this and the a11y gate enforces it. |

## State Management

**Progress** — extends what `model/progress.ts` already derives (`stages`, `currentIndex`,
`percent`, `elapsedMs`, `isDone`, `isStuck`). New client state: `empty` (no active run),
`paused`/`awaiting`/`processing`/`resumedFlash` (the note-panel cycle), a bounded log buffer
(40 entries) and fetch buffer (24), and per-model token tallies. Keep derivation pure in `model/`
and DOM in `ui/`; all data access through `gateway.ts`.

**New guide** — `vals` per field, `skipped` per section, `open` section, `matchIdx` + `scores` for
the matchups, `forkPicks`. Should persist to sessionStorage so a reload mid-intake is not a loss.

**Change** — `view` (requester/owner), selected `guide`, `changeText`, `dropped` tabs, per-request
`labels`. The affected-tabs list is derived, never stored.

**Data.** Nothing new server-side is required for Progress: the existing state file
(`guides-intake/<slug>.state.json`) plus the published probe covers it. Token/model tallies and the
run summary are **new data that does not exist yet** — either emit them from the workflow or leave
those panels out of v1. Do not fabricate them.

## Design Tokens

Every value below is already in `src/styles/base.css` — reference the token, never the literal.

**Light:** `--bg` #e3e7dc · `--bg2`/`--sunken` #ced5c4 · `--ink` #0f141a · `--card` #fbfcf6 ·
`--rule` #a9b39b · `--rule2` #8a9480 · `--muted` #3c4534 · `--green` #396345 · `--warn`/`--ochre`
#7f4a07 · `--crit` #b3261e · `--accent-ink` #783319.
**Dark:** `--bg` #0f1317 · `--bg2` #1a2129 · `--ink` #e8ece3 · `--card` #242c34 · `--rule` #38414b ·
`--rule2` #4e5865 · `--muted` #9aa392 · `--green` #6aab76 · `--warn` #d9923f · `--crit` #ef8a83.

**Note on `--accent`:** the prototypes use a glacier blue (#2e6f8e) because the demo guide is
Iceland. `--accent` is per-guide identity resolved by `src/lib/palettes.ts`; a run's page must take
its accent from ITS OWN guide, and never hardcode one. House default is #9c4421.

**Type.** `--font-display`/`--font-body` Literata; `--font-data` Source Sans 3. Steps used:
`--text-nano` .6 · `--text-micro` .75 · `--text-control-sm` .72 · `--text-caption` .78 ·
`--text-control` .82 · `--text-small` .88 · `--text-body` 1.02 · `--text-lead` 1.15 ·
`--text-h4`/`--text-h3`/`--text-h1` for heads. Micro-labels: uppercase, 700, `--tracking-micro`
.06em; the brand wordmark tracks .24em.

**Radius — there are exactly two.** `0` on anything holding content or evidence; `999px` on anything
you press. `check-drift.mjs` fails a third value. Status stamps are squares, not pills — a rounded
stamp reads as a button.

**Motion.** `--ease-out-expo` cubic-bezier(.16,1,.3,1) for entries; `--ease-spring`
cubic-bezier(.34,1.56,.64,1) for press/hover; `--dur-tap` 120ms · `--dur-ui` 200ms ·
`--dur-reveal` 350ms · `--dur-hero` 600ms.

**Spacing.** `--gutter` 16px phone / 18 tablet / 20 desktop. Card padding 12–16px vertical,
16–18px horizontal. Grid gaps 10–16px.

## Assets

- `public/data/countries-110m.json` — already in the repo. Used for the route map and the guide
  cards. No new assets, no new dependencies, no icon set: the plane, the pin-mark wordmark, and the
  status markers are inline SVG or CSS borders.
- The pin-mark wordmark is `atlas-cover.css`'s existing `.atlas-brand-mark` (a CSS triangle plus a
  dot). Reuse the class rather than redrawing it.

## Decisions already made — implement, don't ask

1. **"Access needs" purple.** Do not add a new colour. Use `--accent` for that category and
   distinguish it by its label, exactly as the other categories are distinguished. Rationale: a new
   pigment needs a measured contrast gate on six surfaces across two themes (the `--crit` precedent),
   and the stripe + chip + label already carry the distinction. Five categories, four existing
   tokens: dates `--accent` · access `--accent` (label-distinguished) · closed `--crit` · budget
   `--green` · preferences `--warn`.
2. **Token/cost reporting.** Omit from v1. The run-summary panel ships without the per-model rows;
   keep the layout so they can be added when the workflow emits them. Do not fabricate figures.
3. **Affected-tabs detection.** Ship the keyword map as clearly advisory — the heading stays
   "What we'd update" and the tabs stay removable. No planner call at this layer.
4. **Theme.** Use `src/scripts/theme.js`; delete the prototypes' localStorage shim.
5. **Empty and stalled states.** Both ship in v1. The empty state is what a bookmarked link most
   often hits, and the stalled state is the repo's own honesty rule made visible.
6. **Demo strip.** Delete it. It exists only to let a human step through states in the prototype.

## Integration plan — the order that keeps the build green

Four commits, each shippable on its own. Nothing here creates a new directory pattern.

**1. Progress page.** Extend what exists; do not fork it.
- `src/features/pipeline-progress/model/progress.ts` — add the note-panel state machine
  (`monitoring | awaiting | processing | resumed`) and the empty case as pure functions, beside
  `deriveProgress`. Tests beside the existing ones in the same file's `.test.ts`.
- `src/features/pipeline-progress/ui/progress.js` — add the route SVG, the log and fetch buffers,
  and the note panel. Same file, same `initProgress()` entry.
- `src/styles/progress.css` — extend with `.pg-route`, `.pg-phase`, `.pg-log`, `.pg-note`.
  Keep the existing `.pg-*` prefix; keep the `scaleX` bar fix.
- Route geometry belongs in `src/lib/` as a pure module with a test — the projection is the kind of
  arithmetic that silently drifts (`src/lib/route-optimize.ts` is the shape to copy).

**2. Intake.** `src/styles/intake.css` extends with the checklist vocabulary (keep `.itk-*`); the
flow module joins the existing intake script. Fields must come from `scripts/intake-schema.mjs` —
it is the single source of truth and a contract test guards it. Adding a field means adding it
there, not in the markup.

**3. Change request.** A new `src/features/change-request/` following the established
`model/ + ui/ + index.ts` shape, with `src/styles/change-request.css`. The keyword map is pure logic
in `model/` with a test.

**4. Triage.** Same feature folder, one more `ui/` module. Buttons map to the existing labels:
Quick fix → `modify-approved`, Full re-check → `revision-approved`. Never show those strings to a
traveller.

**Gates, per CLAUDE.md's Ship Loop:** `npm test` · `npm run build` · `astro preview` at 375px and
desktop, dark and light, reduced-motion on · zero console errors · grep `dist/` for stale tokens ·
the a11y and perf-budget gates. No new dependencies — everything here is inline SVG, CSS, and
vanilla JS.

## When it's done: retire this package

This bundle is a design reference with a finite life. The repo's own convention is that `PLAN_`
means not-yet-built and shipped work becomes documentation or is archived
(`docs/reference/revise-guide.md`'s header records exactly this rename; `docs/archive/INDEX.md` is
the index).

On the commit that lands the last of the four steps above:

1. **Fold anything durable into `docs/reference/`.** Only what a future session needs and cannot
   read from the code: the three note-panel states and their colour meanings, the stalled-run rule,
   and the route-map's frame-by-frame requirement. One short section appended to
   `docs/reference/pipeline.md` — not a new file.
2. **Add the motion to the inventory table** in `docs/reference/motion.md` (Motion · Mechanism ·
   Owner), so every moving thing on these pages has a named owner. This is required by that doc, not
   optional.
3. **Delete `design_handoff_pipeline_and_intake/` outright.** Do not move it into `docs/`. The
   prototypes are inline-styled single files that will drift from the implementation within a
   release, and a stale reference is worse than none — the same reasoning that deleted
   `src/styles/progress-preview/` and `story-open.js` rather than deprecating them.
4. **Record the closure** as one line in `docs/archive/INDEX.md` with the landing commit, and
   refresh `## Last sync` in `github.md`.
5. **Delete the demo strip and the theme shim** if any trace survived, and grep for
   `Flight Deck`, `boarding pass`, and the prototypes' literal hexes to confirm no prototype
   language leaked into shipped code.

Total permanent footprint: one appended section, one inventory row, one archive line. Everything
else is deleted.

---

## Mobile — the part the first draft did not answer

Both surfaces now specify a phone layout, and the design file carries a **preview toggle**
(Desktop / Mobile · 390) at the very top so any reviewer can flip between them in one click. That
bar is a review affordance only — **delete it in production**, like the demo strip.

### The rule: container-driven, not viewport-driven

The prototype switches on the **frame element's own width** (`ResizeObserver`, threshold **760px**),
not on `window`. Recreate it the same way — a container query (`@container (max-width: 760px)`) or
the repo's existing breakpoint mixin against the layout container, never a bare `window.innerWidth`
check. Reason: the progress panel is also embedded in the hub's build strip, where the viewport is
desktop and the container is not.

### What changes at ≤760px

**Progress**
| Desktop | Mobile |
|---|---|
| Fixed-height cockpit (`100vh`, 820px floor), panels scroll internally | Page scrolls as one column; `100svh` min, no internal-only scrolling |
| Two columns `1.08fr / 1fr` | One column, order: route → phases → sourcing → decisions |
| Route SVG capped at `37vh` | Capped at **230px** — still legible, never eats the fold |
| Nav inline in the header | Nav drops to **its own full-width row** (`order:3`), horizontally scrollable, scrollbar hidden, each item ≥40px |
| Note panel sits in flow at the bottom | Note panel is `position:sticky; bottom:0` — **the intervention control is always reachable**; input stacks above the button (`flex-direction:column`) |
| Demo strip label + chips inline | Label hidden, chips scroll horizontally |
| Run summary stats 4-up | 2-up |
| Fetch list 132px | 108px |
| Decisions log fills remaining height | Fixed **300px** min so it can't collapse to nothing |
| Card padding 18px | 13px; gutters 14px; base font 16px |

Text in the decisions log uses `overflow-wrap:anywhere` — agent judgments contain URLs and long
proper nouns and were clipping at 390px.

**New guide**
- Section grid collapses to one column; an expanded section no longer needs `grid-column: 1/-1`.
- Field rows go from `1.35fr / 1fr` to a single column: control first, then the
  "what this changes" note under it with its 2px `--rule` left border intact.
- Head-to-head matchups stack vertically (A above VS above B), each button ≥60px tall.
- Status stamps get `white-space:nowrap` — "NOT STARTED" was wrapping out of its box.
- The sticky completeness meter stays sticky; it is the only orientation on a long phone scroll.

**Change a guide**
- Guide picker cards go full-width (`min-width:100%`), keeping the 64px country-outline block.
- The textarea and the "What we'd update" panel stack, textarea first.
- "The rest of your guide" tab grid uses `minmax(7.5rem, 1fr)` → two columns at 390px.
- Segmented control (I need a change / Requests to me) spans full width.
- Triage cards one per row, 5px category stripe unchanged.

### Mobile acceptance — hard numbers

1. No horizontal page scroll at **320, 360, 390, 414, 768** px. `document.documentElement.scrollWidth`
   must equal `clientWidth` at every one.
2. Every control ≥**44px** touch height (the intake option chips are 40px by design inside a 44px
   row — measure the row, not the chip).
3. The note panel is visible without scrolling on a 390×844 viewport in every run state.
4. The route SVG never exceeds 230px tall and its labels stay legible (10.5px at the SVG's own
   scale — do not shrink the viewBox to fit).
5. Reduced motion: no drift, no pulse, no marching dashes, plane at its true stage — same as desktop.
6. Dark mode at 390px on all three surfaces.

### Header / nav — unchanged, still

Nothing above changes the repo's five-slot mobile bottom bar or the Atlas header. Progress is still
reached from the Atlas row and the build strip; New guide from the existing header CTA; Change from
the guide page's own button; triage from TOOLS. **Net new nav items on mobile: zero.**

---

## Screenshots — `screens/`

Every frame is the FINAL V2 prototype. Where a screenshot and this document disagree, the
document wins. Desktop frames were captured at ~910px (already in the compact single-column
tier — at >=1000px container width the Progress page becomes two columns as specced above).

**Desktop (`NN-desktop.png`)**
| # | What you are looking at | Verify against |
|---|---|---|
| 01–02 | Progress landing, run just started | header, scrubber rail, notify opt-in bar |
| 03 | Running mid-Pass B — plane mid-route, phases filling | route card, stage colours |
| 04 | Paused for an answer — bottom of page | 3px warn border, glow, question card, "Answer & resume" |
| 05 | Stalled — all motion stopped | amber notice, dead animations |
| 06 | Complete — top | 100%, green stations |
| 07 | Complete — run summary | traveller-language rows, "Cost to research", right-aligned figures |
| 08 | Nothing running (empty state) | ghosted route, start CTA |
| 09 | New guide checklist | sticky meter, section stamps |
| 10 | Priorities section open | head-to-head matchup |
| 11 | Change a guide, nothing typed | starter chips ABOVE textarea, example ghost tabs in right panel |
| 12 | Change with real sentence typed | derived affected tabs, weight stamp |
| 13 | Section map with legend row | Redone/Checked/Untouched one-line cells |
| 14 | Pending requests (owner triage) | category stripes, Quick fix / Full re-check |

**Mobile 390px (`NN-mobile.png`)** — same flows: 01–05 Progress running (header rows, sticky
route card, phases, sources); 06 paused with sticky note panel; 07–08 complete + summary 2×2
stats; 09 empty; 10–11 New guide; 12–16 Change: picker, typed request, section map, triage.

---

## V2 review revisions — supersede anything above that conflicts

The user reviewed the combined `Waypoint V2.dc.html` in detail. These decisions are final:

- **Demo controls are a single labelled select** ("Demo state: Running/Waiting/Stalled/Done/No run") under the run scrubber, behind a dotted rule. Both the scrubber's stage rail (tap a stage to jump) and the select are prototype-only — delete in production.
- **The run scrubber replaced the old pill strip**: a full-width track + six tappable stage labels. In production the track/stages stay (read-only), the jumping goes.
- **No dev language anywhere.** The run summary is traveller-facing: "Official sources first / Then local knowledge / Everything cross-checked" + "Cost to research". No model names, no token counts (the "Facts verified" counter replaces "Tokens burned"), no repo paths ("Reykjavík · 10 sections", never guides/iceland/).
- **Notifications** (user-decided): opt-in asked ONCE when a run starts (inline bar, "Notify me" / "No thanks"); channels are browser push + tab-title badge (●) only; events are exactly two — run needs an answer, run finished. A quiet "Notify me / Notifications on" text toggle lives in the note panel. Push permission must be requested from the button gesture; iOS Safari needs home-screen install, title badge is the fallback.
- **"Worth knowing" card** (new, under the route map): date-specific finds surface progressively during the run (clock-change mid-trip, F-road closures, tyre law, etc.), browsable ‹ ›, counts on completion. Data must come from the pipeline's own findings — the prototype's NUGGETS array is demo content.
- **Note panel**: heading is state-driven plain language ("Add to the research" / "One answer needed" / "Research is stuck"), one aligned row, no hint line.
- **Header**: nav "1 RUNNING" badge hidden on the Progress page itself (the status pill carries it); theme toggle is an icon button (moon/sun); on mobile the status pill + elapsed share one full-width row, nav gets its own scrollable row.
- **Fluid scaling**: base font clamp(15–18.5px), all paddings/gaps/panel heights clamp(), single column below 1000px container width, mobile below 760 — all container-driven (ResizeObserver in the prototype; container queries in production).
- Change tab: segmented control is full-width halves ("I need a change" / "Pending requests" — never "Requests to me"); starter chips sit ABOVE the textarea; tab map is titled "Your guide's 10 sections — what we'd touch" with the Redone/Checked/Untouched legend sentence.

## Verifier checklist — run every line before you call it done

Tick these in the PR body. Each one is checkable in under a minute; several exist because the
prototype got them wrong first.

**Layout**
- [ ] `scrollWidth === clientWidth` at 320 / 360 / 390 / 414 / 768 / 1280 / 1920.
- [ ] At 760px exactly, the layout is in its mobile form; at 761px, desktop.
- [ ] Progress at 1280×800 shows no page scrollbar; at 1280×700 the page scrolls rather than
      crushing a panel.
- [ ] The switch is driven by the container, not `window` — grep for `innerWidth`, expect none.

**Motion (`docs/reference/motion.md`)**
- [ ] Plane position is written frame by frame; no `offset-distance` transition or WAAPI animation.
- [ ] Any state change writes its exact frame synchronously, and re-measures on `visibilitychange`.
- [ ] Stalled run: every animation stopped — dot, ring, dashes, glow, plane drift.
- [ ] Phase bars animate `transform: scaleX()`, never `width`.
- [ ] `prefers-reduced-motion: reduce`: no entrances, no pulse, no drift; final frames only.
- [ ] Every moving thing has a row in the motion inventory table.

**Tokens & drift**
- [ ] `check-drift.mjs` passes; exactly two radii (0 and 999px) in the new CSS.
- [ ] No literal hex in the new CSS or JS — grep the prototype hexes (`#2e6f8e`, `#7a4fa3`,
      `#e3e7dc`, `#fbfcf6`), expect zero hits in `src/` and `dist/`.
- [ ] Accent comes from the run's own guide via `palettes.ts`; no hardcoded glacier blue.
- [ ] Status stamps are square; pressable things are 999px.
- [ ] "Access needs" uses `--accent`, label-distinguished. No new pigment.

**Content & honesty**
- [ ] No aviation vocabulary in shipped copy: grep `Flight Deck`, `boarding`, `cockpit`, `fare`.
- [ ] No model names or token counts anywhere a traveller can see. "Cost to research" as one plain dollar line is allowed; grep for "Claude", "tok", "Total fare" — expect zero in shipped copy.
- [ ] `modify-approved` / `revision-approved` never rendered to a traveller.
- [ ] Skipped intake sections read `assumed` and say what was assumed.
- [ ] "What we'd update" is framed as advisory; every affected tab is removable.
- [ ] Empty and stalled states both reachable and correct.

**Accessibility**
- [ ] 44px minimum on every control at every breakpoint (measure the row for the 40px chips).
- [ ] `aria-live="polite"` on the fetch list, the decisions log, and the update panel.
- [ ] Full keyboard pass on the intake: tab order follows reading order, sections toggle on Enter
      and Space, `aria-expanded` tracks state.
- [ ] Contrast gate passes on both themes, including the amber awaiting-input panel.
- [ ] The a11y gate and the perf budget both pass.

**Cleanup**
- [ ] Preview toggle bar deleted.
- [ ] Demo strip deleted.
- [ ] localStorage theme shim replaced by `src/scripts/theme.js`.
- [ ] Zero console errors and zero warnings on all three surfaces, both themes, both breakpoints.
- [ ] `npm test` and `npm run build` green; `astro preview` walked at 375px and desktop.

## Files

**Run the prototype: open `design/Waypoint V2.dc.html` in any browser.** No build step. Use the
black Preview bar (Desktop / Mobile · 390) to flip layouts, and the "Demo state" select on the
Progress page to step through Running / Waiting / Stalled / Done / No run. Everything in the
Preview bar and the Demo row is prototype tooling — none of it ships.

- `design/Waypoint V2.dc.html` — **the single source of truth.** All three surfaces, both
  layouts, every state.
- `design/support.js`, `design/public/data/countries-110m.json` — runtime + geodata the
  prototype loads; the JSON is the same file already in the repo at `public/data/`.
- `screens/` — 30 captioned reference frames (index above).
- The project root’s `Pipeline Dashboard.dc.html` and `Intake and Change.dc.html` are earlier
  split versions — superseded, do not implement from them.

## Repo files these designs were built from

`src/styles/base.css` (tokens, reset, 44px floor) · `src/styles/progress.css` ·
`src/styles/flight.css` · `src/styles/atlas.css` (stamps, sheets, chips) · `src/styles/atlas-cover.css`
(header, brand mark) · `src/styles/intake.css` · `docs/reference/motion.md` (the doctrine, and the
work-in-progress amendment that licenses this page's motion) · `docs/standards/new-guide-intake.md` ·
`docs/reference/revise-guide.md` (the triage model, model routing, fork gate) ·
`src/features/pipeline-progress/**` · `public/data/countries-110m.json`.

**Read `docs/reference/motion.md` before writing any animation here.** Its rules are not
suggestions and two of them were learned by forcing failures.
