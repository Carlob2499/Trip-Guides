---
target: the hub homepage
total_score: 32
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-08-05T00-06-37Z
slug: src-pages-index-astro
---
# Design Critique — Hub Homepage (`src/pages/index.astro`)

**Method: dual-agent (A: design-review agent · B: detector/browser-evidence agent)**

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Countdown, weather, count-up all excellent; auto-scroll fires with no signal, dimmed featured cover reads as an unexplained state |
| 2 | Match System / Real World | 4 | Plain traveler language; "koyo"/"MSI 2026" is the party's own vocabulary — right for the known audience |
| 3 | User Control and Freedom | 3 | Esc closes wizard, glide cancels on input — but the glide takes the wheel once per visit, and in private browsing it replays every visit |
| 4 | Consistency and Standards | 4 | Rigorous token discipline; wizard matches the site's control vocabulary |
| 5 | Error Prevention | 3 | Per-step required gate; no end-before-start date guard; search+chip composition reaches empty state easily |
| 6 | Recognition Rather Than Recall | 3 | Wizard's "Niche interest" field depends on remembering a Priority dropdown choice |
| 7 | Flexibility and Efficiency | 3 | Compact return-visit masthead is a real accelerator; fine at this scale |
| 8 | Aesthetic and Minimalist Design | 3 | "Open, not crowded" lands; but two full viewports before any guide, and Sedona appears twice in one scroll |
| 9 | Error Recovery | 3 | Plain, adjacent errors — but the empty-state advice is factually wrong ("pick another country"; the chips are continents) |
| 10 | Help and Documentation | 3 | Inline example placeholders, "How it's made →" — contextual and quiet |
| **Total** | | **32/40** | **Good — solid foundation, address weak areas** |

## Design Specificity Verdict

**LLM assessment: authored, not category-interchangeable.** The contour fields, self-drawing surveyor's route, per-country accent carried as data into each card, and build-time-counted stats enact the verification thesis rather than decorate it. The one generic bone is the skeleton (intro → stats → hero → filter → grid), but every joint has been re-specified.

**Deterministic scan:** CLI scan found 1 advisory (`em-dash-overuse`, 40 across the whole source file — partial FP; counts frontmatter/comments). In-page scan found 47 findings, 44 of them one rule: `undersized-ui-text` — nearly every micro-label (OPEN GUIDE →, 29 DAYS AWAY, country names, stat captions, all 23 wizard labels) computes to 10.88px, under the 11px floor; the "Featured above" tag hits 9.6px. ~24 of 47 sit inside the closed `#ngModal` (real but not visible-surface). `kicker-above-heading` and `dark-glow` flag deliberate DESIGN.md-sanctioned patterns — false positives. `gpt-thin-border-wide-shadow` on the hidden modal is measurement-suspect.

## Overall Impression

A 32/40 that feels higher on first contact and lower on the tenth — the craft peaks (Overture, state honesty, provenance-as-design) serve the first-time stranger, while the frictions (replaying intro, sub-11px affordance text, top-bar targets out of thumb reach) tax the repeat phone-first party member the product says it's for. Biggest opportunity: one micro-typography token fix erases 44 of 47 detector findings and the worst sunlight-readability persona flag.

## What's Working

1. **The visual system argues the product's case** — counted stats with an honesty caption, advisory pill only when elevated, countdown fed by the guide's own resolver. Nothing transplantable.
2. **State honesty is designed, not patched** — past trips swap countdown for timestamp; reduced-motion kills intro, parallax, and auto-scroll; return visits get the compact masthead.
3. **Measured AA discipline** — every sampled text/ground pair clears 4.5:1 in both themes (5.1–11.8:1); focus outlines everywhere; chips carry a 44px hit-halo despite a 34px visual.

## Priority Issues

1. **[P1] The micro-type floor is broken system-wide.** 44 elements at 10.88px (one at 9.6px) — on touch these ARE the affordance text ("OPEN GUIDE →"). Phone-in-sunlight is the product's stated tiebreak scene. Fix: raise the micro-label size token(s) to ≥12px in `hub-cards.css`/`hub.css` — one token-level edit; both agents converge here. → `/impeccable typeset`
2. **[P1] The Overture replays forever in private browsing and taxes every new device.** `markSeen()` swallows the localStorage throw, so the full intro + 2.8s glide replays each open. Fix: `sessionStorage` fallback; consider skipping the intro when referred from a guide page. → `/impeccable harden`
3. **[P2] Featured-card dimming reads as a broken image.** `opacity:.62` over light paper signals defect, not reference; its explainer tag is the page's only 9.6px text. Fix: full-opacity cover + positive marking (accent ring or control-size tag). → `/impeccable polish`
4. **[P2] Wizard step 3 is the densest choice moment.** 10 topic buttons + 3×7 priority selects, four labels duplicated across both lists, a memory bridge on "Niche interest", and a "Continue on GitHub →" cliff for non-technical recipients. Fix: split step 3, name the topics/priorities relationship, conditional Niche field. → `/impeccable clarify` then `/impeccable distill`
5. **[P2] One heading, total + top-bar tap misses.** No heading structure below the h1 (no screen-reader jump nav); "＋ New guide" ≈33px and theme toggle ≈34px lack the chips' hit-halo; empty-state copy says "country" where chips say continents. → `/impeccable audit` → `/impeccable polish`

## Persona Red Flags

**Casey (distracted mobile):** intro toll on every private-mode open; both top-bar controls out of thumb reach and under 44px; 10.9px affordance text in sunlight. Recovery good — interruption cancels the glide.

**Jordan (first-timer recipient):** boldest button on the page is the maker's own intake tool; "＋ New guide" ends at an unexplained GitHub cliff. Empty state points her at "country" chips that say "Asia / Europe."

**Priya (project persona — recipient checking her trip from a shared link):** wins fast (4 cards, live countdown, search) — but the hero is someone else's trip and stays parked above her one Denmark card after she filters to Europe; deks speak in party shorthand ("koyo," "MSI 2026"), opaque to the grandparent the wizard itself imagines.

## Minor Observations

- Weather pill hardcodes unitless Celsius ("38° / 25°") over an Arizona trip (`src/features/hub/ui/hub.js:37,45`).
- No-JS wizard fallback is the flat 16-field form — the wall-of-options the wizard exists to avoid.
- "Everything below is checked; tick items off as you go" dek repeats on two cards; "below" dangles on the hub.
- Stats a11y order interleaves labels with the next number; group each `.stat` with an aria-label.
- Auto-glide flies past the stats count-up mid-animation.
- `em-dash-overuse` advisory (40 in source): partial FP, worth a glance at rendered prose cadence.

## Questions to Consider

1. PRODUCT.md says strangers aren't the design target and the party already believes the thesis — what if the guides were the first screen and the thesis lived in the stats + About?
2. What if the hero were the first grid cell — a spanning card inside the filterable index — so the editorial moment and "All trips" stop being parallel structures?
3. Should "＋ New guide" say what it is ("Ask for a guide"?) — or move off the recipients' surface entirely?
