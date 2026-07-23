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
  (presentation/motion — absorbed VISUAL_COVERS) · `docs/GUIDE_RUBRIC.md` (quality bar) ·
  `docs/COMPETITIVE_LANDSCAPE.md` (market parity reference).

## Snapshot (updated 2026-07-23, session close)

**`docs/PLAN_FIELD_REPORT_FIXES.md` (E1–E8) and `docs/PLAN_TRAVELER_FEATURES.md` (F1/F2/F4–F7·C1)
are CLEARED. `docs/PLAN_VISUAL_OVERHAUL.md`'s V5 is now also DONE.** Everything buildable without
a real trip or a human eyeball is done. What's left, and only the creator can close it:
- **E2** — the real end-to-end pipeline proof — needs an actual trip to plan.
- **E8 item 5** — a human real-photo eyeball on the V4 contour-visibility pass. Screenshots
  (masthead desktop/mobile × light/dark + a pre-glide hub zoom) were sent to the creator this
  session via `SendUserFile` — awaiting their keep-as-is-or-step-back-halfway call. Not yet
  answered as of this handoff.
- **F7 C2** — needs evidence from **two real research passes** running C1's bar test first;
  same real-trip gate as E2. C3 only builds if C2's evidence says so.

Next up: **V6** (QA, performance, honest pass) — the last session in `PLAN_VISUAL_OVERHAUL.md`.

- **CLAUDE.md carries the Clarifying-Questions Doctrine** — binding on every plan/prompt/session.
- **Secret status:** `CLAUDE_CODE_OAUTH_TOKEN` confirmed valid 2026-07-20.
- **Housekeeping still open:** creator deletes merged remote branch
  `claude/test-coverage-analysis-siftjs` via GitHub UI (sandbox 403s on ref deletion).

## Where we left off

**F1–F7·C1** (7 commits, prior session): checklist upgrade + book-by timeline, budget-pact silo,
weather-aware packing, offline-proof E2E, pre-trip auto-recert, and the Critic bar-test lens.
Full detail in git history / prior HANDOFF revisions — all shipped, tested, pushed.

**E8 item 5** (no code — evidence only, this session): took real Playwright screenshots of the
Korea guide masthead (desktop/mobile × light/dark) and a pre-auto-glide hub zoom, to verify the
V4 contour pass that originally shipped with no screenshot tool available. Contours are clearly
visible and legible in all four masthead states, title legibility preserved throughout; mobile
light was subjectively the subtlest. Sent to the creator via `SendUserFile` — the keep/step-back
call is explicitly the creator's per the plan's own reservation, not decided here.

**V5 — morph continuity** (1 commit, this session): the hub card's accent bar (`.hubcard-bar`)
and the guide masthead's accent rule (`.masthead-rule`) now share
`view-transition-name:accent-<slug>` — the trip's colour visibly travels across the
hub→guide navigation, confirmed live (a mid-transition Playwright screenshot caught the bar
sitting at its morph target). The plan's other ask — the Overture route line's exit state
matching the story-rail entry — isn't a literal shared element (the route line has no tap-time
hook and is normally off-screen by tap time, confirmed via research agent); shipped the honest
equivalent instead: the story-rail's segment fill now uses the guide's own `--accent` instead of
a fixed white, echoing the route's colour rather than sharing its DOM node. OG images, print
styles, `/progress/`, `/health/` all confirmed untouched. Reduced-motion fallback clean.
`docs/MOTION.md` and `docs/PLAN_VISUAL_OVERHAUL.md` updated to record it.

All of F1–F7·C1 + V5: build clean, full test suite green (762/762), typecheck 0 errors, mobile
375px + desktop + dark eyeballed in preview for every user-facing change.

**Re-prompt the creator with:** "V5 (morph continuity) is shipped and pushed — the hub card's
accent colour now visibly carries into the guide masthead across the navigation. That leaves V6
(QA, performance, honest pass) as the last session in the visual-overhaul plan — want me to start
it? Separately: E8's contour screenshots are still waiting on your keep-as-is-or-step-back call,
and E2/F7-C2 both still need a real trip to plan whenever one's ready."
