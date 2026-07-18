# Adversarial Review & Transformation Roadmap — 17 Jul 2026

## Progress log (updated 18 Jul 2026)

- **R0 / P0 security — SHIPPED** (code): hardened RTDB rules, id-escaping + esc tests,
  salted room ids (`gen-room-id.mjs` + scaffold), room-visibility notice, QR vendored
  (share + voting; zero runtime CDNs). ⚠ **Manual step pending: publish `rules.json` to the
  Firebase console** (steps + simulator cases handed off in chat).
- **P1 correctness — COMPLETE**: #7 tablist ARIA + moderate a11y gate ✅ · #8 auto-versioned
  sw cache ✅ · #9 green `astro check` + CI typecheck gate ✅ (Voting extracted to a tested
  silo — the last inline-script feature) · #10 Trip Split offline write queue ✅ (localStorage
  outbox, idempotent replay; full offline E2E pending a writable guide #3) · #11 error beacon ✅
  · #12 locale audit ⏭ skipped (low value; `tz-offset` must stay fixed-locale).
- **R1 telemetry — SHIPPED** (code): `src/features/telemetry/` silo (counts anonymous tab
  opens), `telemetry/` rules node, footer disclosure, `aggregate-telemetry` weekly workflow →
  `docs/telemetry/summary.{json,md}`, guide-author skill wired to read it. Populates once the
  rules are published (`.read: true` on telemetry lets the keyless job read it).
- **Rules PUBLISHED** (18 Jul): hardened rules live — telemetry keyless read returns 200, trip
  reads require auth (401 unauth), legacy rooms frozen read-only. Telemetry counts now accrue.
- **Next**: R2 (generation pipeline — the flagship, wants Opus), or R3/R4/R5 (dynamic runtime,
  per-country visual identity, demand-ranked tools).

---

Three-lens adversarial review of Waypoint (CTO / end-users / efficiency exec),
a prioritized measurable fix list with model assignments, and the roadmap to the
twelve transformation goals. Every specific claim below marked **[verified]** was
checked against the live repo/preview this session; items marked **[assess]** are
judgments, not measurements.

---

## Part 1 — Adversarial review

### Lens 1: CTO reviewing a senior dev's production

**Verdict: this is disciplined, unusually honest engineering — but it is a
craftsman's workshop, not a factory.** The verification doctrine (provenance
stamps, `≈`/`⚠` states, strict mode, the ship loop) is stronger than most
production teams'. The weakness is everything that depends on one expert human
in the loop.

Strengths worth stating plainly [verified this session]:
- Silo architecture with enforced public surfaces; 301 unit tests + 4 Playwright
  suites; per-feature fault isolation; perf budget gate; a11y gate; sw offline;
  secrets handled correctly (public key + referrer restriction, nothing in repo).
- The learnings loop is a real, closed feedback cycle — the Korea post-mortem
  measurably changed the next guide's authoring rules (TRAVELER_PATTERNS.md).

Findings:

1. **[verified] Anonymous-auth Firebase = the room is world-writable in practice.**
   `rules.json` requires `auth != null`, but the client signs in anonymously —
   any internet client can mint an anon token. Room key = the guide slug
   (`southkorea`) — fully guessable. Combined with `"$other": {".validate": true}`
   wildcards at trip level, an outsider can: vandalize/wipe a group's ledger
   mid-trip, plant arbitrary extra fields, or bloat storage (free-tier quota
   drain: 1 GB storage / 10 GB-mo egress). Zero-setup rooms are a deliberate
   product decision (kept), but guessable ids + unbounded shape are not required
   by it.
2. **[verified] Narrow stored-XSS vector via record ids.** `esc()` correctly
   escapes all five metacharacters on string *fields*, but record ids are
   interpolated raw into single-quoted attributes
   (`data-mid='" + m.id + "'`, trip-split.js:181ff). Firebase keys may legally
   contain `'`. A direct REST write with a crafted key executes on every group
   member's device. Narrow, but the payoff (device-local storage of a trusted
   travel app) is high.
