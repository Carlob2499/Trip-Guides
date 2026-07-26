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

**Diagnosis complete, 2026-07-26 (branch `claude/waypoint-audit-modernize-tne4ce`).** Dispatched
`token-canary.yml` live, twice — first at its default `show_full_output: false` (reproduced the
exact silent shape: `is_error:true, duration_ms:1854, num_turns:1, cost:$0`, identical to the
July 20 recert failure), then with `show_full_output: true` added temporarily to unmask the SDK's
real response (reverted immediately after reading it — see commits on this branch). **Root cause,
confirmed from the actual API response, not inferred:**
```
"error_status": 401, "error": "authentication_failed"
"result": "Failed to authenticate. API Error: 401 OAuth access token is invalid."
```
Two retries, both 401, then the SDK synthesizes the misleading `subtype:success` envelope that
made this look "cosmetic" on July 20. **`CLAUDE_CODE_OAUTH_TOKEN` is expired or was revoked.**
The canary's own alert logic is fine as written — it correctly went red and updated tracking
issue #22 with accurate, actionable instructions; B4's "can't distinguish causes" concern turned
out not to matter because 100% of observed failures to date are this one cause.

**⚠ OWNER ACTION REQUIRED — the orchestrator cannot do this step.** Minting a Claude Max OAuth
token requires an interactive `claude setup-token` login tied to the creator's own subscription;
no agent session can perform it. **Fix:** run `claude setup-token` locally → paste the new value
into the repo secret `CLAUDE_CODE_OAUTH_TOKEN` (Settings → Secrets and variables → Actions) →
re-run **Actions → Token canary → Run workflow** to confirm green (closes issue #22
automatically). Confirmed while diagnosing: the human-actor gate (`triggering_actor: Carlob2499`)
posed no problem for a manually-dispatched run, and `allowed_bots` **is** a real, live input of
`claude-code-action@v1` (verified in the action's own `ALL_INPUTS` dump) — so B2 was a real,
fixable gap, now fixed below.

**Fixed in this session, independent of the token (all committed):**
- `allowed_bots: "github-actions[bot]"` added to research-pass's agent step — the one workflow
  legitimately auto-dispatched by a bot actor (from `new-guide.yml`); without this the zero-click
  hop would have been rejected by the action's human-actor verification the first time it ever
  reached that far.
- `GH_TOKEN: ${{ github.token }}` added to job-level `env:` in research-pass.yml, modify-guide.yml,
  and recert.yml — their agent steps' own Bash tool inherits the job environment, and each
  prompt calls `gh issue`/`gh pr` directly (`land-branch.sh` requires it too). Previously unset;
  never tested because no run ever reached a `gh` call.
- `new-guide.yml`'s concurrency group changed from per-issue to a single global lock
  (`new-guide-scaffold`) — country isn't parseable before the job runs, so two *different* issues
  for the same country couldn't be told apart by any pre-job key; they raced to an add/add
  conflict on `uniqueSlug`. A global serialize is correct and cheap (scaffolding is fast, rare).
- `research-${{ inputs.slug }}` concurrency group added to research-pass.yml (rapid/duplicate
  dispatches for the same slug would otherwise race the same branch's bump-commit-push cycle).
- Circuit-breaker message now says "exceeds cap of 5" instead of "cap: 5" — it trips on attempt
  6 (`attempts > CAP`), and the old wording read as "stops after 5."

**Still to do, once the token is rotated (same session or the next, no plan changes needed):**
1. Re-run `token-canary.yml` once to confirm green (closes #22).
2. **End-to-end proof (W6, finally):** file a real New-guide issue for a throwaway `zz-`
   destination, watch scaffold → auto-dispatch → Pass A/B → reconcile → verify → auto-graduate →
   land → `auto-published` issue → ledger entry — all six of which have never fired, even once.
   Exercise the stuck path once (cap attempts low on the throwaway). Cleanup is pre-approved (Q1).
3. Smoke-test one `gh` call from inside an agent's Bash tool specifically (the GH_TOKEN fix above
   is applied but, per Boundary Check #2, still unforced until a live run actually reaches it).

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
- **PR preview deployments (from Q2):** Cloudflare Pages free-tier project building `dist/` on
  every PR → a live preview URL in each recert freshness PR and draft-guide triage PR. Prod
  stays GitHub Pages. Mind `import.meta.env.BASE_URL` (previews serve at root, prod at
  `/Trip-Guides`) — the explicit-base-path rule makes this a config knob, not a rewrite.
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
6. **"More detail" v2 — creator-requested centerpiece.** Current state: `splitLead`
   (`src/lib/lead-split.ts`) folds everything after a card's first `</p>` behind a native
   `<details class="card-more">` when the remainder ≥260 chars; the summary is a micro-caption +
   `↓` over a dashed rule (`guide.css:212-219`) — a bare-text tap target, against the site's own
   clickability doctrine, with a generic label and a snap open. The v2 spec:
   - **Looks like a control**: the summary becomes a chip/pill from the site's control vocabulary
     (visible fill, hover, focus-visible, chevron), same vocabulary as the M4-1 icon pass.
   - **Knows what it's hiding**: optional `moreLabel` field in the section schema (typed,
     falls back to "More detail"); plus an auto count suffix when unlabeled ("· 2 more
     paragraphs") derived at build time — never a lie, it's computed from the real remainder.
   - **Smarter split**: `splitLead` v2 refuses to fold operational content — if the remainder
     contains a `⚠` flag, a `<ul>/<ol>` (steps), or looks like hours/prices, the cut point moves
     past it or the fold is skipped entirely. Honesty rule: a warning is never behind a tap.
   - **Fade-out preview**: a one-line masked preview of the folded content under the lead
     (gradient mask) so the reader sees *that* and *what kind of* content awaits — the strongest
     disclosure affordance in editorial design, zero JS.
   - **Smooth open**: CSS-only `::details-content` + `interpolate-size: allow-keywords`
     animation (progressive enhancement — browsers without it get today's snap), honoring
     reduced-motion. No JS, no layout thrash.
   - **One disclosure vocabulary site-wide**: RaidBlock's `<details>`, collapsible sections, and
     card-more all adopt the same chip + chevron + animation, so "this expands" reads
     identically everywhere.
- Skills: `frontend-design` ON (Opus session); `ui-ux-pro-max` optional for palette/pattern
  cross-checks. Creator reviews the Opus spec (one message) before the Sonnet sweep.

### M5 · Dynamic runtime (R3) — **Opus designs, Sonnet implements** (gated on Q2/Q3)

PIPELINE.md's R3, unchanged in scope, sequenced after M2 (View Transitions on a CLS-0 base):
hub⇄guide View Transitions, live-tile connection state machine, per-view layer (Focus Today /
what's-open-now / weather day-swap). No new backend required for any of it — see Q2.

Added per creator (2026-07-26): **room-code options** — zero-setup default stays, plus
(a) a `#room=<code>` URL-fragment override: a group that wants privacy generates its own code
(`scripts/gen-room-id.mjs` already exists) and shares the link privately; the fragment never
reaches a server and is never committed, and the client prefers it over the guide's `roomId`;
(b) **post-trip room lock**: N days after the trip's end date the client drops to read-only
display — the data keeps serving the recap card and Plan⇄Actual, but no write UI is offered
(that's the post-trip usefulness: the room becomes the trip's financial record, and locking
protects it). A rules-level write-freeze is a possible later hardening; the client lock touches
no existing data and no rules semantics.

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

## Part 3 — Clarifying questions (answered by the creator, 2026-07-26)

1. **Q1 · M0 throwaway cleanup — APPROVED.** The end-to-end proof's throwaway guide (slug
   prefixed `zz-`) gets fully removed afterward: guide dir, intake files, palette, research
   branch, hub listing.
2. **Q2 · Backend / hosting — creator raised Vercel (Hobby tier) for feature-expansion parity.**
   Orchestrator's verdict, from verified Hobby limits: **stay on Pages for production; adopt PR
   preview deployments additively.** Reasoning: (a) every parity feature in
   COMPETITIVE_LANDSCAPE's matrix that remains open (route optimization F8, packing F4, offline
   F5, prep timeline F2, budget pact F3, R3 runtime) is client-side over build-time data — none
   needs SSR/functions; (b) Vercel Hobby is non-commercial-only, 100 GB bandwidth, ~1 M
   invocations, 4 h active CPU/mo, **and has no overage path — at the cap the deployment
   PAUSES and the site goes offline until reset**. A travel product whose SOS sheet is relied
   on mid-trip must not have a hard offline cliff; Pages has no such cliff and 248 green
   deploys of proven machinery; (c) the one genuinely valuable Vercel capability — a live
   preview URL per PR (recert freshness PRs, draft-guide triage PRs become click-to-review) —
   is available without moving prod: **Cloudflare Pages free tier** (unlimited bandwidth,
   preview deploys, account already exists for the Worker) building `dist/` per PR. Logged as
   an M1 work item. The static/no-account/offline architecture stays the differentiator the
   competitive doc says it is. Firebase + the existing Worker remain the dynamic extension
   points.
3. **Q3 · Room codes — zero-setup tradeoff ACCEPTED**; creator wants an *option* on top →
   the `#room=` override + post-trip lock, spec'd in M5 above.
4. **Q4 · Six completed-plan docs — ARCHIVED** (done this session: `docs/archive/`, all
   path-qualified references repointed, build/test/lint green).
5. **Q5 · M4 look changes — APPROVED**, with the creator's stated priority: the "More detail"
   controls (M4 item 6) must look far better and behave more intelligently. Implementation
   still pauses for the creator's one-message review of the Opus spec.
