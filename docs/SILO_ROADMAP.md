# Silo Roadmap — feature + content siloing (convergence Phases 3–4)

The working doc for the approved convergence plan's structural phases. The contract
below is binding for every NEW feature immediately (CLAUDE.md names it); the migration
lands post-trip (after Jul 15), one PR per silo, behavior-preserving.

## The silo contract (adopted from WayPoint-V2, extends `src/features/firebase/`)

```
src/features/<name>/
  index.ts        # the ONLY public surface — no deep cross-feature imports, ever
  model/          # zod schema + pure, unit-tested logic (framework-agnostic)
  ui/             # the Astro component(s)/island(s) for this feature
  mocks/          # real-shaped seeds from golden guide content (offline dev + tests)
  __tests__/      # vitest coverage of the model + interactive states
```

- **Sealed:** features consume each other only via `index.ts` exports.
- **Backend-ready:** data access sits behind an injectable gateway in `index.ts`, so
  static JSON / keyless APIs / Firebase can later swap to a real backend without
  touching `ui/`.
- **Mock-mode-first:** missing keys auto-engage mocks; tests run zero-network.
- **Lazy:** a feature is its own chunk (`import()` on first use), never main-bundle.
- **`src/shared/` is only** for true cross-cutting primitives (design/motion tokens
  live in `src/styles/base.css`; the `#tgConfig` reader; reference tables).
- **No scaffolding:** a silo is created when genuinely needed — no speculative dirs.

## Phase 3 — code silo migration order (frequency × stakes, one PR each)

| # | Silo | Absorbs (from src/scripts + styles) |
|---|------|--------------------------------------|
| 1 | trip-split | trip-split.js (+ WayFinder money model: integer minor-units, EQUAL/EXACT/PERCENTAGE/SHARES) |
| 2 | exports | src/lib/exports.ts (ICS/GPX builders) + endpoints' client bits |
| 3 | sos | sos.js (+ EU-112 fallback, Phase 5) |
| 4 | itinerary | day-rail.js, spine.js, now-line.js, swipe-nav.js, print-day.js (+ planner.css, print-day.css) |
| 5 | hub | hub.js, wizard.js (+ hub.css, hub-cards.css, wizard.css) |
| 6 | field-tools | field-tools.js (+ field-tools.css) |
| 7 | palette | palette.js (+ palette.css) |
| 8 | maps | gmaps-render.js (+ map.css) — already config-gated; formalize |

Cross-cutting page chrome (guide-ui.js, scroll-memory, reveal, micro, lightbox,
onboard, offline-pill, section-flight, gsap-hero, hero-parallax) stays flat in
`src/scripts/` — it is the page, not a feature.

## Phase 4 — content siloing (the hallmark)

One guide = one **directory** of per-section files, assembled at build:

```
src/content/guides/korea/
  _guide.json        # kicker/title/dek/country/verified/… (everything but sections)
  01-plan.json       # one file per tab group, array of that group's sections
  02-essentials.json # …
  …
```

- Loader (`src/content.config.ts`): a custom loader assembles dir-guides and still
  accepts legacy single-file guides — **both shapes valid during migration**.
- **Gate: built `dist/` byte-identical** before/after each guide's split.
- Retires the `*.index.md` sidecars + the `index-guide` npm script (their reason to
  exist — targeted reads into a monolith — disappears).
- Generator + skill update in the same PR (author new guides as directories).

## Standing efficiency gate (every phase)

Build + tests green → preview at 375px/desktop/dark/reduced-motion → grep `dist/` →
perf budget → visual diff vs baseline → **efficiency review** (dead code/text deleted;
bundle, doc count, and per-edit fetch cost did not grow).
