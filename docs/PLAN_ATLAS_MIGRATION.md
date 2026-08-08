# PLAN — Atlas end-to-end migration

> **For the executing model (Sonnet).** This plan was produced by a Fable grilling session
> with the creator on 2026-08-07 (four question rounds; every decision below is settled and
> confirmed). CLAUDE.md auto-loads and governs everything here; nothing in this plan
> overrides it. Read `docs/design-handoff/DESIGN.md` and `docs/design-handoff/README.md`
> in full before Stage C, plus the three anchor documents (creator-supplied 2026-08-07):
> `docs/design-handoff/SPEC-COMPONENTS.md` (exact values — no number in it is a
> suggestion), `docs/design-handoff/ANTIPATTERNS.md` (rejected alternatives — if you are
> about to do one of these, the decision is already made), and
> `docs/design-handoff/ACCEPTANCE.md` (mechanical per-gate checks; a failure is drift, not
> taste). `docs/design-handoff/SCREENSHOT-INDEX.md` maps all 21 reference captures to spec
> sections — consult the named capture before building each piece. The creator has **no
> coding skills** — every question you ask them must be plain language, brief, with a
> recommended option first.

---

## Progress ledger (update this section as you work — it IS the session handoff)

Mark tasks `[x]` the moment their stage's ship-loop gate is green. If a session ends
mid-stage, add a `RESUME:` line under the stage saying exactly where you stopped and what
is half-done. A fresh session reads this section first and continues; it never re-derives
history from git log.

- [x] Stage A — Guide-sheet completion (Phase-2 delta)
- [x] Stage B — Atlas data layer
- [ ] Stage C — The hub (Phase 3) + flip
- [ ] Stage D — Mobile (Phase 4)
- [ ] Stage E — Tools (Phase 5)
- [ ] Stage F — The twelve features (full redesign, one at a time)
- [ ] Stage G — Closeout

---

## Session protocol

1. **Model:** Sonnet. One stage per session is the natural unit; stages A and B fit in one.
2. **Every stage ends with the full ship loop** (CLAUDE.md): `npm run build` → `npm run lint`
   → `npm run typecheck` → `npm test` → verify in `astro preview` :4322 (mobile 375px +
   desktop, dark, reduced-motion) → grep compiled `dist/` for stale strings → commit
   (conventional format) → push → confirm live. Lint and typecheck are NOT optional.
3. **Asking the creator:** use `AskUserQuestion` whenever you hit a fork this plan does not
   settle, and at every checkpoint marked ❓ below. Never silently guess, never silently
   skip. Plain language, ≤4 options, recommendation first.
4. **Content preservation gate (every stage):** before committing, run
   `git diff --stat src/content/guides/` — the ONLY permitted changes to guide content are
   the ones enumerated in Stage B (origin fact rows, tz backfill, gap-state schema fields)
   and Stage E (japan holiday data file, which lives in `src/data/`, not guide content).
   Any other guide-content diff is a bug; revert it and investigate.
