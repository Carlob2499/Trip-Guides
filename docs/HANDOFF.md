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

**This session ran V3 (The Atlas grid) — ✅ DONE, on `main`.** Option A (creator-picked from a
rendered mock): each guide card now wears its own palette — a subtly tinted border at rest and a
**glow in the guide's own colour on hover/focus** (`--accent` at 62%). Pure CSS in
`hub-motion.css`; the reveal is the existing native `view()` system, untouched. Calm ground kept.
Verified desktop+mobile × light+dark (glow reads best on dark). 636 tests, typecheck 0, perf OK.
Prior sessions this builds on: **V2** — the Overture (full-viewport intro that auto-glides into
the hub: `src/scripts/overture.js`, cancelable, once-per-visit, compact-on-return,
reduced-motion-safe). **V1** — the foundation (`contours.ts`, `guide-stats.ts`,
`paletteAccentsForGuide()`, the `--accent2`/`--accent-raw` card props V3 just consumed).

**Still the #1 open item (the audit's top finding, unchanged):** the fully-autonomous research
pipeline has NEVER completed a real end-to-end run. Waits on the creator adding
`CLAUDE_CODE_OAUTH_TOKEN` (repo secret via `claude setup-token`). This is Session F0.

**Housekeeping still open:** the remote branch `claude/test-coverage-analysis-siftjs` (fully
merged, safe to delete) needs the creator to delete it via GitHub UI — the sandbox's git relay
403s on remote ref deletion.

## Where we left off

The Overture (V2) and the palette-tinted Atlas grid (V3) are both live on `main` — the hub opens
with the intro, glides onto the guides, and each card now carries its own colour. Natural next
moves, the creator's call:

1. **V4 — Guide interior depth pass** (Opus, ~1.5–2.5h). Carry the new depth language INSIDE a
   guide without touching the motion signature's ownership: one contour parallax layer behind the
   masthead (extend `hero-parallax.js`, don't add a 2nd owner), unified section-entry easing,
   verified-stamp settle micro-interaction. Opens with its clarifier: any guide sections to leave
   visually untouched?
2. **V5 — Morph continuity** then **V6 — QA/perf** finish the visual plan.
3. **F0 — prove the pipeline** (Opus driver, ~2–3h + wait). Needs the OAuth secret first — still
   the audit's #1 open item.

Deferred polish worth a note (not blocking): a Lighthouse LCP/CLS pass on the new hero vs. the
old masthead — V6 (QA) formally covers it, but if anything feels heavy on a real phone, check
there first. Also still pending: the creator deletes the merged remote branch
`claude/test-coverage-analysis-siftjs` via GitHub UI (sandbox 403s on ref deletion).

**Re-prompt the creator with:** "The Atlas grid is live — every guide card now glows in its own
colour on hover. That's the hub redesign's payoff done. Next in the visual plan is V4 (carry the
same depth INSIDE a guide page), then V5–V6 to finish. Or switch to F0 (prove the pipeline, needs
the OAuth secret). Which one?"
