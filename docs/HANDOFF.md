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

**This session ran V1 (Foundation) — ✅ DONE, on `main`.** Clarifiers answered: headline =
**"Every fact checked. Every trip yours."**; replay = **full Overture on first visit, compact
hero on return** (localStorage key decided: `tg-overture-seen`). Built: `src/lib/contours.ts`
(seeded deterministic contour-ring generator), `src/lib/guide-stats.ts` (real counted stats —
guide count, `source_url` occurrences, distinct sources — no invented numbers),
`paletteAccentsForGuide()` in `src/lib/palettes.ts` (3-stop accent set), `src/styles/
hub-motion.css` (token scaffold, inert), hub cards gained `--accent2`/`--accent-raw` custom
props. **Zero visual diff, verified** (screenshots at mobile/desktop × light/dark ×
reduced-motion — byte-identical accents to before). 636 tests green (was 621).
**Deliberately deferred to V2:** the `window.__overture` handshake flag and the
`tg-overture-seen` check/set — nothing exists yet to own or gate, and a component's
markup+behavior ship together, not split across sessions.

**Still the #1 open item (the audit's top finding, unchanged):** the fully-autonomous research
pipeline has NEVER completed a real end-to-end run. Waits on the creator adding
`CLAUDE_CODE_OAUTH_TOKEN` (repo secret via `claude setup-token`). This is Session F0.

**Housekeeping still open:** the remote branch `claude/test-coverage-analysis-siftjs` (fully
merged, safe to delete) needs the creator to delete it via GitHub UI — the sandbox's git relay
403s on remote ref deletion.

## Where we left off

V1 shipped clean and is the base every other session builds on. Two natural next moves, equally
valid — the creator's call:

1. **V2 — The Overture hero** (Opus, ~2.5–4h). The headline ask, ready to build: headline copy
   and replay behavior are both already decided (above), so V2 opens only with its one
   remaining clarifier — may the New-guide wizard move below the grid, or must it stay above
   the fold?
2. **F0 — prove the pipeline** (Opus driver, ~2–3h + wait). Needs the OAuth secret first.

**Re-prompt the creator with:** "V1 is shipped and live on `main` — the foundation for the
Overture hero is in place, zero visual change yet. Want to go straight into V2 (the actual
intro hero — headline and replay behavior are already decided, one clarifier left) or switch to
F0 (prove the pipeline for real, needs the OAuth secret)?"
