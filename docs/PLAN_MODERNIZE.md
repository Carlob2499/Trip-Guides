# PLAN_MODERNIZE — Adversarial Audit → Executor Program (2026-07-26)

The orchestrator's audit of the whole system — codebase, built site, and automation — and the
sequenced executor program that follows from it. Three parallel audit passes (design/frontend,
CI/workflows + live run history, build/perf metrics) plus orchestrator verification of every
load-bearing claim. Every finding below carries evidence; nothing is generic advice.

**How to run this plan:** one M-session per numbered block, in order (M0 is gating; M1–M2 may
interleave; M3→M4 are sequential; M5 is gated on clarifying answers). Each session opens by
putting this file's *Clarifying questions* (those still unanswered) to the creator via
AskUserQuestion, states its model (`/model` at session start), applies its skill policy, and
closes with the Ship Loop. Guides' *content* is never edited by these sessions — this is a
code/automation/design program, so `waypoint-guide-author` stays OFF throughout unless a session
explicitly touches guide facts (none currently does).

**Hard guardrails (every session):**
- Firebase data is untouchable: no write to any `trips/*` node, no `roomId` change in any
  `_guide.json`, no change to `database.rules` semantics. Korea's live budget
  (`trips/0286df0ea411ae7e`, backup at `trips/southkorea`) is load-bearing user data.
- Delete only what is *proven* dead (evidence in this file) — relics with research value are
  archived, not deleted (the `countries.mjs` precedent).
- Ship Loop on every change: build → test → preview :4322 → grep `dist/` → commit → push.

---

## Part 1 — Audit verdict (the adversarial critique, condensed)

### 1.1 The headline: the automated pipeline's agent layer has never worked

The intake half of the new-guide chain is real and proven: issue form → `ensure-labels` →
`new-guide.yml` → `issue-to-scaffold` → scaffold committed to main → issue commented/closed →
auto-dispatch of `research-pass.yml`. Run history proves each hop once (issue #9 → the `us`
scaffold).

Everything after that hop has **never executed, not once**:

- `research-pass.yml`: 2 runs ever, both failed before any work — run 1 on the `anthropic/`
  org typo (since fixed), run 2 on the missing `CLAUDE_CODE_OAUTH_TOKEN` (since set).