3. **[verified] PII in a world-readable room.** Member payment handles
   (Venmo/Zelle/Kakao) live in the room; anyone who guesses the slug reads them.
4. **[verified] No backup / no undo.** A vandalized or fat-fingered room is
   simply gone. Nothing exports RTDB state anywhere.
5. **[verified] One runtime third-party script.** qrcodejs from cdn.jsdelivr.net,
   loaded at share-time. Supply-chain exposure + QR dead offline (graceful
   message exists). Everything else is self-hosted — this is the last holdout.
6. **[verified] Tablist ARIA is incomplete.** Tabs have `role="tab"` but no
   `aria-controls`; panels lost `role="tabpanel"` in the landmark fix and it was
   never re-added per-panel; no roving tabindex / arrow-key navigation (APG
   tablist pattern). Axe passes because axe doesn't require the full pattern.
7. **[verified] No type-checking anywhere.** TS files are esbuild-transpiled by
   vitest and Vite; `astro check`/`tsc` never runs. Type errors ship silently.
8. **[verified] sw cache version is a manual bump.** Three human bumps this
   session alone (v47→v50). One forgotten bump = stale JS for returning users.
   `gen-sw-precache.mjs` already rewrites the file at build; it should own the
   version too (content hash).
9. **[verified] Production errors are invisible.** `fail()` logs to the console
   of the traveler's phone and nowhere else. The MangoPlate-class content bug
   has a detection loop (recert); the code-failure class has none.
10. **[assess] Bus factor 1, and the factory is the human.** The Groq generator
    emits *drafts*; the quality bar is met by hours of skilled verification per
    guide. That's fine for 2 guides; it is the single blocker to "auto-generate
    a refined itinerary" (goal 3).
11. **[verified] esbuild override pins past vite's declared range** (0.28.1 vs
    `^0.27.0`) — correct today, but leave a tripwire to remove it on the next
    astro/vite major (it will silently mask their intended dedupe).

### Lens 2: End users, by persona

**The organizer (power user).** Well served — this is who the product is built
by and for. Gaps: no way to re-verify a stale fact from the page (the ⚠ pill
links the source, but "recheck all stale" is a repo operation, not a UI one).

**The low-tech traveler (Denmark-family type).** Reading density is high;
mono-font data pills and flag glyphs (`≈`, `⚠`) are unexplained in-page
[verified: no legend surface]. The onboarding hint strip appears exactly once —
miss it and gestures/⌘K are undiscoverable. They will never find the command
palette on desktop [assess].

**The shared-link recipient (mid-trip).** Lands on a rich page with zero
framing about what Waypoint is; OG cards help in the chat app, the page itself
doesn't [verified on hub → guide flow: guide pages assume context].

**Mobile vs desktop friction [verified at 375px vs 1280px]:**
- **Mobile:** (a) with 15 tabs, the *active* tab can sit scrolled out of view on
  load — observed live: landed on `$ Budget` with the tab bar showing the middle
  of the strip; (b) masthead spends ~2.5 screens (hero, dek, 6 stat pills,
  jet-lag bar) before content; (c) stat pills are styled exactly like buttons
  but are inert — the repo's own doctrine ("clickability must be obvious") has
  an unstated inverse that this violates: *non*-clickable things must not look
  like buttons; (d) converter popover clamps to a hardcoded 250px width
  assumption.
- **Desktop:** strong. Spine rail, masonry, palette all earn their space. Only
  gap: ⌘K search has no persistent affordance after the one-time hint.

**Accessibility:** landmarks now clean (this session), but the incomplete
tablist pattern (finding 6) means screen-reader users hear "tab" with no
panel relationship, and keyboard users get no arrow-key navigation.

### Lens 3: Efficiency executive

- **Runtime efficiency is genuinely good [verified]:** dist 1.7 MB total; JS
  within a 900 KB budget dominated by *lazy* Firebase chunks (141+124+68 KB —
  only loaded when a live room is opened); fonts self-hosted (~170 KB woff2);
  build 3s; tests ~1s. Korea HTML is 358 KB — the content *is* the product, and
  it's the offline artifact, so this is defensible.
