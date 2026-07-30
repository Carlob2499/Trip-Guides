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

**Six-agent research pipeline** (this session + parallel #18b work): A (model input) → B
(pinned Sonnet, A-blind) → Reconcile (stops pre-graduation) → Vibe critic (pinned **Fable**,
continue-on-error; **Opus 5 fallback on failure** — degrade the model, never the pass) →
Vibe executor (Opus, only if findings) → Rubric critic (`critic_model`, default Opus, owns
graduation). Fable headless: **PROVEN 2026-07-30** via `model-smoke.yml` (run 30533886628,
API metadata confirms `claude-fable-5`) — the smoke workflow stays for vetting future model ids.

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

## Owner tasks (need the creator, not the agent)

1. **Enable Settings → Actions → General → "Allow GitHub Actions to create and approve pull
   requests"** — land-branch.sh cannot open draft PRs without it (proven in the #18b smoke).
2. Review/merge draft PR #28.
3. Delete merged remote branch `claude/website-visual-redesign-upnl05`.

## Where we left off

**Session #20 (2026-07-30):** executed `PLAN_MOBILE_NAV.md` end to end — four commits, a new
sealed silo, 70 new tests, and a masthead pill cut the creator asked for mid-session. Every
piece was verified by driving it in `astro preview` (synthetic pointer/touch events), which
is how both real bugs surfaced; neither would have failed a unit test.

**Re-prompt the creator with:** "Mobile nav is fully shipped and live — the one thing no
tooling here can check is how the four gestures FEEL on your actual phone (swipe weight,
whether the chrome yields too eagerly at 80px, whether the day-scrub bubble is readable
mid-drag, haptic strength on Android). Open a guide on your phone and tell me what feels
off; the thresholds are all named constants in `src/features/mobile-nav/model/`, so tuning
is a one-line change each. Separately still open: the research pipeline's full live proof
waits for the next guide you actually want (japan NO-OPS at the budget step), and draft
PR #28 needs review/merge."
