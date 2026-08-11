# HANDOFF — the warm-start context

> **Ritual (binding):** this file auto-loads at session start via the SessionStart hook
> (`scripts/handoff-head.mjs`) — do not Read it again. Greet the creator with the
> **"Where we left off"** line below and the recommended next step. At SESSION END, rewrite
> the Snapshot + Where-we-left-off sections, move the PREVIOUS snapshot to
> `docs/archive/HANDOFF_ARCHIVE.md`, and commit. The ≤120-line budget is gated by
> `scripts/__tests__/docs-integrity.test.mjs`; deep context lives in the north-star docs.

## Operating rules (stable — rarely change)

- **Model economy:** research/recert/fact edits + mechanical builds run on **Sonnet**; **Opus**
  for design sessions and judgment/first-run-triage work. Remind the creator to
  `/model`-switch at session start.
- **Never number guides as milestones** — the product is the backbone; a new guide is the
  backbone exercising.
- Ship loop on every change: build → **lint** → **typecheck** → test → `astro preview` :4322 →
  grep `dist/` → commit → push to `main` (the only branch — `verify-live` guards every deploy).
  Lint and typecheck are not optional: CI runs all three and session #20 pushed red twice by
  treating build+test as the whole gate.
- North stars: `docs/reference/pipeline.md` (generation/maintenance) · `docs/reference/motion.md`
  (presentation/motion) · `docs/standards/guide-rubric.md` (quality bar) ·
  `docs/evidence/competitive-landscape.md` (market parity reference) ·
  **`docs/archive/PLAN_ATLAS_MIGRATION.md`** (the current work order — its own Progress ledger is the
  source of truth for which stage is next; read that before re-deriving status from git log).

## Snapshot (2026-08-11 — the R5 guide-UI handoff, steps 1-3 of 6)

`docs/design-handoff/design_handoff_guide_ui/` (13 specs + prototypes + a design-system export)
is now IN the repo and half implemented. It is calibrated to this repo exactly: Korea's 11
groups + Field log + Tools is the 13 stations it names, and `us` — 8 groups, no learnings, no
cover — is its day-zero fixture.

**Shipped and live: BUILD_ORDER steps 1, 2, 3.**
· The lifted Day palette, swept across every surface that carried a copy of it (manifest,
  theme-color, atlas map fallbacks, OG image, QR pair, budget print sheet, both contrast
  fixtures). `--accent-ink-light` moved #80371b → #783319 as a *consequence* — accentTokens()
  derives it against the sunken surface, which got darker. Recomputed, never hand-picked.
· `.shell` is the container-query context at 744/1180, with `--gutter` as the one spacing step.
· `src/features/guide-rail/` — stations derived from the guide, one DOM, three models. The rail
  moved out of the sticky chrome to under the masthead; `#guideTabs` moved with it so all nine
  silos that query `.gtab` still resolve. ARIA is now buttons + aria-current in a nav.
· The fold (`src/components/Fold.astro` + fold.css + fold.js), `dayRouteLink()`, and day state
  resolved against the READER's clock — Korea correctly shows eight `done` days and no present.

**Creator rulings this session:** Vote is deleted outright; Trip kit's tool goes but its content
(phrases, entry) moves into Plan; Tools becomes a per-guide station and the generic `/tools/`
screen retires; LIGHT_BG syncs with the palette.

**The lesson worth keeping: vitest was green for every defect that mattered.** All four real
bugs lived where code met a system it did not control — axe caught a dangling `aria-controls` on
the two stations that have no panel yet; Playwright caught that `display:none` on the legacy tool
tabs made Budget and Trip Split unreachable *by a person* while JS `.click()` still fired; a
deleted CSS block took `.read-prog`'s media query with it; and my own active-dot rule painted over
the `--st-fill` gradient I had just ported forward. The suite ran 1693 green through all of it.
Run Playwright before pushing, not after CI says so.

## Open items

- **Three paydown lists, all recorded as baselines that can only shrink** — 153 design-drift
  violations (`scripts/drift-baseline.json`), 43 prose-shape offences, 16 over-commented test
  files (`a11y.spec.ts` at 37% is the worst). Plus 1280 surviving mutants; read
  `docs/generated/where-the-tests-are-blind.md` top-down, the table is sorted by where it hurts.
- **Two of the eleven are NOT done, and neither is quietly dropped.**
  · **Print preview** (part of #8). The page-print buttons hand off to the browser's own dialog,
    which HAS a preview; the budget sheet builds a document and prints it without ever showing
    it. That is the real gap and it wants a preview-then-print shell — its own change, and the
    synchronous-gesture constraint (`window.print()` must not sit behind an await) shapes it.
  · **"Is there a need for the Next Guide?"** (#11). There is no "Next Guide" anywhere in this
    codebase. Rather than delete something I have misidentified — ask what it is.
- **A visual call for the creator.** SPEC-COMPONENTS rule 1 decided two ambiguous cases the
  kit's mobile screenshots could not settle: the bottom-bar slots and day chips are full pills.
- **Airports for Sedona/Japan** — record them WHEN flights get booked. No fact yet; don't invent.
- Tools, `/about/` and `/new/` are not in the SW precache shell. Cover overlay does not trap
  focus. LOCAL branch `worktree-agent-a7dc7eeb397c6a368` (`5917f8f`) — keep or lose.
- Cloudflare dashboard Git integration still failing 0s builds on every push.
- Korea 03: critic flagged a swapped 명동 label on the Gyeongbokgung map point → file its issue.
- No guide uses a direct royalty-free `sights[].img.src` yet — capability live, unexercised.

## Where we left off

Steps 1-3 are live and all three workflows are green. **Steps 4, 5 and 6 remain** and they are
the restructuring half:

- **Step 4 — Tools as the last station.** Build the per-guide Tools station (four tools: Split,
  Closures, Reminders, Route); retire `/tools/[trip].astro` and rehome the share modal's
  offline-files link; move jetlag's reading into Plan and drop the tool; DELETE Vote (surface +
  `src/features/voting/` + styles); remove the Trip kit tool and render its phrases/entry/book-by
  content inside Plan. Then delete `.grail-track > .gtab-tool` from guide-rail/styles.css and the
  legacy tool buttons from GuideLayout — they are visible chrome today ONLY because hiding them
  made real tools unreachable.
- **Step 5 — Field log as a station**, from `_guide.json → learnings`, after Sources, not drawn
  at all for `us`/`japan`. Its station already exists in the rail and currently has no panel.
- **Step 6 — the masthead and the absent states.** The plate line still shows coordinates and
  `PLATE 02 — KR`; SUPERSEDES §3 replaces both with the trip's cities and its next leg, plus a
  live-state column. Then FALLBACKS §1 against `us`, the copy-honesty and pins tests, and
  `docs/design-handoff/DESIGN.md` amended with every SUPERSEDES row.

**One thing needs you:** `eslint.config.mjs` is hook-protected, so I could not add the R5 bundle
to its ignore list (you approved it). I fixed the source instead — `prototypes/support.js` carries
an `eslint-disable` header naming it a vendored design artefact — so nothing is blocked. Swap it
for the config line if you prefer the R4 precedent.

**Recommended next step:** step 4. It is the largest remaining piece, it is what makes the rail's
last station real, and it is the one that lets the legacy tool tabs finally go.
