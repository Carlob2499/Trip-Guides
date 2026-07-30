# Disposition: outside "travel-itinerary-curator" implementation plan — REJECTED

**Date:** 2026-07-30 · **Reviewed against:** repo state at that date (post-Living-Atlas merge)
**Source:** an external consultant document proposing a `travel-itinerary-curator` skill,
`itinerary_helper.py` Python CLI, `npm run curate`, a "5-Question Venue Mandate", a
"14-dimension rubric", TikTok/Instagram "viral trend synthesis", and an auto-updating
"Traveler Profile Graph".

## Parity findings (why it was rejected)

| Plan claim | Repo reality at review |
|---|---|
| Skill "installed" at `.claude/skills/travel-itinerary-curator/` + `itinerary_helper.py` | Never existed. Only skill: `waypoint-guide-author` |
| `npm run curate` configured | No such script; real gates are `verify`, `recert`, `verify-live` |
| "NEW: `energy`/`env` day tags + weather-swap" | Already shipped verbatim (`src/content.config.ts` days schema; weather day-swap advisory) |
| "NEW: Pass A/T0, Pass B, `verified_on`, shelf-life recert" | All pre-existing repo vocabulary and shipped systems (`recert.yml`, staleness sweep, two-pass research workflow) |
| "14-dimension rubric" | `docs/GUIDE_RUBRIC.md` has 13 rows; the 14th was invented |
| "Single-command autonomous curate-trip" | The issue-ops pipeline already runs intake → scaffold → dual pass → verify → auto-graduate unattended |

## Doctrine conflicts in the net-new parts

1. **Parallel Python CLI** duplicating scaffold/verify/recert — a second competing toolchain
   (Boundary Check #1's bug class: discovery picks a winner and it drifts).
2. **Mandatory per-venue weather backup (5th question)** — forces invented contingencies;
   this repo already cut "the rain plan" for not existing. Weather resilience lives at the
   day level (`env` tags + swap advisory) without fabrication.
3. **TikTok/IG API "viral synthesis"** — no sanctioned API path for this repo's use; scraping
   is ToS-hostile; "viral" as a quality signal inverts the anti-tourist-trap doctrine.
4. **Auto-updating traveler profiles from divergence data** — breaks the learnings-loop rule
   that raw feedback is curated into patterns, never auto-applied.

## What WAS adopted (the one salvageable idea, reshaped to doctrine)

Video/social **lead sourcing** for Pass B — YouTube transcripts via `yt-dlp` (never media),
TikTok/IG signal via web-indexed roundups only, everything leads-only against the same T0 bar:

- `.claude/skills/waypoint-guide-author/references/social-leads.md` (the binding rules)
- Pass B pointers in `SKILL.md` + `research-efficiency.md`
- Best-effort `yt-dlp` install step + Pass B prompt line in `research-pass.yml`

No new skill, no new scripts, no API keys, no schema changes.