- **The cost center is authoring, not serving [assess].** Server cost ≈ $0
  (Pages + Firebase free tier). A guide costs expert-hours. Every roadmap
  dollar/hour should attack that, not runtime perf.
- **No demand data [verified: no analytics of any kind].** The tab budget is
  enforced by doctrine, not by evidence of what travelers actually open. Goal 6
  (self-learning from tab use) currently has no data source. The feedback survey
  exists but fires post-trip only.
- **Dead schema surface [verified]:** `theme` override, `draft` tier unused —
  small, documented, acceptable.

### Cross-cutting registers

**Logical gaps**
- Trip Split offline: RTDB web SDK keeps offline writes *in memory only* — an
  expense logged in airplane mode is lost if the tab closes before reconnect
  [assess: SDK-documented behavior; the exact traveler scenario — roaming off,
  logging dinner — is the risky path].
- localStorage has normalizers (`records.ts`) but no schema version key; a
  future shape change relies on normalizers catching everything forever.
- Multi-device checklist state is per-device (no sync) while Trip Split is
  shared — an intentional split, but nothing in the UI explains why progress
  doesn't follow the traveler across devices.

**Hidden biases**
- `toLocaleString("en-US"/"en-GB")` hardcoded in formatters [verified] — dates
  and numbers render American/British regardless of reader locale.
- USD is the anchor currency everywhere (party-A pattern generalized).
- Google-services assumption: Directions deep-links and the maps upgrade assume
  Google reachability — breaks in China, degrades where Naver/Kakao/Baidu rule
  (the Korea post-mortem itself noted app-mix reality).
- Photos are Wikimedia-only by policy — verifiable licensing (correct call),
  but it biases coverage toward famous landmarks over the food stalls and
  side-street venues guides actually recommend.
- TRAVELER_PATTERNS rests on one data point per party and says so — honest,
  keep weighting accordingly.

**Hallucination risk & output quality**
- The MangoPlate incident [verified in korea/_guide.json] is the proof case:
  a dead-since-2020 service shipped from training data and survived until
  post-trip recert. Strict provenance now exists for *new* guides; the gap is
  that pre-strict content only gets caught by episodic recerts.
- The Groq (llama) draft generator is the weakest quality link vs goal 3
  [assess]: grounded by Wikivoyage fetch but far below the guide-author skill's
  bar; everything depends on the human pass after it.

**Scalability**
- Content: linear in expert-hours (the real limit). Build/hosting: fine to
  ~100s of guides. Firebase free tier: 100 simultaneous connections — fine for
  a small circle, would fall over for a public product [assess].

---

## Part 2 — Prioritized fix list (measurable, model-assigned)

Execution note: P0 is one session; P1 and P2 are one session each. Every fix
lands with its own test or measurable check, per the ship loop.

### P0 — Security & integrity (session 1) — **Opus designs rules; Sonnet executes**

