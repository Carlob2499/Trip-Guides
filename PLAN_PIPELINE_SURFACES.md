# PLAN — Pipeline Surfaces (Progress · New guide · Change a guide)

> Executor: an autonomous **Sonnet 5** session on branch `design/pipeline-surfaces`.
> This plan is the execution contract for the design handoff at
> `design_handoff_pipeline_and_intake/` (committed on this branch, deleted at the end).
> Written 2026-08-15 by the orchestrating session after reading the full bundle and the
> current codebase. The four creator decisions below are already made — do not re-ask them.

---

## Authority order (highest wins)

1. **This plan's "Reconciliations" section** — it corrects the bundle where today's refactor
   (`6ca5568` + Worker commits) made the bundle stale.
2. `design_handoff_pipeline_and_intake/README.md` — the spec. Its **"V2 review revisions"**
   section supersedes anything above it that conflicts; its **"Verifier checklist"** is the
   done-definition.
3. `design_handoff_pipeline_and_intake/design/Waypoint V2.dc.html` — ground truth for any
   measurement, state, or layout ambiguity, at both breakpoints (open it in a browser; the
   Preview bar flips Desktop/Mobile · 390, the "Demo state" select steps the run states).
4. `design_handoff_pipeline_and_intake/screens/` — 30 captioned frames (index in the README).
   Where a screenshot and the README disagree, the README wins.
5. The root `Pipeline Dashboard.dc.html` and `Intake and Change.dc.html` are **superseded
   earlier drafts — never implement from them.**

Repo doctrine that binds every commit: `CLAUDE.md` (already loaded), `docs/reference/motion.md`
(**read before writing any animation** — `offset-distance` cannot be transitioned or WAAPI-driven;
frame-by-frame transform writes; synchronous frame write on state change; re-measure on
`visibilitychange`; a pulse over a dead run is the page lying), `docs/design-handoff/enforcement/`
(`check-drift.mjs` + its three known false-positive classes, see CLAUDE.md), and the Ship Loop.

## Read before writing a line of code

- `design_handoff_pipeline_and_intake/README.md` — in full. Then keep `screens/` open.
- `docs/reference/motion.md` and `docs/reference/pipeline.md` (the two-lifecycles model).
- `src/styles/base.css` (token contract), `src/styles/progress.css`, `src/styles/intake.css`,
  `src/styles/atlas.css`, `src/styles/atlas-cover.css` (brand mark, header vocabulary).
- `src/features/pipeline-progress/` — all of it (`model/progress.ts`, `model/proposals.ts`,
  `gateway.ts`, `ui/progress.js`, `index.ts`, tests, mocks).
- `src/features/change-request/` — all of it (model, ui, gateway, styles).
- `src/pages/progress/index.astro`, `src/pages/new.astro`, `scripts/intake-schema.mjs`
  (+ its contract test), `worker/index.mjs` header comment (endpoint list), `worker/README.md`.
- `src/scripts/theme.js`, `src/lib/palettes.ts`, `src/lib/contours.ts`,
  `src/lib/route-optimize.ts` (the shape to copy for the new geometry module).

---

## Reconciliations — where this plan overrides the bundle README

The bundle was synced this morning but the repo refactored underneath it. These five corrections
are **settled; implement them, don't re-derive them**:

1. **Triage buttons → Worker front door, not labels.** The README's mapping (Quick fix →
   `modify-approved`, Full re-check → `revision-approved`) is dead — those labels were deleted;
   change runs start via the owner-key Worker (`worker/index.mjs`): **POST `/change`** files a
   `modify-request` issue and `change.yml` auto-runs; **POST `/approve`** dispatches a feedback
   change run for a proposal issue. Map: **Quick fix** and **Full re-check** both go through the
   existing change/approve paths, carrying the weight as a hint in the request body text (weight
   is decided by `pipeline plan`, not by the button — the button copy is the *owner's suggestion*,
   phrase the payload accordingly). The feedback-driven card's buttons use `/approve` with the
   proposal's issue number (see `model/proposals.ts`). Never render the dead label strings —
   they no longer exist anywhere.