- `recert.yml`: 1 run; the agent's **first model call errored** (`is_error: true, num_turns: 1,
  duration_ms: 2046, total_cost_usd: 0`). Commit 389b229 diagnosed this as "cosmetic — no PR to
  report into"; the shape contradicts that (a cosmetic reporting failure follows *billed* work;
  $0 + 1 turn + 2s = the call itself died). Root cause unknown — `show_full_output` is off.
- Never happened even once: any research stage, a checkpoint resume, the attempt counter
  passing 0, auto-graduation, `land-branch.sh`, an `auto-published` issue, the run ledger.
- The Sedona (`us`) guide that appears to validate the pipeline was researched and graduated
  **interactively** — its state file's passA/passB/reconcile stamps are 80 ms apart
  (batch-checkpointed retroactively) and `attempts` still reads 0. HANDOFF's "W5 proven end to
  end" is true only of the *intake* path; the deferred W6 is not merely unperformed — the agent
  layer is affirmatively broken and was misdiagnosed.

Three more untested seams are stacked behind the broken call, each able to kill the zero-click
path on its own:

- **Actor gate:** `new-guide.yml:93` dispatches research-pass as `github-actions[bot]`;
  `claude-code-action@v1` verifies a *human* actor (`allowed_bots` unset). The auto-dispatch hop
  has never reached the action, so this rejection has never had the chance to fire.
- **`gh` auth inside the agent:** `land-branch.sh:11` requires `GH_TOKEN`; the agent step sets
  no token env for its Bash tool. Whether `gh` works inside the action's subprocesses is an
  assumption no run has ever tested — the exact CLAUDE.md "force the failure path once" class.
- **Canary semantics:** `token-canary.yml` (0 runs ever, first cron fire 2026-07-27) alerts
  "rotate the token" on *any* probe failure — but the repo's own history shows a valid token
  producing `is_error: true`. Its first firing will either false-alarm or mask the real bug.

### 1.2 Fixed in this branch (already committed)

| Fix | Evidence it was real |
|---|---|
| **Trip Split desktop misalignment (live UI bug)** — `.se-main`/`.se-header` kept a 5-column grid (`1.3rem` drag col) for a drag handle `trip-split.js` no longer renders; 4 children auto-flowed into the wrong columns, payer select crammed into 1.3rem, header labels off by one. Now 4-column; mobile keeps its narrower widths | `trip-split.css:37-59,132-139` vs `features/trip-split/ui/trip-split.js:261` (renders select/input/amt/button — no handle) |
| Dead `.se-drag`/`.se-dragging` rules + stale "drag \| payer \| …" comment removed | no JS reference repo-wide |
| Dead `.imgfail` rules removed (screen + print) — failure UX was rebuilt twice (`media-fail`, `mast-media-fail`); nothing ever adds `imgfail` | `guide.css:254-255,681`; emitters at `SightsBlock.astro:25-26`, `GuideLayout.astro:415` |
| `mexico.json` (repo root) deleted — UTF-16LE mojibake stray from a PowerShell redirect, an unresearched draft scaffold duplicate; Mexico's *researched* data stays in `countries.mjs` | committed in a55a4eb; content unreadable (`ΓÜá Draft scaffold`) |
| Root `wrangler.jsonc` deleted — the documented Boundary-Check-#1 footgun still shipping; `deploy-worker.yml` keeps explicit `--config` (comment updated) | `deploy-worker.yml:61` had to defuse it |
| Stale flat-path references fixed: `new-guide.yml` issue comment linked `src/content/guides/<slug>.json` — a **404 for every future guide** (scaffold splits + deletes the flat file); same in `graduate-guide.yml:119`, `research-pass.yml` header/input/prompt. The prompt now *warns the agent never to create* a flat file (it would shadow the directory) | `scaffold-guide.mjs:264-266` removes the flat seed |

Post-fix: build clean, 848/848 tests, lint 0, `dist/` greps clean of removed tokens.

### 1.3 Scoreboard (measured, this branch)

| Gate | Result |
|---|---|
| build / test / lint / typecheck | clean / 848 pass / 0 / 0 errors (11 hints) |
| dist | 3.95 MB · 42% is on-demand pdfjs (1.68 MB pair) — **not** in the SW precache (verified: CORE = 7 URLs) |
| First-paint JS | hub ~79 KB raw (~25 KB gz) · guide ~127 KB raw (~35 KB gz) — lean |
| Perf budget | PASS with ~35% headroom — but the 900 KB budget is ~78% *lazy* chunks; it cannot catch a first-paint regression |
| CLS | **0.244** (open issue) — cause identified, see M2 |
| Images | 0 of 21 guide-page `<img>` have width/height; masthead ships one 1600px URL, no srcset |
| Preloading | zero `modulepreload` hints; zero font preloads (19 subsets, all swap) |
| `: any` | 111 in src (walkers + `.astro` props) — debt recorded, unlock known |
| Dead code | near-zero (3 selector groups, all now removed; 1 dead export; ~0 TODOs) — unusually clean |
| CSS | guide.css 729/800 split threshold; **no `--space-*` or z-index scale** (20+ ad-hoc z values incl. one 9000); skip-link (z-999) paints under story-mode (z-1000) |

### 1.4 Design critique vs award tier (the honest one)

The identity (cartographic, mono-data, contour motifs, three-family type system with a measured
migration record) is genuinely distinctive — the bones are award-adjacent already. What keeps it
from that tier is not taste, it's *finishing*: (1) the page **moves after paint** — four
JS-injected strips shift layout exactly when first impressions form (the CLS 0.244); (2) the tab
bar mixes **platform emoji** into an otherwise rigorous stroke-SVG icon vocabulary — the single
most visible off-brand element, different on every OS; (3) the hub grid uses a many-items
auto-fill pattern for a 3-guide catalog, so the weakest beat on the page is the product list;
(4) three onboarding devices (story intro, cold-open strip, nav-hint) all fire in one first
viewport, against the site's own "spend the boldness in one place" doctrine; (5) the footer is an
afterthought where the verification story — the moat — should sign the page. All five are
addressed in M2/M4.

---

## Part 2 — The executor program

Model economy per the settled rule: design/judgment on **Opus**, procedure on **Sonnet**.
"Skills" rows list only deviations from the default (all optional skills OFF; `github` + Claude
Code Remote connectors only — the standing CLAUDE.md rule).

### M0 · Resuscitate the agent pipeline — **Sonnet** · GATING, DO FIRST

The product's thesis is the pipeline; nothing else in this plan matters as much.

1. **Read the real error first, at minimum cost:** manually dispatch `token-canary.yml` (bare
   Haiku prompt — the cheapest possible probe) and/or re-dispatch `recert.yml` with
   `show_full_output: true` added to the agent step. Do not guess; read the first model call's
   actual failure.
2. Fix the root cause (candidates, in likelihood order: OAuth token scope/expiry vs the action's
   env contract; action-version/model-ID mismatch; org/permissions). Then fix the three stacked
   seams *in the same session, each proven by forcing it once* (Boundary Check #2):
   - `allowed_bots` on the action (or dispatch research-pass with an App/PAT token) so the
     `github-actions[bot]` auto-dispatch survives the actor gate.
   - Export `GH_TOKEN: ${{ github.token }}` into the agent step env; prove `gh` works inside the
     agent's Bash with one harmless call before trusting `land-branch.sh` to it.
   - Rewrite `token-canary`'s alert logic to distinguish auth-failure (rotate token) from other
     `is_error` (file a different issue naming the real class); smoke-run it once manually.
3. **End-to-end proof (W6, finally):** file a real New-guide issue for a throwaway destination,
   watch scaffold → auto-dispatch → Pass A/B → reconcile → verify → auto-graduate → land →
   `auto-published` issue → ledger entry. Exercise the stuck path once (cap the attempts low on
   the throwaway). Cleanup of the throwaway artifacts is **gated on Q1 below**.
4. Small chain fixes while in there: per-country (not per-issue) concurrency key for
   `new-guide.yml` (two issues for the same country currently race to an add/add conflict);
   `research-${{ inputs.slug }}` concurrency group on research-pass; align the circuit-breaker
   message with its actual `> 5` semantics.

Exit: one **green, headless, zero-click** run from issue to live guide. Until this exists, the
site is a hand-made artifact with a beautiful description of a factory attached.

### M1 · CI efficiency — **Sonnet** (mechanical; low effort)

Measured waste: every main push runs `npm test` twice (deploy + test.yml's coverage superset),
`typecheck` twice, `astro build` twice (deploy + a11y), `npm ci` 3×; docs-only commits run the
full vitest + Playwright stack; 4 workflows skip the npm cache; a11y re-downloads Chromium every
run. 248 deploy runs to date multiply all of it.

- One composite action (`.github/actions/setup`: checkout + node 22 + `cache: npm` + `npm ci`)
  used by all 13 workflows that repeat it.
- `paths-ignore: ['docs/**', 'learnings/**', 'guides-intake/**', '**.md']` on test.yml + a11y.yml
  (deploy still runs — content deploys).
- Concurrency: `test-${{ github.ref }}` cancel-in-progress on test/a11y.
- Cache `~/.cache/ms-playwright` keyed on the Playwright version.
- Fix vestigial refs: `run-skill-evals.mjs` eval-1's `guides/germany.json` fixture → directory
  shape; `skill-retro.yml:57`'s nonexistent `docs/E2_FIELD_REPORT.md`.
- Measure before/after: CI minutes per main push (expect roughly −40%).

### M2 · Performance & CLS zero — **Sonnet** (1–2 sessions)

Closes the open CLS issue. The 0.244 is now *explained*: four post-paint layout shifters
(`#whatsNext`, `#wxWrap` weather strip, `#liveRatePill`/`.gstat-time` injections, and worst,
`onboard.js:25` inserting the nav-hint strip **after the tab bar** on first visit — exactly when
Lighthouse measures) plus 21 dimensionless images.

