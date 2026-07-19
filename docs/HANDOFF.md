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

## Snapshot (updated 2026-07-19, session close)

**Hawaii → Sedona pivot done (issue #11 supersedes closed #10), and a real architectural
bug behind it got fixed at the root, not patched per-destination.** The creator is adding
the `CLAUDE_CODE_OAUTH_TOKEN` secret themselves next session ("when I get home") — that's
the one remaining blocker on the automated agent, no longer an open question for me to
chase. 455 tests, all on `main`.

- **Retrigger + two agent-config bugs, then the Hawaii→Sedona pivot** (earlier this
  session): re-triggered issue #9, fixed the `claude-code-action` org typo + deprecated
  `allowed_tools` input (all 3 agent workflows), then the traveler changed destinations —
  deleted the Hawaii guide entirely (commit `95e33fc`), closed #10, rebuilt fresh for
  Sedona AZ under the same slug/intake parameters, filed **issue #11**. Full detail in git
  log; not repeating it here.
- **The real fix, this turn: time zone is now resolved from coordinates, not a country
  table.** The creator's framing was exactly right — hardcoding "Hawaii" and "Arizona" as
  flat rows in `countries.mjs` (which is what I'd done to unblock those two guides) was
  the wrong fix: a 50-state table doesn't scale and every large country has this same gap,
  not just the US. Added `geo-tz` (offline, timezone-boundary data, no network) +
  `scripts/lookup-tz.mjs`, mirroring `lookup-place.mjs`'s exact conventions. Guides get an
  explicit `tz` field (content.config.ts, same override pattern as `theme`) resolved from
  their own verified coordinates — `GuideLayout.astro` prefers it over the country-table
  fallback. Removed the ad-hoc Hawaii/Arizona rows entirely; Sedona's `country` field
  reverted to the real country ("United States") with `tz: "America/Phoenix"` set
  explicitly. Cross-checked currency/holidays/emergency-numbers/weather: all either
  already correctly country-keyed (currency, holidays, SOS — genuinely national facts, not
  geographic) or already coordinate-driven (weather, live from the guide's own map) — tz
  was the only one with this bug. Wired into the pipeline: SKILL.md, research-efficiency.md,
  and research-pass.yml's agent prompt all now name `lookup-tz.mjs` explicitly (resolve tz
  in the same step as coordinates, for every guide) — `modify-guide.yml`/`recert.yml`
  inherit this for free since both already point agents at SKILL.md.
- **Pipeline complete (P0–P4) + streamlined:** typed intake → resumable dual-pass research
  → `npm run verify` scorecard → graduate-on-evidence → weekly recert. **Only manual step
  (by design):** the owner's `graduate-approved` label. **Scoped edits:** a **✎ Request a
  change** button on every guide.
- **Visual/motion + `docs/FEATURES.md` wave complete:** card→hero morph, first-open
  day-story, story-mode itinerary, cover-extracted palettes, PWA, all 7 planned traveler
  features. Held: #2/#3 (revivable). Dropped: #4.

**Known waits:** the automated agent chain is STILL unproven end-to-end — every bug found
so far was config/wiring the agent never got past, not a content bug; real proof waits on
the OAuth secret (creator's doing it next session). TRAVELER_PATTERNS still has only 2 data
points; this solo-traveler profile matches neither existing party (logged in
`guides-intake/us.md`'s Amendments).

## Where we left off

**Ready for the creator right now:**

1. **Review issue #11** (graduate: us/Sedona) — fully researched, verified, live on `main`
   as a draft at `/guides/us/`. Apply `graduate-approved` if it holds up. Three open
   judgment calls worth a look: rental-car-over-rideshare (checked live, but Sedona's
   shuttle status could shift before the trip), Mii amo's multi-night booking model vs the
   more flexible L'Auberge day-spa alternative, and an honest budget flag — Sedona's
   lodging runs toward the top of the stated $150–300/day range once priced in.
2. **The OAuth secret is being added next session, by the creator** — once
   `CLAUDE_CODE_OAUTH_TOKEN` exists, filing a fresh New-guide issue is the real first
   end-to-end proof of the automated chain. Nothing else is blocking it.

**Re-prompt the creator with:** "Sedona is fully researched and waiting on your graduation
call at issue #11. Also fixed a real architectural bug this session — time zone now
resolves from a guide's actual coordinates instead of a hardcoded country table, so this
won't recur for any future destination, US or otherwise. Once you've added the OAuth
secret, want to file a fresh guide and watch the automated agent run for real, or review
#11 first?"
