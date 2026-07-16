# EXECUTION ROADMAP — Trip Learnings + Convergence Merge + CI Bootstrap

**Written 2026-07-16 (day after the Korea trip, Jul 8–15). Author: Claude (Fable 5),
for execution by Claude Opus 4.8 in one or more fresh sessions.**

This document is the single source of truth for finishing the current project arc.
Execute it **stage by stage, in order, to the letter**. Every stage ends with its own
verification gate — do not start stage N+1 until stage N's gate is fully green and
pushed. All file:line anchors below were verified against the working tree on
2026-07-16; re-verify any anchor with Grep before editing (line numbers drift).

**User invocation (paste into a fresh session):**
> Execute docs/EXECUTION_ROADMAP.md. Start at the first unchecked stage, follow it
> exactly, and stop at any STOP-AND-ASK marker.

Track progress by checking the `[ ]` boxes in this file as stages complete (edit this
file, commit the checkbox flip with the stage's commit).

---

## 0. Standing rules (apply to every stage)

These compress the project's CLAUDE.md + accumulated session learnings. The CLAUDE.md
files auto-load — never Read them again.

1. **Read before edit; never regenerate from memory.** For `korea.json`
   (~2578 lines) always consult `src/content/guides/korea.index.md` first and Read
   with `offset`/`limit`. Regenerate the index after any line-count-changing edit:
   `npm run index-guide -- korea`.
2. **Ship loop for every change that lands on `main`:** `npm run build` (zero schema
   errors) → `npm test` green → verify in `astro preview` on **:4322** (never trust
   `astro dev` — OneDrive HMR serves stale CSS) at mobile 375px + desktop, dark mode,
   reduced motion → grep compiled `dist/` for the new strings (present) and stale
   strings (absent) → commit → push → confirm the live site. Deploy auto-retries
   transient Pages failures; investigate only after three consecutive.
3. **Continuity sweep:** after any content/fact change, grep the whole guide for every
   touchpoint of the changed fact and fix all of them in the same commit.
4. **Service worker:** any push that changes shipped JS/CSS behavior must bump
   `const CACHE = "tripguides-vNN"` in [public/sw.js:19](../public/sw.js) (currently
   `v25`). Never remove the `res.ok` guards around `cache.put` — they fix a real
   cache-poisoning bug that broke the live trip.
5. **Never do:** rework Trip Split to link-only or re-add room codes/buttons (settled
   design — zero-setup shared room per guide); touch Firebase **rules** (the existing
   rules already permit everything this roadmap needs); attempt to launch
   `/code-review ultra` yourself (user-triggered only); commit `.env`; full-file Read
   a large guide JSON.
6. **Base-path discipline:** every internal `/`-href needs `import.meta.env.BASE_URL`
   (site deploys under `/Trip-Guides`).
7. **New client behavior** goes in `src/scripts/` or a feature silo — never inline in
   `GuideLayout.astro`. New self-contained features get `src/features/<name>/` with a
   single `index.js` public API (pattern: `src/features/firebase/`).
8. **Housekeeping (first session only):** `test-results/` is untracked Playwright
   output — add `test-results/` to `.gitignore` in your first commit.
9. **STOP-AND-ASK markers** are hard stops: present the decision to the user and wait.
   Everything else in this document is pre-approved — do not re-ask.

---

## Stage map & rationale

| # | Stage | Branch | Status |
|---|-------|--------|--------|
| 1 | Learnings **P1 — capture** (feedback button + survey → Firebase) | `main` | [x] |
| 2 | Merge `convergence/phase-1-docs` → `main` | reconcile branch → `main` | [x] |
| 3 | Learnings **P2 — tab**, **P3 — reality reflection**, on merged codebase | `main` | [x] |
| 4 | Learnings **P4 — loop** + the **first real Korea reflection** | `main` | [ ] |
| 5 | CI bootstrap PR (Linux visual baselines + Lighthouse) | PR branch | [ ] |
| 6 | Phase 6 visual-identity refresh | — | **BLOCKED: needs explicit user approval** |

**Why P1 before the merge:** post-trip critiques decay by the day — the capture surface
must go live immediately, and P1 is small, additive, and inert. The merge (Stage 2) is
a careful multi-hour job; doing P2–P4 *after* it means the bigger Learnings surfaces are
built once, on the final architecture (silo contract, split guides, test infra), instead
of built on the monolith and then dragged through conflicts. P1's merge footprint is one
new silo folder (no conflict possible) plus a few-line mount in `GuideLayout.astro`
(trivial to carry). *(Alternative considered and rejected: merge first — delays live
capture by a day+ for no gain.)*

---

## Stage 1 — Learnings P1: capture (on `main`, ships live)

Goal: a **Trip Feedback** button on every guide → 3-step survey modal → anonymous write
to Firebase. Nothing else appears; the feature is otherwise invisible.

### 1.1 Data model

Write to `trips/<storeKey>/feedback/<pushId>` via the existing firebase silo — **same
room as Trip Split, different collection; already permitted by the deployed rules; no
console work.** Record shape:

```js
{
  ratings: { overall: 1-5, pacing: 1-5, food: 1-5 },   // ints
  visited: { "<stopKey>": true|false, ... },            // snapshot, see 1.3
  skips: [ { stop: "<label>", reason: "<free text>" } ],
  freeform: "<what we'd change>",                       // NEVER rendered in any UI
  day: "<optional YYYY-MM-DD the feedback refers to>"
  // createdBy + createdAt are added automatically by collection().add()
}
```

### 1.2 Files to create — `src/features/learnings/`

- `index.js` — public API barrel, header comment in the style of
  [src/features/firebase/index.js](../src/features/firebase/index.js). Exports:
  `initFeedback` (mounts button + modal wiring), and re-exports nothing from Firebase
  (consumers of *this* silo never touch Firebase directly).
- `model/feedback.ts` — pure functions: `buildFeedbackRecord(ratings, visitedSnapshot,
  skips, freeform)` (validates/clamps ratings, strips empty skips, caps freeform length
  ~2000 chars) and `aggregateVisited(records)` → `{done, total, skipped:[…]}` (used by
  P2; write it now, it's pure). Plus `model/feedback.test.ts` (vitest, colocated like
  `src/lib/*.test.ts`) covering: clamping, empty-input rejection, aggregation across
  multiple records, later-record-wins per stop.
- `ui/survey.js` — the survey modal. **Model it on the wizard**
  ([src/scripts/wizard.js](../src/scripts/wizard.js)): numbered steps, `ngw-`-style
  class naming (use `lnw-` prefix), lazy `import("gsap")` for slide transitions,
  `reducedMotion()` from `src/scripts/util.js` to skip animation. Steps: ① ratings
  (three 1–5 pill rows — pills, not bare text; clickability must be obvious) ② stops
  ("went / skipped — why?" prefilled from the check-off snapshot, one row per planned
  stop) ③ freeform + submit. On submit: `joinTrip(storeKey)` →
  `collection("feedback").add(record)` → success state ("Thanks — logged for the
  post-mortem") → close.
- `ui/learnings.css` — modal + button styles. Follow the existing token variables in
  `src/styles/`; support dark mode and 375px; import it from the component (see 1.4).
- `mocks/feedback.sample.json` — 3 realistic records (used by tests + the P4 dry run).

### 1.3 Reuse points (verified anchors)

- **Firebase:** `import { hasFirebase, joinTrip } from "../firebase/index.js"` —
  `joinTrip(code)` returns `{ collection(name) → {onChange, add, set, update, remove} }`
  ([src/features/firebase/sync.js:29-61](../src/features/firebase/sync.js)). Gate ALL
  UI behind `hasFirebase()` — with no Firebase config the button must not render.
- **Visited snapshot:** stop check-off state lives in
  `localStorage["tg-stops-" + storeKey]` as a JSON map
  ([src/scripts/field-tools.js:90](../src/scripts/field-tools.js)). Read it read-only;
  do not import field-tools internals.
- **storeKey / room code:** the same value TripSplit uses —
  `GuideLayout.astro` passes `storeKey={storeKey}` (line ~483). Pass it into the silo
  via a `data-` attribute on the mount element, exactly as TripSplit does with
  `data-sk`.

### 1.4 Mount (additive edits to `GuideLayout.astro` only)

Create `src/components/Learnings.astro` (markup shell: feedback button + empty modal
container + `<link>`/import of `learnings.css`; hydrate via
`<script> import { initFeedback } from "../features/learnings/index.js" …`). Mount it
next to `<TripSplit …/>` / `<Voting …/>` (GuideLayout.astro ~483-484). Place the
visible **Trip Feedback** button at the foot of the Itinerary group (find the itinerary
catblock render and append) — a pill-style button, consistent with existing `gtab`/pill
styling. Do **not** add a tab, sheet link, or `specialPanels` entry in P1 — that is P2.

### 1.5 Stage 1 gate (all must pass before push)

1. `npm run build` — zero errors; **both** guides build unchanged.
2. `npm test` — all vitest suites green (existing `src/lib/*.test.ts` + new
   `feedback.test.ts`).
3. **Inertness proof:** build before and after the change (stash trick or two
   checkouts); diff `dist/` — the ONLY differences are the new button/modal markup,
   the new CSS/JS chunks, and hashed asset names. No existing behavior altered.
4. `astro preview` (:4322): at 375px + desktop + dark + reduced-motion — open Korea
   guide → button visible → complete the survey with test data → submit succeeds.
5. **Firebase round-trip proof:** after submitting, re-open the page and confirm via
   the browser console/network that the record exists under `trips/korea/feedback/…`
   (the write is anonymous-auth'd; if it fails, STOP — do not ship — and debug the
   silo, not the rules).
6. **Trip Split regression:** add a test expense in preview; confirm it still syncs
   live (the `#sLive` indicator reaches "live"). Delete the test expense.
7. Bump SW cache `v25` → `v26`.
8. Grep `dist/` for `Trip Feedback` (present in both guides) and confirm no
   `tripLearn` panel exists yet.
9. Commit (include `.gitignore` + this file's Stage-1 checkbox), push `main`, confirm
   the deploy workflow goes green, hard-refresh the live Korea guide and see the
   button. Tell the user it's live so the group can submit critiques now.

---

## Stage 2 — Merge `convergence/phase-1-docs` → `main`

**Never resolve conflicts directly on `main` (it auto-deploys).** Work on a reconcile
branch; `main` only receives the finished, fully-gated merge.

### 2.1 Facts (verified 2026-07-16)

- Merge base is `1f3037c`. `main` since then: `0cb8387` (Korea content: Busan rebuild,
  HYBE, KBBQ — touches `korea.json` + `korea.index.md` only) + your Stage-1 commits.
- Branch tip `ab837e4` contains: doc consolidation, foundations (motion tokens,
  dual-ground contrast gate, additive provenance schema, staleness), recert/link CI,
  Playwright visual+a11y+Lighthouse, **8 sealed silos** (incl. trip-split moved from
  `src/scripts/trip-split.js` → `src/features/trip-split/ui/trip-split.js` + WayFinder
  money model), **guides split into per-section dirs** (`korea/`, byte-identical dist
  at time of split), View Transitions, route ribbon, dest-tz today, itinerary silo.
  126 unit + 16 Playwright tests. Adds `scripts/split-guide.mjs`,
  `scripts/gen-sw-precache.mjs`, `playwright.config.ts`, `vitest.config.ts`,
  new npm scripts + devDependencies.

### 2.2 Procedure

1. `git fetch origin` · confirm tips still match (`git log --oneline -1` each side).
2. `git checkout -b merge/convergence-reconcile main`
3. `git merge convergence/phase-1-docs` — expect conflicts. Resolution table:

| File | Expected conflict | Resolution |
|---|---|---|
| `src/content/guides/korea.json` | modify(main)/delete(branch) | **Main's monolith is content truth.** Keep it temporarily, then run the branch's splitter (`node scripts/split-guide.mjs korea` — check the script's own usage header first) to regenerate `src/content/guides/korea/` from it; then delete the monolith + regenerate `korea.index.md` per the branch's convention (check whether the branch indexes split files — follow whatever `ab837e4` does). |
| `korea.index.md` | same | regenerate, don't hand-merge |
| `src/scripts/guide-ui.js` | branch moved/edited; main added `deepLinkedTab` + `todayInTz` usage | Hand-merge: keep BOTH — the branch's structure + main's `deepLinkedTab` guard and dest-tz today logic (branch also has a dest-tz implementation from Phase 5b — dedupe to one, prefer the branch's if equivalent, but the deep-link-wins-over-jump-to-today behavior MUST survive; it fixed a real live-trip bug). |
| `src/layouts/GuideLayout.astro` | branch (View Transitions, silo mounts) vs main (Learnings mount) | keep both; Learnings mount stays beside TripSplit/Voting mounts wherever the branch put them |
| `src/content.config.ts` | branch rewrote loader + provenance | take the **branch** version wholesale (it accepts both single-file and directory guides) |
| `package.json` / lockfile | branch adds scripts/deps | union; then `npm install` |
| `public/sw.js` | version + branch precache changes | take branch structure, keep the `res.ok` guards, set CACHE to `v27` |
| `CLAUDE.md`, `.claude/skills/waypoint-guide-author/SKILL.md`, docs | branch consolidated docs | take branch, then re-add any main-only additions (grep main's version for sections missing from branch's) |

4. `npm install` → `npm run build` → `npm test` (expect ~126+ unit tests) →
   `npx playwright test` (local baselines from the branch; investigate any diff —
   a diff here means the merge changed rendering).
5. **Content-survival gate (critical):** grep `dist/` for the new-content tokens —
   `10:44`, `18:00`, `T1 Base Camp`, `HYBE`, `Yakiniku Doryong`, `Bonjeon`, and the
   Tokyo section (`Shibuya`) — ALL must be present. Then derive the stale tokens: diff
   the Monday day section of `git show 1f3037c:src/content/guides/korea.json` against
   current content and grep `dist/` to confirm every superseded time/venue is ABSENT.
   Also verify Stage-1's `Trip Feedback` button survived the merge.
6. `astro preview` full pass (375px/desktop/dark/reduced-motion) on Korea + Denmark:
   tab bar, day cards, Trip Split live sync, SOS sheet, feedback survey, View
   Transitions.
7. Merge to main: `git checkout main && git merge --no-ff merge/convergence-reconcile`,
   push, watch the deploy, verify live (hard refresh; confirm SW updated to v27).
8. **Rollback plan** (only if live is broken and the fix isn't a one-liner):
   `git revert -m 1 <merge-commit>` and push; then diagnose on the reconcile branch.
9. Update the memory file
   `…\memory\project_convergence-and-learnings-state.md` — the branch is merged;
   rewrite the state description. Delete the branch on origin after 48h of stable live.

---

## Stage 3 — Learnings P2 (tab) + P3 (reality reflection), on merged `main`

Ship P2 and P3 as **separate commits/deploys**, each with the full ship loop.

### P2 — Learnings tab (hidden until feedback exists)

- Register `learn: document.getElementById("tripLearn")` in the `specialPanels` map
  (pre-merge anchor [src/scripts/guide-ui.js:69-72](../src/scripts/guide-ui.js); find
  its post-merge home in the itinerary/ui silo by grepping `specialPanels`).
- Add `gtab-learn` button (`data-tab="learn"`, pattern: GuideLayout ~319-321) and a
  sheet link (`sheet-learn-link`, pattern: ~526-527) — both rendered `hidden` and
  revealed only by the silo.
- Panel content (`<section id="tripLearn">`, model on `TripSplit.astro`): live
  objective aggregate from `aggregateVisited()` over `collection("feedback").onChange`
  (X/Y stops done, skipped list w/ reasons) + the curated post-mortem section when the
  guide data has one (P3) + a × dismiss (session-scoped, `sessionStorage`).
- **Unlock rule:** subscribe on load; if ≥1 feedback record exists → un-hide tab +
  sheet link. Zero records → nothing appears anywhere.
- **`freeform` is never rendered.** The aggregate uses only `visited`/`ratings`/`skips`.
- **Debug hook for Stage 4:** expose `window.__tgFeedbackDump = () => <raw records>`
  from the silo (console-only, no UI) so the reflection pass can extract raw feedback
  through the browser tools.
- Gate: with Firebase empty of feedback the built pages show NO tab (grep dist +
  preview); after one mock submission the tab appears without reload weirdness;
  dismiss works; Trip Split unaffected. SW bump. Deploy, verify live.

### P3 — additive `learnings` content + Plan⇄Actual toggle

- `src/content.config.ts`: add an **optional** `learnings` structure (per-day
  `{ date, actually, skipped:[{stop,reason}] }` + top-level `keyLearnings:[…]`,
  `changed:[…]`, all with `verified_on`). Optional = both guides still build with zero
  changes.
- Render the curated post-mortem inside the Learnings tab, and add a per-day
  **Plan ⇄ Actual** pill toggle on day cards (locate the post-merge day-rendering
  component in the itinerary silo). Toggle appears only when that day has `learnings`
  data AND the tab is unlocked. Flipping shows ✓ visited / ✗ skipped (+reason) + the
  curated "actually" note; must be obviously hideable (flip back).
- Gate: schema-optional proof (both guides build unchanged with no `learnings` key);
  with mock data the toggle renders and flips at 375px/dark/reduced-motion; ship loop;
  deploy.

---

## Stage 4 — P4: the learning loop + FIRST REAL Korea reflection

1. Create `learnings/korea.md` (private-by-convention synthesis — committed, but raw
   critiques are summarized/anonymized, never dumped verbatim) and
   `docs/TRAVELER_PATTERNS.md` (cross-trip patterns: known ones to seed — group of 3
   mid-20s, over-planning sensitivity, heat fatigue in Jul, low-commute clustering
   preference, beef-KBBQ preference, esports scheduling variance).
2. Add a consult step to `.claude/skills/waypoint-guide-author/SKILL.md`: during
   intake/research, read `docs/TRAVELER_PATTERNS.md` + any `learnings/<slug>.md` for
   the same travelers, and let them shape pacing/venue choices. One-line pointer in
   CLAUDE.md's editing section.
3. **Dry-run the loop** with `mocks/feedback.sample.json` → produce a sample curated
   section + verify it renders (proves the pipeline before touching real data).
4. **Real reflection:** open the live Korea guide in the Browser pane, run
   `window.__tgFeedbackDump()` via javascript_tool, extract real records. Combine with
   what the user tells you in chat. Then: update `learnings/korea.md` +
   `TRAVELER_PATTERNS.md`, author the Korea guide's curated `learnings` data
   (ideal-vs-actual per day — what really happened vs the plan), ship loop, deploy.
   **STOP-AND-ASK before publishing the curated section:** show the user the drafted
   public post-mortem text for approval — it summarizes their friends' critiques and
   is outward-facing. If Firebase has zero real feedback records, ask the user for
   verbal critiques instead and seed from those.
5. **CLEANUP — BLOCKS STAGE 3's P2 DEPLOY (do this first).** Verifying the capture +
   tab wrote **3 synthetic records** to the live `trips/southkorea/feedback`. They are
   identifiable by their `freeform` marker — delete exactly these and nothing else:
   - `__P2_VERIFY_TEST__`
   - `__PERSIST_TEST__`
   - `__REJECT_PROBE__`
   (An earlier 4th, "Pace heavy midweek; Busan was the highlight.", may also still be
   present.) Also check for a leftover diagnostic node at `trips/zzztestpersist` (not a
   guide storeKey — safe to delete wholesale).

   The auto-mode classifier **declines** these deletes (it cannot verify the rows aren't
   real traveler feedback) — correctly. Delete them from the **Firebase console**
   (Realtime Database → `trips/southkorea/feedback`), or run the cleanup outside auto mode.
   **Why this blocks P2:** the Learnings tab reveals as soon as ANY feedback record exists,
   so shipping P2 with these present would show real users fabricated stop data — a direct
   violation of the guide's Honest property. Once the collection is empty, merge
   `learnings/p2-tab` → main and the tab correctly stays hidden until real feedback lands.

---

## Stage 5 — CI bootstrap PR (visual baselines + Lighthouse)

1. Branch `ci/bootstrap-baselines` off merged `main`; push; open a PR with `gh pr
   create` (the visual workflow is **PR-only**, never main).
2. First run will fail on missing Linux snapshots — follow the workflow's own
   flow (`.github/workflows/visual.yml` on the merged tree): retrieve the generated
   Linux baselines from the run artifacts, commit them to the PR branch, re-run until
   green.
3. Read the Lighthouse CI report; summarize scores + any regressions to the user.
4. **STOP-AND-ASK:** present the green PR + Lighthouse summary; merge only on the
   user's yes (merging pushes main → deploy, though baseline/CI files are inert for
   the site).

---

## Stage 6 — Phase 6 visual-identity refresh: **BLOCKED**

Do not start, plan, or partially implement. Requires the user explicitly approving
"Phase 6" scope first. If all prior stages are done, tell the user the roadmap is
complete and Phase 6 is the only remaining (optional) item.

---

## Definition of done (whole roadmap)

- [ ] Feedback capture live on both guides; ≥0 real records handled gracefully.
- [ ] Convergence branch merged; live site verified; branch deleted after 48h stable.
- [ ] Learnings tab + Plan⇄Actual live, inert-until-feedback proven.
- [ ] `learnings/korea.md` + `docs/TRAVELER_PATTERNS.md` written from real trip data;
      SKILL.md consult step in place; curated Korea post-mortem approved + live.
- [ ] Visual/Lighthouse CI green on a merged PR.
- [ ] Memory file `project_convergence-and-learnings-state.md` updated to final state.
- [ ] This file: all checkboxes flipped; final commit notes the roadmap is complete.
