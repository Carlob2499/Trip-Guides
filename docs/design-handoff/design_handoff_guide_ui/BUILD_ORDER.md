# Build order

Six steps. **Steps 1–3 are independently shippable** — each leaves the site working and better
than before, so none of them needs the others to land.

---

## Step 1 — Tokens and the container scaffold

Files: `src/styles/base.css`, `src/layouts/GuideLayout.astro`.

- The seven lifted Day tokens (`TOKENS.md` §1). Night unchanged.
- **Delete any `[data-field="glare"]` block.**
- `--rw` and `--photo` declared in both themes.
- Safe-area custom properties at `:root`; `viewport-fit=cover` in the viewport meta.
- `container-type: inline-size` on the guide body, `container-name: guide`, queries at 744/1180.
- Extend `atlas-tokens.test.ts`.

**Ships alone:** the palette lift and the container scaffold are invisible improvements. Nothing
downstream is required.

**Done when:** all three gates green, both themes render, no unresolved `var()`.

## Step 2 — Rail, pill row, day scrubber

Files: new `src/features/guide-rail/`, `src/styles/mobile-nav.css`, `src/scripts/guide-ui.js`.

- Station list **derived from the guide's groups**; Tools appended last; Field log only when the
  guide has `learnings`.
- Desktop/tablet spine rail; phone pill row with the progress line at `100 / stationCount`%.
- Day scrubber, active chip expanded, `now` only when today is inside the trip.
- Wire the thumb bar to `mobile-nav/model/rank.ts` — do not re-implement.
- Tests: `TESTS.md` §1, §2, §7.

**Ships alone:** replaces the tab rail. The body below is untouched.

**Done when:** Korea renders 13 stations and Sedona 9, with no horizontal overflow on any of the
nine devices, and the current group seats in the thumb bar for every station.

## Step 3 — The day station

Files: `src/components/blocks/DaysBlock.astro`, `src/styles/guide.css`, `src/scripts/guide-ui.js`.

- Day card, the line, per-stop `MAPS ↗` plus the whole-day link.
- The fold (`COMPONENTS.md` §5): two lines visible, hover **and** click on desktop, tap on touch,
  unchanged type size, print force-opens.
- Gap block directly under the lead, above the line, full card width.
- The present band, only when today is this day.
- Checks with persisted ticks.
- Tests: `TESTS.md` §4 (partial), §6.8.

**Ships alone:** the reading surface improves whether or not Tools has moved.

## Step 4 — Tools as the last station

Files: `src/features/trip-tools/`, `src/features/trip-split/ui/`.

- Four tools. Jetlag's reading moves into Plan; the tool is removed.
- **One** `ensureGuide(slug)` guard, on the tools screen.
- Trip Split ships **empty**; the add-expense form uses the shipped field set.
- **Delete the seeding path entirely** — do not leave it behind a flag.
- Tests: `TESTS.md` §3.

## Step 5 — Field log as a station

Files: `src/components/blocks/`, the rail's station list.

- Rendered from `_guide.json → learnings`, after Sources.
- **Not drawn at all** when the record is absent.
- Tests: `TESTS.md` §1.2.

## Step 6 — Absent states, gates, axe, PR

- Build every row of `FALLBACKS.md` §1 against a day-zero fixture.
- Run all three gates and fix what they find — **fix the design, never weaken the gate**.
- Axe both themes. `TESTS.md` §6.6 is the pairing most likely to fail.
- Amend `docs/design-handoff/DESIGN.md` with every R5 override (done 2026-08-14: all seven are
  folded into its body and `SUPERSEDES.md` is deleted).
- Walk `ACCEPTANCE.md` and demonstrate each line.

---

## Repo file map — where each thing lives

| What | Where |
| --- | --- |
| Guide shell, style + script imports, the cascade contract | `src/layouts/GuideLayout.astro` |
| One renderer per section type, dispatched by `Block.astro` | `src/components/blocks/` |
| Page-chrome CSS (masthead, rail, print) | `src/styles/` |
| Cross-cutting page scripts | `src/scripts/` |
| Self-contained features, single `index.ts` public API | `src/features/<name>/` |
| Feature-owned CSS | `src/features/<name>/styles.css` — **at the silo root**, never under `ui/` |
| Pure build-time helpers | `src/lib/` |
| Country accent / currency / tz / emergency | `src/data/countries.mjs` |
| The section schema | `src/content.config.ts` — **do not edit** |
| The guides | `src/content/guides/<slug>/` — **do not edit** |

**The silo contract:** the index file is the only public surface — no deep cross-feature imports,
ever. `model/` = zod + pure tested logic · `ui/` · `mocks/` (real-shaped seeds; tests run
zero-network) · `__tests__/`. Data access sits behind an injectable gateway in `index.ts`. A
feature is its own `import()` chunk. No speculative silos.