2. **Proposals move to triage.** The feedback-proposals panel currently on `/progress/` moves
   into the new owner triage surface `/progress/triage/` (creator decision, this morning). The
   progress page drops it; triage renders proposals as the design's category-striped cards.
   `fetchProposals` + `toProposals` are reused as-is.
3. **Live-event panels ship as honest empties.** "Sources we're reading", "Decisions made",
   "Worth knowing", and the counters (Pages visited · Facts verified · Kept · excluded) need
   per-event data the pipeline does not emit. Creator decision: **build the full layout with
   empty boxes + placeholder copy stating they populate while a guide is being researched**
   (e.g. "This fills in live while a run is reading sources — nothing is running right now." /
   for an active run: "This run predates live source reporting."). Define the event types +
   gateway methods (typed, mocked, tested) so emission is a drop-in later. **Never fabricate
   an event, a count, or a nugget.** The run-summary "Cost to research" row is omitted (no
   data); keep the layout slot per the README's decision 2.
4. **The note panel wires only to real endpoints.** `awaiting` state → the existing
   question/answer flow (**POST `/answer`**, already on the page) with the design's full warn
   treatment, question card, "If you don't answer:" assumption line, accept-the-assumption
   escape, and "Answer & resume" button. The `monitoring` free-form note and the `stalled`
   "File the nudge" have **no endpoint**: ship the panel's three-state visual machine, but in
   those two states replace input+button with one line of placeholder copy (monitoring:
   "Mid-run notes are on the way — for now the run pauses and asks whenever it needs you.";
   stalled keeps the amber notice and points at the run's issue). A control that posts nowhere
   is the page lying — that outranks layout fidelity.
5. **Theme + state paths.** Theme is `src/scripts/theme.js` with the `tg-theme` key and
   `data-theme` attribute (the prototype's `wp-theme` localStorage shim is deleted). Run state
   is `guides-intake/<slug>/state.json` (directory layout — the README's flat
   `<slug>.state.json` mention is stale). The six route stations map 1:1 to
   `STAGE_ORDER` in `model/progress.ts` (`scaffold, passA, passB, reconcile, verified,
   published`) at t = .15/.32/.5/.66/.83/1; `deriveProgress().percent` is stage-quantized
   (n/6) — the plane lerps toward it exactly as the prototype lerps (damped 0.06/frame,
   ±0.0012 sine drift only while running).

Also settled: the empty state's **"Watch a demo run" button does not ship** (it replays
fabricated events; the README's empty-state spec omits it — ghosted route, "Nothing running.",
＋ Start a new guide, Browse guides, last-completed line only). The last-completed line renders
only if a real completed run is resolvable; otherwise omit the line entirely.

## Creator decisions already taken (2026-08-15, via AskUserQuestion — do not re-ask)

| Fork | Decision |
|---|---|
| Live-event data | UI + schema only; honest empty boxes with placeholder copy; pipeline emission is a separate follow-up |
| Executor model | Sonnet 5 |
| Triage | Remap to Worker front door; move proposals off `/progress/` into `/progress/triage/` |
| Delivery | This branch, one PR, README verifier checklist ticked in the PR body |

---

## Commit sequence — five commits, each shippable, each through the full ship loop

Ship loop per commit: `npm run build` → `npm run lint` → `npm run typecheck` → `npm test` →
`node docs/design-handoff/enforcement/check-drift.mjs <changed paths>` → `astro preview` (:4322)
at **375px and desktop, dark and light, reduced-motion on** → grep `dist/` for stale strings →
commit (conventional format) → push.

### Commit A — `feat(progress): route-map dashboard`

The Progress page becomes the designed cockpit. **Extend, don't fork**:

- `src/lib/route-geometry.ts` (+ test) — pure module: the quadratic Bézier
  (`M230.5,209.5 Q420,30 629.6,104.1`), `bez(t)`, `bezAngle(t)`, station coordinates for the
  six stage t-values, and the equirectangular projection/culling that turns
  `public/data/countries-110m.json` into North-Atlantic backdrop paths for the
  `150 20 600 260` viewBox (port `loadMap()`'s arithmetic from the prototype; copy the
  shape of `src/lib/route-optimize.ts`). Projection arithmetic silently drifts — test it.
- `src/features/pipeline-progress/model/progress.ts` — add pure functions beside
  `deriveProgress`: the note-panel machine (`monitoring | awaiting | processing | resumed`),
  the page-state derivation (`empty | running | awaiting | stalled | done` from
  `ProgressView` + question presence), status-pill text/color mapping, and the
  progress sentence. Tests beside the existing ones.
- `src/features/pipeline-progress/gateway.ts` — add the typed live-event interface
  (fetch events, decision events, nuggets, counters) returning empty until a source exists;
  mocks in `mocks/seeds.ts`; zero-network tests.
- `src/features/pipeline-progress/ui/progress.js` — same `initProgress()` entry: route SVG
  (frame-by-frame plane transform via rAF + damped lerp; synchronous frame write on every
  state change; `visibilitychange` re-measure; reduced-motion = true-position, no drift, no
  ring, no march, no glow), phases card (**`scaleX` fills only — never width**), sourcing +
  decisions panels (bounded buffers 24/40, `aria-live="polite"`, `overflow-wrap:anywhere`)
  in their empty-state form, "Worth knowing" card (empty form), note panel, notify opt-in bar
  (once per run start, Notification API permission requested **from the button gesture**,
  title-badge `●` fallback, exactly two events: needs-an-answer, finished; quiet toggle in
  the note panel), empty state, stalled state (**every animation stops**), done state with the
  traveller-language run summary ("Official sources first / Then local knowledge / Everything
  cross-checked" — counts only where real data exists, otherwise the rows' placeholder form).
- `src/pages/progress/index.astro` — restructure to the designed layout: header (status pill +
  elapsed on-page, nav badge hidden here), two-column main `minmax(0,1.08fr) minmax(0,1fr)` at
  >1000px container, single column below, mobile form ≤760px — **container-driven**
  (`@container` or the repo's container mixin; zero `window.innerWidth`). Keep the existing
  slug/correction/owner-key machinery. Fluid clamps per the prototype's `progVals()`.
- `src/styles/progress.css` — extend with `.pg-route`, `.pg-phase`, `.pg-log`, `.pg-note`,
  `.pg-nug` etc. Keep the `.pg-*` prefix and the `scaleX` fix. Radii: 0 or 999px only.
  Accent comes from the run's guide via `src/lib/palettes.ts`; house default where unknown;
  the glacier blue `#2e6f8e` must appear nowhere.
- Entry points: the Atlas table's in-progress row links to `/progress/?slug=<slug>` (it already
  renders `.atlas-stamp--progress`); the hub build strip links here too. **Zero new header items.**
- Mobile (≤760px): one scrolling column route→phases→sourcing→decisions; route SVG ≤230px
  (labels stay 10.5px at SVG scale — don't shrink the viewBox); note panel `position:sticky;
  bottom:0`, input stacks above button; nav its own scrollable row; summary stats 2-up;
  fetch list 108px; decisions min 300px; padding 13px/gutters 14px/base 16px.

### Commit B — `feat(intake): preflight checklist`

- `src/pages/new.astro` + the intake script/feature it already uses — rebuild the form as the
  six-section collapsible checklist (Trip · Who's going · Priorities · Budget · Constraints ·
  Tone), sticky completeness meter (6px `scaleX` fill + time estimate), section status markers
  (22px square: number → ✓ `--green` → ! `--warn`), square stamps (done / part done / not
  started / assumed), two-column field rows (control + question-label + inline example left;
  "what this answer changes" note right behind a 2px `--rule` left border — traveller
  language, never research-architecture language), skip-as-first-class (amber `assumed`),
  head-to-head priorities (5 matchups over 6 categories → ranked top 3, first place filled
  `--accent`), and the pre-dispatch **fork gate** (two clarifying questions with
  recommendations in a `--warn` card; "All set — see it running →" only after both answered,
  linking to `/progress/?slug=<predicted>`).
- **Fields come from `scripts/intake-schema.mjs` — the single source of truth with a contract
  test.** The designed sections are a presentation grouping over those FIELDS; adding a field
  means adding it there. Where the prototype's demo fields and the schema differ, **the schema
  wins**; map each schema field into the section whose heading fits, and keep the schema's
  certainty semantics (its "assumed-by-default" model is exactly what the design's stamps
  render). Dispatch keeps the existing submit path (Worker `/intake` POST or issue-URL fall
  back — whatever `new.astro` does today).
- State (`vals`, `skipped`, `open`, `matchIdx`, `scores`, `forkPicks`) persists to
  `sessionStorage` so a reload mid-intake loses nothing.
- `src/styles/intake.css` — extend the `.itk-*` vocabulary. Mobile: one column; field rows
  stack (note keeps its left border); matchups stack A / VS / B ≥60px buttons; stamps
  `white-space:nowrap`; sticky meter stays sticky.
- Entry point: the existing `＋ New guide` header CTA, unchanged, points here.

### Commit C — `feat(change-request): requester view`

Extend `src/features/change-request/` (model + ui + gateway already exist — keep both submit
modes: owner-key Worker POST and prefilled-issue fallback):

- `model/`: the advisory keyword map (the prototype's `RULES` + `CATS`, with categories
  dates `--accent` · access `--accent` label-distinguished (**no purple — README decision 1**) ·
  closed `--crit` · budget `--green` · preferences `--warn`) as pure tested logic:
  text → affected tabs (kind rewrite/check), minus dropped ones; weight (≥2 rewrites =
  "Bigger job"); matched categories. The affected list is **derived, never stored**.
- `ui/`: guide picker cards (three real-country outlines from `countries-110m.json` fitted to
  64×70 with cos-lat correction — reuse/extend the geometry module from Commit A; selected =
  62% fill, 24s drift, staggered 2.6s city-pin pings, each guide's own accent from
  `palettes.ts`), starter chips **above** the textarea, live "What we'd update" panel
  (`aria-live`, ghost-example empty state, removable tabs — the requester gets the last word
  on scope, weight stamp, plain time estimate, "Send this request"), and the "Your guide's 10
  sections — what we'd touch" map with the Redone / Checked / Untouched legend sentence and
  450ms `scaleX` underline draw. Advisory framing throughout — it is a suggestion, not a plan.
- Deep link: the guide page's existing "Request a change" button pre-fills slug + current tab.
- Segmented control full-width halves: "Request a change" / "Pending requests" (**never
  "Requests to me"**).
- Mobile: picker cards full-width (64px outline block kept); textarea stacks above the panel;
  tab map `minmax(7.5rem,1fr)`; segmented control full width.
- `src/styles/change-request.css` (or the feature's existing `styles.css` — follow what's
  there) for the new vocabulary.

### Commit D — `feat(triage): owner queue at /progress/triage/`

- New `ui/` module in the change-request feature + `src/pages/progress/triage.astro`:
  card grid `minmax(min(25rem,100%),1fr)`, 5px category stripe, category chip, who-asked +
  when, the requester's words verbatim, suggested weight, **Quick fix / Full re-check** per
  Reconciliation 1 (Worker `/change` · `/approve`; border turns `--green` once started;
  "N under way — follow them on the Progress page"). Data: open `modify-request` issues +
  `fetchProposals` (the feedback card states plainly that nothing happens until the owner
  decides). Owner-key gated exactly like the existing maker controls; reachable from the hub
  TOOLS menu only — no traveller navigation.
- Remove the proposals panel from `/progress/` in this commit (Reconciliation 2) and grep for
  every reference the removal ripples into.
- Mobile: one card per row, stripe unchanged. (Triage is desktop-centred but must still pass
  the mobile acceptance numbers.)

### Commit E — `chore(design): retire the handoff bundle`

Per the README's own retirement section, on the commit that lands last:

1. Append one short section to `docs/reference/pipeline.md`: the three note-panel states and
   their colour meanings, the stalled-run rule, the route-map frame-by-frame requirement.
2. Add every new moving thing to `docs/reference/motion.md`'s inventory table
   (Motion · Mechanism · Owner) — required by that doc.
3. **Delete `design_handoff_pipeline_and_intake/` outright** and this plan file
   (`PLAN_PIPELINE_SURFACES.md` → its closure recorded, body stays in git).
4. One closure line in `docs/archive/INDEX.md` with the landing commit; refresh HANDOFF/CONTEXT
   per the session-end ritual (CONTEXT Decision rows for: triage remap to the Worker front
   door; proposals moved to triage; live panels empty-until-emitted).
5. Cleanup greps (expect zero): `Flight Deck`, `boarding`, `cockpit`, `fare`, `wp-theme`,
   `#2e6f8e`, `#7a4fa3`, `#e3e7dc`, `#fbfcf6` (in `src/` and `dist/`), `modify-approved`,
   `revision-approved` (in the new surfaces), `Claude`, `tok` (traveller-visible copy),
   `innerWidth` (new code), `Requests to me`, `Watch a demo run`.
6. Spawn/record the follow-up: "Emit pipeline run events (fetches, decisions, nuggets,
   facts-verified) into `guides-intake/<slug>/` and wire the Progress gateway to them; add
   Worker `/note` for mid-run directives and un-placeholder the note panel's monitoring +
   stalled inputs." File it as a GitHub issue via `gh`.
7. ~~Deferred fork from Commit A~~ — **RESOLVED, commit `e119f2a`.** The hub now surfaces a
   guide currently building: `src/features/atlas/model/building.ts` derives it as
   `draft: true` AND its own `guides-intake/<slug>/state.json` has not yet reached
   `stages.verified` (the japan case — draft but already verified, deliberately hidden —
   correctly excludes). Rendered as `.atlas-stamp--building` / "BUILDING", deliberately NOT
   `.atlas-stamp--progress` — that class already means "the trip is happening now"
   (`SPEC-COMPONENTS.md` §6, `ongoing` in `trip-dates.ts`), and reusing it would have mislabeled
   an unbuilt guide as a trip already underway. Links to `/progress/?slug=<slug>`. No corpus
   guide qualifies today (denmark/korea are published, japan is deleted) — proved via a
   temporary scaffolded fixture, deleted before commit; `building.test.ts` pins the japan-shape
   case against its real historical `state.json` values so the regression check survives
   japan's deletion.

---

## Done-definition

The PR body ticks **every line of the README's "Verifier checklist"** (Layout · Motion ·
Tokens & drift · Content & honesty · Accessibility · Cleanup) plus the README's six
**mobile acceptance hard numbers** (no horizontal scroll at 320/360/390/414/768;
≥44px touch rows; note panel visible without scrolling at 390×844 in every run state;
route SVG ≤230px with legible labels; reduced-motion full compliance; dark mode at 390px on
all three surfaces). Where a checklist line is adjusted by a Reconciliation above (e.g. the
label strings no longer exist to grep), tick it with a one-line note saying why.

Verification is real, not asserted: drive `astro preview` with the browser tools, measure
`scrollWidth === clientWidth` at each width, screenshot each surface at 390px and desktop in
both themes, and attach the screenshots to the PR.

## Execution protocol

- Work only on `design/pipeline-surfaces`; never push `main`. One PR at the end (title
  `feat: pipeline surfaces — progress cockpit, intake checklist, change + triage`), checklist
  in the body, screenshots attached.
- **Escalation rule:** the same gate or checklist item failing twice consecutively → stop
  iterating, record the failure state in the PR body, and end with a clear handoff note
  flagging it for an Opus session. Do not burn the budget flailing.
- **Fork protocol:** a genuine new fork (not answered by this plan, the README, or the code)
  → `AskUserQuestion` if the session is interactive; if unanswerable, record it in the PR
  body under "Open forks", implement nothing for that item, and continue with the rest.
  Never silently pick.
- No new dependencies. No framework. Inline SVG, CSS, vanilla JS/TS only.

## Clarifying questions (per doctrine — all currently answered)

- Live-event panels: **answered** — empty boxes + placeholder copy until the pipeline emits.
- Model: **answered** — Sonnet 5.
- Triage mapping + proposals location: **answered** — Worker front door; proposals move.
- Delivery: **answered** — this branch, one PR.
- Standing assumption (veto-able): the note panel's monitoring/stalled inputs ship as
  placeholder copy (Reconciliation 4) rather than dead controls, and "Watch a demo run" is
  excluded. New forks follow the Fork protocol above.
