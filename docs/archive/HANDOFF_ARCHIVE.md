# HANDOFF archive — superseded snapshots and re-prompts

> **Truncated 2026-08-15** (owner ruling): only the three most recent snapshots stay in the
> working tree. Every older one is in git — `git log -- docs/archive/HANDOFF_ARCHIVE.md`
> walks the history, and `git show a79d194:docs/archive/HANDOFF_ARCHIVE.md` prints the full
> 2,080-line file as it stood. Newest first, verbatim.
>
> Moved out of `docs/handoff.md` 2026-08-03 to keep it a handoff, not a chronicle
> (the ~80-line budget its own header sets is gated by
> `scripts/__tests__/docs-integrity.test.mjs`). The session-end ritual still appends here.

## Snapshot (2026-08-14 — dark-mode focus-ring contrast fixed)

**Fixed, not deferred.** The prior entry's "`--accent-ink` would break light (≈2.70:1)" was wrong
— `accentTokens()` derives it to clear ≥4.5:1 on every light AND dark surface by construction, so
no fork existed. 53 `:focus`/`:focus-visible` rules painting identity `--accent` (19 `src/styles/`
files, 6 feature silos, `progress-preview`) now paint `--accent-ink` instead, same fix already
applied to accent link text. Verified in preview: Korea's dark ring 2.48:1 → 5.23:1, light
unchanged; `.pin-flash`/`[data-selected]` left alone. Ship loop green: build/lint/typecheck,
vitest 2009/2009, `a11y.spec.ts` 69/69, drift unchanged.

## Snapshot (2026-08-14 — case 11's live half is built; the "structural blocker" wasn't one)

**Live Routes verification ships.** `check-routes.mjs` is now three layers, cheapest first:
a prose count (no key), a **physical floor** over `days[].waypoints[]` (no key — a straight-line
distance no ground transport could cover in the scheduled gap), and a **live matrix**
(`GOOGLE_ROUTES_KEY`, one `computeRouteMatrix` per day, only days with ≥3 stops — §4's exact
budget). Threaded into `verify() --network` like E2's drift row. Korea yields 27 legs across 7
qualifying days; denmark 5, us 2, japan 0.

**The blocker this file listed for a release did not exist.** The old status said live checking
needed legs "structured as origin→destination pairs against the guide's `map` points" — a schema
design decision. But PLAN_EVIDENCE_FIRST §4 had already named the substrate ("scheduled day
legs") and `days[].waypoints[]` already carried `{name, lat, lng, time}`. **Consecutive waypoints
ARE the pairs.** The lesson, recorded in CONTEXT.md: before declaring work blocked on structure
that doesn't exist, grep for the structure that does. A blocker asserted from a module's own
header comment is an assumption, not a finding.

**Two calibration corrections, both from running it on the corpus rather than reasoning about
it.** An 80 km/h ceiling flagged both real KTX legs (Seoul→Daejeon, Daejeon→Busan) — fixed by
setting the bound at 300 km/h, because this layer is physics, not a realistic speed. Then reading
a windowed stop's END time correctly (origin-end → destination-start, so "10:00–16:30"→"17:00" is
a 30-minute window, not 420) surfaced two more: a window closing at the same clock minute the
next stop opens. That's how humans write itineraries, so `FLOOR_GRANULARITY_MIN` absorbs it.
**Final corpus false-positive rate: zero.** The live verdict is asymmetric for the same reason —
a gap LARGER than the drive is dwell time and proves nothing.

**Boundary checks run, not assumed.** The forced-outage path executed (7 `routes-unreachable`
findings, no invented verdicts); a stubbed matrix drove the real Korea legs end-to-end (7 calls,
27 legs, budget honoured); and one intentionally-invalid-key request hit the live endpoint —
`API_KEY_INVALID`, nothing created. `GOOGLE_ROUTES_KEY` is wired into graduate-guide, recert and
research-pass as an optional secret; unset keeps the free layers and never fails a run.

**`us` registry, closed.** The three remaining section-path-echo claims are renamed. One was
wrong, not just ugly: `budget-daily-costs-5`'s claim read "Red Rock Pass (7-day) — $5" while the
value is the per-DAY rate. It renders nowhere (`data-claim` is emitted only on `approx` rows —
checked in `dist/`, not assumed), so this was registry hygiene, not a reader-facing bug. The
rename also had to be redone once: "PHX rental car, per day — {low end, mid-size}" put the
distinguishing attribute AFTER the em-dash, which is exactly what `claimStem` strips, so it
manufactured a new bare-echo pair. Attribute before the dash. us hygiene now clean.

# Archived snapshot (moved 2026-08-14, merge of the parallel design-fork session)

## Snapshot (2026-08-14 — both design-reconciliation forks are closed)

**Fork #2 (currency converter on rate-fallback) fixed.** `applyFallback()` in
`src/features/live-data/ui/rate.js` used to leave `#liveRatePill` hidden even with
`curFallbackRate` in hand, so a failed fetch silently dropped the converter. It now shows the
pill with the seed rate, marked "≈" and titled "Seed rate · live rate unavailable" — honest, not
live, but present. Verified by forcing the real failure path (pointed `fetch` at a dead host,
rebuilt, confirmed in preview: pill un-hides, popover converts off the seed rate; reverted).
Updated `a11y.spec.ts`'s stale comment describing the old never-unhides behavior. Fork #1
(dark-mode focus-ring contrast) was fixed earlier this session — see archive for both writeups.
Ship loop green: build/lint/typecheck, vitest 2034/2034, `a11y.spec.ts` 77/77, drift unchanged
at 29 real · 742 exempt.

## Where we left off

**Both forks this file was tracking are shipped. Nothing design-related is waiting on the
creator.** The rate-fallback behavior was the last open product decision from the design
reconciliation; it's now a straightforward honesty-preserving fix, not a fork.

**Recommended next step — regenerate the japan guide through the rebuilt pipeline.** It is the
program's natural end-to-end acceptance test (CONTEXT.md's Japan ruling says so explicitly), it
is the only guide with 0 coordinate-bearing waypoints so it exercises the new Routes layers from
zero, and its trip is real and upcoming (Oct 15 – Nov 10, 2026). Everything else on the roadmap
is R3–R6 in `docs/reference/pipeline.md` — product scope never part of this plan. The only other
residue is administrative: the merged remote branch `claude/pipeline-changes-plan-752kra` still
exists on GitHub because this environment's proxy refuses git delete operations — one click in
the branches UI, see Open items above.
