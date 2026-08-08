# HANDOFF archive — superseded snapshots and re-prompts

> Moved out of `docs/HANDOFF.md` 2026-08-03 to keep it a handoff, not a chronicle
> (the ~80-line budget its own header sets is now gated by
> `scripts/__tests__/docs-integrity.test.mjs`). Newest first, verbatim.

## Snapshot (2026-08-08 — Atlas migration Stage C, items 1–6 of 11 shipped)

**Prior sessions shipped Stages A+B and Stage C items 1–5** (archive has full detail):
feature silo, atlas-map port, server-rendered table view, world view + pin-card solver, all
live-verified, `65e2561`.

**This session: Stage C item 6 — cover + iris (D21)**. `src/features/atlas/ui/cover.js`
(`initCover`) + `src/styles/atlas-cover.css`: fade/FLIP/iris dismiss sequence ported from the
prototype for timings, plus `reducedMotion()`-gated single-cut and real keyboard/focus support
the prototype lacked. Discovered mid-item that the FLIP needs a header wordmark to FLIP into,
and Stage C hadn't built one yet (that's item 9's job) — built the minimal `.atlas-header`
shell (brand mark + wordmark only) as a genuine dependency, not scope creep; item 9 adds the
rest of the row around it. Its height now feeds `--hdr-h` via a small `ResizeObserver`. No-JS
safety (D4): `.atlas-cover` is `display:none` by default, `[data-open]` only after JS confirms
`sessionStorage` hasn't seen it this session — confirmed in the compiled `dist/` CSS, not just
source. `flyIn` targets the same relevance-ordered "quick" trip the table view's quick card
already uses (content is king). Ship loop green (build/lint/typecheck/1560 tests); the closed
type-scale test caught 4 literal font-sizes, fixed to existing tokens. Live-verified in
`astro preview`: fade + FLIP transform (against real measured rects), dark theme, mobile
375px, and the sessionStorage gate all correct. Not directly observed: the iris mask's own
`requestAnimationFrame` loop — same frame-compositing tooling limit the prior session hit,
verified by code review instead (unmodified port of the prototype's own formula).

## Snapshot (2026-08-08 — Atlas migration Stage C started, items 1–5 of 11 shipped)

**Prior session shipped Stages A+B** (further archive detail below): Stage A closed all 11
guide-sheet gaps (flag chips, gap state, masthead plate number, popover conformance, day-scrub
sticky fix, closed-days, venues grid, collapse-all, hash auto-expand). Stage B built the
invisible data layer Stage C needed: airport gazetteer, the reserved `traveler-origin` fact row
(D14/ADR 0003), tz backfill, per-guide atlas record derivation, vendored world TopoJSON, the
search-index build step. A same-session Fable-5 review caught and fixed the D6 180-day
plate-renumbering time bomb, a popover order regression, and a missing viewport clamp (`c872ec3`).

**This session: Stage C — the hub, items 1–5 of 11**, `65e2561`. Built ASIDE at
`src/pages/atlas.astro` (dev-only, unlinked from live nav — `index.astro` untouched, D1 intact):
pin-card collision solver (`src/features/atlas/model/solver.ts`, ported from the design-handoff
prototype, 9 tests); `<atlas-map>` globe element ported with the required D19/D21 changes
(guides/anchors/origins now arrive via a `.guides` property, never module constants; route arcs
are per-guide from that guide's own confirmed origin — the prototype's single shared "home base"
is gone; reduced-motion is live-listened; d3/topojson-client load via lazy `import()`); the
server-rendered table view (D4 — search, quick card, sheet list, all live-verified in-browser);
world-view assembly (globe mounts, pins solve with zero overlaps, zoom/fit/pause/toast/mode-toggle
all verified via direct DOM/JS invocation — this session's browser pane couldn't composite frames
for screenshots/rAF, a tooling limit, not a code defect). Found and fixed a real load-bearing gap
along the way: `content.config.ts`'s guideLoader interpolated `facts.json` into prose but then
DISCARDED the registry, so nothing downstream of `getCollection` could ever read a fact's own
state — Stage B's `traveler-origin` arcs were unreachable until now. Also hardened
`check-perf-budget.mjs`'s on-demand-chunk detection from a fragile `pdf`-only name regex to a
structural "absent from every page's first-paint closure" check (d3's Rollup output has no
stable name to match). Ship loop fully green (build/lint/typecheck/1560 tests/perf-budget);
content-preservation gate clean (zero `src/content/guides/` diffs); CI confirms live
(Tests/Deploy/Accessibility 23/23 all passed on `65e2561`).

**Scope note flagged, not resolved:** README describes a standalone cross-trip "Tools" screen
with its own trip picker (§5), but it is NOT one of Stage C's 11 numbered plan items — table
view's TRIP TOOLS row links into the quick-card guide's own existing tools tab instead
(`/guides/<slug>/#gtab-split`). Raise this explicitly at the item-11 checkpoint.

## Snapshot (2026-08-07, session #38 — 2 → 22 groups on Panels; weather/holidays hostable)

**Three commits (`02ffb9e`, `a54f5e2`, `a13e76e`), each full-ship-loop green and live-verified.**
Creator granted mid-session judgment authority ("pick, judge, iterate — migrate before deciding").
Course: denmark/Plan first (the sanctioned step), then a survey classified every group, then ALL
14 eligible groups migrated meta-only, then the first blocked-type renderer work landed.

**`a13e76e` — the pattern for hostable-but-not-carded types.** `PANEL_HOSTABLE_TYPES`
(section-types.ts) = CARDED + `weather` + `holidays`. They render `bare` inside a Panel (the
Panel draws the title) and KEEP their hide-on-empty wrapper; the silo hides the whole Panel
around it (`.pnl:has(.wx-wrap[hidden])` — live CSS because weather unhides client-side on fetch
success). Honest-blank preserved, no orphaned heading either way. Forced both directions in
preview (unhide → Panel appears → re-hide). This unblocked Plan ×4 + denmark/Transit. NOTE:
japan holidays data file absent at build → hidden Panel (pre-existing legacy behavior, now
consistent); korea's renders the reassuring no-holiday state.

**Polish found by preview judgment:** 1-panel grids drew a dead reorder grip — hidden via
`:only-child` (self-revives when a group grows). Scope keys distinct incl. non-ASCII
(`koreapokmongo`); ready gate lands on `<html>`, not the grid (remember when probing);
Astro INLINES panel CSS per-page — grep dist HTML, not `_astro/*.css`.

**Remaining blocked = the true renderer phases:** `sights`/`venues` (per-item-card hard case),
`days` (all guides), `divergences` (japan, moot — its group also has sights). Plus masthead
plate, graticule, notation layer per design-handoff PROMPT.md. No meta edits left to make.

**Housekeeping:** stale `claude/phase-2-*` remote branch deleted (plus two orphaned git lock
files). GitHub reports 4 Dependabot vulns (3 high) on every push — likely overlaps the pending
`pdfjs-dist` bump; untriaged.

### Open items (session #38)

- **Needs the creator:** (1) LOCAL branch `worktree-agent-a7dc7eeb397c6a368` (progress-study,
  `5917f8f`, exists nowhere else) — keep or lose; (2) sign off revise-guide `land` default `draft` →
  `auto` + V6 Q4 thresholds; (3) Cloudflare dashboard Git integration still failing 0s builds on every
  push — consider disabling; (4) skill-evals `push` trigger yes/no (fired 0 times as
  `pull_request`-only).
- `pdfjs-dist` 6.1.200 → 6.2.108 pending (triaged session #36, archive has detail; not urgent).
  Cross-check against the 4 Dependabot vulns (3 high) GitHub flagged on the 2026-08-07 push.
- Korea 03: critic flagged a swapped 명동 label on the Gyeongbokgung map point → file its issue.
- S1–S5 research standards + dossier contract still await their first real research pass.
- No guide uses a direct royalty-free `sights[].img.src` yet — capability live, unexercised.
- feedback-export Monday cron: if 2026-08-10's scheduled fire is also absent, investigate.
- `.card:has(.brow)` 3px `border-left` — incumbent, revisit only if card language reworked.
- **Panel, still deferred by design:** two tabs on one scope clobber each other's collapse state
  (accepted); story-mode's accent mixes ride a fixed dark ground with no contrast gate (residual
  risk, #38). The #35-era items (allowlist gate, no-JS/no-animate gates, reset control) shipped
  this session — #40/#41.
- **Phase 2 remainder (the guide sheet, per design-handoff PROMPT.md):** only the hard
  renderers remain — `sights`/`venues` per-item cards, `days`, plus masthead plate, graticule
  off photography, notation layer. Every meta-only migration is done (22 groups live).
- Open Panels are TALL towers in narrow columns (~1.4–2k px; measured, accepted — collapse is the
  mitigation). If reading pain shows up, the fallback options from the grilling were: keep the
  inner lead/More-detail fold, or single-column panel groups.
- `.claude/launch.json` gained `astro-preview-alt` (:4323) because another session held :4322 — remove
  if it reads as debris; :4322 stays the canonical ship-loop surface.

### Where we left off (session #38)

**Session #38 (2026-08-07):** creator granted judgment authority mid-session; the whole
migratable surface shipped in three live-verified commits — denmark/Plan (`02ffb9e`), all 14
survey-eligible groups + dead-grip fix (`a54f5e2`), weather/holidays hostable + Plan ×4 +
denmark/Transit (`a13e76e`). 22 groups on Panels, 1465 tests, every deploy verify-live green.
Mechanical work ran on Sonnet subagents (4 gates runs, 3 deploy watches, survey); judgment
calls (1-section groups migrate for uniformity, Pokémon GO ships at 15 with collapse as the
mitigation, empty-Panel semantics) taken and documented, none silently.

**Recommended next step:** the `sights`/`venues` per-item-card renderer — the Phase 2 hard
case, deliberately left for a fresh session. Open with the design questions: does each
sight/venue item become its own Panel (title = storage id per item), or does the SECTION
become one Panel hosting its item cards whole? How do per-item `map`/`place_id`/checklist
interactions survive reorder? Alternatively: masthead plate / notation layer (independent,
smaller). Also due: triage the 4 Dependabot vulns against the pdfjs-dist bump.

**Re-prompt the creator with:** "Everything migratable is on Panels — twenty-two groups
across all four guides, up from two this morning. The day's pattern: your 'migrate first,
decide later' was right — the one-panel-group question dissolved once a dead grip was the
only real cost, and Pokémon GO's fifteen panels read fine with collapse doing its job.
Weather and holidays crossed over too, with their honest-blank contract intact: an empty
panel hides whole, title and all, live. What remains is the work that was always the hard
part — sights and venues as per-item cards — and that starts with a design decision, not a
meta line: is the ITEM the Panel, or the section?"

## Snapshot (2026-08-06, session #37 — first real guide group on Panels; deploy fix PROVEN)

**Two commits (`cb5f88d` #40, `f20dcda` #41), both issues closed, live-verified.** Design tree
settled by a grilling round first (creator picked korea/02-essentials + persist-collapse; fold and
fullWidth forks closed on recommendation), then full-authority execution: issues filed by a Haiku
subagent, two-axis review before push.

**#40 — the allowlist has one home.** `findUnsafeHtml`/`ALLOWED_TAGS` extracted to
`src/lib/prose-html.ts`; the schema imports it and `prose-html.test.ts` walks every panel-preview
fixture body through the SAME check (the one HTML surface the collection schema never saw). Forced
failure proven.

**#41 — korea/Essentials = 9 Panels.** The Panel ABSORBS the block identity (anchor id, data-cat,
provenance attrs, # chip) — reorder moves grid.children, so a wrapper is structurally impossible.
Bodies whole (`whole` prop skips splitLead; one disclosure per card). `panelGroups` is guide meta,
schema-gated: group exists, all carded, all titled, titles unique (the title IS the storage id).
budget is the one fullWidth type — `src/lib/section-types.ts` is shared by renderer + schema so they
can't drift. Scope `korea:Essentials` per GROUP. Deep links force-open without persisting (toggle
reads the DOM, not the store, so the next click stays honest). Reset control is the guide surface's,
drawn only while a custom order exists. `.catblock:has(.pnl-grid)` opts out of desktop masonry.

**The gates' honest finding.** Headless Chromium does not paint before the silo's boot task, so a
boot-restored Panel can NEVER animate in the harness — the no-animate-on-restore outcome assertion
was green even with the stagger deliberately collapsed. The gate now pins the MECHANISM
(`data-panel-anim` must land a MutationObserver batch after `data-panel-ready`; same-task writes
share a batch) and THAT failed correctly when forced. Lesson for the book: when the outcome is
unobservable in your harness, gate the mechanism — and only a forced failure tells you which one
you have.

**Review earned its pass: 6 findings, all fixed.** HIGH: progress rings froze at 0/N inside Panels
(`anchors.js` `.closest(".card")` → `.card, .pnl`). MED: palette jumps now set the hash so a hit
inside a collapsed Panel opens it; hash navigation re-scrolls after the resort (the opened Panel
moves up-band, stranding the viewport); schema rejects duplicate titles per group. LOW: scrollspy
sorts by visual order after reorder; a vacuous spec assertion made real.

**Deploy fix (#36) PROVEN.** `f20dcda` was the first real-content push since `661b5a7`:
build/deploy/verify-live ALL green — verify-live actually ran, and the live korea page serves the
Panel grid (curl-confirmed `data-panel-scope="korea:Essentials"`). All four workflows green.

**Re-prompt (superseded):** "The first real guide content is living on Panels — korea's
Essentials: nine sections, collapse and order persisting per reader, budget spanning the row,
deep links that open what they point at. The pattern that earned its keep this session: every
gate was forced to fail before it counted, and one refused — headless Chromium cannot animate a
boot restore at all, so the no-animate gate was quietly proving nothing. It now pins the
mechanism (anim lands a task after ready) and THAT fails when broken. The review pass also paid
for itself: the checklist progress ring on Panel-hosted cards shipped frozen at 0/N and no test
or visual pass could see it — `.closest('.card')` simply missed `.pnl`. Migration for the next
group is now one line of guide meta plus the schema holding the rest."

## Snapshot (2026-08-06, session #35 — Panel primitive COMPLETE + two platform gates)

**Four issues shipped, four commits, each reviewed (2-axis) then pushed:** #36 grid
(`43a05fa`), #37 reorder (`f2f7fad`), #38 accent-ink (`ba50b3d`), #39 lint/CI scope
(`5f3e52f`). All closed. Phase 2 onward is now "move this section onto a Panel", never
"invent another container".

**#36 — the grid.** Pure sort model (`model/sort.ts`): full-width band first, open before
collapsed, tie-break = declared order; rules COMPOSE (a collapsed full-width Panel stays in
its band). ui/grid.js moves REAL DOM nodes so tab/reading order match the screen; resort
waits for the collapse transition (immediate when transitions are off = reduced motion).
Caught live, not by tests: `grid-column-end:-1` PINS the last Panel to the final column and
strands the hole mid-row — the last-row fill is a measured span, recomputed on resort/resize.

**#37 — reorder.** `model/order.ts` (move/clamp/no-op; saved order reconciled: stale ids
drop, NEW ids append at the end, never shuffled into the reader's arrangement). Drag = live
node moves, drop commits, cancel reverts, a drag that never moved records NOTHING; keyboard
arrows/Home/End on the grip button; live region announces where the Panel actually LANDED —
"stays at position N" when the bands refuse. Per-scope key `tg-panelorder-*`; reset via
`[data-panel-order-reset]` (hidden until wired). Grip drawn only under `[data-panel-reorder]`.

**#38 — the cascade lesson.** A custom property substitutes its var()s on the element that
DECLARES it — :root's `--accent-ink:var(--accent-ink-light)` resolved once at :root and every
hub card inherited the HOUSE ink while its own inline candidates sat unread. Fix: carrier
rules (`[style*="--accent-ink-light"]` re-declares locally + dark partners). Gates (both past
occurrences covered): rendered per-carrier check hub+guide/both themes (forced-failure
proven), and a source denylist (accent text never from --accent raw/color-mix/candidate).
**The source gate's FIRST run found occurrences 3+4:** change-request micro text painted raw
--accent (fixed), story-mode's fixed-dark overlay (allowlisted with reasoning + staleness
check). Gates that fire on their first run are the ones earning their place.

**#39 — same lesson, meta.** The new divergence gate (lint scope ⊆ CI scope, read from
test.yml itself) ALSO fired on first run: docs/mockups/*.mjs are deliberately linted but
docs/** pushes skipped CI. CI now follows lint (docs/** out of paths-ignore; md-only commits
still skip). The creator's 82ed519 had already applied the immediate unblock.

## Where we left off

**Session #35 (2026-08-06):** shipped issues #36+#37 (the Panel grid + reorder — the Panel
primitive is COMPLETE) and #38+#39 (accent-ink carrier fix + lint/CI divergence gate). Four
commits (`43a05fa`, `f2f7fad`, `ba50b3d`, `5f3e52f`), each two-axis reviewed before push;
1447 tests green; all four issues closed. PC shut down on creator's request after the final
push — CI for `5f3e52f` was in progress (Tests/A11y/Deploy) and unverified-live; check it
first thing.

**Recommended next step:** confirm `5f3e52f`'s CI went green + site live, then Phase 2
(migrate the first real guide section onto a Panel) — or triage the Dependabot HIGH.

**Re-prompt the creator with:** "The Panel primitive is complete — grid, collapse, reorder,
persistence — and the pattern that kept repeating this session is worth naming: three gates
fired on their FIRST run. The accent gate found two more live accent-as-text improvisations
the moment it existed; the lint-scope gate found docs/mockups already diverged; and the
forced-failure pass proved the rendered gate actually fails when the fix is removed. The
doctrine held: a gate that has never failed is an assumption, not a gate. Two cascade rules
also joined the permanent lesson book: a custom property resolves its var()s on the element
that DECLARES it (so inline candidates need carrier re-resolution rules), and
`grid-column-end:-1` pins rather than spans (so the no-dead-space fill must be measured in
JS). Phase 2's list is stacked in Open items — the tag allowlist inside Panels is the one
with teeth."

## Snapshot (2026-08-06, session #34 — Atlas Phase 1.2: the Panel container exists and is live)

**Issue #35 shipped (`2f6f626`, CI 4/4 green, live).** The Panel is the Atlas container —
kicker, title, drag handle, collapse toggle, body — in `src/features/panel/` (sealed silo) +
`src/components/Panel.astro`, verified on `src/pages/panel-preview/` (fixture content through
the real silo, tool chrome, `?bare=1`, `?scope=` to prove isolation). Per CONTEXT.md it is a
CONTAINER, never a content type: **no guide section moved onto it** — that is Phase 2.

**The store records decisions BOTH ways, and that was a bug first.** v1 stored only collapsed
ids, so a Panel that ships collapsed and is OPENED by the reader silently re-collapsed on every
load. Absence now means "never touched" (markup default decides); `false` is a real recorded
decision. `setCollapsed` also refuses exactly what `parseCollapsed` would drop (`MAX_ID_LEN`,
`MAX_PANELS`) — **a decision that cannot survive the round trip must never be shown as taken.**

**The HIGH the review caught: restore was ANIMATING.** Server HTML never carries
`data-collapsed` for a storage-restored Panel, so it painted open, then the unconditional 350ms
transition animated it shut on every load. Fixed with a two-stage gate — `[data-panel-ready]`
set synchronously (shut at first paint), `[data-panel-anim]` a frame later (only the reader's
own toggles animate). Gating collapse on `ready` also fixed no-JS for free: no JS → every Panel
open, no toggle drawn. **Generalisable: any CSS-transitioned state restored by script needs the
transition gated behind the first paint, or the restore is visible as motion.**

**Three defects were found only by driving the real page, none by tests.** `?scope=` was read
from `Astro.url` on a PRERENDERED route, so every URL got Scope A (query params must be
resolved client-side); a collapsed Panel measured 20px, not 0, because `0fr` floors at the
grid item's own PADDING (moved to the last child's margin); the "ships collapsed" fixture was
missing its flag. The 805-green-test lesson from #33 held again.

**Method note.** Both `_tmp-*` Playwright specs (no-animate-on-restore via `addInitScript` +
`transitionstart`; no-JS via `javaScriptEnabled:false`) passed and were then DELETED — the study
route is explicitly deletable-without-a-trace and a test bound to it is a trap. Those two
invariants are verified but UNGATED; Phase 2 should re-assert them against a real guide page.

## Snapshot (2026-08-04, session #33 — the ground moved: palette R2, and the repo got a design record)

**The surface tonal ramp widened (`base.css` R2, live).** The three light surfaces sat within
1.10:1 of each other, so a card barely separated from the page under it and `--bg2` read as the
same surface as `--bg`. Same hues, same identity — the ground drops, the card lifts. Light:
card/bg 1.104 → 1.238, bg/bg2 1.094 → 1.128. Dark: card/bg 1.140 → 1.319. Chosen by the creator
from four rendered candidates, not from hex read in chat.

**What moved WITH the ground, none of it taste.** `--green`/`--warn` (on the darker `--bg2` the
old values fell to 4.19:1 and 4.38:1, under the 4.5 floor they hold everywhere else) · country
accent `#b07a1f → #a6721b` (Spain/Colombia/Indonesia/Egypt — it hit 2.85:1 and failed the ≥3.0
build gate; **the gate is the invariant, the accent is the variable**) · `accent-tokens.ts`
LIGHT/DARK_SURFACES are derivation *inputs*, so all 52 accent-inks re-derived and still clear
4.5:1 on all six flat and tinted surfaces. **The method that made this safe: verify the palette
against the repo's own `contrast.ts` BEFORE editing 24 files.** It predicted every consequence.

**One real bug fell out.** `.topbar-search` improvised accent text with `color-mix` instead of
`--accent-ink` — scraped 4.63:1 on the old ground, dropped to 4.45:1 on the new, axe caught it.
Fixed at the cause. This is exactly the failure `accent-tokens.ts` was written to prevent; it
had one survivor. `contrast.test.ts`'s `CARD2` (`#f2f4eb`) was a phantom testing nothing.

**`PRODUCT.md` + `DESIGN.md` + `.impeccable/design.json` now exist** — the repo's first design
record. North Star **"The Surveyor's Sheet"**; every value extracted from the code, every named
rule traceable to a decision already made. PRODUCT.md fences the absences (no testimonials,
users, traffic, revenue, press) so no future surface invents them.

**Lint was dead repo-wide and nobody knew.** Two stale agent worktrees under
`.claude/worktrees/` each carried a tsconfig; typescript-eslint saw two candidate roots and
failed to PARSE all 740 files. Both pruned (verified merged into main + one dir literally
empty); `npm run lint` is clean. `Trip-Guides-progress-preview` was deliberately NOT pruned.

**Re-prompt the creator with:** "The ground moved and it's live. The rule that made a 24-file
palette change safe: verify the candidate against the repo's own `contrast.ts` BEFORE editing
anything — it predicted every consequence in advance, including the two that mattered
(`--green`/`--warn` falling under 4.5:1 on the darker `--bg2`, and `#b07a1f` failing the ≥3.0
build gate). When a colour and a gate disagree, the gate is the invariant and the colour moves.
The axe run then caught one thing static analysis couldn't: `.topbar-search` had improvised its
own accent text with `color-mix` instead of `--accent-ink`, passing on the old ground and
failing on the new — the exact failure `accent-tokens.ts` exists to prevent, with one survivor.
The repo now carries `DESIGN.md` (North Star: The Surveyor's Sheet) so the next component
doesn't re-derive the tokens from scratch. And lint had been dead repo-wide for as long as a
stale agent worktree sat in `.claude/worktrees/` — 740 parse errors, none of them real. Pruned.
Item ⑤ is one line in `eslint.config.mjs` that only you can add; the config-protection hook
blocks me, and I left it blocked."

## Snapshot (2026-08-03, session #32 — scar-tissue ablation; checks promoted to gates)

**CLAUDE.md was ablated per the scaffolding-decay rule:** war-story prose whose rule is now
enforced by a gate was trimmed to the rule (guide-shape history, continuity gate enumeration,
connector rationale, stale sights/food counts). The Clarifying-Questions Doctrine was scoped:
interactive sessions use `AskUserQuestion`; headless surfaces use their built mechanisms
(revise-guide's fork gate pauses via issue comment; new-guide posts traveler questions
non-blocking) — never a chat prompt in CI. The obsolete cloud-sync stale-CSS caveat was
removed everywhere (the repo no longer lives under that sync folder); `astro preview` stays
the verification surface because it serves the real production build.

**Four checks became gates** (`scripts/__tests__/docs-integrity.test.mjs`): HANDOFF ≤120
lines · every `docs/*.md` path cited from workflows/scripts/CLAUDE.md/docs exists (the
`E2_FIELD_REPORT` failure class) · the obsolete cloud-sync caveat stays out (archive-only) ·
internal `href="/…"` in `.astro` without `BASE_URL` fails. A SessionStart hook
(`.claude/settings.json` → `scripts/handoff-head.mjs`) now injects this file automatically.
HANDOFF's 800 lines of history moved to `docs/archive/HANDOFF_ARCHIVE.md`;
`PLAN_MOBILE_NAV.md` and `TRIP_SPLIT_V2.md` (shipped, cited only by docs) moved to archive.

**Where we left off:** separated scar tissue from doctrine across CLAUDE.md and the repo —
trimmed what gates already enforce, promoted four ungated checks into a docs-integrity test,
hooked HANDOFF auto-load, retired the cloud-sync caveat, archived shipped plan docs and 800
lines of HANDOFF history.

## Snapshot (2026-08-03, session #30b — repository-breadth pass; a real "region" field; US restructured)

**Continuing the same session.** Two more scoped pieces landed after the geocode/plan_b work
below, both creator-directed:

**A display-only `region` field, so a state trip stops reading as a whole country.** The US
guide's hub card, hero eyebrow, and OG/recap images all showed "United States" for a
Sedona-only trip — reading far broader than the guide is. `country` itself was never touched
(every currency/timezone-fallback/emergency-number/continent lookup keys on it —
`countries.mjs`'s own comment already documents this exact Hawaii/Arizona history and why
`country` can never be a state). New optional `region` field sits on top, display-only: every
surface that shows the location as TEXT now prefers it (hub grid card, hero eyebrow, masthead
eyebrow, OG image, recap image, hub search string, coverless-card initial, GPX/export
waypoint-name fallbacks). US now carries `region: "Arizona"` — **future US guides should set
this** (a multi-state trip would read "Arizona & Utah"). 4 new schema-contract tests.

**US restructured: Food & shopping is now its own tab.** It used to be a "What to eat" venues
section bolted onto the Days file — the only one of the four guides without a dedicated Food
tab. Moved verbatim into a new `07-food-and-shopping.json`, renamed `07-sources.json` →
`08-sources.json` to keep tab order sensible. No content changed in that move.

**The repository-breadth research pass — scoped to real gaps, not padding.** CLAUDE.md's own
doctrine ("Sights and Food are REPOSITORIES, not itinerary echoes") measured against actual
counts: US had 4 sights (all 4 already itinerary-scheduled — zero margin), Japan had only 3
sights per city for week-plus stays in each of 3 cities, and two sub-regions inside otherwise
"rich" guides had literally ZERO dedicated content — Denmark's Oslo overnight leg (3 sights,
0 food) and Korea's Daejeon (2-day MSI base) and Busan (day trip), both 0/0. Seoul, Copenhagen,
Malmö's food, and Fukuoka were already fine and were NOT touched.

Four parallel research agents (one per guide, each scoped to specific files/sections) did a
single real research pass — not the repo's full dual Pass-A/Pass-B/reconcile/critic ceremony,
by explicit creator instruction, but every item still Places-verified `OPERATIONAL` before
writing, never fabricated:
- **Denmark**: Oslo 3→6 sights + a new 8-item food/shopping section (was 0); Malmö 3→6 sights.
- **Japan**: Sapporo 3→7 sights, 3→6 food; Sendai/Tohoku 3-4→7 sights, 4→7 food. Fukuoka
  untouched (already reasonable).
- **Korea**: Daejeon 0→4 sights + 0→5 food (new sections inside the existing "Daejeon & MSI"
  tab, not a new tab); Busan 0→5 sights + 0→4 food (new sections inside the existing
  "Sights"/"Food & shopping" tabs, checked against the Jul 13 itinerary first so nothing
  duplicates what's already scheduled that day).
- **US**: sights 4→10, food 5→9, a brand-new Shopping section 0→5. Also fixed a real
  pre-existing bug found along the way — El Rincon and Tamaliza carried IDENTICAL "why" text
  (copy-paste error); each now has its own researched specialty. Respected the guide's own
  active Pocket Fire/Oak Creek closure orders throughout — Devil's Bridge, West Fork Trail,
  Soldier Pass Trail and Boynton Canyon Trail are all inside the closure zone and were
  deliberately NOT added; several dead venues (Turquoise Tortoise, Colt Grill, Oak Creek
  Factory Outlets) came back `CLOSED_PERMANENTLY`/defunct and were dropped rather than added.

Final counts (sights / food+shopping venues): Denmark 18/40, Japan 18/33, Korea 23/64, US
10/14 — every guide now has real repository margin beyond its own itinerary.

**Verified twice, independently:** each agent ran its own build+verify before finishing, and a
SEPARATE full integration pass afterward confirmed it — `npm run build` clean, 1344 tests
green, lint 0, all four guides PASS verify, and (a second, independent check) `--network`
shows **0 closed venues across all four guides** on every new item, plus dist/ grepped to
confirm every new name compiled through. The typecheck error and the Commons-photo
UNVERIFIABLE leg are both the same pre-existing, environmental issues noted below — neither
touched by this pass.

**Not done:** the formal S2/S3 "Candidates considered" ledger and the full dual-pass
reconciliation table — by explicit creator instruction ("don't perform the entire research
pass"), this was a single verified pass, not the repo's full pipeline ceremony. If any of
these four guides heads toward graduation, that gap is worth knowing about.

---

## Snapshot (2026-08-03, session #30 — geocode backfill finished; plan_b's first real content)

**Denmark, Japan and US are now geocoded** (Korea shipped in session #29's last commit). 33
Denmark venues, 33 Japan (across two runs), 7 US — every match checked to fall inside its own
country before writing, per the propose-then-write discipline session #29 established.

**The first Japan run caught a real gap in the outlier guard, same shape as session #29's
Konbini bug.** Japan's itinerary files legitimately run several cities in one file (Sendai,
Sapporo, Fukuoka sections back to back), so an item that already carries its OWN verified
coordinates — only its `place_id` was missing — had no honest file-median to be judged
against: Otaru Canal, Mt. Moiwa and six more genuine matches were rejected as if they were
the Staten-Island bug. **Fixed:** an anchored row (already has `map`) is now judged against
its OWN coordinates, not the file median, and excluded from the median used to judge everyone
else. **Caught a real defect on the way:** one match accepted before this fix (`C-pla`) had
silently written a wrong Osaka-area coordinate for a shop the guide describes as being inside
Sapporo's Tanukikoji arcade — exactly the failure class the guard exists to catch, and it got
through. Corrected by hand with a city-qualified query. Three new regression tests.

**Running `--network` verify on all four guides surfaced two closed venues** — Denmark's
Jabby's Filipino Cuisine (`jabbys.dk` no longer resolves) and Korea's Palsaik Samgyupsal (no
operating location findable under any query). Both replaced with a verified-open alternative
in the same city — Tambayan CPH and Yookji Hongdae — full provenance, not silently dropped.

**`plan_b` (the inclement-day alternate field, shipped 2026-08-02) got its first real content**
— six entries on Japan, the only guide in scope this pass (Denmark/Korea's trips already
happened; US wasn't asked for). Scoped to days with REAL regional weather risk (checked
Fukuoka/Sapporo/Sendai's actual Oct/Nov rain climatology first, not assumed) combined with a
single-venue anchor: Mt. Moiwa (ropeway wind-closure, already documented in the guide's own
text) → Sapporo Beer Museum; Otaru → its Music Box Museum; Noboribetsu/Jigokudani → Yumoto
Sagiriyu bathhouse; Jozankei hiking day → SHIKAnoYU day-use onsen; Matsushima → Zuiganji
Temple; Naruko Gorge → Takinoyu public bath. Every alternate Places-confirmed operating before
writing; three of six happen to be onsen/bathhouses, matching the exact pattern the schema was
built from (Korea's jjimjilbang refuge) without that being planned going in.

**Fixed a real gap `check-research.mjs`'s D2 advisory exposed on contact:** it flagged every
one of the six `plan_b` bodies as an undated price/hour figure because the hard-fact scanner
checked only a day item's own `verified_on`, never looking inside `plan_b` even though the
schema requires `plan_b` to carry its own `source_url` + `verified_on`. Fixed to recognize
plan_b's own date; still flags a day whose OUTER body has its own undated figure. Two new tests.

**Verified: 1340 tests (+30 total this session), build clean, lint 0, typecheck's one error
confirmed pre-existing (reproduces before this session's changes, unrelated `map-pins.ts` type
gap). All four guides PASS verify; `--network` shows 0 closed venues on all four (Jabby's/
Palsaik fixed). Commons-photo leg reports UNVERIFIABLE — this sandbox cannot reach
`commons.wikimedia.org` at all (confirmed via direct `curl`, connection failure not 403),
environmental and pre-existing, not something this session touched.**

**Not done, by explicit creator choice this session:** `plan_b` for Denmark, Korea, or US — the
creator scoped this pass to Japan only. US (Sedona, Sep, real monsoon-tail flash-flood risk on
its two outdoor days) is the natural next candidate if the creator wants to continue the arc.

## Snapshot (2026-08-02, session #29 — budget UI diagnosis + the sendable summary sheet)

**The Budget calculator can now print a sendable summary.** "Save summary as PDF" sits in the
calculator's toolbar (revealed only once there is spending — an empty budget has no summary) and
produces **two A4 pages**: a cover carrying trip identity, cover photo, the headline total with
its local-currency equivalent, per-person/per-day tiles and who-pays-who; then a statement with
paid/share/net per traveller, every expense itemised, and each person's own lines. Measured at
712pt and 875pt against A4's 1017pt box — no overflow, no collisions.

**It prints rather than generating a PDF in JS, and that is the load-bearing decision.** A
bundled generator (jsPDF and friends) ships WinAnsi fonts and would turn a Hangul member name
into boxes without an embedded CJK font. The browser's own print engine renders the page's real
text: vector, selectable, tiny, zero dependencies. Scoping copies `print-day.css` — the sheet is
appended to `<body>` (never inside `.split-wrap`, which `print.css` hides outright) under
`body[data-print-budget]`, and removed on `afterprint` with a 60s sweep for Safari.

**Two deliberate content calls.** Payment handles are on screen but NOT in the file — a PDF gets
forwarded and shouldn't carry anyone's Venmo. And the post-trip lock explicitly exempts this
button: a settled trip is exactly when someone wants to send round what it cost, so the one
control the lock has no business touching is the one that only reads.

**`expenseShares()` was extracted from `settle()`'s inner loop** so the per-person breakdown is
computed by the same code that settles — a second implementation would be free to drift, and a
printed record that disagrees with the on-screen balances is worse than no record. Behaviour-
preserving, proven by the untouched settle suite. 14 new model tests + 4 Playwright tests
(button reveal, two-page build on body, printed figures equal on-screen figures, Hangul survives
and handles don't). 1239 unit · 70 Playwright · lint 0.

**Budget calculator UI — fixed, then rebuilt as V2.** The five measured problems are closed
(descriptions 104px → 273px, order now People → Expenses → Results, controls on the site's 44px
pill vocabulary, settle rows 109px → 74px, the floating total folded into the results card).
Then the creator commissioned a full assessment (`docs/TRIP_SPLIT_V2.md`) and approved five
fixes plus categories, all shipped:

- **Three correctness defects**, each confirmed with a probe before being asserted: adding a
  person retroactively re-split expenses they were never part of; the tested minor-unit engine
  `computeSplits` was exported and never called while the shipped float path lost a cent on
  100/3; and the split rule was one trip-wide boolean.
- **Money is integer minor units end to end**, settlement included. Korea's seeded trip moves
  $11.63 → $11.64 because that cent is now allocated rather than evaporating.
- **Settling is recorded** ("Mark paid" → dated payments log with Undo), and **amounts are
  entered in the currency actually paid**, with the ECB rate captured at entry and stored.
- **Spend categories** with a "Where it went" breakdown — explicitly NOT wired to the guide's
  budget section: *"the budgets don't matter as much, only the splitting of costs"* (creator,
  2026-08-02). Plan vs Actual was proposed, rejected, and is recorded as declined in the doc.
- **Newest-first list + search/filter** (by text, payer, category). Filtering never touches the
  totals and says so on screen. "Paid by Sam" on a 40-expense trip: 9.8 phone screens → 4.6.

**Data safety, since a trip's expense history is not reproducible:** Firebase rooms are only
ever READ through the normalizer — the migration never writes a converted shape back. A pre-V2
room still keeps its rule in `meta.customSplit`, so that flag is still read and applied
per-expense; without it a room that used Custom amounts would have been silently re-read as an
even split. On-device saves are copied to `tg-split-<guide>-pre-v2` before the new shape lands.

**The honest remaining gap:** mobile rows are 157px (desktop 82px) because 94px of one is two
44px touch targets, so a long trip is still ~9.8 screens unfiltered. Filtering is the answer
that shipped; shrinking the row further would trade an accessibility floor for scroll.

## Snapshot (2026-08-02, session #28 — Pass B deep discovery; every open item closed)

**Pass B deep discovery — native-first, anti-default (creator's design).** Deep research now
has exactly one sanctioned home in the pipeline: Pass B. It rides a **dossier contract**
because the researcher keys live on the creator's machine and CI carries none — never-in-CI is
physics, not a preference. The interactive sweep writes `## Discovery leads (Pass B —
native-first)` into the intake doc (scaffold emits the empty table on every new guide); the
headless Pass B verifies each row to T0, marks it `verified` / `rejected: <reason>`, and feeds
rejections into the candidates tables where they count toward the S2/S3 floors. Empty or absent
table → Pass B runs exactly as before; nothing blocks. Three binding rules in
`research-efficiency.md`: queries in the destination's language with the source language
recorded · exclude the English top-10 (Pass A already holds those; the filter matters MORE on a
Kyoto-class destination, where the English layer is most polluted) · dossier carries leads only.
Pass A stays capped at ONE Standard discovery call — official pages don't need a fleet.
`8d5a995`, CI green.

**The change-request wizard is verified end to end.** The one thing no unit test could prove —
that GitHub honors a URL prefill for a **textarea** field — is now proven against the live form:
issue #31 came back with all three fields populated, and `parse-modify-issue.mjs` read them back
exactly (`{"slug":"denmark","change":"PREFILL TEST — do not submit.","section":"Getting
Around"}`). The label gates held too: all four issue-triggered workflows fired and **skipped**,
because `modify-request` alone runs nothing. Test issue closed.

**Local lint is fixed — `npm run lint` exits 0.** The stale agent worktree is gone. Its 21 files
of uncommitted progress-study work were preserved first as `5917f8f` on branch
`worktree-agent-a7dc7eeb397c6a368` (2,684 lines: four preview pages, their CSS, the axe/smoke/
shoot harness) — recover with `git checkout worktree-agent-a7dc7eeb397c6a368`. `git worktree
remove` hit a OneDrive "Permission denied" after deleting every file and deregistering the
worktree; the empty directories were cleared by hand. **Nothing was lost — the commit predates
the removal.** No `eslint.config.mjs` edit was needed, so the config-protection hook stands.

**Every V2-era open item is now closed.** The Actions "allow PRs" setting was already enabled
(`can_approve_pull_request_reviews: true`); PR #28 is merged; the prefill click is done; lint is
green.

**Still unproven by design:** the S1–S5 standards and the dossier contract have never met a real
research pass. The first one is the calibration test — expect the floors to need tuning on
contact, and treat a floor that fires on a legitimately thin priority as data about the floor,
not a failure of the guide.

## Snapshot (2026-08-02, session #27 — the five research-quality standards land; Places live)

**Places is LIVE end to end** — the creator fixed the key's application restriction and the
canary returns `Gyeongbokgung Palace — OPERATIONAL`. The japan verify blocker (a divergences
item whose `verified_on` had no source — a party-fit judgment wearing a verification date) was
fixed by REMOVING the orphan date, not inventing a URL. **All four guides PASS verify.** The
Worker's silent-fail-open posture is now observable: every unprotected POST logs which guards
are off, and `GET /health` reports `{"turnstile":"OFF","rateLimit":"OFF"}` live. (Creator
ruling: change requests STAY on the GitHub handoff — no second public write route.)

**The five research-quality standards (creator: "implement all of these") — SHIPPED.** The
old rubric measured whether what shipped was TRUE; these measure whether enough was GATHERED:
- **S1 · venue status gate.** `verify --network` status-checks every `venues[]` item + named
  map point via Places. `CLOSED_PERMANENTLY` BLOCKS (dead-link class); notFound/temporary
  advise (fuzzy queries must not cry wolf); no key → n/a. Key threaded into research-pass,
  graduate-guide, recert.
- **S2/S3 · the candidates table + floors.** `## Candidates considered` in the intake doc —
  one table per ranked priority, every candidate EVALUATED (shipped or `rejected: <reason>`).
  Verify blocks on floors (16/8 · 10/5 · 6/3; `researchFloors` in `_guide.json` overrides) and
  cross-checks shipped names against the guide. Pre-standard guides n/a; an EMPTY table on a
  new guide FAILS — a scaffold cannot reach verify PASS until its consideration set is on
  record. Full lifecycle forced with a throwaway scaffold.
- **S4 · Pass B floors.** A full pass owes ≥8 finds, ≥3 crowd/timing, ≥2 novel/alternative
  (`check-passb-coverage.mjs --floors`, CI-gated on full passes only).
- **S5 · source mix.** Verify reports domains/top-share/ccTLD per guide; blocks only past 60%
  top-share — measured the four real guides FIRST (12%/9%/17%/25%) and set the ceiling above
  the worst, the repo's own ratchet doctrine.
- Rubric rows #7/#8/#12 updated + new #14; SKILL.md and research-efficiency.md now say it
  plainly: **the two-round rule is a verification cap, not a breadth cap** — registry+Places
  made verification cheap; the freed budget buys discovery, and the floors are what it must
  produce.

**Verified: 1218 tests (+34 today), typecheck 0, lint clean, build clean, all four guides
PASS, CI green.** One process slip worth recording: the S5 commit shipped with 2 lint errors
because lint ran after commit — fixed in the next commit; lint now runs before.

**Open, needs the creator:** ① one signed-in GitHub click to confirm the change-request
textarea prefills; ② draft PR #28; ③ the Actions "allow PRs" setting; ④ local `npm run lint`
(stale worktree; use `npx eslint src worker scripts tests`).

## Snapshot (2026-08-02, session #26 — whole-repo fact registry + consistency pass)

**All four guides are on the fact registry — 141 perishable facts.** japan 24, us 9, joining
denmark 26 and korea 82. Same gate both times: built `index.html` + `.gpx` byte-identical,
`.ics` identical modulo `DTSTAMP`. **`guide-shape-uniform.test.mjs` now REQUIRES `facts.json`
on every guide directory** — the loader treats it as optional, and that tolerance is exactly
how three of five guides once sat as flat `.json` files unnoticed (both shapes built, so
nothing said so). An empty `{}` satisfies it; the scaffolder writes one, verified by actually
scaffolding a throwaway guide.

**Consistency audit — the CODE was clean, the DOCS had rotted.** A full export/import sweep
over 623 exported symbols found exactly **2** unreferenced (`ANSWER_KEYS`, whose comment
claimed a "doc-coverage test" that has never existed; `STALLED`, a bare unused alias). Both
deleted. The real findings were documentation describing a repo that no longer exists:
- `PLAN_VISUAL_REDESIGN.md` said *"nothing here is building yet"* while four of its moves are
  live and live code cites it as their spec. The most misleading file in the tree.
- **`CLAUDE.md` + `ARCHITECTURE.md` omitted `facts.json` from the guide-directory contract —
  operationally dangerous, not cosmetic.** CLAUDE.md tells an agent to "Read ONLY the group
  file the fact lives in", but a price may now be a `{{fact:id}}` row; following that literally
  means editing prose that no longer holds the number. Both corrected, with the grep-first rule
  spelled out.
- `ARCHITECTURE.md` guide list omitted Japan and called two archived guides "live"; "all 8
  features sealed" when there are 22 silos. `FEATURES.md` still listed two shipped features as
  "Held" and the phrases/entry cards as "DORMANT". `PLAN_FACTORY_V2.md` P7 marked deferred
  though two of its four surfaces shipped. `skill-retro.yml` told the agent to read
  `docs/E2_FIELD_REPORT.md`, which has never existed.

**`unusedFactIds` was built to catch registry rot and never called** — the one inert gap in the
registry work. Now wired through `readGuides` into the verify scorecard: a row nothing
references keeps its date, keeps reading as "verified", and keeps costing a recert check for a
number no traveler can see. Advisory, not blocking. Forced an orphan row in to prove it fires.

**`src/lib/issue-forms.mjs` closes the last label-drift hazard.** `parse-revise-issue.mjs` had
SIX hand-typed label literals across two templates and `graduate-guide.mjs` a seventh, none
contract-tested, while new-guide and modify both were. All three field sets now live in one
module (they must — the revise parser falls back to modify's labels for an escalated issue),
`Guide slug` is written once, and 15 tests cover contracts + round-trips. **Proved the gate
bites:** renamed a label in `revise-guide.yml`, watched the test fail on it, reverted.

**Deliberately NOT done:** the three shipped plan docs stay in `docs/` rather than moving to
`archive/` — live workflows and scripts cite them BY PATH, so archiving means rewriting 12
references to fix a filing problem. A shipped plan that code cites is documentation; a
*misleading* one is the defect, and those are corrected in place.

**Verified: 1184 tests, typecheck 0, lint clean, CI green ×4, all four guides byte-identical.**

**Open, needs you:** ① Places API key is referrer-restricted (403) — Google Cloud →
Credentials → **Application restrictions = None**. ② `verify --slug japan` fails its research
gate on a `divergences` item with `verified_on` and no `source_url` — **pre-existing**
(confirmed at HEAD before the migration), from the original Japan research run; the fix is the
real disproof source or an honest removal of the orphan date, never an invented URL.
③ One signed-in GitHub click to confirm the change-request textarea prefills.

## Snapshot (2026-08-02, session #25 — V2 Session 5: the change-request wizard. **V2 COMPLETE**)

**The "Request a change" pill now opens a guided 3-step wizard** instead of dropping a reader
onto a GitHub form that asks for a "Guide slug" and a "Section" — repo vocabulary, put to
someone who just noticed a price was wrong. Steps: pick the tab (from the guide's OWN nav, its
section titles shown as a hint), describe the change, review what will be sent. The slug comes
from the page.

**Progressive enhancement, not a JS-only button.** The pill is still a real `<a>` to the same
prefilled issue, so with JS off — or before hydration — the flow degrades to exactly what
shipped before. **No Worker route, by choice:** the wizard files NOTHING itself, it hands the
reporter to GitHub with the payload prefilled and they press submit. That keeps a public write
endpoint, its token and its rate-limit surface off the board entirely; filing still does
nothing until the owner applies `modify-approved`.

**`src/lib/modify-schema.mjs` is the modify-side twin of `intake-schema.mjs`** — the three
fields used to be duplicated between the issue form and the parser, joined by two matching
string literals (rename a label → the parser silently stops finding the field). A contract test
pins the form against it, and a **round-trip test proves what the wizard sends is what the
pipeline parses**. `sanitizeSection` moved there too, so the wizard sanitises what it SENDS with
the identical rule the parser applies to what it RECEIVES.

**Two defects only the browser could find:** rebuilding the chip list on each pick destroyed the
element the user had just activated (keyboard focus dropped to `<body>` mid-flow — now built
once, only pressed state changes); and the hint printed every section title, so Denmark's
eight-section Sights tab became a wall (capped at 3 + "+N more"). Also: nothing pre-selected
(`null` ≠ the explicit "I'm not sure"), and the final navigation is synchronous inside the click
— an `await` there would put it outside the user gesture for popup blockers (boundary check #2).

**Verified: 1168 unit tests (+27), 66 Playwright (8 new wizard specs), a11y gate green with NO
node-count cap raised, typecheck 0, lint clean, CI green ×5.** Driven at 375px dark: modal
escapes the `.sticky-chrome` backdrop-filter containing block and stays on-screen when scrolled,
textarea computes 16.32px (iOS zoom floor), Escape returns focus to the trigger.

**⚠ One honest gap:** GitHub needs a signed-in session to render the new-issue form, so textarea
prefill is confirmed from GitHub's docs ("the `id` is the canonical identifier for the field in
URL query parameter prefills") and by the round-trip test, but **not observed live**. Worst case
is a reporter retyping their sentence on a form that still has slug/section/title filled. Worth
one manual click to confirm next time you're signed in.

---

### V2 arc complete — all five sessions shipped
1. Critic merge (6 agents → 4) + traveler questions surfaced on the intake issue.
2. Acquisition: `lookup-venue.mjs` (Places) + the FX bug hunt that found Korea's currency
   hardcoded into every guide's budget footer. **Places still blocked on the key restriction.**
3. Fact registry — landed dormant, proven byte-identical.
4. Denmark + Korea migrated (108 facts), byte-identical.
5. Change-request wizard.

## Snapshot (2026-08-02, session #24 — V2 Session 4: denmark + korea migrated, 108 facts)

**Both guides now keep their prices as sourced ROWS, and the built site did not change by one
byte.** Denmark 26 facts / 26 occurrences; Korea 82 / 97 (15 mentions share a row — the same
price cited from the same page collapsed to ONE fact). `npm run verify` prints the count.

**`scripts/migrate-facts.mjs`** — `--slug X` proposes, `--write` applies. Three properties make
it safe against real content: values are lifted **verbatim** (never retyped); replacement is
**positional** (one regex pass, offsets right-to-left) because `"40 DKK"` is a substring of
`"340 DKK"` and naive string replacement silently corrupts the larger figure; and a value
written `"≈ 120"` (marker, then space) is **skipped**, since re-rendering would emit `"≈120"`
and lose the space.

**Scope is deliberately narrow, and the limits are the interesting part:**
- **Money only.** Clock times in a day plan are itinerary structure, not sourced facts; hoisting
  them yields dozens of rows that bury the prices worth tracking.
- **Only units already carrying `source_url` + `verified_on`.** A figure with no citation stays
  in prose rather than silently inheriting a neighbour's.
- **Sources/reference lists skipped** — they restate figures that live elsewhere; migrating them
  would mint a second row for the same price cited from a different page.

**Payoff demonstrated, and its honest limit.** Changing one registry row updated all THREE of
its references on rebuild. Two further mentions of that same figure did NOT update — they sit in
units with no provenance, so they were never migrated. **The continuity sweep still covers the
unmigrated remainder**; the registry shrinks that job, it does not yet retire it.

**A SIXTH directory reader surfaced** during migration — `src/lib/guide-stats.test.ts`
re-implemented the `!== "_guide.json"` filter and choked on facts.json (the suite caught it).
Repo swept again: `fetch-holidays` (uses the shared reader), `verify-live` (reads only
`_guide.json`) and `split-guide` (write-only) are safe by construction.

Also: new guides scaffold with an empty `facts.json` so a research pass records rows as it
works instead of leaving a migration to dig them out later, and SKILL.md now teaches authoring
rows during research (≈ derived from `state`, inline-text values, ids that carry the figure).

**Verified: 1141 tests, typecheck 0, lint clean, CI green ×4, verify PASS on both guides, no
`{{fact:` token anywhere in `dist/`. Gate met on both: `index.html` + `.gpx` byte-identical,
`.ics` identical modulo `DTSTAMP`.**

**Next: V2 Session 5** — the in-site Request-a-change wizard (guide pages only, no Worker
route). Reuses the share-modal shell (incl. the `.sticky-chrome` backdrop-filter re-parent
trap), needs `sections` added to the `#tgConfig` island and a `MODIFY_FIELDS` contract test.

## Snapshot (2026-08-02, session #23 — V2 Session 3: the fact registry lands, dormant)

**`<slug>/facts.json` exists and works — and changes nothing yet, by design.** One record per
perishable fact (claim · value · source_url · verified_on · shelf_life · state), referenced from
prose as `{{fact:<id>}}` and substituted in `guideLoader` **before `parseData`** — the one choke
point every consumer passes through (guide pages, hub, OG/recap images, `.ics`/`.gpx`), so no
renderer or exporter knows tokens exist, and the HTML allowlist + strict-≈ gate judge the FINAL
text. Mechanics: `src/lib/facts.mjs` (shared by the Astro loader AND the node auditors, so the
site and the gates can never disagree — the staleness table's twin declarations are the
cautionary precedent). Shape: `factsFile` in `content.config.ts`, which stays the one schema home.

**What it buys** (the reason Session 4 migrates denmark to it): one edit updates every mention,
so the numeric half of the continuity sweep stops being a grep hunt; the citation audit can walk
ALL facts instead of sampling five; recert updates propagate; and a bare invented number in prose
becomes *detectable* rather than merely forbidden.

**The five landmines, all closed.** Every directory reader treated any non-`_guide.json` file as
an array of sections: `content.config.ts` (hard build failure), `audit/lib.mjs` (SILENT
whole-guide skip — it swallows the TypeError and warns), `compose-guide.mjs` ×2 (one of which
**deletes** what it matches, i.e. would have destroyed the registry), `extract-palette.mjs`. All
five now share `isSectionFile()`. `audit/lib.mjs` also interpolates exactly as the loader does —
otherwise a token-only body reads as "filled" to the completeness check and a registry price
stops matching the undated-price advisory — and returns the raw registry separately, because
interpolation drops the dates: `check-staleness` walks `facts.json`, so a migrated fact stays on
the recert punch list instead of quietly aging out of view. Fact `source_url`s join the
dead-link sweep for free.

**Rules worth knowing before authoring one:** `≈` is DERIVED from `state: "approx"`, never typed
into `value` (one spelling, and no bare ≈ beside an unsourced number); `value` is inline text
only, schema-enforced (markup would bypass the prose tag allowlist and a stray `</p>` would move
the lead-first fold); provenance is REQUIRED (a fact earns a row *because* it is perishable); an
unresolved token FAILS the build.

**Verified: 1141 tests (+20), typecheck 0, lint clean, CI green on all four workflows.
NO-OP PROVEN three ways** — 77/81 dist files byte-identical (the 4 `.ics` differ only by
`DTSTAMP`, which differs between any two builds — confirmed by double-building with no code
change), the sw-precache hash returns to its exact prior value, and with zero `facts.json`
present the new path never executes. **Both live paths forced** with a temporary guide:
interpolation produced `DKK 145` and a derived `≈35-45 min` in `dist/`, a repeated fact
substituted in both places, and every failure path names the exact guide/fact/fix — unresolved
token, markup in a value, and a fact missing `source_url`.

**Next: V2 Session 4** — scaffolder emits an empty `facts.json`; `migrate-facts.mjs` proposes
rows + token replacements as a reviewable diff (values move by SCRIPT, never retyped); migrate
**denmark** as the pilot; teach the skill to author rows during research; add fact counts to the
verify scorecard. **The decisive gate:** denmark's built HTML + `.ics` + `.gpx` must diff to
ZERO after migration.

## Snapshot (2026-08-02, session #22 — V2 Session 2: acquisition layer)

**`scripts/lookup-venue.mjs` (Google Places) — "is it still open?" leaves the model's hands.**
Follows lookup-place.mjs exactly (named export + CLI, never throws, inert without a key).
**The field mask is the bill**, and that shaped the API: Google's per-SKU free caps put
`businessStatus` in Pro (5,000/mo) and `regularOpeningHours` in Enterprise (1,000/mo), so the
script splits `--check status` (cheap, does it exist) from `--check hours` (5× less headroom).
Tiers verified against Google's data-fields page, pinned by tests so a field can't drift
between tiers unnoticed. Wired into the weekly API canary (`check-apis.mjs`), which skips
cleanly without the secret.

**⚠ BLOCKED ON ONE OWNER ACTION:** the live smoke against the real key returned
`403 API_KEY_HTTP_REFERRER_BLOCKED` — the key carries an **HTTP-referrer restriction**, which
server-side callers (Actions sends no referer) can never satisfy. Fix in Google Cloud →
Credentials → the key → **Application restrictions = None** (keep *API restrictions* = Places
API, and keep the daily quota cap — that is the real guard for a server key). Re-verify with
`gh workflow run content-audit.yml`, then read the canary line on issue #23. Until then the
script is correct but unusable, and every unit test still passes — which is exactly why the
live smoke exists (boundary check #3).

**FX: the exchange rate was Korea's, on every guide.** Three defects, one root cause —
Korea's numbers hardcoded into shared components. BudgetBlock shipped a literal
`≈₩1,535 = $1 · Jun 2026` + a KRW search link on ANY USD-denominated budget (Denmark quoted
kroner under a won sign; Sedona offered to convert dollars to dollars); `FALLBACK_RATES` held
4 of 40 currencies and **rate.js returns early without a seed rate**, so the other 36 had no
rate feature at all, not a degraded one; and those 4 were 6-7% stale. Now the markup carries
no rate — it ships hidden and empty, and rate.js reveals it with the guide's own currency
(live / locked-stale / dated seed), showing nothing for a currency with no seed and nothing
for a USD destination. `npm run refresh-fx` regenerates the table from the same ECB feed the
runtime uses (29 covered, 11 honestly reported as unpublished, never invented). Sanity bands
now derive from the seed (÷3…×3) for the 25 currencies that previously accepted any value.

**Also:** reader-mirror (`r.jina.ai`, keyless 20 rpm) added to the fetch doctrine as a SECOND
attempt inside the same budget — with the guard that it never becomes the citation.

**Verified:** 1121 tests (+33 this session), typecheck 0 errors, lint clean, a11y 14/14 with
no cap raised, exports + field-tools green, CI green on all four workflows, and driven in
`astro preview` at 375px dark — Denmark reads `6.51 DKK = $1 · Live · ECB · 2026-07-31 —
check live rate`, Sedona renders nothing (both confirmed by client-rect, not innerText).

**Next: V2 Session 3** — the perishables-only fact registry (`facts.json` + `{{fact:id}}`
interpolated in `guideLoader.load()` before `parseData`; five directory readers need an
explicit skip or they break; unresolved token must fail the build loudly).

## Snapshot (2026-08-02, session #21 — V2 plan adopted; critic merged; questions surfaced)

**A V2 redesign plan was adopted after an adversarial review of the whole research pipeline**
(plan file: `~/.claude/plans/orchestrate-this-plan-for-hazy-gadget.md` — 5 sessions, each with
a scope fence, file:line dossier, and a binding verify list; **executed on Opus 5 / high**).
Goals ranked: no hallucinated facts → lower token cost → easier edits → **zero visual change**.
Creator decisions locked: perishables-only fact registry · one merged critic · auto-graduation
stays · questions surfaced but NEVER blocking · Places API yes (if free tier covers it) ·
change-wizard on guide pages only, **no Worker route** · parallel Pass A/B **cut** (the
checkpoint spine enforces a total stage order; `pipeline.mjs` hard-refuses `passB` before
`passA` is committed, and the integrity gate's 120s burst detector would flag concurrent
commits — real cost, wall-clock-only benefit).

**Session 1 of 5 SHIPPED (this session).** The research chain is now **four agents**: Pass A ·
Pass B · Reconcile · Critic.
- **Judgment stack merged.** The Fable vibe critic, its Opus fallback, and the Opus vibe
  executor are gone (−149 lines of workflow); the fresh-context critic runs the **vibe lens as
  its fifth scan** and implements its own findings under full discipline. Saves up to 3 agent
  sessions + 2 verify loops per run. Rationale kept in the workflow header and `PIPELINE.md`.
- **Artifact gate extended**: `## Critic findings` + `## Citation audit` + `#### Continuity
  sweep — critic execution` (the sweep required only when findings were non-sentinel, i.e. the
  critic actually edited).
- **Traveler questions now reach the traveler** (QA F4/F6/F7's root cause). `new-guide.yml`
  threads the intake issue number through a new `issue` input; a deterministic step posts every
  `Status: open` question as an issue comment — deduped by question id, `always()` so a
  cut-off run still surfaces what it assumed. **Not a gate**: no label swap, no pause, no
  failure. The `**Assumed:**` line is what shipped and what the traveler is asked to correct.
- **Doctrine contradiction fixed**: Pass B already verifies every find to T0, so reconcile no
  longer re-verifies B-only rows — it carries the citation across and re-checks only on cause.

**Verified:** 1088 tests green · build clean · lint (worktree workaround) exit 0 · typecheck 0
errors · both workflows parse · question parser exercised against open/answered/deduped/absent
fixtures · **live smoke on GitHub** (run 30733903544, slug=japan): budget step short-circuited
`already reached verified`, every agent step skipped, **zero agent tokens**, run green — the
edited YAML proven against the deployed thing (boundary check #3). Zero build inputs touched,
so rendered output is unchanged by construction.

**Next: Session 2** (acquisition — `lookup-venue.mjs` on Places behind a verified-free-tier
gate; FX fallback coverage for every guide currency + `refresh-fx.mjs`; Jina Reader in the
fetch doctrine if its terms allow). Then 3 (registry core), 4 (registry + denmark pilot),
5 (change wizard).

## Snapshot (updated 2026-07-30, session #20 — mobile nav shipped end to end)

**`docs/PLAN_MOBILE_NAV.md` executed in full (A + B + C).** Below 900px the guide is now
navigated from the thumb, not the top of the screen:
- **New sealed silo `src/features/mobile-nav/`** — `model/` (rank · gesture · yield · scrub,
  all pure + tested), `ui/` (botbar · resume · swipe-tabs · yield-chrome · day-scrub),
  `index.js` with an injectable store gateway.
- **Bottom TAB bar**: current group · most-used other group · Groups (sheet) · Today · Map.
  Ranking is **per-device localStorage**, not telemetry (that silo is write-only on the
  client and is a cross-visitor aggregate). The bar never switches tabs itself — it clicks
  the real `.gtab`, so scroll-memory / scroll-spy / telemetry / saved-tab all run through
  one path. Responsive 320 → tablet (floating pill ≥600px).
- **Groups sheet** rows carry a resume line ("you were at ⟨section⟩") for groups actually
  read; nothing remembered renders nothing.
- **Gestures**: finger-tracked swipe between groups (rewritten from itinerary's discrete
  72px version and MOVED into this silo), yielding chrome, day-rail drag-scrub, shared
  sheet drag-to-dismiss (`src/scripts/sheet-drag.js`), haptics on the existing `tapHaptic`.
- **Masthead pill row cut 6 → 3** (creator, mid-session): only live per-guide facts survive
  (countdown · exchange rate · destination clock); 58px → 36px, no sideways scroll at 320px.
  `✓ Works offline` was replaced by an honest per-page `✓ Saved on this device` in the
  colophon, matched against the real cache.

**Two bugs only running it could find** (boundary check #2 — both now regression-tested):
scroll-anchor jitter (~2px rebound after every settled scroll) stopped the chrome from ever
yielding; and the day scrub landed on the wrong card because day-rail measured its deck
delta mid-animation (it now exposes `goTo(idx, instant)`).

**Creator follow-ups, same session (all shipped):**
- **Tools got their own bar slot.** Slot 2 was a second content group — which the Groups
  sheet already reaches in one tap, while a tool panel took three. It now shows the tool
  THIS device opens most, defaulting to **Split**: the budget calculator is one tap from
  anywhere. Bar reads `Days · $ Split · Groups · Today · Map`.
- **The journey line's labels were drawn ON the rail.** `.jl-word` used
  `bottom:calc(100% - 1.05rem)`, which measures DOWN from the stop's top — measured word
  26–38px against a track at 27px. Now `bottom:calc(100% + 3px)`, and the track's offset
  derives from the same `--jl-pad` variable so widening the label room can never leave the
  rail behind. Affects every guide and every journey figure.
- **The Days timeline no longer scrolls sideways on a phone** (it was 448px of track in a
  350px column, with its own scrollbar and clipped `nowrap` labels): edge labels wrap,
  stops shrink, alternate middle dates hide at 7+ days.
- **The day rail's active chip keeps its date** ("01 Wed Jul 8"), so the compacted rail
  still says which day you're on.
- **Jet-lag calculator is no longer on every screen.** It's an arrival tool: it now renders
  only on the group whose own content covers jet lag / landing (`data-jl-group`, derived at
  build from section titles) and not at all once the trip `isPast`. Verified: japan (77
  days out) shows it on group 0 only; korea (22 days past) shows it nowhere.

**1088 tests green** (was 1018), build clean, verified in `astro preview` at 320 / 375 /
768 / desktop, dark + light, across all four guides. `dist/` swept for every retired token.

## Snapshot (2026-07-30, session #19 — skill = single source of truth; vibe chain; About page)

**Skill modernization SHIPPED (creator GO on all 4 parts):**
- `waypoint-guide-author` is now the **single source of truth**: all six `research-pass.yml`
  agent prompts are POINTERS (stage I/O contract only; ~150 duplicated lines deleted; the vibe
  pair's "PROMPT SYNC" burden is gone). New `references/pipeline-roles.md` = stage-role law
  (traveler-question emitter, vibe lens + exact sentinel, executor rules, critic protocol).
- **Hard gates:** new done-gate #3 **citation audit** (sample ≥5 perishable facts, fetch each
  `source_url`, confirm the page still supports the value → `## Citation audit` table) and a
  workflow **"Critic artifact gate"** that FAILS any run whose critic ends without
  `## Critic findings` + `## Citation audit` (alarm after landing, never a barrier).
- `social-leads.md` merged into `research-efficiency.md`; SKILL.md slimmed (schema-detail →
  block-types.md). **Research-skill discovery layer**: interactive sessions may open each pass
  with ONE Standard-mode `Research` call (leads only, T0 bar unchanged, NEVER in CI).

**Six-agent research pipeline** — ⚠ **superseded by session #21's four-agent chain** (the vibe
critic / fallback / executor were merged into the single critic; see the #21 snapshot). Still
true from this session: Fable headless was **PROVEN 2026-07-30** via `model-smoke.yml` (run
30533886628, API metadata confirms `claude-fable-5`), and that smoke workflow stays for vetting
future model ids.

**Also this session:** `/about` page shipped (token-styled, journey-line, real build-counted
stats; hub footer links it) · dead deps removed (dotenv, 2 retired mockup fonts, redundant
astro-eslint-parser) · consultant plan rejected (`docs/archive/CONSULTANT_PLAN_REJECTION.md`).

**Late-session additions (all pushed):** default effort **high** (not xhigh) across
research-pass AND revise-guide · **continuity doctrine hard-gated** on all three headless
edit surfaces (required sweep records; modify=alarm, revise+executor=barrier) ·
**Pass B coverage gate** (`check-passb-coverage.mjs` — every B-find needs a reconciliation
verdict; deterministic, 9 tests) · **docs/PIPELINE_PATTERNS.md** virtuous loop (critic/vibe
findings compound as process patterns, promotion rule ≥2 runs → skill rule/gate; NEVER into
the learnings silo — process evidence ≠ lived experience).

**1018 tests green, build + YAML clean (all 3 workflows), all pushed to main.**

## Queued plan

- *(none — `PLAN_MOBILE_NAV.md` shipped in session #20; its "As built" section records the
  three places the plan was wrong and why, which is the part worth reading.)*

## Pending from session #18b (revise pipeline — still open)

- Review/merge **draft PR #28** (korea smoke revision); then flip `revise-guide.yml` `land`
  default `draft` → `auto`; sign off V6 Q4 thresholds (overall ≤3, pacing ≤2, ≥3 skips).
- Critic flagged the swapped 명동 label on korea 03's Gyeongbokgung map point → own issue.
- ⚠ Cloudflare dashboard Git integration builds "tripguides" on every push and fails in 0s —
  external config noise; consider disabling (deploy-worker.yml owns the real Worker deploy).

## ✔ Local lint — RESOLVED (session #28)

`npm run lint` exits 0. For ~4 sessions it reported 600+ phantom parse errors on this machine
because `.claude/worktrees/agent-a7dc7eeb397c6a368/` was a full repo checkout, giving eslint two
candidate `tsconfigRootDir`s. **CI was never affected** (clean checkout) — which is exactly why
it went unnoticed for so long, and exactly CLAUDE.md boundary check #1.

Fixed by committing the worktree's uncommitted work (`5917f8f` on branch
`worktree-agent-a7dc7eeb397c6a368`) and removing the worktree. **If an agent worktree is ever
left behind again, this is the failure mode** — a second repo checkout inside the repo is a
second tsconfig root, and the symptom looks like a code problem when it isn't.

## Owner tasks (need the creator, not the agent)

1. Delete merged remote branch `claude/website-visual-redesign-upnl05`.
2. Decide the fate of branch `worktree-agent-a7dc7eeb397c6a368` — it holds the progress-study
   design work (`5917f8f`, 22 files) unreviewed and unmerged. Keep, develop, or delete.

*(Closed in #28: the Actions "allow PRs" setting was already enabled; PR #28 merged; the
change-request prefill click is done and proven.)*

---

**Session #30 (2026-08-03, same session, two parts):** Part 1 — geocode backfill (Denmark,
Japan, US; Korea already done) + `plan_b`'s first real content (six Japan entries). Part 2 —
a display-only `region` field (US now shows "Arizona", not "United States"), US's Food &
shopping restructured into its own tab, and a repository-breadth research pass across all
four guides' Sights/Food sections (Denmark's Oslo, Japan's Sapporo/Sendai, Korea's Daejeon/
Busan, and US guide-wide all went from thin-or-zero to real coverage). Both parts are merged
to `main`.

**Re-prompt the creator with:** "Two things landed this session. First: all four guides are
geocoded, plan_b (the rain/closure alternate) shipped its first real content on Japan, and the
run found real bugs along the way — a coordinate guard fix, a wrong coordinate it had let
through before the fix, and two closed restaurants (Denmark's Jabby's, Korea's Palsaik) that
got replaced with verified-open alternatives. Second: the guides' Sights/Food sections are a
REPOSITORY by this repo's own doctrine — a traveler who exhausts the itinerary should still
have somewhere to go — and we measured real gaps: the US guide had zero margin (4 sights, all
4 already itinerary-scheduled), and Oslo/Daejeon/Busan had literally nothing. Four research
agents closed those gaps in one pass — real, Places-verified venues, not padding — and along
the way fixed a genuine US content bug (two restaurants sharing identical description text)
and a mislabeling bug (the US guide showed 'United States' everywhere a Sedona-only trip
should've said 'Arizona' — now fixed with a reusable `region` field for future US guides).
**Not done, by your own instruction:** the full dual-pass research ceremony (Candidates
considered tables, formal reconciliation) — this was a single verified pass, real but lighter,
scoped to clear the gap, not a graduation-ready research pass. Everything is merged to `main`,
no PR opened."

---

**Session #29 (2026-08-02):** shipped the budget summary sheet — "Save summary as PDF" in the
Budget calculator, two A4 pages, printed by the browser rather than generated by a JS library
(the reason is Unicode: a Hangul name would come out as boxes otherwise). Mock-ups were drawn
first and the creator chose the statement-with-cover-page direction, plus local currency,
per-person breakdown and trip dates/photo — and declined payment handles in the file, which is
the right call for something that gets forwarded. Before that, the budget calculator's UI was
measured at 375px with real data and five concrete problems were found; **fixing those is the
open work**, and none of it touches the model or the sync layer.

**Re-prompt the creator with:** "The budget summary PDF is live — the button appears in the
Budget calculator once there's spending, and it prints a two-page sheet: a cover with the total,
local-currency equivalent, per-person and per-day, and who pays who; then a statement itemising
every expense and each person's own lines. It prints through the browser instead of a JS PDF
library specifically so non-Latin names survive, and payment handles are deliberately left out
of the file. What's still open is the calculator's own UI: expense descriptions clip at ~104px,
the panel reads bottom-up (you type expenses at the bottom while the answer updates 500px
above), the controls are smaller than the site's current button vocabulary, and settlement rows
take 109px to say one line. That's a presentation-only pass — say go and it's roughly a
session's work."

---

**Session #28 (2026-08-02):** wired deep research into Pass B as a native-first, anti-default
dossier contract; verified the change-request wizard end to end against the live GitHub form;
cleared the stale worktree and with it the phantom-lint problem. **Every open item from the V2
arc is closed.** The repo is at a clean stopping point — nothing is half-built and nothing is
waiting on the creator except two housekeeping branches.

**Re-prompt the creator with:** "Everything from the V2 arc is closed. Deep research now has one
sanctioned home — Pass B — and it works as a handoff: you run the native-language sweep
interactively, it writes a `## Discovery leads` table into the intake doc, and the headless pass
verifies every lead to a primary source and records the rejections as evidence of what was
considered. It excludes the English top-10 on purpose, because that's the layer Pass A already
has and the layer that's most polluted on famous destinations. The change-request button is
proven end to end — a real prefilled issue came back with all three fields and the parser read
them back exactly, and the label gates correctly ran nothing. Local lint is fixed: the stale
agent worktree was the cause, and its 21 files of progress-study work are safe on branch
`worktree-agent-a7dc7eeb397c6a368`. **The honest gap:** none of the five research-quality
standards has met a real research pass yet. The next new guide is the calibration test — if a
floor fires on a priority that's legitimately thin, that's information about the floor, not a
verdict on the guide. Two housekeeping items are yours: delete the merged
`claude/website-visual-redesign-upnl05` branch, and decide whether the progress-study design
work gets developed or dropped."

---

**Session #26 (2026-08-02):** finished the fact registry across all four guides (141 facts) and
ran a whole-repo consistency audit — 2 dead exports removed, seven docs corrected, the last
label-drift hazard closed with a shared schema + contract tests.

**Re-prompt the creator with:** "Every guide is on the fact registry now — 141 prices and
fares, each with its own source and date, each edited in one place — and all four built pages
are byte-identical, so nothing a traveler sees moved. The consistency audit found the code
almost spotless (2 dead exports out of 623) but several docs describing a repo that no longer
exists; the one that mattered was CLAUDE.md still telling agents to edit prices in the group
file, which since the migration would mean editing prose that no longer holds the number.
**Three things are on you:** (1) the Places API key is referrer-restricted so venue
verification 403s — Google Cloud → Credentials → that key → **Application restrictions =
None**; (2) `verify --slug japan` fails on a disproof item that has a date but no source URL —
it predates all this work, and the fix is the real source or removing the orphan date, never an
invented one; (3) one signed-in GitHub click to confirm the change-request box prefills. Also
still open: draft PR #28, the Actions 'allow PRs' setting, and local `npm run lint` (use
`npx eslint src worker scripts tests`)."

---

**Session #25 (2026-08-02):** shipped V2 Session 5 — the guided change-request wizard. **The
five-session V2 arc is complete.**

*(prior re-prompt, superseded)* "V2 is done — all five sessions shipped. The change-request
button now walks a reader through three steps in-page instead of asking them what a 'slug' is,
and it still degrades to the plain GitHub link with JS off. **Two things are on you:** (1) the
Places API key is still referrer-restricted, so venue verification 403s — Google Cloud →
Credentials → that key → **Application restrictions = None** (keep the Places API restriction
and the daily quota cap); (2) next time you're signed into GitHub, click the change-request
button once and confirm the description box arrives prefilled — GitHub's docs say it should and
the round-trip test agrees, but a signed-out browser can't render that form so I couldn't watch
it happen. Worth deciding next: migrate japan + us onto the fact registry (same one-command
pass), or let the remaining V2 ideas I cut — the destination dossier, parallel Pass A/B — stay
cut. Also still open: draft PR #28, the Actions 'allow PRs' setting, and local `npm run lint`
(use `npx eslint src worker scripts tests`)."

---

**Session #24 (2026-08-02):** shipped V2 Session 4 — denmark AND korea migrated onto the fact
registry, 108 facts total, both byte-identical.

*(prior re-prompt, superseded)* "Denmark and Korea now keep their prices as sourced rows —
108 facts — and both built pages are byte-identical, so nothing a traveler sees moved. Proved
the payoff on a real fact: one edit updated all three of its references. Worth knowing the
limit — two other mentions of that figure didn't update, because they live in prose with no
citation of its own and so were never migrated; the continuity sweep still covers that
remainder. **Still waiting on you (2 min):** the Places API key is referrer-restricted, so
venue verification 403s — Google Cloud → Credentials → that key → **Application restrictions =
None** (keep the Places API restriction and the daily quota cap). Session 5 is the last one:
the in-site Request-a-change wizard. Also still open: draft PR #28, the Actions 'allow PRs'
setting, and local `npm run lint` (use `npx eslint src worker scripts tests`)."

---

**Session #23 (2026-08-02):** shipped V2 Session 3 — the perishable-fact registry, landed
dormant and proven byte-identical.

*(prior re-prompt, superseded)* "The fact registry is in and provably changes nothing yet — a
guide can now keep prices and hours as one sourced record that prose points at, so one edit
updates every mention and the citation audit can check all of them instead of five. Session 4
migrates denmark to it as the pilot, with the gate being that its built pages diff to zero.
**Still waiting on you (2 min):** the Places API key is referrer-restricted, so venue
verification 403s — Google Cloud → Credentials → that key → **Application restrictions = None**
(keep the Places API restriction and the daily quota cap). Also still open: draft PR #28, the
Actions 'allow PRs' setting, and local `npm run lint` (use `npx eslint src worker scripts
tests`)."

---

**Session #22 (2026-08-02):** shipped V2 Session 2 — the acquisition layer. Venue verification
via Places (blocked on one key-restriction fix), and an FX bug hunt that found Korea's currency
hardcoded into every guide's budget footer.

*(prior re-prompt, superseded)* "Session 2 shipped, and it found more than it set out to: the
budget footer on every guide was quoting Korean won — Denmark showed kroner under a won sign,
Sedona offered to convert dollars to dollars — and 36 of 40 currencies had no exchange-rate
display at all because a missing seed rate silently disables the feature rather than degrading
it. All fixed and verified in preview. **One thing needs you (2 minutes):** the Places API key
is referrer-restricted, so the server-side call gets a 403 — in Google Cloud → Credentials →
that key → set **Application restrictions = None** (keep the API restriction to Places and the
daily quota cap; those are the real guards for a server key). Then I re-run the canary to
confirm. After that, Session 3 is the fact registry — the big one, where prices and hours
become data instead of prose. Still open from earlier: draft PR #28, the Actions 'allow PRs'
setting, and local `npm run lint` (use `npx eslint src worker scripts tests`)."

---

## Snapshot (2026-08-06, session #36 — the deploy was never broken; our retry chain was)

**One commit, `661b5a7`, merged to main (fast-forward).** Session #35's four pushes all went red on
Deploy while the site was live and correct. The cause was not Pages — it was our own retry chain
turning a slow queue into a guaranteed failure.

**The mechanism.** `actions/deploy-pages` CANCELS the deployment it created when it times out, and the
deployment ID *is* the commit SHA. So every retry re-submitted that same ID and was handed back the
record the previous attempt had just cancelled — `Deployment cancelled.` five seconds in, every time,
unconditionally. The retries could not succeed. Worse, they left the deployment half-alive, so the
NEXT push died on `due to in progress deployment. Please cancel <prev sha> first` — which is how one
slow queue became four consecutive red runs (`43a05fa`, `f2f7fad`, `5f3e52f`, `e0c787f`). The real
failure was mundane: deployments sat in `deployment_queued` ~12.5 min against the action's 10-min
default and landed about a minute AFTER the workflow gave up.

**The fix.** One attempt, `timeout: 900000` (15 min); retry chain deleted; environment url reads the
single attempt. Plus `verify-live` now runs even when deploy reports failure (`needs: [build, deploy]`,
`if: !cancelled() && needs.build.result == 'success'` — gated on build, so nothing-to-deploy still
skips). It had SKIPPED on all four red runs: the one check that speaks about the SITE rather than the
deploy step stayed silent exactly when it was the only thing that could have said "the site is fine".

**Two lessons for the permanent book.** (1) A retry is only a retry if the operation is IDEMPOTENT —
keyed on a commit SHA, a re-submit is a re-read of a dead record, so the safety net was the bug. (2) A
did-it-land check gated on the deploy step succeeding goes quiet in precisely the case it exists for.

**NOT YET PROVEN — read this first.** No deploy has run since the merge: live `last-modified` is still
13:15:35, the old `e0c787f` deploy. The change is workflow-only so the built site is byte-identical
either way and nothing is missing. The next push carrying real content is the test: deploy green AND
`verify-live` actually running. If it goes red again the failure now means something different — the
queue genuinely exceeded 15 min, not that we cancelled ourselves.

**Dependabot triaged, not fixed (creator's call).** `pdfjs-dist` 6.1.200 — GHSA-hq66-cqwq-w95j,
arbitrary JS on opening a malicious PDF, fixed in 6.2.108 (patch bump, same major). Reachability is
narrow: a traveler must obtain a hostile PDF and deliberately drop it into the New-Guide wizard's
booking-doc upload (`src/features/hub/model/pdf-text.ts`), itself a lazy chunk — no drive-by, no
server-side path, no login or session to steal, only same-origin localStorage. Not urgent; do it on a
routine pass. **Unverified:** could NOT confirm it is literally alert 13 — the GitHub MCP set has no
Dependabot endpoint and direct api.github.com is 403 in agent sessions. It is the only HIGH that is a
direct, shipped, runtime dep; `js-yaml`/`brace-expansion`/`fast-uri`/`ajv` are dev-only, moderate is
`postcss`.

**Phase 2 answered (asked this session).** Per `docs/design-handoff/PROMPT.md` it is **the guide
sheet**: move the sixteen section renderers onto Panels, masthead becomes a plate, graticule comes off
guide photography, and the notation layer lands (provenance dot + staleness popover, flag chips,
stamps, gap state). No spec issue exists yet — #33 deliberately left Phases 2–5 unspecced until the
primitive shipped, and it now has.

---

## Snapshot (2026-08-07 — Phase 2 completed; Atlas migration plan Stage A shipped)

**Session #38 ended mid-Phase-2** (archive has its detail); four more sessions/commits landed
before this one picked up the Atlas migration plan: `f3734c0` finished Phase 2 (sights/venues/
days/divergences all on Panels — the "remaining blocked" line in the old snapshot is resolved),
`efaca03` rebuilt the masthead as **the plate** (square, sunken bed, oxide corner ticks — the
plate NUMBER was deliberately omitted then for having no real data source), `edbd7b7` fixed
notation-layer gaps (staleness reading, sights' own provenance dot, dead CSS tokens) and
explicitly deferred the flag-chip and gap-state work as needing "a real architecture decision."
`06da464` wrote `docs/PLAN_ATLAS_MIGRATION.md` itself (a Fable grilling session, D1–D22 settled);
`b051389` cleared all 4 Dependabot alerts; `4e25569` integrated the creator's anchor bundle
(SPEC-COMPONENTS.md, ACCEPTANCE.md, ANTIPATTERNS.md, screenshots 10–21) into the plan.

**Stage A — Guide-sheet completion, all 11 items.** Day-scrub `position:sticky`
fixed (`.pnl-body-in` clips only while collapsing/collapsed, not in the open steady state — a
`.pnl-clip` class carries the brief expand-transition case). `place_id` now reaches
`<TransitLinks>` from sights/venues. `closed_days` renders a Closed row on sights and gets a
new build-time (never-failing) cross-check against itinerary waypoints
(`scripts/check-closed-days.mjs`). Venues now grid inside a Panel (D12). The plate NUMBER
efaca03 omitted now ships — `src/lib/sheet-order.ts` (chronological-by-trip-start, pure+tested)
feeds "PLATE NN — CC"; masthead conformance bundle (16px inner mat, corner ticks at ITS corners,
title 640/-.014em, plate-line bottom hairline) done to the design-handoff prototype's exact
markup. Provenance popover conformance (oxide square border, WHERE THIS CAME FROM kicker via
`--aink` not raw oxide — D8's contrast trap avoided by construction, NO PUBLIC SOURCE fallback) —
extracted into one shared `ProvenancePopover.astro` (was tripled across 3 call sites). Flag
chips (D10) — edbd7b7's deferred item: `renderFactValue` now emits a real allowlisted `<a>` (no
new `<span>` shape needed) for `state:"approx"`, works with zero JS, `flag-chip.js` logic in
provenance-dot.js builds the same popover client-side from data-* attributes. Gap state (D9) —
edbd7b7's other deferred item: `state:"unconfirmed"` + `instead` added to the shared provenance
fields, `GapBlock.astro` built to the exact SPEC-COMPONENTS.md ASCII spec, wired into sights/
venues; verified via a scratch-and-revert content test (renders nowhere in real guides yet, by
design). COLLAPSE ALL/EXPAND ALL landed in each panel-group header. Hash auto-expand was already
shipped (verified live, no change needed). A real new a11y baseline entry
(`DAY_SCRUB_STICKY_RANGE_WHY`) was needed and added, verified/measured, not guessed — the day-
scrub fix interacting with the a11y gate's own force-all-tabs-open harness technique.

**Stage B — Atlas data layer**, same push as A per the plan's own one-session scoping: airport
gazetteer (`src/data/airports.mjs`), the reserved `traveler-origin` fact row contract (D14/ADR
0003 — confirmed/unconfirmed state, no route arc when unconfirmed), tz backfill (korea/denmark),
per-guide atlas record derivation (`src/features/atlas/model/guide-record.ts`, pure+tested),
world-atlas 2.0.2 TopoJSON vendored into `public/data/`, the search-index build step, intake
congruence. A same-session Fable-5 code review (Standards + Spec axes) caught the D6 180-day
plate-renumbering time bomb (fixed via pinning the ordinal year from each guide's own kicker),
a staleness-popover order regression, a missing viewport clamp, and phantom `flag-chip.js`
references — all fixed, `c872ec3`.
