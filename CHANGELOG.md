# Waypoint — Changelog

The structural story of this project: what changed, and **why**. Not every commit — the
shifts that changed how the thing is built. Newest first.

Waypoint is a static Astro site of *verified, personalized* travel guides, deployed to GitHub
Pages under `/Trip-Guides`. A guide is only done when it's **Verified · Personal · Actionable
· Honest** (see `CLAUDE.md`).

---

## 2026-07-16 — The Learnings loop
*Guides were the ideal plan. Now they can admit what really happened.*

Real trips diverge from the plan, and nothing was capturing that. Added the
`src/features/learnings/` silo, shipped in four inert layers:

- **P1 — capture.** A **Trip Feedback** pill at the foot of each itinerary opens a 3-step
  survey (ratings · plan-vs-actual stops · freeform) writing anonymously to Firebase
  (`trips/<storeKey>/feedback`). Stops are read live from the itinerary DOM using the same
  keys as the on-trip check-offs.
- **P2 — the Learnings tab.** A `#tripLearn` panel showing the live objective aggregate
  (X/Y stops done + skips with reasons). Hidden until there is reality to show.
- **P3 — the curated post-mortem.** An optional `learnings` block in the guide schema plus a
  per-day **Plan ⇄ Actual** toggle, so a day can show what was planned *or* what happened.
- **P4 — the loop.** `docs/TRAVELER_PATTERNS.md` (how this group actually travels) and
  `learnings/<slug>.md` (private synthesis) now feed the `waypoint-guide-author` skill, so
  each trip makes the *next* guide better.

**Rules that keep it honest:** raw `freeform` critiques are never rendered and never pasted
verbatim — only summarized into patterns. Patterns carry provenance tags
(`[stated]`/`[observed]`/`[reported]`/`[hypothesis]`) so a hunch can't be planned around as
fact. And nothing renders until there's real feedback or an authored post-mortem — an honest
blank is the feature, never a fabricated learning.

Also fixed here: `collection().add()` fired its write without awaiting it, so the survey said
*"Thanks — logged"* even when the write hadn't reached the server. Added an additive
`addAsync()` (settles on server ack) and the survey now distinguishes *logged* from
*queued/still syncing* rather than claiming a success it can't prove.

## 2026-07-16 — Convergence merged
*Three repos' worth of lessons folded into one.*

Merged the long-running convergence branch (learnings from WayPoint-V2 + WayFinder) into the
live `main`, reconciled against content that had shipped during the trip:

- **8 sealed feature silos** — `src/features/<name>/` with a single `index` public API,
  `model/` (pure + tested), `ui/`, `mocks/`. No feature deep-imports another.
- **Guides split into per-section files** — `src/content/guides/<slug>/` (`_guide.json` +
  `NN-<group>.json`). The monolithic `korea.json` and its `*.index.md` sidecar are **retired**;
  a targeted edit now opens one small file instead of a 2,500-line JSON.
- **Quality gates** — dual-ground (light *and* dark) contrast gate in the schema, additive
  `source_url`/`verified_on` provenance, staleness warnings, and PR-only CI: Playwright visual
  regression, axe a11y, Lighthouse.
- View Transitions, route ribbon, destination-timezone "today".

## 2026-07-08…15 — Korea, live
*The first trip the site ran during, not just before.*

The Korea guide was edited **while the trip happened** — a solo Tokyo side-trip carved out of
the group itinerary and budget mid-trip, and Monday's Busan day rebuilt around new KTX times.
This is where the Learnings loop came from: the plan visibly moved, and nothing recorded why.

Also caught here, and the reason the verification rules exist: a celebration venue was written
as hanwoo *beef* when it's an aged-**pork** specialist. A Korean primary source caught it
before it shipped.

## 2026-07-09 — Live group sync (Firebase)
*One budget, shared, with no setup.*

Added the config-gated, lazily-imported `src/features/firebase/` silo (anonymous auth +
Realtime Database). **Trip Split** became a zero-setup shared room: everyone viewing a guide
edits **one** budget automatically — no codes, no buttons, no accounts. Every mutation writes a
record, so simultaneous edits merge instead of clobbering. With no config committed, the whole
path tree-shakes away and the calculator stays a private offline tool.

Fixed a service-worker bug that had poisoned real devices: transient 404s were being cached.
Cache writes are now guarded on `res.ok` — do not remove those guards.

## 2026-07-05…07 — Design identity + the itinerary as a tool
Rebuilt the visual identity (new type system + country-derived palettes), then reshaped the
itinerary from a document into something usable in the field: a responsive day-card deck, day
rail, stop check-offs, SOS sheet, print day-sheets, offline support. Removed Leaflet and other
weight along the way — several phases were pure subtraction.

## 2026-07-04…05 — The authoring pipeline + the skill
Formalized how guides get made: a structured intake → scaffold or a grounded draft →
**research pass** → verification. The `waypoint-guide-author` skill became the operational home
of the content standards (the 4-question venue rule, `≈`/`⚠` flags, verification stamps,
Commons photo validation), so the rules live in one place instead of drifting across docs.

Tooling: Commons image search, Nominatim place lookup, Wikivoyage fetch, holiday data, and a
research linter — because a script that can verify a fact should never be guessed at.

## 2026-06-05…07-03 — Foundations
Static HTML → **Astro** with typed content collections: guides became **data** (zod-validated
JSON) rendered by shared components, not hand-written pages. This is the decision everything
else rests on — a change to a component improves every guide at once, and only the JSON is
per-country.

---

## Conventions worth knowing

- **Ship loop:** `npm run build` (zero schema errors) → `npm test` → verify in `astro preview`
  on **:4322** (never `astro dev` — OneDrive serves stale CSS) at 375px + desktop, dark,
  reduced-motion → grep `dist/` → push → confirm live.
- **Service worker:** bump `CACHE` in `public/sw.js` on any shipped JS/CSS behavior change.
- **Shared components are global; only JSON is per-country.** A component change hits every
  guide — that's the point.
- **New self-contained behavior gets its own silo**, reached only through its `index`.
