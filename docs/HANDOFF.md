# HANDOFF — read this first, then re-prompt the creator

> **Ritual (binding):** at SESSION START, read this file INSTEAD of re-deriving history from
> the conversation, memory sprawl, or git log — it is the single warm-start context. Then
> greet the creator with the **"Where we left off"** line below and the recommended next step.
> At SESSION END, rewrite the Snapshot + Where-we-left-off sections (keep this header), commit.
> Keep it under ~80 lines — a handoff, not a chronicle. Deep context lives in the north-star
> docs it links; only follow those when the task actually needs them.

## Operating rules (stable — rarely change)

- **Model economy:** research/recert/fact edits + mechanical builds run on **Sonnet**; **Opus**
  for design sessions and judgment/first-run-triage work. Every grand-plan session below lists
  its own model — remind the creator to `/model`-switch at session start.
- **Never number guides as milestones** — the product is the backbone; a new guide is the
  backbone exercising.
- Ship loop on every change: build → test → `astro preview` :4322 (never `astro dev`) →
  grep `dist/` → commit → push to `main` (the only branch — `verify-live` guards every deploy).
- North stars: `docs/PIPELINE.md` (generation/maintenance) · `docs/MOTION.md`
  (presentation/motion) · `docs/GUIDE_RUBRIC.md` (quality bar) ·
  `docs/COMPETITIVE_LANDSCAPE.md` (market parity reference).

## Snapshot (updated 2026-07-30, session #18 — P7 shipped on branch)

**P7 differentiation surfaces (R11-R14) shipped** on `claude/research-trial-results-h32hlk`:

- **Schema:** `tier` (primary/corroborated/secondary), `agreement` (A+B converged/A only/B only),
  `recheckNote` added to provenance. New `divergences` section type with category enum.
- **Components:** DivergencesBlock.astro (claim/correction cards with category badges),
  provenance dot+popover on VenueBlock (shows checked date, source, evidence tier, research
  agreement), calendar badge on DaysBlock (constraint-driven), "Next self-check" in colophon.
- **Japan data:** 5 divergences (Ippudo tourist-trap, Otaru overcrowded, Takimotokan, Dazaifu
  default-answer, Naruko missing-context), tier/agreement backfilled on ramen, yatai, key sights.
- **Japan cover:** updated to Naruko Gorge koyo (CC BY 4.0, Oct 24 capture, right season).
- **Congruence:** scaffold-guide emits divergences shell, guide-readiness knows the type.
- **980 tests green, build clean.**

**Test count: 980.** Lint 0, build clean. Four guides live: Korea, Denmark, US, Japan.

## Left to do

1. **Merge `claude/research-trial-results-h32hlk` to main** — P7 commit ready, tests green.
2. **Delete remote branches** — creator must do from GitHub UI:
   `claude/website-visual-redesign-upnl05` (fully merged since session #15).
3. **`astro preview` visual check** — P7 components (provenance dot popover, divergences
   cards, calendar badges) need a mobile 375px + desktop + dark-mode visual pass.
4. **A11y baselines** will re-record on CI's first main run — watch for green.
5. **`no-explicit-any` debt** — 118 remaining `any`s behind a 33-path exception list.
6. **Room codes** committed to a public repo. `#room=` fragment override exists.

## Owner tasks (need the creator, not the agent)

1. **Merge P7 branch to main** (or approve a PR).
2. **Delete `claude/website-visual-redesign-upnl05`** from GitHub (fully merged).
3. **Visual sign-off** on P7 surfaces in `astro preview` — provenance dots, divergences
   block, calendar badges, colophon self-check date.

## Where we left off

**Session #18 (2026-07-30):** Built and shipped P7 differentiation surfaces. Fixed CSS
type-scale violations (replaced `--text-muted` with `--muted` to avoid the `--text-*`
font-size token namespace). Added divergences scaffold entry with phase + seed item to
pass scaffold contract tests. All 980 tests green, build clean. Pushed to
`claude/research-trial-results-h32hlk`.

**Re-prompt the creator with:** "P7 is done — provenance popovers on venues, divergences
block with 5 Japan-specific corrections, calendar badges on constrained days, and the
self-check date in the colophon. Branch pushed, 980 tests green. Ready to merge to main
and do a visual check in `astro preview`."
