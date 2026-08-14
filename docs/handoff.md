# HANDOFF — the warm-start context

> **Ritual (binding):** this file auto-loads at session start via the SessionStart hook
> (`scripts/handoff-head.mjs`) — do not Read it again. Greet the creator with the
> **"Where we left off"** line below and the recommended next step. At SESSION END, rewrite
> the Snapshot + Where-we-left-off sections, move the PREVIOUS snapshot to
> `docs/archive/HANDOFF_ARCHIVE.md`, and commit. The ≤120-line budget is gated by
> `scripts/__tests__/docs-integrity.test.mjs`; deep context lives in the north-star docs.

## Operating rules (stable — rarely change)

- **Model economy:** research/recert/fact edits + mechanical builds run on **Sonnet**; **Opus**
  for design sessions and judgment/first-run-triage work. Remind the creator to
  `/model`-switch at session start.
- **Never number guides as milestones** — the product is the backbone; a new guide is the
  backbone exercising.
- Ship loop on every change: build → **lint** → **typecheck** → test → `astro preview` :4322 →
  grep `dist/` → commit → push (this branch — `verify-live` guards every deploy to `main`).
  Lint and typecheck are not optional: CI runs all three and session #20 pushed red twice by
  treating build+test as the whole gate.
- North stars: `docs/reference/pipeline.md` (generation/maintenance) · `docs/reference/motion.md`
  (presentation/motion) · `docs/standards/guide-rubric.md` (quality bar) ·
  `docs/evidence/competitive-landscape.md` (market parity reference) ·
  `docs/design-handoff/` + its `enforcement/` (the design system's own authority — read BOTH
  before any hub/guide visual work). **There is no live design work order:**
  `docs/archive/PLAN_DESIGN_RECONCILIATION.md` is fully ticked and archived alongside
  `PLAN_ATLAS_MIGRATION.md` — history only, referenced when asked, never re-read by default.

## Open items

- **§B4 blocked on project access**, not tool access (`DesignSync` works from a main session;
  this login's `list_projects` doesn't show the right one) — don't retry until it does.
- **Held, not open:** the route-order picker's home (Tools station vs. itinerary mount) — needs both surfaces reviewed together.
- The gap block and "no cover" plate have never rendered on a real guide, by design (CONTEXT.md
  §H3) — proof-of-life is an isolated test fixture, not a staged guide edit.
- Airports for Sedona/Japan — record them WHEN flights get booked. No fact yet; don't invent.
- `/about/` + `/new/` not in the SW precache shell; cover overlay does not trap focus; Cloudflare dashboard Git integration still failing 0s builds.
- No guide uses a direct royalty-free `sights[].img.src` yet — capability live, unexercised.
- **ALL FOUR remote branches are now safe to delete — and none can be deleted from a container
  session.** `pipeline-changes-plan-752kra`, `a11y-landmark-fix-v2` and `recert/japan` are merged
  into main; `claude/design-fixes-continuation-wi920k` is **superseded, never to be merged** — it
  carries the same a11y commit in an older/smaller form plus doc state main moved past, so merging
  it would un-archive `PLAN_DESIGN_RECONCILIATION.md` and revert `handoff.md`. Every delete route
  is closed here: `git push --delete` 403s at the egress proxy, the REST API 403s ("GitHub access
  is not enabled for this session"), the GitHub MCP surface has `create_branch` but no delete, and
  `merge_pull_request` takes no delete-branch flag. One pass at
  github.com/Carlob2499/Trip-Guides/branches clears all four.

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
