# Surface transplant — closeout

Status: **THE TEN SURFACES ARE ON MAIN. CREATOR VISUAL ACCEPTANCE IS OUTSTANDING.**
Written: 2026-09-05, at the end of the run the playbook set up.
Reads with: `surface-transplant-playbook.md` (the work order), `docs/reference/design-system.md`
(the authority — each surface's decisions are recorded in its own §), `docs/mockups/compare/`
(the board-vs-build sheets this closeout asks you to accept or reject).

---

## 1. What landed

Every board in `docs/mockups/final-package/mockups/` now has a shipped surface behind it, one PR
each, each merged on its own exact head with `required-gate` + `design-canary` green and
`deploy` verified live.

| # | Surface | Board | PR | Model |
| --- | --- | --- | --- | --- |
| 01 | Atlas | `01_atlas_experience` | #195 | Fable 5.1 |
| 02 | Trip | `02_trip_page` | #197 | Opus 5 |
| 03 | Itinerary | `03_itinerary_page` | #198 | Opus 5 |
| 04 | Map | `04_map_experience` | #200 | Opus 5 |
| 05 | Guide | `05_guide_experience` | #201 | Opus 5 |
| 06 | Search | `06_search_experience` | #202 (+ #203) | Sonnet 5 |
| 07 | Guide Builder + Progress | `07_guide_builder` | #207 | Opus 5 |
| 08 | Split | `08_split_expenses` | #204 | Sonnet 5 |
| 09 | SOS | `09_sos_safety` | #205 | Sonnet 5 |
| 10 | Trip Learnings | `10_trip_learnings` | #206 | Sonnet 5 |
| — | After the ten (frame everywhere, share cards) | — | #208 | Opus 5 |

The frame is now the product's shell rather than a destination treatment: every page that is not
a raw asset — the five destinations, `/new`, `/progress`, `/progress/triage`, `/about`,
`/health`, `/change`, `/404` — wraps its strip and its body in `.stage.spatial`, and the two
share cards render on the same forest ground.

---

## 2. Commentary — what the boards asked for, and what shipped

**The wired-only rule did most of the design work.** The boards are generous: ratings, distances,
photo counts, "Add to itinerary", live-location sharing, embassy contacts, guide recommendation
cards, Export buttons, notification bells, avatars, per-category health tabs, "28 things done /
47 photos added". Almost none of it is backed by anything this product holds. Each surface's §
in `design-system.md` lists exactly what was left out and why, so the omissions are a recorded
decision rather than an unexplained gap — and so nobody re-adds them by pattern-matching the
board six months from now.

The interesting cases were the ones where the board and the constitution disagreed:

- **SOS (09) shipped as a no-op.** The three-layer sheet already met the board and already had a
  better answer than the board's own: §28 forbids ambiguous icons, and the board's per-category
  glyphs are exactly that. The honest closeout was a compare sheet and a note, not a diff.
- **Split (08) shipped scoped, and said so.** The board's three-card summary strip and its
  `Overview/Expenses/Balances/Settle Up` tab row are not separate wired views — everything
  renders as one scrolling page — and the CSS budget had no room for chrome that would only
  imply structure the product doesn't have. What shipped is the register and the real header;
  the rest is recorded as open in §27 rather than faked.
- **The Builder (07) has a rail and a preview that decide nothing.** Both are projections: the
  rail copies the mark `intake-checklist.js` already paints, the preview reads the same controls
  the pipeline will. There is no second opinion about what is done and nothing predicted about a
  guide that does not exist yet. "Build with confidence" promises verification, stated gaps and a
  watchable run — and explicitly promises no time or cost, because neither is knowable before the
  research runs (U02).

**The frame pattern paid for itself.** `.stage` + `.spatial` were built once for Atlas; every
surface after it got the register for the price of one class, because the interiors were already
token-driven. Surfaces 8, 9 and the four utility pages cost essentially no CSS at all.

---

## 3. What went wrong, and what it cost

Three things, all of them worth knowing before the next visual pass:

1. **The 300KB CSS budget is a real ceiling and it is not in the surface gate.** Surface 6 landed
   at 300.9KB and `deploy.yml` failed *after* merge, at `check-perf-budget.mjs` — a step
   `required-gate.yml` does not run. The site stayed up on the previous deploy, so nothing broke
   for a reader, but Surface 6 did not publish until the follow-up (#203). **Run
   `node scripts/check-perf-budget.mjs` locally before opening any PR that adds CSS.**
2. **The fix for that was reuse, not deletion of features.** #203 got 1.5KB back by making the
   rail items `.srch-drawer`s wearing a different layout instead of a second full button class.
   That is the pattern worth repeating: in a stylesheet this mature, a new component is usually
   an existing component in a different position.
3. **Dead CSS was the real budget.** #207 opened by retiring the Focus Today overlay's 16
   classes — a view that died with the D7 destinations but whose rules still shipped on every
   guide page — and freed 2.5KB, which is more than the entire builder frame cost. Note the
   trap found on the way: this codebase builds class names at runtime (`cat-fan-${i}`,
   `itk-mark-` + state), so "no reference in the source" is not proof a class is dead. Every
   deletion in that commit was checked against concatenation patterns first, and several
   candidates were kept because of it.

One real defect was found by a gate rather than by eye: on `/new` the cream band under the frame
sat *beneath* the fixed contour layer, which axe reported as an unresolvable background. It is
fixed, and it is a good argument for keeping the a11y sweep in the loop on layout changes.

---

## 4. Owner task list

Only you can do these.

1. **Visual acceptance, ten sheets.** `docs/mockups/compare/01-atlas.webp` … `10-learnings.webp`,
   plus `07-builder.webp`. One line each: accepted, or what to change. This is the gate
   `design-system.md` §35 names, and it is the one thing between here and calling the redesign
   done. Nothing below matters until this happens.
2. **Repository secrets** `PUBLIC_GMAPS_KEY` + `PUBLIC_GMAPS_MAP_ID` (`docs/reference/integrations.md`).
   Map and Itinerary are still on the OpenStreetMap embed fallback, so their compare sheets show
   the honest degraded map rather than the board's.
3. **Decide on Split's deferred half** (§27): the three-card summary strip and the tab row. The
   tabs are not wired views today, so building them means deciding whether they should be.
4. **Decide whether the share cards should be forest.** #208 moved them on the argument that a
   link preview should look like the site it opens. It is a taste call and it is reversible in
   one file each.

---

## 5. Model-routed next steps

- **Fidelity pass on whatever acceptance rejects** — Opus 5 for a destination, Sonnet 5 for
  Search/Split/SOS/Learnings, same split the playbook used. Re-read the surface's § first; the
  decisions are written down now, so a second pass should be arguing with a recorded reason
  rather than rediscovering it.
- **`budget-sheet.css`'s print palette** (the last six COLOUR findings in `drift-real`) — Sonnet 5.
  Small, self-contained, and genuinely a different surface's decision: print has no tokens.
- **Screenshot-baseline regeneration** — only *after* acceptance. `design-system.md` is explicit
  that a regenerated baseline is a regression lock, never design approval, and regenerating one
  to conceal an unaccepted change is the thing the rule exists to stop.
- **Do not start another redesign round.** `CLAUDE.md` is explicit: PR #186 was the engineering
  foundation, the ten surfaces were the transplant, and the next visual pass is fidelity and
  convergence — not a third grammar.