| # | Fix | Measurable acceptance |
|---|-----|----------------------|
| 1 | **Harden RTDB rules**: enumerate allowed collections (kill `$other:true` at trip level); constrain child-key charset (`$mid.matches(/^-?[A-Za-z0-9_-]{1,40}$/)`); cap string/number fields (mostly present); validate feedback shape | REST write with `'` in a key → rejected; unknown top-level node → rejected; existing app flows all green |
| 2 | **Escape ids in every innerHTML interpolation** (defense-in-depth vs #1) | grep: zero unescaped `+ x +` interpolations inside template strings across `src/features`; unit test renders a hostile id inert |
| 3 | **Unguessable room ids**: per-guide random salt baked at build (committed, stable across rebuilds), room = `slug-SALT` | ≥64-bit entropy; old rooms readable during a migration window; new links carry salted id |
| 4 | **Nightly RTDB backup**: Actions cron → REST export → 30-day artifact | restorable JSON ≤ 24 h old, verified by a restore drill |
| 5 | **Vendor the QR lib** (npm dep, lazy chunk, drop CDN) | zero runtime third-party script origins; QR renders offline in airplane-mode test |
| 6 | **Room-visibility notice** in Trip Split UI ("anyone with this link can see names & payment handles") | visible pre-first-write on every device |

### P1 — Correctness & robustness (session 2) — **Sonnet; Haiku for sweeps**

| # | Fix | Measurable acceptance |
|---|-----|----------------------|
| 7 | **Complete the tablist pattern**: `aria-controls` on tabs, `role="tabpanel"` + `aria-labelledby` per panel, roving tabindex + arrow keys; tighten axe gate to fail on moderate | axe 0 findings at all severities; Playwright arrow-key nav test |
| 8 | **Auto-version sw CACHE** from build content hash in gen-sw-precache.mjs | no manual bumps ever again; hash change ⇔ cache id change (test) |
| 9 | **CI typecheck**: `astro check` gate | CI red on a seeded type error, green on main |
| 10 | **Offline write queue for Trip Split**: localStorage outbox, flush on reconnect | airplane-mode expense survives page reload and syncs (Playwright offline test) |
| 11 | **Error beacon**: `fail()` additionally writes `{guide, feature, message, ua}` to a rate-limited RTDB `errors/` node | a thrown leaf error on a real device appears in the node; no PII |
| 12 | **Locale audit**: drop hardcoded `"en-US"`/`"en-GB"` where display-only | grep zero hardcoded display locales; KRW/DKK formatting spot-checked |

### P2 — UX friction (session 3) — **Sonnet; Haiku for mechanical bits**

| # | Fix | Measurable acceptance |
|---|-----|----------------------|
| 13 | Active tab scrolls into view on load (mobile) | Playwright 375px test: active tab within viewport on deep-link load |
| 14 | Mobile masthead density: pills to ≤2 rows, jet-lag bar folded | content heading visible within 1.5 viewports on 375×812 |
| 15 | De-button inert stat pills (visual grammar: interactive vs static) | doctrine check + visual diff approved |
| 16 | Persistent ⌘K affordance in desktop topbar | present ≥1100px, absent mobile |
| 17 | Converter popover: measure real width, clamp to viewport, focus trap | no clipping at 320px; focus cycles inside popover |
| 18 | Cold-visitor framing: one folded "What is Waypoint?" line on guide pages | visible to first-time visitors, dismissed state persists |

---

## Part 3 — Transformation roadmap (goals 1–12)

Platform stance: **stay on GitHub Pages + Firebase free + GitHub Actions as the
compute layer.** The one genuine server need on this roadmap is on-demand guide
generation — solved without a server by the *issue-ops* pattern (wizard files a
templated GitHub issue → labeled issue triggers an Action → Action researches
and opens a PR). Migrate to Cloudflare Workers only if issue-ops latency ever
actually hurts. Native apps: PWA-first; TWA (Play, $25 once) if wanted;
Capacitor/iOS ($99/yr) not justified for a small circle.

### R0 — Hardening (the Part 2 list) · 2–3 sessions
Goals served: 2, 11 (foundation). Models: Opus (rules/threat design once),
Sonnet (execution), Haiku (sweeps). Exit: every measurable green, deployed.

### R1 — Telemetry & the learning substrate · 1–2 sessions
Goal 6's missing data source. Anonymous counters (tab opens, tool opens, per
guide/day) to an RTDB `telemetry/` node under the hardened rules; weekly
Actions job aggregates to `docs/telemetry/summary.json`; the guide-author skill
reads it next to TRAVELER_PATTERNS. Post-trip survey gains a per-tool "did you
use this?" row. **Models: Sonnet.** Exit: a real per-tab engagement table for
the next trip; tab-budget decisions cite it.

