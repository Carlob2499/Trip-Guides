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

**This session ran V2 (The Overture hero) — ✅ DONE, on `main`.** The hub top is now Option A:
a full-viewport cinematic intro that, on first visit, plays the kinetic headline then
**auto-glides** down onto the hub (the creator's ask) — eased, cancelable, once-per-visit,
compact-on-return, off under reduced-motion. New `src/scripts/overture.js` (owns the glide +
recede + parallax + route + stats count-up); component CSS in `src/styles/hub-motion.css`;
`index.astro` gained the Overture + stats-beat markup, a pre-paint `data-overture` state script,
and the relocated `#btnDark`/`#btnNewGuide` (IDs preserved). Real build-time stats shown: 3
trips · 22 sourced facts · 14 distinct sources. **Behaviorally verified via Playwright** (glide
lands on hub; early user-scroll respected; return=compact; reduced-motion=no scroll) at
desktop+mobile × light+dark. Build clean, typecheck 0, 636 tests, perf OK.
V1 (prior session) built the foundation this stands on: `src/lib/contours.ts`,
`src/lib/guide-stats.ts`, `paletteAccentsForGuide()`, and the `--accent2`/`--accent-raw` card
props (the last still awaiting V3 to consume them).

**Still the #1 open item (the audit's top finding, unchanged):** the fully-autonomous research
pipeline has NEVER completed a real end-to-end run. Waits on the creator adding
`CLAUDE_CODE_OAUTH_TOKEN` (repo secret via `claude setup-token`). This is Session F0.

**Housekeeping still open:** the remote branch `claude/test-coverage-analysis-siftjs` (fully
merged, safe to delete) needs the creator to delete it via GitHub UI — the sandbox's git relay
403s on remote ref deletion.

## Where we left off

The Overture is live on `main` — the hub now opens with the cinematic intro that auto-glides
into the guides. Natural next moves, the creator's call:

1. **V3 — The Atlas grid** (Opus, ~1.5–2.5h). The payoff the glide lands on: tint each guide
   card with its own palette (the `--accent2`/`--accent-raw` props V1 already put on the markup —
   so this is largely a pure-CSS session), staggered reveals, hover glow. Opens with its
   clarifier: how bold may the tinting go (border+glow, recommended, vs full card-ground tint)?
2. **F0 — prove the pipeline** (Opus driver, ~2–3h + wait). Needs the OAuth secret first.

Deferred polish worth a note (not blocking): a Lighthouse LCP/CLS pass on the new hero vs. the
old masthead — V6 (QA) formally covers it, but if anything feels heavy on a real phone, check
there first.

**Re-prompt the creator with:** "The Overture is live — the hub opens with the intro and glides
you down onto the guides. Next in the visual plan is V3 (the Atlas grid — making the cards the
payoff, each in its own colour; mostly CSS since V1 wired the palette props already). Want V3, or
switch to F0 (prove the pipeline, needs the OAuth secret)?"