- `width`/`height` (or CSS `aspect-ratio`) on every guide `<img>`; masthead + hub hero get the
  `srcset`/`sizes` treatment `SightsBlock.astro:22-24` already implements (480/800/1200) — a
  375px phone currently downloads 1600px.
- `min-height` reservations for the JS-populated strips; nav-hint renders into reserved space or
  overlays — never inserts.
- Emit `modulepreload` for the ~7 shared static chunks (today a sequential parse-time waterfall);
  `<link rel="preload">` the two above-fold latin font subsets (Bricolage + Literata).
- Split the perf budget into tiers: **first-paint ≤150 KB raw** (new, protects what visitors
  feel) + existing total budget (protects the lazy pool).
- Gate the Learnings entry script on data presence (10 KB + gate work on every guide page for a
  usually-empty surface); investigate Korea's 416 KB HTML (4× the us guide — hidden-tab and
  Plan⇄Actual duplicate markup are the suspects).
- Target: CLS ≤ 0.02 measured; LCP unchanged or better; budgets wired into CI.

### M3 · Design-system consolidation — **Opus specs (½ session), Sonnet implements**

Zero visual change intended; makes the system actually single-source before M4 builds on it.

- `--space-*` scale (the type scale's own "47 authors reaching past the scale" failure mode,
  currently unfixed for space — dozens of near-identical paddings).
