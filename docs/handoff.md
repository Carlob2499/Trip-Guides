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

## Parallel session, same day (merged): design-reconciliation forks closed

A concurrent session fixed the two items this file used to hold open — the dark-mode
focus-ring token (`--focus-ring`, theme-aware) and the rate-fallback now keeping the
currency converter alive on a seed rate — and scaffolded the japan draft from issue #50.
Their entries left Open items above; details in that snapshot (docs/archive/HANDOFF_ARCHIVE.md).

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

## Where we left off

**Second-pass audit (2026-08-14, after the big cleanup):** re-mapped scripts/workflows/docs;
found only remnants — deleted the 4 orphaned progress-study files in `docs/mockups/` (the
shipped pipeline-progress feature's throwaway prototype) + their `.gitignore` block, and the
empty `voting`/`telemetry` silo skeletons. Everything else audited KEEP with evidence (see
commit). `backfill-tier.mjs` stays until E1 tiering finishes, per the list below.

**All gates green after the cleanup:** build · lint · typecheck 0 · 2009 tests / 144 files ·
77 a11y checks vs the preview build · dist grep clean. Deferred with rationale: test-walker
`walk()` dedup (8 divergent skip-lists — consolidating risks silently changing gate corpora);
mass CSS-home unification and jetlag re-siloing (churn without reader value); revise-guide +
modify-guide merge (agent pipelines; merge blind and you can't test the seam — needs a live run).

**Waiting on the creator, 2 items:** (1) Turnstile keys — code is fully wired both ends; create
the widget in the Cloudflare dashboard, put the site key in `hub/intake-proxy-config.js`, run
`npx wrangler secret put TURNSTILE_SECRET`. Until then the live intake endpoint has no bot check.
(2) RTDB rules: telemetry node removed from `rules.json` — paste into the Firebase console to
revoke the now-unused write path.

**Recommended next step — the guide-deepening list from the audit** (uses existing tooling, zero
new code): korea geocode backfill (24/87 items missing coords), japan's 3 malformed fact values +
1 misattribution, the 17 bare-echo ambiguities, korea's 11 undated budget figures, finish E1
tiering (then delete backfill-tier.mjs), then regenerate japan through the rebuilt pipeline.
