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

**Backbone complete, the approved feature wave shipped, and the pipeline just went from
5 manual touchpoints to 2.** ~450 tests, all on `main`.

- **Pipeline complete (P0–P4) + streamlined this session:** typed intake → resumable
  dual-pass research (checkpoints) → `npm run verify` scorecard → graduate-on-evidence →
  weekly recert matrix. **New:** `new-guide.yml` auto-dispatches `research-pass.yml` the
  moment a scaffold commits (filing the issue is now the only manual step to start a guide);
  a persisted attempt counter (`pipeline.mjs --bump-attempt`) stops a stuck run after 5
  attempts and files a `stuck` issue instead of resuming forever; on a full verify PASS the
  research agent merges its own branch to `main` (`scripts/land-branch.sh`, real PR,
  auto-merged — not a hand-rolled push) and auto-files the `graduate-request` nomination
  itself. **The one deliberately-kept manual step:** graduating to the curated grid still
  needs the owner's `graduate-approved` label — the mechanical gates can't judge rubric
  rows #6/#8/#9/#12 (anchor/priority/party-fit/authenticity), so a confidently-wrong fact
  still needs a human glance before it's presented as trustworthy (creator confirmed this
  tradeoff explicitly). **New — scoped edits:** a **✎ Request a change** button on every
  guide page (draft or published) files a "Request a change" issue; `modify-approved`
  (owner-only) runs `modify-guide.yml`, the skill's "Edit an existing guide" mode, landed
  the same way. Also fixed: `graduate-guide.mjs` only handled flat-file guides before —
  now handles the split-directory shape too (Korea/Denmark's actual shape).
- **Visual/motion complete (V1, V3a–d, V4):** card→hero morph · first-open day-story ·
  native scroll reveals · story-mode itinerary · lead scannability · cover-extracted
  palettes (one precedence on guide+hub+OG). Runtime: connection state machine,
  cold-visitor strip, weather day-swap (`env` tags, explicit-only), PWA complete. All
  chrome (share/SOS/search/exports) functionally verified in-browser.
- **`docs/FEATURES.md` wave — ALL SEVEN SHIPPED:** #1 transit deep-links · #5 arrival
  autopilot · #6 phrase cards · #7 entry-requirements (Trip kit tab houses 5/6/7) · #8 sun &
  daylight strip · #9 advisory pill (US State Dept, honest-blank below Level 2) · #10 trip
  recap card. Held: #2 prep timeline, #3 budget pact (revivable). Dropped: #4 vault.

**Known waits:** R5 telemetry ranking needs real use; `docs/telemetry/summary.md` doesn't
exist yet (no traffic); TRAVELER_PATTERNS grows only from real trips (2 data points total);
#6/#7's phrase/entry CONTENT is still dormant on Korea/Denmark (mechanism shipped only);
**the entire streamlined pipeline above is unproven end-to-end** — `guides-intake/` is
empty, meaning no real guide has ever run through the dual-pass/checkpoint/auto-merge system
yet. Everything is unit-tested (`pipeline.mjs`, `graduate-guide.mjs`) and the YAML was
reviewed carefully, but there is no GitHub Actions runner in this environment to prove the
`workflow_dispatch` chain live.

## Where we left off

The streamlining work is DONE and pushed. **The single highest-leverage next step is
filing one real guide** — it's the first real proof the auto-chain → auto-merge →
auto-nominate chain actually works under real interruption/retry conditions, not just in
review. Everything else is secondary until that's proven.

1. **File a real guide** (the priority) — Issues → New guide, fill in a real destination +
   intake. Watch the Actions tab: scaffold → research auto-starts → should land on `main`
   on its own (or leave a draft PR if it can't). This is the end-to-end proof no amount of
   local testing can substitute for.
2. Try the new **✎ Request a change** button on Korea or Denmark for a small known fix, to
   prove `modify-guide.yml` end-to-end too.
3. Revive a held feature (#2/#3), or populate #6/#7's dormant content via a research pass.

**Re-prompt the creator with:** "The pipeline is now far more automated — filing one
New-guide issue should carry a guide to `main` with no further clicks, and one label click
graduates it. This has never run for real. Want to file a real destination and watch it go,
or work on something else first?"
