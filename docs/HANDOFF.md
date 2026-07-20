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
- North stars: `docs/PIPELINE.md` (generation/maintenance) · `docs/VISUAL_COVERS.md` +
  `docs/MOTION.md` (presentation/motion) · `docs/GUIDE_RUBRIC.md` (quality bar) ·
  `docs/COMPETITIVE_LANDSCAPE.md` (market parity reference).

## Snapshot (updated 2026-07-20, session close)

**Three grand plans now govern all future work, each with a binding session ritual (open by
`AskUserQuestion`-ing the session's clarifiers → build → ship loop → rewrite this file):**

- **`docs/PLAN_TRAVELER_FEATURES.md`** — F0 (prove the pipeline end-to-end, THE GATE, needs
  `CLAUDE_CODE_OAUTH_TOKEN`) → F1 prep timeline → F2 budget pact → F3 dormant entry/phrases/env
  content → F4 packing strip → F5 offline confidence → F6 pre-trip auto-recert → F7 runs
  **`docs/PLAN_PIPELINE_CRITIC.md`** (the debated "third iteration": C1 bar-test lens
  prompt-only → C2 evidence gate after 2 real runs → C3 promotion only if evidence says so) →
  F8 free route optimizer. Grounded in `docs/COMPETITIVE_LANDSCAPE.md` (full market sweep incl.
  served-code inspection of Wanderlog/Mindtrip).
- **`docs/PLAN_VISUAL_OVERHAUL.md`** — "The Overture & the Atlas": a full-viewport intro hero
  before the guide grid (creator's explicit ask), doctrine-bound to `MOTION.md`.

All three carry a **Model & time budget** table. Totals: features ≈14–22h (excl. F7), critic
≈4–6h, visual ≈9.5–16h.

**This session ran V4 (guide interior depth) — ✅ DONE, on `main`.** Option B (creator-picked): a
faint topographic contour overlay OVER the guide hero photo (`.mast-contours` inside `.mast-frame`,
above scrim / below title; light `.11`/`.07` strokes, title stays legible), static, photo-guides
only. Dropped two planned items honestly (parallax → static suits a reading hero; verified-stamp
settle → no per-section stamp exists to settle). 636 tests, typecheck 0, perf OK.
Prior visual sessions (all live on `main`): **V3** Atlas grid (per-guide card border + hover glow),
**V2** the Overture (full-viewport intro that auto-glides into the hub — `src/scripts/overture.js`,
cancelable/once-per-visit/compact-return/reduced-motion-safe), **V1** foundation (`contours.ts`,
`guide-stats.ts`, `paletteAccentsForGuide()`).

**Still the #1 open item (the audit's top finding, unchanged):** the fully-autonomous research
pipeline has NEVER completed a real end-to-end run. Waits on the creator adding
`CLAUDE_CODE_OAUTH_TOKEN` (repo secret via `claude setup-token`). This is Session F0.

**Housekeeping still open:** the remote branch `claude/test-coverage-analysis-siftjs` (fully
merged, safe to delete) needs the creator to delete it via GitHub UI — the sandbox's git relay
403s on remote ref deletion.

## Where we left off

The hub redesign arc is live on `main` — the Overture (V2) auto-glides into the palette-tinted
Atlas grid (V3), and now the guide interiors carry a faint map-contour overlay on the hero (V4).
Natural next moves, the creator's call:

1. **V5 — Morph continuity** (Opus, ~1–2h). Extend the card→guide View-Transition morph: carry
   the tapped card's palette accent into the guide masthead arrival; match the Overture route's
   exit to the guide story-intro rail entry (the signature literally continues). Then **V6 —
   QA/perf** closes the visual plan (Lighthouse vs. baseline, full matrix, MOTION.md rewrite).
2. **F0 — prove the pipeline** (Opus driver, ~2–3h + wait). Needs the OAuth secret first — still
   the audit's #1 open item.

Deferred polish (not blocking): a Lighthouse LCP/CLS pass on the new hero (V6 covers it), and an
eyeball of the V4 contour strokes over the REAL cover photos post-deploy (bump `.11` if faint on
bright covers). Still pending: the creator deletes the merged remote branch
`claude/test-coverage-analysis-siftjs` via GitHub UI (sandbox 403s on ref deletion).

**Re-prompt the creator with:** "V4 is live — a faint topographic map-line overlay now floats over
each guide's hero photo, title still crisp. The whole hub-and-guide visual overhaul is nearly done:
just V5 (make the hub→guide transition one continuous move) and V6 (QA/perf) left. Or switch to F0
(prove the pipeline, needs the OAuth secret). Which one?"
