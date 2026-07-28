# HANDOFF — read this first, then re-prompt the creator

> **Ritual (binding):** at SESSION START, read this file INSTEAD of re-deriving history from
> the conversation, memory sprawl, or git log — it is the single warm-start context. Then
> greet the creator with the **"Where we left off"** line below and the recommended next step.
> At SESSION END, rewrite the Snapshot + Where-we-left-off sections (keep this header), commit.
> Keep it under ~80 lines — a handoff, not a chronicle. Deep context lives in the north-star
> docs it links; only follow those when the task actually needs them.

## Operating rules (stable — rarely change)

- **Model economy:** research/recert/fact edits + mechanical builds run on **Sonnet**; **Opus**
  for design sessions and judgment/first-run-triage work. Every grand-plan session below lists
  its own model — remind the creator to `/model`-switch at session start.
- **Never number guides as milestones** — the product is the backbone; a new guide is the
  backbone exercising.
- Ship loop on every change: build → test → `astro preview` :4322 (never `astro dev`) →
  grep `dist/` → commit → push to `main` (the only branch — `verify-live` guards every deploy).
- North stars: `docs/PIPELINE.md` (generation/maintenance) · `docs/MOTION.md`
  (presentation/motion) · `docs/GUIDE_RUBRIC.md` (quality bar) ·
  `docs/COMPETITIVE_LANDSCAPE.md` (market parity reference).

## Snapshot (updated 2026-07-28, session close #12 — Living Atlas programme underway; R1 SHIPPED on its branch)

