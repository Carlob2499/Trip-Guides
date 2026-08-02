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
- Ship loop on every change: build → **lint** → **typecheck** → test → `astro preview` :4322
  (never `astro dev`) → grep `dist/` → commit → push to `main` (the only branch —
  `verify-live` guards every deploy). **Lint and typecheck are not optional** — CI's Tests
  workflow runs `npm run lint`, `npm run typecheck` AND `vitest`, and session #20 pushed red
  twice by treating build+test as the whole gate. Use `npx eslint src worker scripts tests`,
  not `npm run lint`, until the stale-worktree issue below is resolved.
- North stars: `docs/PIPELINE.md` (generation/maintenance) · `docs/MOTION.md`
  (presentation/motion) · `docs/GUIDE_RUBRIC.md` (quality bar) ·
  `docs/COMPETITIVE_LANDSCAPE.md` (market parity reference).

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

## ⚠ Local lint is broken by a stale agent worktree (not a code problem)

`npm run lint` (`eslint .`) reports **630 phantom parse errors** on this machine, because
`.claude/worktrees/agent-a7dc7eeb397c6a368/` is a full repo checkout — registered as a real
git worktree since Jul 29 — and eslint finds two candidate `tsconfigRootDir`s. **CI is
unaffected** (clean checkout), which is why the divergence went unnoticed: exactly CLAUDE.md
boundary check #1. Lint every real tree with `npx eslint src worker scripts tests` until it
is resolved — that passes clean.

Two ways out, both the creator's call:
1. Add `.claude/**` to `eslint.config.mjs`'s ignores. **A hook blocks agents from editing
   that file** ("fix the source, don't weaken the config"), so this needs a human or a
   temporary hook disable. It is not a weakening — `.claude/` holds no source.
2. Remove the worktree: `git worktree remove .claude/worktrees/agent-a7dc7eeb397c6a368`.
   **It has UNCOMMITTED untracked work** (`docs/mockups/*progress-study.mjs`,
   `src/pages/progress-preview/`) and 0 commits ahead of main — rescue or discard that
   first. Left in place this session for exactly that reason.

## Owner tasks (need the creator, not the agent)

1. **Enable Settings → Actions → General → "Allow GitHub Actions to create and approve pull
   requests"** — land-branch.sh cannot open draft PRs without it (proven in the #18b smoke).
2. Review/merge draft PR #28.
3. Delete merged remote branch `claude/website-visual-redesign-upnl05`.

## Where we left off

**Session #22 (2026-08-02):** shipped V2 Session 2 — the acquisition layer. Venue verification
via Places (blocked on one key-restriction fix), and an FX bug hunt that found Korea's currency
hardcoded into every guide's budget footer.

**Re-prompt the creator with:** "Session 2 shipped, and it found more than it set out to: the
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
