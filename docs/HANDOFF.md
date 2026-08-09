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

## Snapshot (2026-08-09 — the Atlas migration is **DONE**: Stages F and G both closed)

Thirteen commits, one per feature plus the closeout. The headline is not the restyling.

**Six of the twelve features hid a real defect, and every one needed measuring to see.** White
on the dark green at 2.73:1 (learnings). The over-budget verdict at 3.57:1, with a dark palette
behind a bare `prefers-color-scheme` query so the theme TOGGLE never reached it. The
change-request submit button at 1.45–2.30:1 on hover — on every guide, both themes. The About
page's contour ground at 3.84:1 in dark, because overlapping polyline strokes compound. Two
`.pal-hint` rules sharing one class, so the palette footer's border drew across every result
row. And `var(--line)` / `var(--space-*)` reads that nothing declares, which CSS does not error
on: the declaration is simply invalid and falls back, silently.

**Two MOTION.md rule-7 violations went with them.** The reading spine set `style.height` from
the scroll listener; `/progress/` set `style.width` from its poll tick. Both are transforms
driven by a custom property now (`--spine-fill`, `--pg-progress`).

**The recurring finding, worth carrying:** every surface that opens on a GESTURE had never been
scanned by the a11y gate, because axe skips hidden nodes. Share panel, story mode, palette —
and the SOS sheet before them. Four for four. Each got a scoped axe test in its own spec file,
which is the right shape: folding them into the whole-page gate does not work, because a panel
that ships its own scrim makes every other element's background unresolvable.

**Two gates were written this arc and both earned it.** `src/styles/var-defined.test.ts` fails
any `var()` nothing declares — it found the `--space-*` reads immediately, then caught Stage G's
own token deletion breaking the preview pages. `atlas-tokens.test.ts` gained the `--on-green`
contract, including an assertion that plain `#fff` would fail.

**Stage G deleted the `--r-*` ladder** rather than deprecating it — nine stylesheets and
twenty-six sites the feature stage never touched, including `guide.css`'s own `.card`.
Containers to 0, controls to 999px. `src/styles/progress-preview/` keeps the ladder, declared
locally: those are unshipped design studies drawn in the pre-Atlas language.

Also closed: DESIGN.md reconciled against what `check-drift` actually enforces; the masthead's
`view-transition-name:accent-<slug>` removed (its partner was the retired hub card, so it was
animating alone); MOTION.md rule 7 and ARCHITECTURE.md updated; `npm audit` 0.

**Then a three-agent code review over the whole arc found the worst defect of the session**,
and it predated the arc: the **What's-Next banner was shipping at 1.09:1** — near-white ink on
near-white ground. `guide.css` declared it as an accent fill with `color:var(--bg)`;
`overview.css`, imported after, replaced the fill with a tint and had no `.wn-text` rule. The
banner only unhides inside the trip's own date range, so it was unreadable exactly while
someone was travelling. Also found: `#fff` on the extracted accent (3.69:1, denmark only); a
search collapse that left visible-but-untappable results; a ping sheet that trailed the thumb;
and the Panel hint sitting INSIDE its heading, so every hinted panel announced the whole
tooltip paragraph as its name. Four tests passed for the wrong reason and are repaired, each
verified by reverting the source and watching it fail.

`src/styles/on-fill.test.ts` is the new gate: ink on a token-driven fill may never be a
literal. Third instance of that one mistake, so it got a gate rather than a third patch.

Gates on every commit: build · lint 0 · typecheck 0 · 1610 unit · 170 Playwright · zero
`src/content/guides/` diff. All CI green.

## Open items

- **A visual call for the creator.** SPEC-COMPONENTS rule 1 ("999px on anything you press")
  decided two ambiguous cases the kit's screenshots could not settle, because its mobile frames
  render empty: the mobile bottom-bar slots and the day chips are **full pills** now. Look at
  them on a phone; if the kit meant rounded tiles, this is the one place to correct.
- **Hub visual fidelity — still open.** Deferred twice now. The creator flagged gaps nobody has
  catalogued; issue #46 (globe pin auto-zoom + cover-hero popup) is filed for Claude Design and
  is not this assistant's to build.
- **Airports for Sedona/Japan** — record them WHEN flights get booked. No fact yet; don't invent.
- Tools, `/about/` and `/new/` are not in the SW precache shell. Cover overlay does not trap
  focus. LOCAL branch `worktree-agent-a7dc7eeb397c6a368` (`5917f8f`) — keep or lose.
- Cloudflare dashboard Git integration still failing 0s builds on every push.
- Korea 03: critic flagged a swapped 명동 label on the Gyeongbokgung map point → file its issue.
- No guide uses a direct royalty-free `sights[].img.src` yet — capability live, unexercised.

## Where we left off

**The Atlas migration is complete.** Stages A through G are all closed in
`docs/PLAN_ATLAS_MIGRATION.md`'s ledger; that plan is now history rather than a work order.

**Nothing is blocked on the creator**, but one thing wants their eyes: the bottom-bar slots and
day chips became full pills under the spec's own rule, and only they can say whether that reads
right on the phone they actually use.

The reviewed arc is closed: three agents over `71bb29b..HEAD`, every finding fixed.

**Recommended next step:** the hub visual-fidelity pass, which is now the oldest open item —
open by asking what looks wrong, and in parallel diff the running build against
`docs/design-handoff/enforcement/screenshots/`. After that the backlog is ordinary product work
again rather than migration work.

**Re-prompt the creator with:** "The Atlas migration is done — all twelve features redesigned
and the closeout landed. The interesting part wasn't the restyling: six of the twelve were
hiding real bugs, mostly text that measured under the contrast floor in one theme only, plus two
things animating layout on every scroll frame. Everything that opens on a gesture — share, story
mode, the palette, SOS — turned out to have never been accessibility-scanned at all, and now is.
One thing for you to eyeball: the mobile bottom-bar slots are full pills now. Next up is the hub
visual pass you flagged twice."