**The Living Atlas redesign is running on `claude/website-visual-redesign-upnl05`** (NOT yet
merged to main). Full spec: `docs/PLAN_VISUAL_REDESIGN.md` (phases R1–R6, gates, delegated
decisions, Fable executes) · mock-ups: `node docs/mockups/build-mockup.mjs` · creator-chosen
motion language recorded in `docs/MOTION.md` ("the overture, then the heartbeat"). **R1 is
COMPLETE on the branch:** Quiet Edition type (Literata standard opsz variant does display AND
body; Source Sans 3 replaces Spline Mono for data; Bricolage retired; display weights/tracking
retuned across 10 css files; OG parity switched to serif title + sans labels) + literal labels
(Getting around→Transit, Itinerary→Days, References→Sources across all guides, scaffolder,
template, guide-author skill — which also gained the voice standard). Gates green: build 0,
876 tests, perf 125/200 KB, dist/ greps clean of old faces and old labels, preview verified
375px+desktop+dark. NEXT: R2 (mobile bottom bar + journey sheet) per the plan's session
prompt; descriptors render (R1's second half) rides with R5's section anchors. a11y baselines
re-record on CI when the branch PRs — expected to shift only if contrast moved (colors didn't).

## Previous snapshot (2026-07-26, session close #11 — M1–M6 COMPLETE; only M0's E2E proof left)

> **Merged to `main` 2026-07-26 (`834b741`, fast-forward), then `fc81804`.** `origin` is
> `main`-only again apart from the merged `claude/waypoint-audit-modernize-tne4ce`, which is now
> redundant and safe to delete. All gates green on `main`: lint 0, `astro check` 0 errors, **876**
> unit, Accessibility green after the tab-icon baseline fix (see Where we left off), Pages +
> intake-worker deployed. `claude/test-coverage-analysis-siftjs` was already fully contained in
> `main` — a stale local ref, nothing to merge.

**M1 through M6 are all COMPLETE. The ONLY thing left in the whole programme is M0's
end-to-end pipeline proof, which is blocked on ONE owner action: rotate the OAuth token.** Branch `claude/waypoint-audit-modernize-tne4ce`. Full audit + executor
program in `docs/PLAN_MODERNIZE.md` — read that file for the complete record; this is a summary.
Build clean, **870** tests, lint 0 (`no-explicit-any` now ON as a ratchet), `astro check` 0
errors, perf budget green (worst first-paint page 125 KB / 200 KB).

- **M0 (blocked on the creator): `CLAUDE_CODE_OAUTH_TOKEN` is expired/revoked** — confirmed via a
  live dispatch: `401 OAuth access token is invalid`, not the "cosmetic" misdiagnosis from July
  20. **Owner action next session:** `claude setup-token` locally → repo secret → re-run Token
  canary (closes issue #22) → then the W6 end-to-end proof (a real `zz-` throwaway guide through
  the whole chain) runs for the first time ever, same session. Independent-of-token M0 fixes
  already shipped: `allowed_bots` on research-pass's agent step, `GH_TOKEN` job-level env on
  three agent workflows, new-guide's concurrency race fixed, circuit-breaker message fixed.
- **M1 (CI efficiency) shipped:** paths-ignore + concurrency + Playwright browser cache on
  test.yml/a11y.yml, cache:npm on the two workflows that needed it, a stale-fixture bug fixed in
  the skill-evals script.
- **M2 (CLS) shipped:** nav-hint now overlays instead of pushing content (the CLS 0.244's most
  reliable contributor), `.guide-stats` changed from wrap to scroll (pill-append could no longer
  shift height), hero srcset/sizes on both heroes, and `check-perf-budget.mjs` now derives a real
  per-page first-paint budget from the built artifact's actual script/import graph (measured:
  worst page 124 KB / 200 KB) instead of one 900 KB total that was ~78% lazy chunks.
- **M3 (design tokens) shipped, scoped to zero-visual-change + two real bugs:** z-index scale
  named in base.css; fixed the confirmed bug (skip-link painted UNDER story-mode, now explicitly
  above it) and a 9000-vs-everything-else-900s outlier; `--text-h1` token added at `.cat-title`'s
  EXACT existing size (caught and corrected a draft that would have silently enlarged it — verify
  the px math before landing a "zero visual change" claim, don't just assert it); a dead duplicate
  `font-weight` declaration removed; two stale hub-motion.css comments fixed. Spacing-scale sweep
  and `.day`'s two-file styling are real but deferred — 15+ files, needs its own pass.
- **M4 is now COMPLETE (items 1–5 shipped this session, Opus).** Full detail in the plan.
  **Icons:** `src/components/Icon.astro` is the single home for 19 stroke paths; every emoji and
  text glyph is gone from the chrome — tool tabs, mobile sheet, bottom bar, dark toggle (its `◑`
  used to flash for a frame before JS swapped it), Trip Kit eyebrows, jet-lag, day-pace, footer.
  `dist/` greps clean. Accessible names preserved (icons `aria-hidden`, controls keep real text),
  so screen readers stop announcing emoji names. Left deliberately: `reminders.js`'s KIND_ICON
  map — JS-rendered content-type markers in a silo, not chrome.
  **Hub:** `data-count` drives a 2-up editorial layout with bigger covers at ≤4 guides (3 closes
  as 2 + 1, last card full-bleed); the original auto-fill returns at 5+, untouched.
  **Tabs:** tool tabs stay in the same tablist (ARIA and arrow-key ring intact) but get a divider
  and, at ≥900px, CLIPPED labels — clipped text stays in the a11y tree, so the strip fits one row
  on desktop with every accessible name intact.
  **Choreography:** story intro → cold-open → nav-hint, one per view, none burning its flag while
  standing down. This exposed a real latent bug: `story-open.js` was imported BELOW the two
  scripts that needed its `window.__storyIntro` flag, so it was always `undefined` when they read
  it. Fixed by reordering (still above `gsap-hero.js`, its other constraint).
  **Colophon:** the footer is now a signature — claim, this guide's own counted numbers, small
  print, request-a-change pill. Korea shows 45 verified facts / 23 primary sources, Denmark
  21/16, Sedona 11/7. The "Checked" stamp needed real work to be honest: the guide-level
  `verified` field is free prose, so the ISO-matching `verifiedDate` was null on every guide and
  the row would have silently never rendered — added `latestVerifiedOn()` (4 tests) over the
  per-fact provenance dates, which are machine-readable. All three guides now show a true
  "Last checked 2026-07-23".
- **M4 item 6 (More detail v2) shipped last session — creator's explicit priority.** `.card-more-sum` is now a
  real chip (fill/border/hover/focus-visible/chevron); `moreLabel` is a real schema field with an
  honest computed-count fallback; the split refuses to fold a `⚠` or `<ul>/<ol>` remainder (shows
  everything rather than hide a warning); a masked fade-out preview renders above the closed chip;
  the open animates via `@supports`-gated CSS (`::details-content`/`interpolate-size`), snap
  fallback everywhere unsupported. Verified live in `dist/`. **A11y investigation note:** manually
  ran the full a11y gate (this sandbox has no `playwright install` path, so via a temp local
  config against the pre-installed Chromium); found and fixed one real issue from the M2
  `.guide-stats` change (`tabindex="0"`, scrollable-region-focusable), and bisected a 4-test
  `bgOverlap` failure all the way to the pre-session commit — it reproduces on fully-stashed code,
  so it's environment/font-stack drift the test's own comments already document, not a
  regression.
- **M5 (dynamic runtime / room codes) DONE.** Surveyed first: View Transitions and the
  connection state machine were ALREADY shipped in earlier sessions (transitions.css,
  offline-pill.js) — recorded so nobody rebuilds them. The real work was the room-code options:
  a `#room=` fragment override (private code, never enters the repo, never sent to a server;
  same 16–40 char rule; wired at the one chokepoint) and a post-trip read-only lock that turns a
  settled trip's budget into its financial record. **Opt-in, default off** (`budgetLock`): a
  14-day grace would have silently frozen Korea's LIVE budget on 30 Jul, four days after
  shipping, and that is not a fork to pick for the creator. Client-side only — no DB or rules
  change. Verified in dist/: every guide ships `"budgetLock":false`.
- **M6 (type safety) DONE — the rule is ON as a ratchet.** `src/lib/guide-types.ts` derives
  `GuideData`/`Section`/`SectionOf<T>` from the Zod schema (never hand-written). Converted the
  core walkers (map-pins, buckets, exports, hub derivation): **150 → 118** `any`s, with the
  build output **byte-identical** before/after (same SW content hash — proof it was purely
  type-level). The types surfaced 3 real defects no test could see, incl. `PlannerDay.energy`
  typed `string` against a 3-value schema enum. `no-explicit-any` is now `"error"` with a
  33-path exception list in eslint.config.mjs — a shrinking TODO in the config instead of a
  rule switched off. Forced the failure once to prove it bites. Also learned the hard way:
  `[slug]` in an ESLint `files` path is a glob CHARACTER CLASS, so those four endpoints matched
  nothing until rewritten with `*`. guide.css split at its threshold (print block → print.css,
  790 → 696 lines).
- **Tooling follow-ups (2026-07-26, Part 5 of the plan):** `playwright.config.ts` now resolves
  Chromium adaptively — the managed browser wins when installed (CI unchanged), a pre-installed
  one is used only when it is genuinely absent, `PW_CHROMIUM_PATH` overrides. **Visual
  verification works again from a plain `npx playwright test`**, which un-blocks the deferred
  `--space-*` sweep. The token canary now @-mentions AND assigns the repo owner, routing the
  alert through GitHub's own email/mobile-push path (a Claude routine was built and deleted —
  routine sessions can't be granted the github connector here, and this environment's proxy
  intercepts api.github.com either way, so it could not see what it was checking). The wizard's
  PDF upload now derives COUNTRY — the one required field — from the real country table,
  prefilling only on exactly one match. **a11y baselines deliberately NOT re-recorded** from
  this sandbox: they are calibrated to CI's font stack, and rewriting them here would turn CI
  red. That belongs on CI's runner.
- **Connector hygiene (owner action):** this session ran with Dropbox, Gmail, Calendar, Drive,
  PubMed, Spotify and Vercel attached — zero call sites, ~45k tokens of dead schema per session.
  `CLAUDE.md`'s policy (github + Claude Code Remote only) is correct and is not being followed.
- **Session #8 also fixed:** a live Trip Split desktop misalignment, dead `.se-drag`/`.imgfail`
  CSS, stray `mexico.json` + root `wrangler.jsonc`, stale flat-`<slug>.json` references.

Standing context from session #7 (detail in git history / `git show 3dc5349:docs/HANDOFF.md`):
every guide is a directory and a test enforces it · Mexico/Portugal retired (their researched
`countries.mjs` rows deliberately kept) · served `.gpx`/`.ics` spec-tested · ESLint 277→0 and a
CI gate · CodeQL's 4 real alerts fixed · Trip Split room codes real + sync failures surfaced,
confirmed live by the creator.

## Left to do

1. **Korea's live budget was recovered, and the recovery is the lesson.** Its 3 members and 23
   expenses ($4,293.09) were at `trips/southkorea` — the title-derived room from before the slug
   change, writable back then because the 16-char rule did not yet exist. Copied to
   `trips/0286df0ea411ae7e`; the old node is UNTOUCHED as a backup. `_guide.json` records
   `roomMigratedFrom: "southkorea"`. Guard added: `model/room.ts` (no storeKey fallback, ever) +
   `scripts/__tests__/guide-room-id.test.mjs`. Both were deliberately failed before being trusted.
2. **The `no-explicit-any` debt** (Snapshot above). The unlock is typing the guide-JSON walkers
   against `CollectionEntry<"guides">["data"]` and the section union, then turning the rule back on.
   Biggest single files: `exports.ts` (14), `map-pins.ts` (14), `content.config.ts` (12),
   `GuideLayout.astro` (28).
2. **Room codes are committed to a PUBLIC repo** (all three guides). Deliberate — the creator
   chose zero-setup sync for three travellers over secrecy — but anyone reading the repo can read
   and write those budgets. The alternative, a `#room=` fragment shared privately, stays open.
3. **The room guard cannot check whether an old room is POPULATED** — no credentials, no network
   to the DB at build time, and a build that depends on a live datastore is its own hazard. The
   historical half of `guide-room-id.test.mjs` compares working tree vs HEAD, which catches the
   mistake at the moment it is made and is a no-op in CI. The valid + unique checks are the
   unconditional ones. Stated in the test itself, not hidden.
4. **Dead-file audit: mechanical half done, judgment half open.** All 289 source files under
   `src/ scripts/ worker/` were scanned — **zero dead modules**; the only unreferenced files are
   tests (nothing imports a test) and `src/env.d.ts` (ambient). What remains is a call only the
   creator can make: ~~six completed-work docs~~ — RESOLVED 2026-07-26: archived to
   `docs/archive/`, references repointed.
5. Not built: the PostToolUse typecheck hook in `.claude/settings.json`, and trimming `CLAUDE.md`
   toward 200 lines (it grew this session).
6. **Unverified:** `scaffold-guide.mjs`'s new end-to-end directory path. Creating a throwaway guide
   would leave artifacts the destructive-op guard prevents cleaning up.

## Owner tasks (need the creator, not the agent)

1. **Rotate `CLAUDE_CODE_OAUTH_TOKEN` — blocks M0 from finishing.** `claude setup-token` locally →
   repo secret → re-run Token canary. See Snapshot above; this is the only thing standing between
   here and the pipeline's first-ever real end-to-end run.
2. **Re-enable the `config-protection` hook** if it is still off (`~/.claude/settings.json` line
   53) — the agent cannot; the permission classifier refuses edits to `~/.claude/`.
3. Commit `eae5573`'s subject line is a literal `@` (PowerShell here-string leaked into Bash); the
   body is intact. The Fact-Forcing Gate blocks `--amend`.
4. **Shell reminder:** commands in this repo's docs are Git Bash — `rm -rf` / `git show … > file`
   in PowerShell fails or writes UTF-16.

**W6 (real end-to-end pipeline proof)** is no longer deferred — it's the next concrete step, once
the token is rotated. Detail in `docs/PIPELINE.md` and `docs/PLAN_MODERNIZE.md`'s M0.

## Where we left off

Two sessions ago the audit's lesson was: every green gate here measures the artifact, not the
factory. This session answered *why* the factory never ran — not a guess, a 401 read straight off
a live dispatch — then spent the wait on everything else the plan could reach without the token:
CI efficiency, the CLS root causes, the type-scale/z-index foundation, and the creator's specific
priority (More detail v2). One real a11y bug was caught and fixed along the way (a scrollable
region needed `tabindex`).

**Correction, on merging this branch to `main`: the second a11y finding was NOT environment
drift.** It was recorded as baselines "calibrated to a different machine" and left. Merging turned
the Accessibility workflow red on all eight guide combinations — the branch had never run that
workflow, so nothing surfaced it until then. CI and the sandbox in fact report *identical* counts
(denmark 47, korea 65); the cause was this branch's own tab icons. An inline `<svg class="gtab-ico">`
inside each `.gtab` defeats axe's stacking-order reimplementation once per tab, so each guide grew
by exactly its tab count: +8 denmark, +11 korea.

The part worth carrying forward is *why the gate could not say so itself*. `unrecognised` — the
zero-tolerance novelty check the file calls "the mechanism that surfaces a real bug" — keys on
rule + messageKey, never on the element. So a wholly new element family inherited a justification
written about sight-card photo captions and passed silently; only dumping the node selectors
showed it. The count check caught the symptom, the novelty check missed the cause. Real composited
contrast was then measured before any baseline moved (worst case 4.77:1 against 4.5:1 required),
and the new numbers were deliberately failed at 43 before being trusted at 47. Fixed in `fc81804`.

**Re-prompt the creator with (2026-07-28):** "R1 shipped on the redesign branch — open any
guide from it and the site already reads like the study: one serif wearing display and body,
quiet sans numbers, literal tabs on one row. Your motion choice (B+C, 'overture then
heartbeat') is now MOTION.md doctrine. Next session executes R2: the mobile bottom bar +
journey sheet. Also still standing from the M-programme: rotate `CLAUDE_CODE_OAUTH_TOKEN`
to unlock the pipeline's first end-to-end proof."

**Prior re-prompt (superseded):** "The whole M0–M6 programme is done except one thing, and that
one thing needs you: `CLAUDE_CODE_OAUTH_TOKEN` is expired (confirmed from the real API response
— 401 OAuth access token is invalid). Rotate it (`claude setup-token` → repo secret → re-run
Token canary) and I'll run the pipeline's first-ever real end-to-end proof: a throwaway guide
through scaffold → research → verify → auto-graduate → land → live. Everything else shipped:
CI efficiency, the CLS root causes, the design-token foundation, the full visual pass (one icon
language, editorial hub, one-row tab strip, sequenced onboarding, a colophon footer that signs
each guide with its own counted verification numbers, and the More-detail redesign you asked
for), room-code options (`#room=` override + an OPT-IN post-trip lock — default off, because
turning it on by default would have frozen Korea's live budget on 30 Jul), and the type-safety
debt (150→118 `any`s, `no-explicit-any` now ON as a ratchet with a shrinking exception list).
870 tests green. Three things I deliberately did NOT do, each with a reason in the plan:
modulepreload/font-preload hints, the `--space-*` spacing sweep, and typing the `.astro` block
props — all real, all wanting their own pass rather than a rushed one."
