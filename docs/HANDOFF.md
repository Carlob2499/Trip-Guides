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

## Snapshot (updated 2026-07-24, session close)

**Astro 6.4.8 → 7.1.3 shipped, and a brand-token unification is half-done.** `astro check`
286 hints → **10** (all deliberate, documented in code) · `npm audit --omit=dev` 4 high → **0** ·
build 4.93s → **1.41s** · **822 tests green**. Commits `2a014c2`, `6f45301`, `b8feaea`, `1e4dd32`,
`0403f3d`, `4059c29`.

**⚠ `main` is RED on the Accessibility gate, deliberately. 78 real contrast violations remain.**
Green would be a lie; see "left to do".

- **The a11y gate had been passing vacuously for months.** It freezes the clock, which stops
  `reveal.js`'s 4s un-hide timer, so axe scanned a page at `opacity:0` and found nothing. Fixed
  (`emulateMedia({reducedMotion:'reduce'})` + `assertContentVisible`). Proof it was never
  version-specific: the repaired gate also fails against the **pre-upgrade Astro 6 build**.
- **`--accent2` meant two different colours.** Hub = palette secondary (`#73572b`), guide =
  `darken(accent,.14)` (`#906c35`). Now one shared derivation in `src/lib/accent-tokens.ts`;
  `--accent` = identity (fills/borders), `--accent-ink` = text with a **≥4.5:1 contract** derived
  by `readableOn()`. Direction comes from the surface, so it lightens on dark grounds.
- Two bugs found by measuring, not reasoning: **dark mode never mapped the accents at all**
  (Korea shipped 110 links at 2.20:1), and **inline styles shadowed the fix** — emitting the
  resolved `--accent-ink` on `<html>` outranks the stylesheet, so inline now carries only the
  `-light`/`-dark` candidates and base.css resolves. Both pinned by tests.
- Astro 7 whitespace: 3 real blockers fixed with `{" "}` **before** upgrading (one above the fold
  on the homepage). Settled empirically — **only NEWLINE whitespace is stripped; same-line spaces
  survive**. Guide prose was never exposed (all `set:html`, never compiled).
- Also fixed: Worker `AUTO_CAP=0` rejected every submission instead of queueing; `/health`
  advertised the deleted `visual.yml`.

**Font research is DONE — the verdict is KEEP Bricolage / Literata / Spline.** Two independent
passes measured 14 Google Fonts candidates from the shipped `.woff2` binaries; no swap survived.
Three "use it better" fixes are diagnosed but **not applied**:
1. **Literata's italic has never been loaded** — 103 `<i>`/`<em>` + 11 CSS rules render as faked
   obliques. `import "@fontsource-variable/literata/wght-italic.css"`, ~54KB.
2. **`font-optical-sizing` at `guide.css:43` is dead** (loaded build has no `opsz` axis). Must fix
   **all four** import sites together, and re-judge that line's `letter-spacing:-.02em`.
3. **Korean falls back to Malgun Gothic** — proven via Chrome's font resolver; a Windows-only
   *sans* mid-sentence inside the *serif* body. 1,108 Hangul chars across 8 Korea files. Fix is a
   CJK system stack appended to `--font-body`/`--font-data`: zero bytes. (Two research agents got
   this wrong — a naive `grep -P` for the Hangul range returns 0 here. Verify with node.)

**Verification gotchas that cost real time — reuse these:** `file://` screenshots of this site are
worthless (absolute `/Trip-Guides/` hrefs mean CSS never loads — shoot over HTTP). Any pixel
compare MUST block the public internet, or live GitHub badges and the FX chip look like
regressions. And `document.fonts.check()` lies about coverage — use CDP
`CSS.getPlatformFontsForNode`.

## Left to do (ranked; creator approved all of it)

1. **The remaining 78 contrast nodes**, now clustered: decorative `.day-num` watermarks (1.48:1),
   white-on-accent fills (3.68:1), and a hardcoded `#2e2f2d` surface bypassing tokens.
