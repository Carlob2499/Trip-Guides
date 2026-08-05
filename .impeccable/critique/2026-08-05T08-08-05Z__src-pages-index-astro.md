---
target: the new hub
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
timestamp: 2026-08-05T08-08-05Z
slug: src-pages-index-astro
---
Method: dual-agent (A: design review · B: detector + browser evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | Chips carry no `aria-pressed`; no live region announces result counts |
| 2 | Match System / Real World | 3 | Chips say continent; empty state says "pick another country" |
| 3 | User Control and Freedom | 2 | Auto-glide moves the page 2.8s after load, right after inviting the user to scroll |
| 4 | Consistency and Standards | 3 | Hero uses full-bleed photography, DESIGN.md's named anti-reference; `.hub-foot` uses `--ink` where the system uses hairlines |
| 5 | Error Prevention | 3 | Little to get wrong; filter + search compose safely |
| 6 | Recognition Rather Than Recall | 3 | With both search and chip active, only the chip shows state |
| 7 | Flexibility and Efficiency | 3 | Skip-link, upcoming-first sort, compact returning state; no sort control, no search hotkey |
| 8 | Aesthetic and Minimalist Design | 4 | Genuinely excellent restraint; accent spent sparingly, no ornament that isn't load-bearing |
| 9 | Error Recovery | 1 | Empty state is a bare italic `<p>` with no control and the wrong noun |
| 10 | Help and Documentation | 3 | "How it's made" is the right single door |
| **Total** | | **27/40** | Good, with two soft spots |

## Design Specificity Verdict — 8/10 authored

Almost nothing here survives a copy-paste into another product: build-counted stats, seeded contour fields, the Painted Atlas keyed to destination-local hour, survey-paper ground, Literata's optical-size axis. DESIGN.md's "measured, not described" is legible without being told.

The exception is `.hub-hero` — full-bleed photo + bottom scrim + eyebrow/title/pill stack is the most reproduced hero pattern of the decade, and DESIGN.md names full-bleed aspirational photography as an explicit anti-reference. R3 fixed the hero's *information architecture* without re-asking whether its *visual language* belongs.

Deterministic scan: source file clean (exit 0). Built page: 16 `design-system-color` (all painted-atlas sky/orb ramps — false positives, one intentional illustration palette), 2 `em-dash-overuse` (counted source comments — false positive), 1 `dark-glow` at `src/styles/painted-atlas.css:49`, confirmed live in the DOM. Zero console errors, zero failed requests, no horizontal scroll at 375px.

## Priority Issues

**[P0] The empty state is a dead end and names the wrong noun.** Filter Europe + search "zzzz" gives one italic sentence, no control, and "country" contradicts the continent chips above it. Mid-trip on a phone this reads as broken. Fix: make `#hubEmpty` an `aria-live="polite"` region containing a real reset button that clears search, resets the continent, re-latches "All trips" and re-runs `apply()`. Change "country" to "continent".

**[P1] The auto-glide scrolls past the page's own best argument.** `glideTo(hub.offsetTop)` (overture.js:180) lands *below* the stats beat, so the counters animate into view and depart in the same 1.5s — and `.stats-note` ("Real numbers, counted from the guides themselves") is `display:none` in compact, so a returning visitor never reads it. Fix: retarget the glide to `.stats-beat` and stop hiding the note.

**[P1] The filter is fully usable by mouse and fully mute by ear.** `hub.js:60` toggles `.hub-chip-active` as a class only — no `aria-pressed`, no announced count. (`intake-flow.js` already does this correctly at lines 216/252/257; the hub never got it.) About 6 lines.

**[P2] A past-trip hero can sort into the middle of the grid.** `hub.js:60` collects `grid.querySelectorAll(".hubcard")`, which now includes `.hub-hero` since R3. When `heroIsPast` (most of the year), the spanning 421px hero carries a past `data-start` and sorts by date into the past group — under ordinary cards. The `restGuides`/`heroId` DOM order is then undone by the sort. Fix: sort `.hubcard:not(.hub-hero)` while keeping the hero in the filter set.

**[P2] The two Overture pills are the smallest targets on the page.** `.ov-pill-icon` measures 34x34; the New guide pill is 36px tall. The chips got a `::after` halo to reach 44px effective; the pills never did — in the hardest-to-reach corner, under PRODUCT.md's one-handed-in-sunlight scene.

**[P3] The hero contradicts the published design system.** Either amend DESIGN.md to admit photography at hero scale and say why, or bring the hero into the survey language: photo held to a plate with a hairline border, a dated margin mark, coordinates set in Source Sans. An unenforced rule silently downgrades every other rule in the file.

## Persona Red Flags

**The traveller mid-trip on a phone (PRODUCT.md's tiebreak scene).** Returning, compact state: hero starts at y=692, first ordinary card at y=1053 — zero complete guide cards in her first 812px. 547px of masthead plus a stats beat built to convince people who aren't her. The surface most optimized for persuasion is the one she hits first, every time.

**The maker's non-technical friend, arriving from a shared link.** 2.8s in, the page starts moving by itself with no input from him — read as "the site glitched," not "cinematic." And the New guide pill is the highest-contrast control on the page, for the persona PRODUCT.md explicitly gives no design budget.

**Screen-reader user.** Skip-link, alt text, and `hidden` are all correct. Then: no `aria-pressed`, no result count, no announcement when the grid empties.

## Minor Observations

- `.hub-foot { border-top: 1px solid var(--ink) }` renders a `#e8ece3` bar in dark; should be `--rule2`.
- Hero meta pills and the CTA are all pill-shaped; only one is pressable, and `hub-hero-past` converges their weight.
- `sizes="100vw"` is dishonest inside a 1340px max-width container.
- Dark contrast measured clean throughout (`.ov-sub` 7.13:1, active chip 15.58:1).
- `markSeen()` fires at glide *start* — a 0.5s window where a visitor permanently loses the Overture.
- Grid `data-count` switches to `auto-fit` at 5 guides; the hero's `grid-column:1/-1` will then be a very wide 421px letterbox. Check before the fifth guide.
- `dark-glow` on `.pa-orb` is a sun/moon halo — physically correct, the one context the rule doesn't target. Ignore.

## Questions to Consider

1. DESIGN.md forbids full-bleed aspirational photography and the hub's largest element is exactly that. Which one is wrong? Shipping both and letting the contradiction sit is the only indefensible option.
2. If a returning visitor sees no complete card in their first phone screen, is this a hub or a landing page? Compact already concedes they need less persuasion — why shrink the beats instead of reordering them?
3. Was the auto-glide designed to show the visitor the guides, or to show them the Overture ends? The cue already does the latter, with consent.
4. What would occupy the New-guide slot if the masthead were designed for the friend who was sent a link?
