# HANDOFF — read this first, then re-prompt the creator

> **Ritual (binding):** at SESSION START, read this file INSTEAD of re-deriving history from
> the conversation, memory sprawl, or git log — it is the single warm-start context. Then
> greet the creator with the **"Where we left off"** line below and the recommended next step.
> At SESSION END, rewrite the Snapshot + Where-we-left-off sections (keep this header), commit.
> Keep it under ~80 lines — a handoff, not a chronicle. Deep context lives in the north-star
> docs it links; only follow those when the task actually needs them.

## Operating rules (stable — rarely change)

- **Model economy:** research/recert/fact edits run on **Sonnet** (light Opus only for a
  contested reconcile). Fable/Opus = design sessions only, on exception. Binding detail:
  `.claude/skills/waypoint-guide-author/references/research-efficiency.md`.
- **Never number guides as milestones** — the product is the backbone; a new guide is the
  backbone exercising.
- Ship loop on every change: build → test → `astro preview` :4322 (never `astro dev`) →
  grep `dist/` → commit → push.
- North stars: `docs/PIPELINE.md` (generation/maintenance) · `docs/VISUAL_COVERS.md` +
  `docs/MOTION.md` (presentation/motion) · `docs/GUIDE_RUBRIC.md` (quality bar).

## Snapshot (updated 2026-07-18, session close)

**Backbone complete, the approved feature wave shipped, the pipeline went from 5 manual
touchpoints to 2 — and this session it got its first real-world exercise, which surfaced
and fixed 3 genuine bugs.** 450 tests, all on `main`.

- **Real-world round (this session):** the creator filed a real "New guide: Hawaii" issue
  (#9) through the site and hit a live failure: `new-guide.yml`'s scaffold step never ran
  `npm ci` before a script that imports `zod` → `ERR_MODULE_NOT_FOUND` on the very first
  real issue. Fixed (added the install step). Separately, the New Guide wizard modal was
  silently dropping 3 fields (anchor event, party, travel style) — the intake form never
  asked for them, so nothing was there to transcribe into the GitHub issue; added the
  inputs and wired them into the submit URL. Fixing that surfaced a second, independent
  pre-existing bug: a double-matching CSS selector in `wizard.js`'s field-mapping orphaned
  "End date" outside its step. Both wizard bugs fixed and verified end-to-end in-browser
  (all 3 steps render and advance correctly) — commit `ced8d0d`. Also fixed 2 pre-existing
  a11y color-contrast violations (Denmark light mode + a previously-undetected Korea
  dark-mode mirror case) via `color-mix(in srgb, var(--accent) 70%, var(--ink) 30%)`,
  root-caused to `MIN_ACCENT_CONTRAST=3.0` in `extract-palette.mjs` being sized for
  large/decorative use, not the 4.5:1 small-text/active-tab uses it also serves.
  **Issue #9 (Hawaii) itself never scaffolded** — it failed before the fix landed, so it
  needs the `new-guide` label re-applied (or a fresh issue filed) to actually try again.

- **Pipeline complete (P0–P4) + streamlined:** typed intake → resumable dual-pass research
  → `npm run verify` scorecard → graduate-on-evidence → weekly recert. Scaffold auto-starts
  research; a persisted attempt counter caps stuck runs at 5 and files a `stuck` issue; a
  verify PASS auto-merges to `main` (`scripts/land-branch.sh`) and auto-files the
  graduation nomination. **Only manual step:** the owner's `graduate-approved` label — the
  mechanical gates can't judge anchor/priority/party-fit/authenticity, so a confidently-wrong
  fact still needs a human glance. **Scoped edits:** a **✎ Request a change** button on every
  guide files an issue; `modify-approved` runs `modify-guide.yml` the same way.
  `graduate-guide.mjs` now handles both flat-file and split-directory guide shapes.
- **Visual/motion + `docs/FEATURES.md` wave complete:** card→hero morph, first-open
  day-story, story-mode itinerary, cover-extracted palettes, PWA, and all 7 planned
  traveler features (transit deep-links, arrival autopilot, phrase cards, entry-requirements,
  sun/daylight strip, advisory pill, trip recap). Held: #2/#3 (revivable). Dropped: #4.

**Known waits:** R5 telemetry ranking needs real use; `docs/telemetry/summary.md` doesn't
exist yet (no traffic); TRAVELER_PATTERNS grows only from real trips (2 data points total);
#6/#7's phrase/entry CONTENT is still dormant on Korea/Denmark (mechanism shipped only);
**the entire streamlined pipeline above is unproven end-to-end** — `guides-intake/` is
empty, meaning no real guide has ever run through the dual-pass/checkpoint/auto-merge system
yet. Everything is unit-tested (`pipeline.mjs`, `graduate-guide.mjs`) and the YAML was
reviewed carefully, but there is no GitHub Actions runner in this environment to prove the
`workflow_dispatch` chain live.

## Where we left off

The wizard/a11y/npm-ci fixes from the real-world round are DONE, tested, built, and
pushed. **The single highest-leverage next step is still the same one this doc named
before that round started: get one guide all the way through the automated chain.**
Issue #9 (Hawaii) is the natural candidate — it already exists, it just needs to actually
scaffold now that the bug that killed it is fixed.

1. **Re-trigger issue #9** (or file a fresh one) — re-apply the `new-guide` label (removing
   + re-adding it re-fires the `labeled` event) and watch the Actions tab: scaffold →
   research auto-starts → should land on `main` on its own (or leave a draft PR if it
   can't). This is the end-to-end proof no amount of local testing can substitute for.
2. Try the new **✎ Request a change** button on Korea or Denmark for a small known fix, to
   prove `modify-guide.yml` end-to-end too.
3. Revive a held feature (#2/#3), or populate #6/#7's dormant content via a research pass.

**Re-prompt the creator with:** "The wizard now transcribes everything you fill in, and the
bug that killed issue #9's scaffold is fixed. Want to re-trigger #9 (or file a fresh guide)
and watch it run the full auto-chain for real, or work on something else first?"