5. **Continuity sweeps** (CLAUDE.md's editing rule): after any change that touches a datum,
   grep the whole repo for its other touchpoints and stale phrasings before "done".

---

## Binding principles

1. **CONTENT IS KING (creator ruling, 2026-08-07, binding on all present and future
   design elements).** Every surface derives its data from the linked guide's own content
   — never from a parallel copy, a hand-filled registry, or invented values. If a new
   element shows trip days on the globe, those days come from the guide it links. When you
   need a datum, look in the guide content FIRST; add a derivation, not a duplicate. This
   minimizes lookups and eliminates a whole class of hallucination. Existing embodiments to
   imitate: trip dates via `tripWindow()` over the days sections; status derived from
   dates; anchors from the guide's first `map` section; Traveler origin from the guide's
   departure fact (ADR 0003); emergency data via `emergencyFor()` (ADR 0002).
2. **Honest absence.** No authored/invented content, ever. A missing fact renders the gap
   state or nothing at all. An unconfirmed origin draws no route arc.
3. **Uniform application.** A datum renders identically on every surface (hub, masthead,
   OG, print, ping sheet). One derivation feeds all of them — e.g. the sheet ordinal feeds
   both the hub index and the masthead plate number.
4. **Design-system fidelity.** `docs/design-handoff/DESIGN.md` named rules are binding —
   honour the *reasons*, not just the rules. The one colour literal allowed is `#9c4421`.
   `prefers-reduced-motion` disables motion entirely (a cut, not a soften). 44px minimum
   tap targets. Every fixed edge pads `max(reserved, var(--safe-*))`.
5. **Recorded deviations stand (creator-confirmed).** Do NOT "fix" these back to the
   prototype: sights image plates use `aspect-ratio: 3/2` (not fixed 170px); the panel
   grid's `minmax(min(100%,19rem))` (not 420px); the provenance dot's glyph colour
   (WCAG 1.4.11). They are deliberate improvements. **Stage A/B review pass added three
   (creator-confirmed 2026-08-08):** (a) the ⚠ staleness pill keeps its DIRECT link to the
   source rather than opening the provenance popover (Stage A item 7's wording) — one tap
   lands the reader on the thing they need to re-check, and the pill's own text already
   says everything the popover would; (b) the popover's WHERE THIS CAME FROM kicker reads
   `--aink`, not raw oxide — raw oxide measures 2.20:1 on `--card` in dark mode (base.css's
   own measurement), a predictable axe failure, and `--aink` is the repo's established
   ≥4.5:1-by-construction answer for exactly this pairing (D8's hue family is preserved);
   (c) flag chips DRAW at 32px — 44px-tall boxes inline in prose blow up line spacing —
   and meet the binding 44px tap minimum through an invisible ::before hit zone, the same
   effective-target-through-padding technique the spec prescribes for the provenance dot.

---

## Decision ledger (settled by the creator — never re-ask these)

| # | Decision |
|---|---|
| D1 | New hub is built **aside** the current one; `index.astro` flips in ONE commit at the end of Stage C. Live site never shows a half-migrated hub. |
| D2 | Scope is **everything left**: Phase-2 delta, hub, mobile, tools, plus full redesign of the twelve unspecced features. |
| D3 | Old hub retires wholly: overture intro, stats beat, continent chips, hover-video cards. `PaintedAtlas` survives only as the coverless-image fallback. |
| D4 | **Table view is server-rendered at build** — the no-JS/SEO door (Two Doors Rule). Globe + cover are progressive enhancement. The existing works-with-JS-disabled Playwright guarantee moves to the table. |
| D5 | Hub mobile surfaces (segmented WORLD\|TABLE switch, ping sheet, FAB map menu) ship **in Stage C**, not Stage D. |
| D6 | **Sheet numbers are chronological by trip start** (Denmark 01, Korea 02, Sedona 03, Japan 04). One derivation (`src/lib/sheet-order.ts`, pure + tested) feeds hub index, table rows, ping sheet, AND the masthead plate number ("PLATE 02 — KR"). |
| D7 | Quick-card fact chips are **derived only**: emergency numbers via `emergencyFor()` (ADR 0002), the guide's sourced rate from `facts.json` when one exists, the Guide base chip, and a ⚠ chip only when the guide declares an `advisory`. Nothing else. |
| D8 | If the axe gate fails on the two unverified pairings (10px oxide kicker on `--card`; ochre at 9.5–10.5px), you may self-adjust **within bounds** — raise size to ≤11px and/or weight — and record it. NEVER change the hue (Identity Doesn't Theme rule). Hue would require asking. |
| D9 | **Gap state**: extend the provenance vocabulary — `state: "unconfirmed"` plus optional `instead` text renders the gap component (⚠ NOT CONFIRMED at reading scale, 2px ochre border, WHAT TO DO INSTEAD line). Build schema + component now; content arrives only when real research produces it. |
| D10 | **Flag chips** (`≈`/`⚠` as tappable pills) only where machine-derived: `≈` from a fact token's `state:"approx"`, `⚠` from staleness/unconfirmed states. Literal glyphs typed in prose stay plain text. |
| D11 | `closed_days`: render on cards + a build-time **warning** (not hard fail) when an itinerary day schedules a venue on its closed day. Promote to a gate later only if the doctrine warrants. |
| D12 | Venues **grid** inside a Panel (`minmax(280px,1fr)`), matching the prototype. Update `src/features/panel/styles.css` and the `section-types.ts` comment that says they stack. |
| D13 | Masthead conformance bundle, all four: 16px inner mat with ticks at its corners; plate number (from D6's ordinal); title 640 weight / −0.014em tracking; plate-line bottom hairline. |
| D14 | **Traveler origin** (ADR 0001 + 0003): a reserved `facts.json` row per guide — value is the IATA code, state confirmed/unconfirmed, source is the booking. Resolved via a small airport gazetteer. Values: Korea EWR ✓ confirmed · Denmark JFK ✓ confirmed · Sedona EWR-or-JFK **unconfirmed** · Japan possibly JFK **unconfirmed**. Unconfirmed = row present, `state:"unconfirmed"`, NO arc drawn. |
| D15 | Japan holidays: **fetch JP-2026** from the primary source into `src/data/holidays/`, with `source_url` + `verified_on`. Also append a line to `docs/PIPELINE_PATTERNS.md`: holiday data files are a research-pass deliverable the pipeline missed (creator flagged 2026-08-07). |
| D16 | Trip-split traveler names: **blank start** — the tool asks the viewer to add names; only Korea's Firebase room may already hold real data, which is preserved. No placeholder seeding, no invented names. |
| D17 | The twelve unspecced features get **full redesigns, one at a time, in Stage F** — each re-expressed in the Atlas system, with the creator answering that feature's forks via AskUserQuestion (with preview screenshots) when you reach it. |
| D18 | World country geometry (`world-atlas` TopoJSON, ~110 KB) is **vendored into `public/`** — the offline rule forbids the CDN fetch. Fetch respects the base path (`document.body.dataset.base` pattern). Add to the SW precache. |
| D19 | `atlas-map.js` is **refactored to accept guide data** (anchors, ids, names, origin per guide) instead of owning module constants. d3 + topojson-client load lazily (`import()`), keeping the 200 KB first-paint CI budget green. |
| D20 | Cross-guide search runs on a **build-time index** (one generated JSON, lazily fetched on first focus/keystroke), not the prototype's client crawl of every guide file. |
| D21 | The cover gets its missing `sessionStorage` once-per-session gate. Reduced motion: single cut, no fade/FLIP/iris/flyIn (already correct in prototype page code — but fix `atlas-map.js`'s gaps: `flyTo`/`flyIn`/eased zoom must not animate under reduced motion, and listen for preference changes). |
| D22 | Hub→guide morph rides **cross-document view transitions** (existing `cover-<slug>` / `accent-<slug>` names map onto the plate), not the prototype's manual FLIP. |

---

## Anchor-document adaptations (where ACCEPTANCE/SPEC text yields to settled reality)

The anchor documents were written against the prototype. Six of their assertions meet
decisions or shipped code that already rule; apply them ADAPTED as follows — everything
else in ACCEPTANCE.md applies verbatim:

1. **Panel collapse "340ms GSAP height tween"** → the repo's shipped mechanism stands:
   CSS `grid-template-rows 1fr→0fr` at `var(--dur-reveal)` (350ms), no GSAP, no
   re-measure needed (the concern the spec guards against is GSAP-specific). Check the
   *behavioral* assertions (no one-frame jolt, sort order, per-scope persistence) as
   written.
2. **Panel grid `minmax(340px/460px)`** → the repo's `minmax(min(100%,19rem))` is a
   recorded deviation (Binding principle 5), live-verified across 22 groups.
3. **"atlas-map.js ships as-is" / 48-point routes / DPR 2** → D19 refactor rules (data-fed,
   reduced-motion fixed, per-guide origins); where SPEC numbers disagree with the
   prototype code, the prototype code wins (its 41 points, DPR 1.6 were the judged
   artifact). Everything the SPEC marks "do not re-tune" (canvas layers, dirty-flag,
   solver design, zoom clamp, fade-zoom law) applies.
4. **Gate 5 "search indexes guides in the background"** → D20's build-time index replaces
   the mechanism; the assertions that must still hold: matches on body text, capped
   results, and a result opens its guide **on the right tab**.
5. **Gate 3 "no number appears without a dot or flag chip"** → scoped to *governed
   perishable figures* (facts.json tokens and provenance-carrying items, per
   `provenance:"strict"`); prose numerals the author typed stay prose (D10).
6. **Masthead chips "currency, base"** → the base chip stays omitted (no schema field on
   any guide — honest absence over invention, recorded in `GuideLayout.astro`).

---

## Clarifying questions (open — ask at the marked moment, not before)

1. **Sedona + Japan origins** — when the creator confirms from bookings, flip the fact
   rows to `confirmed`; the arcs light up. Ask ONCE, at the end of Stage C, plainly:
   "Which airport did/will you fly from for Sedona? For Japan?" Accept "still unsure" and
   leave unconfirmed.
2. **Stage F per-feature forks** — each feature's brief below lists its likely forks; ask
   them when you reach that feature, with a screenshot of the current state.
3. **Anything not settled by D1–D22** that forks the plan: stop and ask. Unexpected
   technical issues that don't fork the design: fix and record.

---

## Stage A — Guide-sheet completion (Phase-2 delta)

Small, high-value fixes to already-shipped work. Verify each against the explorer
findings; read the file before editing.

1. **Day-scrub sticky fix.** `.day-scrub`'s `position:sticky` is dead inside Panels —
   `.pnl-body-in { overflow: hidden }` (`src/features/panel/styles.css:157`) is its
   nearest scroll container and never scrolls. `overflow:hidden` is load-bearing for the
   collapse clip (`grid-template-rows 1fr→0fr`). Resolve deliberately — candidate: apply
   `overflow:hidden` only while collapsing/collapsed (e.g. toggle a class from
   `collapse.js`, or `overflow:clip` on the collapsing wrapper only), so the expanded
   state restores stickiness. Prove in preview on a long Days panel, both states,
   before/after collapse, mobile + desktop.
2. **`place_id` wiring.** `SightsBlock.astro:86` and `VenueBlock.astro:74` call
   `<TransitLinks>` without `placeId` — pass `it.place_id`; `src/lib/transit-links.ts:42`
   already supports it. Verify one deep-link in preview points at the place, not bare
   coords.
3. **`closed_days` (D11).** Render a Closed row on sight cards where present (venues have
   one). Add a build-time warning: cross-check each guide's day waypoints against
   `closed_days` of the venue/sight they reference (match by name/id — read how waypoints
   reference venues before designing the match). Warning prints at build, never fails it.
4. **Venues grid (D12).**
5. **Masthead bundle (D13).** Depends on `src/lib/sheet-order.ts` — build that first:
   input = the guides collection, output = ordinal by trip start date (from `tripWindow()`
   — content is king), stable, tested in `src/lib/`. Then the plate number renders
   "PLATE NN — <CC>".
6. **Popover conformance.** `src/styles/provenance-dot.css` + `provenance-dot.js`:
   oxide `1px solid #9c4421` square border (radius 0), add the `WHERE THIS CAME FROM`
   kicker (9.5px/640/.2em — subject to D8 if axe objects), the claim line, and the
   `NO PUBLIC SOURCE` fallback when no source row exists. Keep the glyph-colour deviation.
7. **Flag chips (D10).** New small component/CSS emitted by the fact-token substitution
   for `state:"approx"` (`≈ approx.` pill) and by staleness/unconfirmed paths (`⚠` pill).
   Control-size, 1px current-ink border, tappable (opens the same provenance popover).
8. **Gap state (D9).** Schema: extend the fact/item provenance with
   `state:"unconfirmed"` + optional `instead: string`. Component per spec (README
   §notation): ⚠ NOT CONFIRMED at reading scale in ochre, 2px ochre border, rule,
   explanation, WHAT TO DO INSTEAD stamp line. Renders nowhere today — that is correct
   (capability live, unexercised).
9. **COLLAPSE ALL / EXPAND ALL** control in each panel-group header (README:281), wired
   through `src/features/panel/collapse.js`'s existing persistence.
10. **Hash auto-expand.** Navigating to an anchor inside a collapsed Panel expands it
    first (listen for hashchange + on-load hash; call the existing collapse API).
11. **Housekeeping.** Rewrite `docs/HANDOFF.md`'s stale snapshot (it predates commits
    `f3734c0`/`efaca03`/`edbd7b7`); archive the old snapshot per the ritual.

**Gate:** ship loop + content-preservation gate (zero guide-content diffs this stage).

## Stage B — Atlas data layer (no visible UI change)

1. **Airport gazetteer** `src/data/airports.mjs`: IATA → `{ lat, lng, label }` for EWR,
   JFK (extend as needed). Coordinates verified against a primary source on write, with
   a comment noting source + date.
2. **Reserved fact row contract**: id `traveler-origin`, value = IATA code only, optional
   `source_url`, `verified_on`, `state` confirmed/unconfirmed. Document the contract where
   `facts.json` is documented (guide-template.jsonc / the guide-author skill's references
   if present — congruence rule). Add rows: korea EWR (confirmed — its prose already says
   EWR; adding the row changes no prose; grep for ripples anyway), denmark JFK
   (confirmed, source: traveler booking record), us + japan (unconfirmed per D14).
3. **tz backfill**: korea `Asia/Seoul`, denmark `Europe/Copenhagen` in `_guide.json`.
4. **Per-guide atlas record** — ONE build-time derivation module (suggest
   `src/features/atlas/model/guide-record.ts`, pure, tested): slug → `{ anchor, anchorLabel,
   countryId, ordinal, start, end, status, tz, origin?, coverImg?, dek, title }`, every
   field derived from guide content: anchor = first `map` section center (Fukuoka for
   japan — creator-confirmed); countryId from a small ISO-numeric map keyed off the
   existing `country` field in `src/data/countries.mjs`; dates via `tripWindow()`; status
   derived from dates vs today; origin via the fact row + gazetteer. NO new hand-filled
   meta beyond tz. This record is the ONLY thing the hub consumes — content is king.
5. **Vendor world TopoJSON** (D18): download `world-atlas@2.0.2/countries-110m.json`
   once into `public/data/`, record version + source in a comment/README line, add to SW
   precache (`scripts/gen-sw-precache.mjs`), fetch through the base path.
6. **Search index build step** (D20): generate one JSON at build (per section: slug,
   group, crumb, title, 150-char snippet, lowercase haystack — the prototype's record
   shape at `buildSearchIndex`), emitted as a static asset. Unit-test the builder.
7. **Intake congruence**: add the departure-airport question to
   `docs/NEW_GUIDE_INTAKE.md` and the scaffold/intake schema so future guides capture it
   at birth (writes the fact row).

**Gate:** ship loop; content gate passes with exactly the enumerated diffs (fact rows ×4,
tz ×2). Nothing visible changed — verify hub/guides render identically in preview.

## Stage C — The hub (Phase 3)

> **RESUME (2026-08-08 session, mid-stage):** Items 1–7, 9 done and verified (ship loop
> green: build/lint/typecheck/1560 tests; content-preservation gate clean — zero
> `src/content/guides/` diffs). Built aside at `src/pages/atlas.astro` (dev-only, not linked
> from live nav) — `index.astro` untouched, D1 intact.
> - **1 Feature silo**: `src/features/atlas/model/{solver,relevance,local-time}.ts` +
>   tests added alongside Stage B's model files.
> - **2 atlas-map port (D19/D21)**: `src/features/atlas/ui/atlas-map.js`. Adaptations from
>   the prototype: guides/anchors/origins arrive via the `.guides` property (never module
>   constants); route arcs are PER-GUIDE from that guide's own confirmed origin to its own
>   anchor (the prototype's single shared "home base" is gone — D14/ADR 0003 origins are
>   per-trip); `prefers-reduced-motion` is live-listened (not read once) and flyTo/flyIn jump
>   instantly under it; d3 + topojson-client load via lazy `import()`, never `window` globals;
>   world geometry fetches the Stage-B-vendored `public/data/countries-110m.json`, base-path
>   aware. Pin dot colour (oxide/grey) now encodes the Key legend's actual "surveyed vs
>   filed" (trip status past/ongoing vs upcoming/undated) — the prototype's Korea-only
>   dot-size distinction was actually about card PLATING, which Stage C.5 now gives all four
>   guides per spec, so it no longer applies.
> - **3 Table view (D4)**: `src/pages/atlas.astro`'s server-rendered body — sticky search
>   header (client-enhanced via `features/atlas/ui/search.js`, lazy-fetches the Stage-B
>   search index, links results at `#sec-<i>` for A10's hash auto-expand — more precise than
>   "the right tab"), quick card (D7 chips: emergency tel: links, currency, live clock,
>   advisory — no sourced-rate chip anywhere: no guide has a registered exchange-rate fact
>   today, so this ships as honest absence rather than a guessed convention), sheet list
>   (relevance-sorted via new `model/relevance.ts`, status stamps). Live-verified in-browser:
>   search returns real snippets, quick card correctly picked Sedona as "NEXT TRIP".
> - **4/5 World view + pin cards + solver**: `src/features/atlas/ui/world-view.js` mounts
>   `<atlas-map>`, wires index rail/key/THE RECORD/zoom-fit-spin/motto/toast, and runs
>   `model/solver.ts` (ported from the prototype's `solvePlacement`, 9 tests) via
>   `requestIdleCallback` off the `atlas-pos` stream. Live-verified via direct DOM/JS
>   invocation (this session's browser pane couldn't composite frames for
>   screenshots/rAF — a tooling limit, not a code defect; manually invoking `_draw()`/
>   `_emit()` and dispatching real events confirmed correct guide data, non-overlapping
>   card placement, working zoom/fit/toast/mode-toggle/fly-to).
> - **Load-bearing fix found and closed**: `content.config.ts`'s guideLoader interpolated
>   `facts.json` into prose but then DISCARDED the registry — nothing downstream of
>   `getCollection("guides")` could ever read a fact's own state/value (`originFor`'s D14
>   traveler-origin arcs were unreachable). Added `facts: factsFile.optional()` to the guide
>   schema and `raw.facts = facts` in the loader. This is infra (`content.config.ts`), not
>   guide content — the content-preservation gate stayed clean.
> - **`scripts/check-perf-budget.mjs` improved**: the `total JS` budget's on-demand
>   exclusion was a hand-maintained `pdf` name regex; d3/topojson-client's Rollup output
>   uses generic `index.esm.*.js` names that pattern can't match. Replaced with a structural
>   check (a chunk absent from every page's first-paint closure is on-demand by
>   construction) — generalizes to any future lazy dependency, not just this one.
> - **Scope note for the checkpoint (item 11)**: README describes a standalone,
>   cross-trip "Tools screen" (§5) with its own trip selector — but it is NOT one of this
>   stage's 11 numbered items, and item 9's Chrome only names a "TOOLS" entry point, not a
>   new screen. Table view's TRIP TOOLS row and (once built) the hub header both link into
>   the QUICK-CARD guide's own already-shipped tools tab instead
>   (`/guides/<slug>/#gtab-split`) rather than guessing a large new screen into or out of
>   scope. Flag this explicitly to the creator at the item-11 checkpoint.
> - **6 Cover + iris (D21)**: `src/features/atlas/ui/cover.js` (`initCover`, exported
>   through `index.ts`) + `src/styles/atlas-cover.css`. Ported the prototype's fade/FLIP/
>   iris dismiss sequence verbatim for timings (per this plan's own trust rule); two
>   additions D21 asked for and the prototype didn't have: `reducedMotion()` (shared
>   `src/scripts/util.js` helper) gates the whole sequence to a single cut, and the CTA is a
>   real `<button>` (native Enter/Space + an Escape handler + explicit `.focus()` on open —
>   `autofocus` is a no-op on a `display:none` element) so a keyboard/screen-reader visitor
>   isn't stuck behind it. **A real dependency, not scope creep**: the wordmark FLIP needs a
>   header wordmark to FLIP into, and no hub header existed yet (item 9 owns the full
>   Chrome). Built the minimal shell only — brand mark + wordmark — in `.atlas-header`;
>   item 9 adds the rest of the row around it, not a new header. Its real height is now
>   measured into `--hdr-h` via a small `ResizeObserver` in `atlas.astro`'s script (the
>   "no JS writer yet" token test already anticipated this: the writer ships with whichever
>   phase first has a real header to measure). **No-JS safety (D4)**: `.atlas-cover` is
>   `display:none` by default in CSS; `initCover` only adds `[data-open]` after confirming
>   `sessionStorage` hasn't already seen it — a no-JS visitor never sees a cover with no way
>   past it, and the CSS rule is confirmed present in the compiled `dist/` chunk, not just
>   the source. The globe's `flyIn` target is the same relevance-ordered "quick" trip the
>   table view's quick card already uses (`data-fly-slug` on the cover, stamped
>   server-side) — content is king, no second "home base" invented. Live-verified in
>   `astro preview`: fade transitions and the wordmark FLIP transform (measured against the
>   real header rect) both compute and apply correctly; dark theme and mobile (375px, 46px
>   CTA, wordmark clamps to its 2rem floor) both correct; the sessionStorage gate correctly
>   removes the cover with zero flash on a repeat visit. **Not directly observed**: the
>   iris mask's own `requestAnimationFrame` loop — this session's browser pane still can't
>   composite frames (same limit the prior session hit), so the last 780ms of the sequence
>   is verified by code review (a direct, unmodified port of the prototype's own proven
>   formula) rather than a live frame-by-frame check.
> - **Type-scale gate caught 4 literals** (`src/styles/type-scale.test.ts`): the cover's
>   one-off decorative sizes (14px/8.5px/10px) each land within ~1% of an existing token
>   (`--text-small`/`--text-nano`/`--text-panel-kicker`) — used those instead of adding new
>   literals to the closed allowlist.
> - **9 Chrome**: header actions cluster added beside the item-6 shell — TOOLS (an `<a>` into
>   the quick-card guide's own tools tab, `#gtab-split`, guarded by `quick &&`, same
>   non-decision as the table view's own TRIP TOOLS row per the scope note above), New guide
>   (`${base}/new/`), and the theme toggle wired to the SHARED `initDarkToggle("btnDark")`
>   (`src/scripts/theme.js` — the same implementation index.astro/GuideLayout already use, not
>   a third copy). PwaHead and the skip-link were already present from earlier items. Added
>   OG/description meta (the hub page had none before, and neither does today's `index.astro`):
>   description + og:title/og:description/og:url/og:type=website + matching twitter:*. No
>   og:image — no hub-level OG image asset exists (guide pages have a per-slug generator at
>   `pages/og/[slug].png.ts`; the hub has no counterpart) — omitted rather than fabricated.
>   Footer/About link relocated: a small `.atlas-foot` at the bottom of the table view carries
>   the old `index.astro` hub-foot's copy, pointed at `${base}/about/`. **Deliberately NOT
>   done**: relocating the WORLD|TABLE toggle bar into the header — the plan's own item 9 line
>   below never asked for it (that phrasing was this session's own earlier HANDOFF draft, not
>   the plan), and moving it would touch the already-verified `--hdr-h`-minus-44px
>   `#atlasGlobe` height math items 3–5 shipped; the toggle stays its own sticky bar, unchanged.
>   Item 8 (mobile) is what actually owns giving WORLD|TABLE a real responsive treatment. Ship
>   loop green (1560 tests, unchanged count — this composes already-tested shared pieces).
>   Live-verified in `astro preview`: TOOLS points at `/guides/us/#gtab-split` (Sedona, the
>   correct quick pick), theme toggle flips `data-theme` and re-syncs theme-color to the live
>   `--bg`, footer renders only in table mode, header wraps cleanly at 375px with zero
>   horizontal overflow (no screenshot — same frame-compositing tooling limit as item 6;
>   confirmed via getBoundingClientRect/scrollWidth instead). Grepped compiled
>   `dist/atlas/index.html` to confirm the OG tag, Tools/New-guide hrefs, footer markup, and
>   `id="btnDark"` are genuinely present in production output.
> - **7 View transitions (D22)**: `src/pages/atlas.astro` didn't import `transitions.css` —
>   `@view-transition{navigation:auto}` was already live site-wide via `base.css` (every page
>   imports it), so cross-document transitions were never actually OFF, but the calm 420ms
>   `cubic-bezier(.4,0,.2,1)` NAMED-group morph timing plus the belt-and-suspenders
>   reduced-motion animation-kill only exist in `transitions.css`, which the hub lacked. Added
>   the import. Wired the one real gap: `world-view.js`'s pin-card `<img class="atlas-pincard-
>   plate">` now carries `view-transition-name:cover-${slug}` inline (mirrors `index.astro`'s
>   hub-card convention exactly; safe unconditionally since `ensureCard`'s slug-keyed Map
>   guarantees at most one live element per name at a time). **Deliberately not done**: adding
>   `cover-<slug>`/`accent-<slug>` to the table view's quick card or sheet-list rows — neither
>   carries a photo or a guide-accent-coloured element in the current (photo-less, data-first)
>   table-view design, so there's nothing real to name; inventing a colour swatch just to hang
>   a transition name on would be new, undesigned surface. Those navigations still get the
>   root cross-fade (unaffected). Live-verified in `astro preview`: the pin-card image carries
>   the right inline name after the solver places it, and both the 420ms group-timing rule and
>   the reduced-motion override are present and matched in the live page's stylesheets. Ship
>   loop green (1560 tests, unchanged — no new logic, only naming + one CSS import).
> - **Still to build**: 8 (mobile <760px — wire to existing `mobile-nav` models), 10 (the flip
>   commit itself — NOT pushed until item 11's GO), 11 (screenshot checkpoint + Sedona/Japan
>   origin question, D14/Clarifying #1).

Build aside (a dev-only route, e.g. `src/pages/atlas.astro`, or the new components mounted
nowhere) and flip `index.astro` in one final commit. Read the handoff README §1–3 fully
first. Key specs and the prototype's own bugs are catalogued below — trust the README
where it conflicts on *intent*, the prototype where it conflicts on *timings* (README's
stated timings drift from code; the code's were the ones judged in the working prototype).

1. **Feature silo** `src/features/atlas/` per the ARCHITECTURE contract: `index.ts` public
   surface, `model/` (pure + tested to the coverage floor: solver, status, guide-record,
   search-query), `ui/` (atlas-map element, overlays, pin cards, cover), `mocks/`,
   `__tests__/`.
2. **`atlas-map` element** (D19, D21): port from the prototype with these required
   changes — accept guides/anchors/origins as data (property or JSON attribute), not
   module constants; per-guide origin arcs (a guide with no confirmed origin draws NO
   arc); fix reduced-motion (no flyTo/flyIn/zoom animation; listen for preference
   change); keep the adaptive-quality tiers, terminator, DPR cap 1.6, drag/wheel
   feel, and the `atlas-pos`/`atlas-select` events as-is. Known prototype traps: the
   `atlas-pos` detail object is reused/mutated — never retain it; clicking anywhere in a
   guide's country selects that guide (acceptable at 4 guides — keep, it's the designed
   behavior); d3/topojson arrive via lazy `import()`, not `window` globals.
3. **Table view, server-rendered** (D4): the full sheet list, quick card (D7), TRIP TOOLS
   row, and sticky search header render at build from the guide records. Search
   (client-enhanced): lazy-fetch the Stage-B index on first focus; ≥2 chars, cap 40,
   result rows open the guide on the right tab group. Add a small debounce (the prototype
   had none). Quick card's ticking clock + "HH:MM THERE" hydrate client-side from `tz`.
4. **Overlays**: index rail, key, zoom/fit/spin controls, THE RECORD chronology (derive
   entries from guide records; make ALL rows fly-then-offer rather than the prototype's
   inconsistent fly-vs-open — pick fly + a per-row "open" affordance), motto card, toast
   for no-guide countries. Hub overlays are Panels per the glossary — use the Panel
   container where the design shows panel chrome. Fade-zoom law per the prototype
   formulas; raise the 38px overlay controls and 32px index rows toward 44px where layout
   allows (tap-target rule outranks the prototype here).
5. **Pin cards + collision solver**: solver as pure logic in `model/` with unit tests
   (eight seats, greedy-with-global-compact-retry, obstacle AABBs, 18px grid fallback —
   the exact algorithm is documented in the prototype at `solvePlacement`); frame loop
   transform-only (`translate3d`, 0.16 ease, 0.1px quantised). NEVER `left/top` per-frame
   (pre-rejected shortcut). All four cards get plates (the prototype only plated Korea);
   plate images via the existing cover fallback chain (cover → first sight photo →
   PaintedAtlas mini).
6. **Cover + iris** (D21): sessionStorage gate, 4200ms auto-open, click/wheel opens now,
   wordmark FLIP to the header, 380ms-delay/780ms iris via mask-image, `flyIn` beneath.
   Reduced motion = single cut, no flyIn.
7. **View transitions** (D22): plate/masthead carry the existing `cover-<slug>` and
   `accent-<slug>` names so the cross-document morph continues working from both globe
   pin-card CTAs and table rows.
8. **Mobile (<760px)** (D5): segmented WORLD|TABLE switch, ping sheet, FAB map menu, all
   per prototype specs (safe-area padded, 44px+ targets, GSAP-free equivalents or gsap
   lazy-import consistent with repo pattern).
9. **Chrome**: hub header (theme toggle, ＋ New guide, TOOLS), OG/description meta for the
   hub page (it has none today), skip-link, PwaHead, footer/About link relocated per
   design (table view + header).
10. **The flip** — one commit: `index.astro` becomes the atlas hub; delete the old hub
    code and CSS (overture.js, hub-live-cards.js, hub-motion.css, gsap-hero/hero-parallax
    hub usage, stats-beat, chips) after grepping for shared consumers; update tests:
    `tests/visual/overture.spec.ts` is replaced by atlas specs — no-JS table renders all
    guides with real hrefs; reduced-motion skips cover; a11y loops keep their hub entries
    (the ≥2 accent-carriers assertion needs re-pointing at the new markup); axe gate on
    the new pairings (D8). Perf: `scripts/check-perf-budget.mjs` must stay green —
    d3/topojson/world data all lazy.
11. ❓ **End-of-stage checkpoint**: screenshot desktop + mobile, light + dark to the
    creator; ask the Sedona/Japan origin question (Clarifying #1); get explicit GO that
    the flip commit ships.

**Gate:** ship loop + content gate + axe + perf budget + the no-JS guarantee.

## Stage D — Mobile (Phase 4)

Per handoff README's mobile sections and `src/features/mobile-nav/model/*` — **keep the
model's constants exactly** (creator's handoff prompt). Bottom bar wired to the existing
rank model; yielding chrome; swipe between groups; the Groups sheet; safe-area insets
everywhere; `viewport-fit=cover`. The hub's own mobile surfaces shipped in Stage C — this
stage is the guide pages. ❓ checkpoint with phone-width screenshots before commit.

## Stage E — Tools (Phase 5)

The five tools (split, jetlag, closures, reminders, route order), each seeded **from the
guide's own record** (content is king; the pre-rejected shortcut "seed on first render"
still applies — every entry point into Tools loads the trip's data, one data-load guard).
Wire to existing logic, do not reimplement: `src/lib/jetlag.ts` + `tz-offset.ts`,
`src/lib/holidays.ts` + `src/data/holidays/`, `src/lib/staleness.ts`,
`src/features/trip-split/model/*` (TypeScript originals are the source of truth — never
port from the prototype's JS copy), `src/features/route-opt/model/optimize.ts`.
Specifics: JP-2026 holidays fetched per D15 (+ the PIPELINE_PATTERNS.md line); split
names per D16; four entry points reachable (hub header TOOLS, table TRIP TOOLS row, guide,
mobile menu). ❓ checkpoint per tool if any fork appears; otherwise one end-of-stage
review.

## Stage F — The twelve features (full redesign, D17)

One feature per pass, in this order (visibility-first): **SOS sheet · share panel · story
mode · palette (topbar search/SOS injector) · About + health pages · learnings survey ·
field-tools · voting · budget-pact · trip-kit · change-request · telemetry surfaces.**

Per feature: (1) read its silo (`src/features/<name>/`) and current UI fully; (2) draft
its Atlas re-expression — Panel container, notation layer, stamps, the named rules —
changing NO behavior and NO data flow; (3) ❓ put the feature's genuine UX forks to the
creator via AskUserQuestion WITH a screenshot of the current state and a plain-language
description of each option; (4) implement; (5) preview screenshot to the creator for
sign-off; (6) ship loop; commit per feature. Known fork examples: SOS (sheet vs panel
presentation), share panel (where QR + link live in the new chrome), story mode (its
launcher's place in a Panel-hosted Days section), telemetry (its only UI is config/health
readouts — confirm what "redesign" means there before touching it). Two features are
load-bearing inside DaysBlock (story-play launcher, Plan⇄Actual flip) — restyle in place,
never detach.

## Stage G — Closeout

1. Diff root `DESIGN.md` against `docs/design-handoff/DESIGN.md` — Phase 1 replaced it,
   but confirm full congruence (named rules present; no drifted values) and reconcile.
2. Old-token sweep: grep `src/` and `dist/` for retired class names/CSS (`overture`,
   `stats-beat`, `hubcard`, hub-motion selectors…) — zero live references.
3. Docs: update `docs/MOTION.md` (new hub motions, retired ones), `docs/FEATURES.md`,
   `docs/ARCHITECTURE.md` (atlas silo), rewrite HANDOFF.md snapshot, archive this plan's
   ledger state.
4. **Dependency hygiene**: `npm audit` must report 0 vulnerabilities. Baseline
   established 2026-08-07 (pre-plan): pdfjs-dist → 6.2.108, fast-uri override → 3.1.5,
   js-yaml/postcss/brace-expansion refreshed. If new advisories appear mid-migration,
   fix them in their own commit — never bundled into a feature stage.
5. Final full ship loop + axe on every changed surface + Playwright suite green +
   verify-live.

---

## Verification matrix (what "green" means, per stage)

| Check | A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|---|
| build/lint/typecheck/test | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| preview :4322 (375px+desktop, dark, reduced-motion) | ✓ | render-identical | ✓ | ✓ | ✓ | ✓ | ✓ |
| grep `dist/` stale strings | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| content-preservation gate | ✓ | enumerated only | ✓ | ✓ | enumerated only | ✓ | ✓ |
| axe gate | if colour touched | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| perf budget (first-paint 200 KB) | — | — | ✓ | ✓ | ✓ | — | ✓ |
| no-JS hub guarantee | — | — | ✓ | — | — | — | ✓ |
| creator ❓ checkpoint | — | — | ✓ | ✓ | if forks | per feature | — |
| ACCEPTANCE.md gates (adapted per the section above) | G2·G3 | — | G0(axe)·G4·G5·G8 | G7·G8 | G6 | G8 | ALL re-run |

Gate 0's other two items are already satisfied: DESIGN.md was replaced in Phase 1
(verify in Stage G), and the seven open questions are answered by this plan's Decision
ledger.

## Known traps (all pre-litigated — do not rediscover these)

- **`docs/design-handoff/ANTIPATTERNS.md` is binding.** Every entry there was built,
  looked at, and removed — masonry, SVG globe, greedy solving, `left`/`top` animation,
  hover-only dots, telemetry-driven ranking, invented rates/holidays, softened reduced
  motion, mid-range border radii, oxide-for-emphasis, React. The bullets below are the
  repo-specific additions.

- **No masonry** for panel grids; **no `left`/`top`** per-frame positioning; **no
  first-render seeding** of the split tool (all three tried and undone in the prototype).
- Greedy per-card solving starves later cards — keep the global compact retry pass.
- Never disconnect the reveal IntersectionObserver mid-flight (orphans elements at
  opacity 0).
- Astro inlines per-page CSS — grep dist **HTML**, not `_astro/*.css`, when verifying.
- Bare `/`-hrefs and bare fetch paths 404 under `/Trip-Guides/` — always the BASE_URL
  pattern; client fetches via `document.body.dataset.base`.
- `astro dev` HMR state is not what ships — verify on `astro preview` :4322 only.
- Boundary checks (CLAUDE.md): the vendored-TopoJSON fetch and the SW precache addition
  are seams — force the failure path once (dead path → PaintedAtlas/graceful text, not a
  blank hub) and smoke the deployed hub once after the flip.
