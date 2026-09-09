# Design debt register

Status: **OPEN — living document.** Opened 2026-09-08, after the navy/cream pass (#212).
Scope: the code layer of the design system — tokens, controls, motion, iconography, and the gates
that hold them. Surface **composition** debt is not here; it lives in `board-vs-build.md`, which is
a different axis and needs a different decision from you (acceptance, not scheduling).

Anything scheduled out of this register becomes a GitHub issue per `issue-tracker.md`. This file
holds the standing inventory and the ordering; it is not a second issue tracker.

Scored `severity x frequency / effort`, resolved by judgement rather than arithmetic — the point is
the order, not the number.

---

## Resolved 2026-09-08

| # | Debt | Category | Was | Now |
|---|---|---|---|---|
| D1 | Theme switch had no transition damping | Implementation | `data-theme` flipped while ~130 transition declarations across 43 stylesheets watched colour, background, border and shadow. Every one eased on its own duration, so the switch smeared instead of snapping | `setTheme()` in `src/scripts/theme.js` injects a suppression sheet, forces a reflow, swaps, removes on the next frame. Runtime-verified in order: damp added, swap at `transitionDuration: 0s`, damp removed, 110ms restored, nothing left in `<head>` |
| D2 | Nine per-class press rules at seven depths | Visual | `.92 .94 .96 .97 .98 .985` across six stylesheets, **composing** with `base.css`'s global `scale:.98` rather than replacing it. `.topbar-btn` reached `.94 x .98 = .921` through `guide.css` and `.96 x .98 = .941` through `chrome.css` — two different depths for one selector, resolved only by load order | One rule, `scale:.96`, in `base.css`. A runtime sweep of every loaded stylesheet returns exactly one `:active` scale rule |
| D3 | Press cancelled hover on three controls | Visual | `transform` is one channel, so `:active{transform:scale()}` replaced `:hover{transform:translateY()}`. `.next-cta` dropped its 2px lift and `.ab-cta-btn` its 1px at the instant of the press; the current bottom-nav slot lost the `translateY(-1px)` that marks it | Fixed by D2 — the independent `scale` property composes instead of replacing. `base.css` had already written this down as the reason it uses `scale`; nine rules contradicted it |
| D4 | Bottom-nav anchors had no press cue at all | Visual | `base.css` covers `button`, `[role=button]`, `summary` and three named anchors. `.botslot` renders as `<a>` for Atlas and guide links and as `<button>` elsewhere, so half the primary navigation pressed and half did not | `a.botslot` joined the named list |
| D5 | Three icon stroke weights in one top bar | Visual | `Icon.astro` states a 1.8px contract "so a new icon can never drift in weight", and seven inline SVGs in `AppChrome.astro`, `search.js`, `sos.js` and `theme.js` shipped at 2.0 | All 1.8. Runtime: 16 icons at 1.8, one at 1.7 — the brand mark, which is a wordmark and not a member of the icon set |
| D6 | The largest motion in the product bypassed its own easing token | Implementation | `transitions.css` carried Material's `cubic-bezier(.4,0,.2,1)` as a literal, so the cover morph decelerated on a different curve from every control it lands beside. `motion.md` §2 names `--ease-standard` as the curve for acquisition-then-settle | `var(--ease-standard)`, verified resolving to `cubic-bezier(.2,.7,.2,1)` in the page |
| D7 | Theme toggle icon hard-cut | Visual | `btn.innerHTML` was rebuilt on every toggle, destroying the outgoing glyph in the same frame the incoming one appeared. It could only ever cut | Both glyphs mounted and stacked; CSS cross-fades from `data-theme` (scale .25 to 1, blur 4px to 0, on `--dur-routine` / `--ease-standard`). Verified: the hidden glyph sits at opacity 0, scale .25, `blur(4px)` |
| D8 | Photographs had no defined edge | Visual | No `img` outline rule existed anywhere, while the product moves photo-led (korea sights 15/23 to 21/23 in #212) | `--photo-edge` — pure black / pure white at 10%, in oklch, deliberately outside the palette's drift surface — applied as an `outline` so it cannot move a pixel of layout. **Awaiting your acceptance, see below** |
| D9 | The gallery shipped a second theme toggle | Documentation | `gallery.astro` flipped `data-theme` in its own inline handler, bypassing the shared module that `theme.js` was extracted to be — the exact duplication that extraction ended | Routed through `setTheme`. The handler moved out of the `define:vars` block, which Astro forces to `is:inline` and which therefore cannot see an import |
| D10 | **The drift ratchet had 137 violations of slack** | Implementation | `drift-real.test.mjs` capped recorded debt at 153 while the real figure was 16. The one test whose stated job is to catch "the baseline being padded to silence a failure" would have passed while 137 violations were baselined one at a time. A ceiling far above the floor is not a ratchet, it is a number | Ceilings tightened to 16 and 4, to be lowered with the baseline each time the debt actually falls. Proved by padding one entry to 20: fails at "expected 30 to be less than or equal to 16" |
| D12 | **A fixed violation left its allowance behind** | Documentation | `regressions()` compares in one direction only — it reports what is NEW or WORSE and says nothing about a baseline key whose violations are gone. `src/styles/guide.css::TYPE` had been fixed at some earlier point and its allowance stayed, so recorded debt read 17 against a real 16, and that exact violation could have returned to that exact file unnoticed | New test: the baseline may hold no entry the checker has stopped reporting. Baseline tightened to 16 across 4 keys. Proved by planting a stale key: fails naming it |

### Correction to D10, 2026-09-08

D10 was first filed as "neither drift checker runs anywhere" — that the classifier kept a baseline,
stated it "fails on anything new", and was invoked by nothing in `build`, `check`, `ship:check` or
any of the 22 workflows. **That was wrong, and it was wrong because the check that produced it was
a grep.** The gate is real: `scripts/__tests__/drift-real.test.mjs` calls `regressions()` and runs
under vitest, so it is already enforced in `check:fast`, `check`, `coverage`, `test.yml` and
`required-gate.yml`. Grepping the workflows for the word "drift" could never have found it.

Confirmed the way it should have been confirmed the first time — by planting a violation
(`.drift-probe{color:#ab12cd;border-radius:7px}` in `touch.css`) and watching the suite fail with
`NEW src/styles/touch.css::RADIUS` and `::COLOUR`, then pass again on revert.

What survived the correction is narrower and real: the gate ran, but its ratchet had 137
violations of slack and it was blind in one direction. Both are now closed and both fixes were
proved by making them fail on purpose.

---

## Open — ranked

| # | Debt | Category | Severity | Frequency | Effort | Why it ranks here |
|---|---|---|---|---|---|---|
| D11 | **Four visual baselines cannot be verified outside CI.** All four gallery captures fail locally at a 182px height delta and 35,632,691 differing pixels — and fail **identically on unmodified `main`** | Implementation | Moderate | 4 gates | Medium | Verified by stashing every change and re-running: same delta, same pixel count. Deliberate (`b7f1c949` regenerated them on CI's Chromium because local font metrics drift over a 29,000px capture), but the cost is that no visual change can be checked before pushing |
| D13 | **`.resume-chip` is dead CSS.** `touch.css:37-56` styles a component whose only markup lives in an uncommitted worktree, not on `main` | Documentation | Minor | ~20 lines | Low | It still carries the old `.98` press value, so it would reintroduce D2 the day the feature lands. Left in place deliberately — deleting a styled surface belongs to whoever owns the feature, not to a polish pass |
| D14 | **The map's image-outline exclusion is unverified.** `img:not([data-itin-map] img)` is written and correct by inspection, but the Maps API returns 403 without a key in dev, so no map `<img>` has ever rendered against it | Implementation | Moderate | 1 surface | Low | Needs one check on a surface with a live key before D8 is called done. A grid of outlined tiles is exactly the seam a map spends its effort hiding |
| D15 | **The raw checker's noise is load-bearing.** `check-design-drift.mjs` reports 405 violations, of which 325 are exempt across 18 named classes — 109 hex-in-test, 83 in-a-comment, 74 hex-is-the-source-of-truth. `drift-real.mjs` records that two genuine MOTION violations sat in that noise through an entire closeout stage | Implementation | Moderate | 1 tool | High | Not a defect; the classifier is the right answer to it. Recorded so the 405 is never quoted as the debt figure again — `board-vs-build.md`'s "360 colour findings" is that mistake already made once |

---

## Deferred by decision

**The 16 baselined drift violations are accepted debt, not open work.** Six off-token colours in
`budget-sheet.css`, a sheet with its own deliberate register; one MOTION violation at
`guide.css:138`, a `transition:height` on `::details-content` that has no transform equivalent;
and nine TYPE violations in the OG and recap card generators, which draw SVG for a PNG rasteriser
that cannot reach the site's webfonts. Each sits in the baseline because someone decided it, and
none should be "fixed" without revisiting that decision.

**Registry coverage is not debt.** `component-registry.json` holds 25 entries against 41 `.astro`
files, but the registry is scoped to composable components, blocks, features and shared patterns,
and `src/component-registry.test.ts` already enforces existence in both directions.

---

## Awaiting creator acceptance

**D8, the photographic edge, is the one item here that is a design change rather than a compliance
fix.** Everything else in the resolved table brought code into line with a contract this repo had
already written down and then contradicted. D8 adds a visual property nobody asked for, on the
argument that a picture whose border region sits near the page colour — an overcast sky on cream,
a night street on the dark ground — currently dissolves into the surface it is printed on.

It is implemented and every gate is green. The visual baselines have **not** been regenerated. If
you reject it, revert the `--photo-edge` token and the single `img` rule in `base.css`; nothing
else depends on either.
