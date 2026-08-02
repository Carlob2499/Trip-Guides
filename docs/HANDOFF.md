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