- z-index scale tokens; fix the real stacking bug (skip-link z-999 under story-mode z-1000 — a
  keyboard user tabbing during story mode focuses an invisible link); tame the 9000 outlier.
- Named weight roles (640/700/720/750/780 sprawl → `--w-*`); kill the double h2 weight
  declaration (`guide.css:8` vs `:350`).
- New `--text-h1` step (~clamp 2.1→2.6rem) — the missing band between h2 (32px) and display
  (76.8px) that `.cat-title`'s bespoke clamp proves is needed; migrate `.cat-title`, `.cat-num`.
- `--surface-photo` / `--on-photo` tokens; sweep the ~12 hardcoded fixed-dark literals
  (`#1a2028` *is* light-mode `--ink` duplicated — a palette change would silently drift them).
- Unify `.day`'s two-file styling (guide.css 520px vs planner.css 639px — two mobile stories for
  one component); move `hub-motion.css`'s `:root` block into base.css; fix its two stale comments
  (`--accent2` is deleted; the "needs eyeballing" note was settled 2026-07-23 per MOTION.md).
- Skills: `frontend-design` ON for the Opus spec half only.

### M4 · Visual elevation — **Opus designs + creator review, Sonnet implements** (gated on Q5)

The five moves from §1.4, as one coherent pass (uniform-across-surfaces rule applies):

1. **One icon language**: replace tab-bar/sheet emoji (`🗳 📌 📓 🧳 $`) and text glyphs
   (`◑ ⌂ ↑ ▾`) with the existing 1.8px-stroke SVG vocabulary. Touches every page; also fixes the
   screen-reader emoji-name noise.
2. **Editorial hub for a curated catalog**: ≤4 guides → 2-up layout with large covers (~440px
   cards, `hubcard-cover` exists); auto-fill returns at ≥5. Build on the "Featured above" dedup
   marker — never remove a guide from the grid (the index-never-lies rule).