### R2 — Generation pipeline v2 · 3–4 sessions — **the flagship**
Goals 3, 4, 5. Replace the Groq draft path with a Claude-driven research
pipeline, runnable both interactively (Claude Code + guide-author skill — the
quality path today) and headless (Actions + Anthropic API):
intake → demographic/party selection from TRAVELER_PATTERNS → research fan-out
with web search, ledger rows captured as structured JSON → draft guide JSON →
`check-research.mjs` as the *self-correction loop* (failed facts go back for
re-research, not hand-waving) → strict-provenance build → PR with the ledger
attached. **Models: Opus 4.8 orchestrates + synthesizes; Sonnet runs research
fan-out; Haiku formats.** Exit metrics: intake-to-draft-PR in one CI run;
≥90% of perishable facts carrying T0/T1 sources; the rest flagged `⚠` or
omitted (zero bare facts — the linter proves it); human review ≤2 h/guide
(vs. days today). Per-guide API cost estimate $3–10.

### R3 — Dynamic, swift, offline-aware runtime · 1–2 sessions
Goals 1, 2, 11. Astro View Transitions hub⇄guide; connection state machine
(offline banner, live tiles degrade explicitly, queued-writes indicator from
P1-#10); hydration/priority audit. Exit: LCP <1.8 s mobile (lab), CLS <0.05,
INP <200 ms; airplane-mode walkthrough is coherent end-to-end. **Sonnet.**

### R4 — Per-country visual identity engine · 2 sessions
Goals 8, 9, 12. Build-time "country skin": accent palette extracted from the
guide's own hero/sight imagery (node-vibrant at build → CSS custom properties),
typography constant; one signature motion set (View Transitions + scroll-driven
animations, `prefers-reduced-motion` respected) defined in a motion-doctrine
doc the way the tab budget is defined. On goal 9's phrasing, an honesty note:
award-winning sites' code is copyrighted — we study *techniques* via write-ups,
devtools observation, and open-source recreations, and we don't lift code. The
deliverable is a curated motion/technique reference in the design doc.
**Models: Opus writes the identity/motion spec; Sonnet implements.**
Exit: two guides visibly distinct with zero per-guide CSS authored by hand;
motion passes reduced-motion audit.

### R5 — Tool suite by demand · 1–2 sessions
Goal 7. Candidates ranked by R1 telemetry + both post-mortems: entry/visa
checklist with sourced links, weather+activity-aware packing list, offline
phrase cards (extend the show-the-driver pattern), spend report export
(trip-split → CSV/summary), golden-hour photo times. **Build the top 3 only** —
the tab budget doctrine applies to tools too. **Sonnet/Haiku.** Exit: each new
tool's telemetry ≥ the median existing tool within one trip, or it's culled.

### R6 — App-ready distribution · 1 session
Goal 10. PWA manifest/icons/splash hardening, install prompt, iOS meta;
optional TWA for Play. Monetization realism [assess]: a reader app for a small
circle won't clear $99/yr App Store overhead; if this ever monetizes, the asset
is the *generation pipeline* (guide-as-a-service), not the reader. **Haiku/Sonnet.**

### Session strategy under Max 5x
One phase-chunk per session; open with the phase's measurables, close with the
ship loop. Opus only where judgment concentrates (R0 rules design, R2
orchestration, R4 spec); Sonnet is the default executor; Haiku for sweeps,
formatting, icon/asset generation. Batch Playwright locally; don't burn session
turns polling CI.

### Sequencing
R0 → R1 → R2 (flagship) → R3 → R4 → R5 → R6.
R1 before R2 because the generator should be born reading telemetry+patterns;
R3/R4 are independent of R2 and can interleave if a trip deadline appears.

---

## Part 4 — Decisions (resolved 17 Jul 2026)

1. **Room-id migration (P0-#3): salt future guides only.** Existing rooms
   (Korea, Denmark — both concluded trips) freeze read-only: the write rule
   requires the salted key shape, so unsalted legacy rooms reject writes
   automatically while staying readable. No shared links break.
2. **Telemetry consent (R1): footer disclosure**, counters always on, no ids,
   no PII. One-line notice in the guide footer.
3. **Execution starts with P0 immediately** (same session as this review).
4. **This document is committed** — it is the durable plan future sessions
   execute against.
5. Goal 13 in the original prompt was blank — pending user clarification;
   roadmap proceeds on goals 1–12.