2. **Wire the expanded a11y scan into `tests/visual/a11y.spec.ts`** — dark mode + all tab panels
   (`[role=tabpanel]{display:block!important}`) + treat `results.incomplete` as unproven. CI still
   only sees light mode and 1 panel of 13–16. Scratch runner: `test-results/axe2.mjs`, `axe3.mjs`.
3. **The three font fixes** above.
4. **Type scale — creator chose FULL unification, not started.** 72 unique font-sizes (35 used
   once, 28 crammed below 1rem at 0.26px steps) and an **undeclared 4th role**: the uppercase
   tracked micro-label, 69 rules, 13 sizes, 12 tracking values, **two typefaces doing the identical
   job at the identical size**. Declare it in base.css with one spec and migrate.
5. **Mobile measure** — 30 chars/line (desktop 62; ideal 45–75) from two stacked gutters
   (`div.shell` + `div.card` = 80px of 375px) plus `line-height:1.75`. Content is NOT the problem
   (89% of Korea's 326 blocks are ≤60 words).
6. **Font specimen** the creator asked for: render real guide text in the rejected alternatives so
   they can judge the KEEP verdict with their own eyes.
7. Impeccable's mechanical detector has **not** been run yet:
   `node ~/.claude/skills/impeccable/scripts/detect.mjs --json <changed targets>`.

## Owner tasks (unchanged, still outstanding)

1. **Revoke** the old GROQ key at the Groq console (out of `.env`, not revoked).
2. **W5 label-free test — approved but NEVER RUN.** `GH_TOKEN` is on the Worker; the plan was to
   disable `New guide scaffold`, POST a real payload, confirm the issue files, delete it, re-enable.
   The permission classifier blocks the workflow toggle, so the creator must flip it.
3. **W2:** mint a read-only Firebase RTDB service account → repo secret `FIREBASE_SERVICE_ACCOUNT`.
4. Delete merged remote branch `claude/test-coverage-analysis-siftjs` (sandbox 403s on ref deletion).
5. Untracked `docs/MONETIZATION_FEASIBILITY.md` + `docs/USER_RESEARCH_PLAN.md` still on disk —
   monetization is off the table, so these are deletable on the creator's word.
6. Commit `eae5573`'s subject line is a literal `@` (PowerShell here-string leaked into Bash); the
   body is intact. The Fact-Forcing Gate blocks `--amend`, so repairing it needs the guard off.

**W6 (real end-to-end pipeline proof) stays deferred, gated on an actual trip** — creator's choice.
Prior W0–W5 arc (token canary, pre-trip auto-recert, LEARN loop, IMPROVE loop, PDF intake,
zero-click Worker) is complete and live; detail in `docs/PIPELINE.md` and the git log.

## Where we left off

The session went in through `/orch-refine-code` ("no warnings, no errors"), which surfaced the
Astro 7 upgrade, then `/impeccable` for brand unification. The through-line: **three separate
gates were reporting success while measuring nothing** — the a11y gate scanning an invisible page,
the contrast gate checking a token that isn't the one painted as text, and a build gate whose
`theme` input no shipping guide actually sets. Each was fixed by giving the check a contract it
can fail, not by adding more tests.

The accent work is the half-finished piece: the token system is unified and correct, but 78
violations remain and the expanded scan lives in scratch scripts rather than CI. Everything needed
to finish is in "Left to do" — the diagnosis is done, the fixes are mechanical.

**Re-prompt the creator with:** "Astro 7 is live, the accent tokens are unified behind a real
contrast contract, and 465 of 543 contrast failures are fixed. Two things you should know: your
accessibility gate had been passing for months while auditing an invisible page — that's fixed,
and it's why `main` is deliberately red with 78 real violations still to clear. And the font
research came back **keep all three faces**, but Literata's italic has never been loaded, so 103
italics in your guides have been rendering as fakes. Next up is finishing those 78, wiring the
expanded scan into CI, the three font fixes, and the type scale you asked for. Where would you
like to start?"
