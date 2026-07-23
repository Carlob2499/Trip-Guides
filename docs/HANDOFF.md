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

**All three standing plans are now fully CLEARED — `docs/PLAN_FIELD_REPORT_FIXES.md` (E1–E8, all
8 items including item 5), `docs/PLAN_TRAVELER_FEATURES.md` (F1/F2/F4–F7·C1), and
`docs/PLAN_VISUAL_OVERHAUL.md` (V1–V6) are all done.** E8 item 5 (the contour-visibility
human eyeball) was settled this session — **kept as-is, no step-back**; see `docs/MOTION.md`'s
U9 section. What's left, gated on things only the creator can supply:
- **E2** — the real end-to-end pipeline proof — needs an actual trip to plan.
- **F7 C2** — needs evidence from **two real research passes** running C1's bar test first;
  same real-trip gate as E2. C3 only builds if C2's evidence says so.

**No grand plan is queued up next.** When the creator's ready to pick a new direction, the north
stars (below) are the place to look, or ask what's on their mind. Three GitHub issues (#17, #18,
#19) were filed this arc for pre-existing, out-of-scope findings — see below.

- **CLAUDE.md carries the Clarifying-Questions Doctrine** — binding on every plan/prompt/session.
- **Secret status:** `CLAUDE_CODE_OAUTH_TOKEN` confirmed valid 2026-07-20.
- **Housekeeping still open:** creator deletes merged remote branch
  `claude/test-coverage-analysis-siftjs` via GitHub UI (sandbox 403s on ref deletion).

## Where we left off

**F1–F7·C1** (prior session): checklist upgrade + book-by timeline, budget-pact silo,
weather-aware packing, offline-proof E2E, pre-trip auto-recert, and the Critic bar-test lens.
Full detail in git history / prior HANDOFF revisions — all shipped, tested, pushed.

**E8 item 5 — SETTLED (this session):** real Playwright screenshots of the Korea guide masthead
(desktop/mobile × light/dark) and a pre-auto-glide hub zoom verified the V4 contour pass that
originally shipped with no screenshot tool available. Contours are clearly visible and legible
in all four masthead states, title legibility preserved throughout. Reviewed by the creator —
**kept as-is, no step-back.** This closes the last open item in
`docs/PLAN_FIELD_REPORT_FIXES.md`; all of E1–E8 are now done.

**V5 — morph continuity** (this session): the hub card's accent bar (`.hubcard-bar`) and the
guide masthead's accent rule (`.masthead-rule`) now share `view-transition-name:accent-<slug>` —
the trip's colour visibly travels across the hub→guide navigation, confirmed live (a
mid-transition Playwright screenshot caught the bar sitting at its morph target). The plan's
other ask — the Overture route line's exit state matching the story-rail entry — isn't a literal
shared element (the route line has no tap-time hook and is normally off-screen by tap time,
confirmed via research agent); shipped the honest equivalent instead: the story-rail's segment
fill now uses the guide's own `--accent` instead of a fixed white. OG images, print styles,
`/progress/`, `/health/` all confirmed untouched. Reduced-motion fallback clean.

**V6 — QA and the honest pass** (this session, closes the plan): running the full Playwright
suite together for the first time this arc surfaced real findings the overhaul itself never
caused — refreshed 8 visual baselines stale since before V1 (reviewed each by eye first, none
blind-updated), fixed a genuine a11y landmark regression (`<section class="overture">` →
`<header>`, the Overture hero's content wasn't contained by any landmark), fixed a genuine WCAG
contrast failure (`.bs-pos` read 2.87:1 against `.botSections`'s always-inverted background,
fixed theme-independently), and fixed two label/name-mismatch findings. Recorded this site's
first-ever Lighthouse numbers (90s across the board; CLS held at a steady ~0.244, filed as
follow-up #19). Confirmed the perf budget gate passes with headroom, and that 3 unrelated
pre-existing E2E failures (SOS focus-trap wrap, two Trip-Split network-harness tests — filed as
#17, #18) aren't caused by this arc. Full detail: `docs/MOTION.md`'s own "V6" section.

All of F1–F7·C1 + V5 + V6: build clean, full test suite green (762/762), typecheck 0 errors,
mobile 375px + desktop + dark + reduced-motion + JS-off all verified in preview.

**Re-prompt the creator with:** "All three standing plans are now fully cleared — E8 item 5 is
settled (kept as-is, no step-back), which closes out `PLAN_FIELD_REPORT_FIXES.md` entirely, and
`PLAN_VISUAL_OVERHAUL.md` closed out last session (V1–V6). Along the way this arc found and fixed
a couple of real accessibility bugs (a landmark gap, a contrast failure) and filed 3 GitHub issues
for pre-existing bugs that turned up but aren't part of any plan (#17 SOS focus-trap, #18 two
Trip-Split test flakes, #19 a steady CLS reading worth root-causing later). No grand plan is
queued up next — what would you like to work on? The only things left anywhere are E2 and F7-C2,
both gated on a real trip to plan whenever one's ready."
