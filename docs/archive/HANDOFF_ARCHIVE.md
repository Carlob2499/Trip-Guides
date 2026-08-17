# HANDOFF archive — superseded snapshots and re-prompts

> **Truncated 2026-08-15** (owner ruling): only the three most recent snapshots stay in the
> working tree. Every older one is in git — `git log -- docs/archive/HANDOFF_ARCHIVE.md`
> walks the history, and `git show a79d194:docs/archive/HANDOFF_ARCHIVE.md` prints the full
> 2,080-line file as it stood. Newest first, verbatim.
>
> Moved out of `docs/handoff.md` 2026-08-03 to keep it a handoff, not a chronicle
> (the ~80-line budget its own header sets is gated by
> `scripts/__tests__/docs-integrity.test.mjs`). The session-end ritual still appends here.

## Snapshot (2026-08-17 — outside audit complete; pre-implementation cleanup started)

**`main` was at `faa4946`; PLAN_PIPELINE_SURFACES was merged and live.** The deployed Atlas and
empty Pipeline surfaces were visually inspected against the source. The Atlas was mature; the
Pipeline's checkpoint display was real, while its sources, decisions, nuggets, and counters were
honest placeholders because no producer wrote `events.json` yet.

**The research spine was strong but the finalized doctrine was not fully actualized.** Immediate
gaps included adaptive native-language escalation, bounded reservation/concierge investigation,
Worth the Effort/Detour output, explicit critic state, and Intake-to-Finished token/time/cost
measurement. Four-agent architecture and Opus use had to earn their place through
quality-per-token evaluation; Claude remained the production backbone through September.

**Deadline remained unchanged:** research and engineering freeze by September 30, followed by UI
binding and finalization October 1–7. The next work was alignment and baseline verification, not
another product questionnaire or broad rewrite.

## Snapshot (2026-08-15 — guide-deepening list, items 1/3/4/5 closed)

**Korea geocode backfill.** `PLACES_API_KEY` lives in `.env` but nothing sources it into the
process env — `set -a; source .env; set +a` before invoking `geocode-venues.mjs`. 1 of 25
unresolved venues (LoL Park) matched confidently and was written; the other 24 stay blank on
purpose — name mismatches Places itself disagrees with, or category entries ("Konbini") that
aren't a single place. Refuse-rather-than-guess working as designed.

**Bare-echo / undated-budget items were already clean.** Korea/denmark's facts hygiene
(bare-echo, malformed, misattribution) and untokenized-money checks both ran clean — an earlier
2026-08-15 session had already closed them. Japan's findings (3 malformed + 1 misattribution + 3
bare-echo stems) left with the guide — it was deleted later the same day for a fresh redo (see
Decisions). The defects survive as frozen fixture evidence, which is where they always belonged.

**E1 tiering backfill done; `backfill-tier.mjs` deleted.** Re-run on korea/denmark: 0 rows left
to assign — everything's already `tier: primary` or correctly left blank as a research call the
script was never built to make.

## Snapshot (2026-08-14 — the codebase-audit cleanup: audited, then cut, all gates green)

**Six-lens adversarial audit → three executed passes** (branch `claude/codebase-audit-cleanup-cahyfq`,
report artifact shared with the creator). Verdict: near-zero dead code, but process weight, helper
duplication, and four shipped defects. **Defects fixed:** tools-reminders.js was never imported
(Tools ticks didn't persist — now wired); double `.sheet-grip` drag-handle removed; grid.js's two
literal NUL bytes (grep saw the file as binary) escaped; the guide footer's telemetry disclosure
outlived the feature (caught by the dist grep, removed).

**Cuts, all creator-approved:** panel/progress-preview design-study trees; 5 unreferenced archive
docs; the test-index meta-gate (test + generator + 248KB catalog); the ENTIRE telemetry chain
(silo, bumpCounter, RTDB rules node, weekly workflow — whose docs/telemetry commit path was broken
and never fired); the 24 local-only Playwright specs (a11y.spec.ts remains the CI gate);
model-smoke.yml; CHANGELOG (frozen, moved to docs/archive/). Workflow diet: content-audit merged
into recert.yml as its Monday report job; mutation + skill-retro de-cronned to dispatch-only.
17 workflows remain, 4 crons.

**Structure:** silo contract's 3 violations sealed (hub index.ts; atlas exports initAtlasWorld —
atlas-map.js got an SSR-safe HTMLElement base for the barrel; route-optimizer math →
`src/lib/route-optimize.ts`); guide.css split under its ~800 rule (botbar/sheet → mobile-nav.css,
map/budget blocks rehomed); index.astro's inline hub script → `src/scripts/atlas-hub.js`;
`check-drift.mjs`→`check-content-drift.mjs` and trip-tools `reminders.ts`→`booking-reminders.ts`
(name collisions); single-letter-variable rename sweep over the 6 worst files (274→185 repo-wide).
Dedup: esc/reducedMotion → scripts/util.js; scripts gained lib/cli.mjs + lib/geo.mjs; og/recap
share pages/og/_card.ts. d3 → 3 submodules (~200KB less shipped); geo-tz → devDependencies.

> **Rolled off since**, in order, each one commit further back than the last: the
> "both design-reconciliation forks are closed" snapshot (2026-08-15 — the rate-fallback
> currency-converter fix and the dark-mode focus-ring fix), and "case 11's live half is built"
> (2026-08-16 — live Routes verification, the blocker that wasn't, and the `us` registry
> close-out). Both are shipped work with nothing open against them;
> `git log -- docs/archive/HANDOFF_ARCHIVE.md` walks back to either verbatim.
