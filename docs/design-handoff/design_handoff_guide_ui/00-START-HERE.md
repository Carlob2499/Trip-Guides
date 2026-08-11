# Start here

**You are implementing the Waypoint guide-page redesign (revision R5) into
`github.com/Carlob2499/Trip-Guides`, an Astro static site.**

Read this file completely before opening anything else. It tells you what order to read in,
what supersedes what, and what to do when a document disagrees with itself.

---

## 1. The one-paragraph brief

Waypoint is a static Astro site of verified, personalised travel guides. Its differentiator is
that every perishable fact traces to a primary source and a check date, and where research came
up short the guide says so instead of filling the hole. This redesign covers **the guide pages
themselves** — the reading surface — on phone, tablet and desktop. It replaces the tab-pill rail
with a **spine rail** (a pill row on the phone), turns Tools into the last station on that rail,
gives Field log its own station, folds explanatory prose behind a two-line peek, and lifts the
Day palette so the page holds up in direct sun. Nothing about the content pipeline changes: the
guide JSON is untouched, and no `"type"` value in any guide file is edited.

## 2. Reading order — do not skip and do not reorder

| # | File | Why |
| --- | --- | --- |
| 1 | `00-START-HERE.md` (this file) | precedence rules, glossary, the shape of the job |
| 2 | `SUPERSEDES.md` | **what is now wrong in the repo.** Read before you trust any repo doc |
| 3 | `README.md` | the master specification — screens, components, behaviour |
| 4 | `TOKENS.md` | every colour, size, weight, radius, duration. Exact values |
| 5 | `COMPONENTS.md` | per-component measurements. Nothing here is approximate |
| 6 | `SCREENS.md` | screen-by-screen composition for all three viewports |
| 7 | `BEHAVIOR.md` | interactions, state, motion, gestures, keyboard, reduced motion |
| 8 | `TESTS.md` | the tests to write, including every edge case found in review |
| 9 | `FALLBACKS.md` | what to do when something is absent, fails, or contradicts |
| 10 | `ACCEPTANCE.md` | the checklist you must be able to tick before opening the PR |
| 11 | `prototypes/` | runnable design references. **Not production code** |
| 12 | `design-system/` | the R5 token layer, components and guideline cards |

## 3. Precedence — when two documents disagree

Apply strictly, highest first:

1. **`SUPERSEDES.md`** — it names things that are now wrong. It wins over everything.
2. **`TOKENS.md` / `COMPONENTS.md`** — exact values. They win over prose.
3. **`README.md`** and the other files in this bundle.
4. **The prototypes in `prototypes/`** — tie-breaks only. If a doc says 16px and the prototype
   renders 17px, the doc is right and the prototype drifted.
5. **`docs/design-handoff/DESIGN.md` (R4) in the repo** — everything it says that this bundle
   does not contradict still holds. It is a large, good document; do not discard it.
6. **`docs/design-handoff/README.md` and `SPEC-COMPONENTS.md` (R4)** — same.
7. Anything else in `docs/`. Much of it is historical planning. Treat with suspicion.

**Your own memory of what Waypoint looks like ranks below all of the above.** If you are about
to write a colour, a spacing value, a component layout or an icon you cannot point to in a file
in this bundle or in the repo, stop and go read.

## 4. What you must NOT do

- **Do not introduce React, Vue, Svelte, Tailwind, or a build-time CSS framework.** The stack is
  Astro + plain CSS in `src/styles/` + vanilla JS modules in `src/scripts/` + self-contained
  features in `src/features/<name>/`. The prototypes are written in a React-flavoured design
  runtime because that is what the design tool renders; that is an artefact, not a requirement.
- **Do not edit any file under `src/content/guides/`.** This redesign is design-only. Zero guide
  data edits. If a design seems to need a new field, raise it instead of adding one.
- **Do not port `prototype/trip-split.js` back into the repo.** The TypeScript originals in
  `src/features/trip-split/model/` are the source of truth and they have tests.
- **Do not re-derive any constant marked DO-NOT-DERIVE** in `BEHAVIOR.md`. Those numbers have
  model tests behind them and were learned from real bugs.
- **Do not invent content.** No placeholder copy, no example expenses, no sample ledger rows, no
  fabricated "start here" resume line, no invented coordinates.
- **Do not seed Trip Split from the guide's budget block.** See `SUPERSEDES.md` §4.

## 5. What "done" means

`ACCEPTANCE.md` is a checklist of statements that must each be true and verifiable. You are done
when every box is ticked, all three CSS gates pass, the new tests in `TESTS.md` exist and pass,
and the axe run on both themes is clean. Not before.

## 6. Glossary — use these words exactly

| Word | Means |
| --- | --- |
| **Panel** | the one repeated container: kicker, title, rule, body. Every card is one |
| **Panel section** | the guide content type `"type": "panel"`. Nests *inside* a Panel |
| **Station** | one section group as a stop on the spine rail |
| **Spine rail** | the horizontal line of stations. Tablet + desktop |
| **Pill row** | the phone's swipeable equivalent, with a 2px progress line |
| **The plate** | the mounted cover photograph, with corner ticks |
| **The plate line** | the 2px-oxide-topped line beneath the masthead |
| **The gap** | `⚠ NOT CONFIRMED` at reading scale — honest absence |
| **Marginalia** | a fold-out explanation attached to a stop or a fact |
| **Reading scale** | `clamp(1.5rem, 1.2rem + 2.4vw, 2.6rem)`, floor 24px |
| **Notation** | Source Sans 3, uppercase, tracked. The data voice |
| **Field log** | the post-trip record, from `_guide.json → learnings` |

## 7. The prompt to paste into Claude Code

See `PROMPT.md`. Paste it verbatim as your first message; it points at this file.
