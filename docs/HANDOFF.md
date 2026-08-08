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
  grep `dist/` → commit → push to `main` (the only branch — `verify-live` guards every deploy).
  Lint and typecheck are not optional: CI runs all three and session #20 pushed red twice by
  treating build+test as the whole gate.
- North stars: `docs/PIPELINE.md` (generation/maintenance) · `docs/MOTION.md`
  (presentation/motion) · `docs/GUIDE_RUBRIC.md` (quality bar) ·
  `docs/COMPETITIVE_LANDSCAPE.md` (market parity reference) ·
  **`docs/PLAN_ATLAS_MIGRATION.md`** (the current work order — its own Progress ledger is the
  source of truth for which stage is next; read that before re-deriving status from git log).

## Snapshot (2026-08-08 — Atlas migration **Stage E COMPLETE**; the Tools screen is live)

Three things closed this session, all green and live.

**The bottom-bar A/B is resolved (`538ca6c`).** The creator compared both on a phone and chose
the design-handoff README's FOUR slots — [group][group][ALL][TOOLS]. The `?bar=` switch and the
five-slot variant are deleted. Today's jump moved into the Groups sheet's tool row (same
handler, now with preventDefault so the `<a href="#">` can't fight its own scrollIntoView); the
map was already reachable there as a section link, so `navMapCat`/`navMapSec` went with their
only consumer.

**Japan's holidays, and a source-hierarchy catch (`1661727`).** Japan had shipped a `holidays`
section with NO `JP-2026.json` behind it — the block rendered empty and nobody noticed. Running
the fetch script filled it; spot-checking against 内閣府's syukujitsu.csv showed the aggregator
is measurably wrong for 2026: Nager.Date returns 16 rows to the Cabinet Office's 18, drops
憲法記念日 (May 3) while putting that name on the May 6 substitute, and omits the Sep 22 bridge
day. The committed file is hand-written from the CSV with `source_url` + `verified_on` per row;
`PINNED` in `scripts/fetch-holidays.mjs` stops CI replacing it (verified: a rerun logs the skip,
zero diff). `HolidayInfo` gained a `source` derived from the rows, so the credit line no longer
hard-codes "Nager.Date" — Japan reads www8.cao.go.jp, the other three still read Nager.Date.
Both PIPELINE_PATTERNS.md rows written.

**Stage E — the standalone Tools screen (`d1eb7a0` + `345451b`).** `/tools/` and
`/tools/<slug>/`, five tools, a trip picker, all four README entry points wired and each one
walked by a test. The creator's answer to this stage's opening question was BOTH: the screen
ships and the guides keep their own tools tabs. The README's `ensureGuide(slug)` guard is a
build-time fact here — one rendered page per trip, the picker is four `<a>`s, and it works with
JS off. New silo `src/features/trip-tools/` (reminders · closures · route order, 30 tests);
`src/pages/tools/_data.ts` composes one record per trip so both routes cannot disagree.

**Creator ruling, binding (2026-08-08):** Trip Split records what was ACTUALLY spent, is
unrelated to the budget a guide researched, and **nothing duplicates** — no seeding of any kind,
not even into an empty ledger. The screen mounts the guide's OWN calculator on the guide's OWN
storeKey. This supersedes D16. Two tests hold the line.

Two overflow bugs were caught by the a11y gate rather than by eye — they surfaced as
unresolvable contrast, not visible clipping: the jetlag `<select>`'s option labels set an
intrinsic minimum width that overflowed its panel by 66px, and reminder text with an unbreakable
run overflowed its row at 375px. The decorative contour layer was dropped from this screen for
the same class of reason. Korea's 140 checklist items made a 12,800px panel; the 42 with a
closing door are the panel now, the rest sit behind a `<details>`.

CI's coverage gate then caught what local `npm test` does not run: `src/lib/**` needs 95%
function coverage and the Tools loader cannot be unit-tested at all (it needs `astro:content`).
Moved to `src/pages/tools/_data.ts` — wrong shelf, not a missing test.

Gates on all three commits: build · lint · typecheck 0 · 1593 unit · 119 Playwright · coverage
green · check-drift clean on tools.css · zero `src/content/guides/` diff. All CI green, deploy
confirmed live (`/tools/japan/` smoked on the deployed site).

## Open items

- **Hub visual fidelity — OPEN, and now NEXT.** The flip shipped with gaps the creator can
  see and this assistant has not enumerated. The creator chose (2026-08-08) to do it after
  Stage E, so it is due. `docs/design-handoff/enforcement/` + CLAUDE.md's "Design Fidelity"
  section carry the authority order and the kit's known false positives; compare the running
  build against the actual screenshots, not just the prose spec.
- **Airports for Sedona/Japan** — record them WHEN flights get booked (creator expects the NYC
  area). Until then there is no fact; do not invent or re-ask.
- The Tools pages are NOT in the SW precache shell — nor are `/about/`//`new/`: a Stage G call.
- Cover overlay does not trap focus: with the cover open, Tab moves into the page behind it
  (found 2026-08-08 while probing the skip link; the cover still dismisses on any key, so it
  is a papercut, not a trap). Worth a focus-trap pass whenever the cover is next touched.
- LOCAL branch `worktree-agent-a7dc7eeb397c6a368` (progress-study, `5917f8f`, exists nowhere
  else) — keep or lose.
- Cloudflare dashboard Git integration still failing 0s builds on every push — consider disabling.
- Korea 03: critic flagged a swapped 명동 label on the Gyeongbokgung map point → file its issue.
- No guide uses a direct royalty-free `sights[].img.src` yet — capability live, unexercised.

## Where we left off

**This session:** the bottom-bar A/B resolved to the four-slot spec bar, Japan's holidays were
sourced from the Cabinet Office (and the aggregator caught being wrong), and **Stage E shipped
the standalone Tools screen**. All gates green, deploy live.

**Nothing is blocked on the creator.** Every question this session raised was put and answered:
four-slot bar wins · build the Tools screen AND keep the guide tabs · hub fidelity after E ·
trip split is real spend only, no seeding, no duplication.

**Recommended next step:** the creator's own ordering says **the hub visual-fidelity pass** now
— it was deferred until after Stage E and Stage E is done. It needs the creator in the loop:
they can see gaps nobody has catalogued, so open by asking what looks wrong, and in parallel
run `check-drift.mjs` and diff the running build against
`docs/design-handoff/enforcement/screenshots/`. After that: **Stage F** (the twelve features,
one per pass, visibility-first — SOS sheet first), then **G** (closeout).

**Re-prompt the creator with:** "Stage E is done — there's now a real Tools screen at
/tools/ that works across all four trips (split, jetlag, closures, reminders, route order),
reachable from the hub, the table, the mobile menu and any guide; your guides kept their own
tools tabs too. The four-slot bottom bar is now the only one. Japan's holidays turned out to
be missing entirely AND wrong in the source we'd been using — fixed from the Japanese
government's own list. Next up is the hub visual pass you flagged: tell me what looks off, or
just point at a screen and I'll compare it against the design kit myself."
