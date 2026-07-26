# Denmark uplift — verdict and lessons

**Status: DRAFT PLAN, not scheduled.** Denmark stays an archive (maker's call, 2026-07-17).
Measured 2026-07-17 — every claim below was checked by running something, not reasoned about
(the first three drafts of this plan were each plausibly wrong; full workings in this file's
git history). **Check the claim before you cost it.**

## What the gap actually is (measured, not estimated)

The post-mortem rated Denmark's itinerary "marginally useful" and asked for Korea's standard.
The line count (1,491/39 sections vs Korea's 2,871/73) misleads: every structural day field
(`tldr`/`pace`/`fit`/`checklist`/`body`) is populated on all 9 days — Denmark has *more* days
than Korea. The real difference is prose depth (~21 vs ~53 lines/day) and reference breadth.

The two features asked for by name:

1. **Korea's scrolling itinerary — already renders on Denmark today.** It shipped Jun 25–Jul 11,
   *after* Denmark's Jun 8–16 trip. A timing gap, not a content gap. Do not "fix" it.
2. **Daily weather forecast — permanently impossible.** `guide-ui.js` deliberately skips
   forecasts for concluded trips, so a `weather` section added now renders nothing, forever.
   The scaffold has long pre-wired weather (with capital-coord fallback) for every new guide,
   so guide #3 is already protected. Nothing to build.

The gap nobody asked for, which is worse: **0 of 9 days carry `energy` tags** — so the party
whose binding constraint was *mobility* never got the Low-Energy toggle, while Korea (the
walkers) has 2/8.

## The plan, in cost order

- **A. Tag `energy` on all 9 days (~30 min) — do this; it is the entire honest uplift.**
  Derivable from existing `pace`/`body` + the post-mortem (Malmö = `slow`, Fælledparken =
  `packed`). No research needed.
- **C. Provenance backfill (~2h) — partial only, and never flip `strict`.** Denmark's stamp is
  a single undated blob, so most sections have no evidencable date; date the handful the stamp
  supports, leave the rest undated (a half-dated guide under strict just fails the build).
- **D. Prose depth (~1 day+) — skip.** A full research pass on a concluded trip nobody will
  retake re-verifies June 2026 prices for no one.

## The lessons (they belong to guide #3, not Denmark)

1. **A guide isn't finished when it ships — it's finished when it's at the current standard.**
2. **Some features have a hard expiry** (a forecast only exists during the trip window); the
   platform already guards this — deliver in-window or record the miss.
3. **Tag `energy` at authoring time from the intake's mobility answers**, not retroactively —
   it matters most for the party least able to absorb a bad day.

Denmark's remaining value is as evidence, and it has already paid: the party split in
`TRAVELER_PATTERNS.md` and the structure-vs-roaming finding came from it.
