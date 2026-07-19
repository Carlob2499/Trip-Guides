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

**Backbone complete + the ENTIRE approved feature wave shipped.** 431 tests, all on `main`.

- **Pipeline complete (P0–P4):** typed intake → resumable dual-pass research (checkpoints)
  → `npm run verify` scorecard → graduate-on-evidence → weekly recert matrix. Sonnet pinned
  in research-pass.yml / recert.yml via `claude_args`.
- **Visual/motion complete (V1, V3a–d, V4):** card→hero morph · first-open day-story ·
  native scroll reveals · story-mode itinerary · lead scannability · cover-extracted
  palettes (one precedence on guide+hub+OG). Runtime: connection state machine,
  cold-visitor strip, weather day-swap (`env` tags, explicit-only), PWA complete. All
  chrome (share/SOS/search/exports) functionally verified in-browser.
- **`docs/FEATURES.md` wave — ALL SEVEN SHIPPED:** #1 transit deep-links · #5 arrival
  autopilot · #6 phrase cards · #7 entry-requirements (Trip kit tab houses 5/6/7) · #8 sun &
  daylight strip (day-card chip + Focus Today "daylight left", pure client math, calibrated
  against sunrise-sunset.org reference data) · #9 advisory pill (US State Dept per-country
  pages — **bot-gated against build-time fetch, confirmed live; it's a manual/browser
  research step, not automated** — hub badge + SOS sheet, honest-blank below Level 2) · #10
  trip recap card (`src/pages/recap/[slug].png.ts`, sharp/SVG reuse; `hit = waypoints −
  skipped` verified to reproduce Korea's own hand-written "21 of 37" figure; Learnings-tab
  share link). Held: #2 prep timeline, #3 budget pact (revivable, one word). Dropped: #4
  reservation vault.

**Known waits:** R5 telemetry ranking needs real use; what's-open-now blocked on structured
hours; TRAVELER_PATTERNS grows only from real trips; #6/#7's actual phrase/entry CONTENT is
still dormant on Korea/Denmark (mechanism shipped, a research pass populates it); #9's
Korea/Denmark advisory levels are live-verified but decay on the normal recert cadence.

## Where we left off

The approved wave is DONE — nothing queued. Real options for the next session:

1. **Revive a held feature** — #2 prep timeline (T-minus deadlines on the booking
   checklist) or #3 budget pact (intake budget vs Trip Split live actuals). Design work,
   not pure Sonnet mechanism-building.
2. **Populate #6/#7's dormant content** — a guide-author research pass to fill Korea's/
   Denmark's phrase cards + entry requirements (currently shipped-but-empty by design).
3. **Run the dual-pass pipeline on a real guide #3** — the machinery (generate+reconcile,
   richer intake) shipped a while back; the first live run still needs a destination + new
   traveler-pair intake from the creator.
4. General maintenance/polish, or file a real trip.

**Re-prompt the creator with:** "The approved feature wave (#1/#5–#10) is fully shipped —
431 tests green, all pushed to main. Nothing queued next. Pick one: revive held features
#2/#3, run a research pass to populate #6/#7's dormant phrase/entry content, kick off a
real guide #3 with the dual-pass pipeline, or something else entirely?"