3. **Tab-bar strategy** before the next Korea-sized guide: content tabs left, tool tabs collapsed
   into one "Tools" pill on desktop (they are chrome by CLAUDE.md's own definition); the mobile
   sheet already proves the grouped model.
4. **First-visit choreography**: one device per visit — story intro on visit 1, nav-hint on
   visit 2, cold-open only for external referrers ("spend the boldness in one place").
5. **Colophon footer**: the verification signature — "Checked [date]" stamp, this guide's
   source/fact counts (`computeGuideStats` already computes them), offline note, request-a-change
   pill. The moat, signing every page.
- Skills: `frontend-design` ON (Opus session); `ui-ux-pro-max` optional for palette/pattern
  cross-checks. Creator reviews the Opus spec (one message) before the Sonnet sweep.

### M5 · Dynamic runtime (R3) — **Opus designs, Sonnet implements** (gated on Q2/Q3)

PIPELINE.md's R3, unchanged in scope, sequenced after M2 (View Transitions on a CLS-0 base):
hub⇄guide View Transitions, live-tile connection state machine, per-view layer (Focus Today /
what's-open-now / weather day-swap). No new backend required for any of it — see Q2.

### M6 · Type-safety payoff — **Sonnet** (mechanical, anytime after M0)

Thread `CollectionEntry<"guides">["data"]` + the section discriminated union through the known
hot files (`GuideLayout.astro` 24, `exports.ts` 14, `map-pins.ts` 14, `content.config.ts` 12,
block components' map callbacks); turn `no-explicit-any` back ON. While in there: replace
deprecated `unescape` (`vote-link.ts:44`), remove the `derivePlannerData` dead export, verify
then remove the never-painting `.cardimg` base rule, split guide.css when it crosses 800.
ESLint's first run found a live crash the whole test suite missed — this debt is the same class.

### Skill & token policy (standing, all M-sessions)

| Skill/tool | Policy |
|---|---|
| `waypoint-guide-author` | OFF for all M-sessions (code-layer). Auto-ON the moment any session touches a guide fact — then its continuity sweep is binding |
| `frontend-design` | ON only in M3/M4 Opus design halves |
| `ui-ux-pro-max` | Optional, M4 only |
| `code-review` | Recommended before each M-session's push |
| All others (docx/pptx/xlsx/pdf/artifacts/…) | OFF — no call sites |
| Connectors | `github` + Claude Code Remote only (standing CLAUDE.md rule; disable others at session start) |
| Agents | Explore/general-purpose for open-ended synthesis only; greppable questions stay local greps |

---

## Part 3 — Clarifying questions (binding; put to the creator before the gated work)

1. **Q1 · M0 throwaway cleanup:** the end-to-end proof creates a real (published) throwaway
   guide. Approve its full removal afterward (guide dir, intake files, palette, research branch,
   and un-listing from the hub) — the destructive-op guard requires your explicit OK?
   *Recommended: yes, with the throwaway slug prefixed `zz-` so it's unambiguous.*
2. **Q2 · Backend stance:** the audit found **no feature that needs a bigger backend** — the
   settled Pages + Firebase free tier + Actions-as-compute stance covers M0–M6, and the existing
   Cloudflare Worker is the extension point if a dynamic feature ever needs server logic.
   *Recommended: reaffirm the settled stance.* Say the word only if you harbor an ambition
   (accounts, comments, paid guides…) that should reshape M5.
3. **Q3 · Room codes in a public repo** (open HANDOFF item): keep the zero-setup tradeoff, or
   move codes to a privately-shared `#room=` fragment (a small M5 work item)? *No default — this
   is a privacy call only you can make.*
4. **Q4 · Six completed-plan docs** (PLAN_FIELD_REPORT_FIXES, PLAN_TRAVELER_FEATURES,
   PLAN_VISUAL_OVERHAUL, FIELD_REPORT_2026-07-22, DENMARK_UPLIFT, TEST_COVERAGE_ANALYSIS):
   *Recommended: archive to `docs/archive/` — greppable history out of the working set.* Delete
   only on your say-so.
5. **Q5 · M4 look changes:** the emoji→SVG tab swap and the 2-up hub visibly change every page.
   Approve the direction now (implementation still pauses for your one-message review of the
   Opus spec), or park M4?
