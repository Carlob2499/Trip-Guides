# PLAN — Mobile Layout & Navigation ("feels like an app")

> **SHIPPED 2026-07-30 — all three phases.** Commits `da19002` (A), `90ba636` (B 1/2),
> `d3a3660` (B 2/2), plus Phase C and a masthead-pill cut. Read the "As built" section at
> the bottom before treating anything above as current: three specifics changed on contact
> with the real layout, and the reasons are worth more than the original wording.

> Creator brief (2026-07-30): improve mobile LAYOUT AND NAVIGATION — information first,
> movement so smooth and natural the site is seamless. Decided same session: primary tab
> navigation moves to a bottom bar + groups sheet on mobile; phase 1 ships all four
> gesture pieces. This doc is the spec an off-day session executes.

## North star

The thumb is the cursor. Primary navigation lives where the thumb rests; every gesture is
interruptible and tracks the finger; chrome yields to content; and navigation surfaces
INFORMATION (where you were, what's next), never just links. No new content surfaces, no
second nav level — everything below rearranges existing information ("open, not crowded").

## Decided (creator, 2026-07-30)

- **Bottom tab bar + groups sheet** is mobile's primary navigation. Top chips stay
  desktop-only.
- **Phase 1 = all four gesture pieces**: swipe-between-tabs, yielding chrome, day
  scrubber, sheet physics + haptics.

## Phase A — Navigation architecture (the IA change; do FIRST, gestures attach to it)

1. **Bottom tab bar** (`.botbar` evolves; mobile <900px only)
   - Slots: 3 telemetry-ranked content groups (fallback when telemetry is thin: the
     guide's first three groups) + **Groups** (opens the sheet) + **Today** (keeps the
     existing journey jump).
   - Active state mirrors the current group; taps use the existing `showTab` path so
     scroll-memory and scroll-spy keep working unchanged.
2. **Groups sheet** — thumb-height bottom sheet listing ALL groups (grid, icon + label,
   ≤10 by budget) plus the 4 tool tabs. Each content group row carries a **resume line**
   from scroll-memory ("Food — you were at ⟨nearest section title⟩"); no memory → no line
   (honest blank). This is the full nav, one thumb away.
3. **Top chrome on mobile** slims: topbar keeps back/search/share/theme; the chip row
   hides <900px (desktop unchanged). The slim bar shows current group + local time when
   condensed (see Yielding chrome).
4. **A11y**: bar is a `tablist` mirroring the top one's ARIA; sheet is the existing
   trap-focus dialog pattern; every target ≥44px; `env(safe-area-inset-bottom)` kept.

## Phase B — Gestures & motion (each independent; land in any order after A)

5. **Swipe between tabs** — horizontal pan on `#content` moves to the adjacent group.
   Axis-lock: claim the gesture only when |dx| > |dy| and dx > 24px; never fight
   vertical scroll. The bottom-bar active indicator tracks the finger (transform, live),
   content slides direction-aware; release past 30% width or velocity > 0.5px/ms
   commits, else springs back. Reduced-motion: instant switch, no slide.
6. **Yielding chrome** — scroll down >80px hides the bottom bar (translateY) and
   condenses the top bar to a slim strip (current group + local time); scroll up or
   stop ≥600ms returns both. Never yields while a sheet, Focus Today, or the story
   intro is open. `prefers-reduced-motion`: opacity swap instead of slide.
7. **Day scrubber** — Days tab only, right edge: one dot per day (the story rail's
   "segments are days" language, vertical). Drag = jump between day cards with a day
   bubble under the thumb; taps work too. Hidden on guides with <4 days. Pointer-events
   confined to a 28px edge strip; a11y: `slider` role, arrow keys, day announced.
8. **Sheet physics + haptics** — all bottom sheets (SOS, share, groups, day sheet):
   drag handle, finger-tracked translate, velocity dismissal, `overscroll-behavior:
   contain` on sheet bodies. `navigator.vibrate(8)` on: sheet snap, checklist tick, tab
   commit — Android-only by platform; iOS silently no-ops; wrap in one `haptic()` util
   so it's one grep to remove.

## Phase C — polish (separate pass, not phase 1)

- Resume chip on fresh arrival ("Continue where you left off → Food").
- Standalone-mode: per-guide `theme-color` from the extracted palette;
  `overscroll-behavior-y: none`; "✓ saved offline" line in the colophon.
- `@media (hover:hover)` sweep (hubcard + any hover transforms).

## Verification (every phase, per Ship Loop)

Build + 1018-test suite green → `astro preview` :4322 at 375px AND desktop, dark + light,
reduced-motion → axe pass on a guide page + the hub → grep `dist/` → commit → push.
Gesture checks are manual-in-preview: axis-lock (diagonal scroll never switches tabs),
swipe near the map/carousel doesn't hijack, scrubber doesn't trap page scroll, sheets
can't be flung open, keyboard paths unchanged. Story intro + swipe coexist (intro owns
first entry; gestures arm after `story-done`).

## Clarifying questions (for the executing session — ask BEFORE building)

1. **Bottom bar contents**: the current journey bar has Today · Kit · Map. Proposed:
   Today survives as a slot, Kit/Map fold into the Groups sheet's tool row. OK, or must
   Kit/Map stay one tap away?
2. **Telemetry-thin fallback**: first three groups by order, or a fixed editorial pick
   (Plan · Days · Food) until data exists?
3. **Swipe scope**: content groups only (proposed — tool tabs opt out), or include tools?
4. **Haptics default**: on where supported (proposed), or off until a settings toggle
   exists?

## Estimates (focused sessions)

Phase A ~1 session · Phase B: swipe+chrome ~1 session, scrubber+sheets ~1 session ·
Phase C ~half. Each lands independently behind the ship loop; no big-bang.

---

## As built (2026-07-30) — answers, deviations, and what the plan got wrong

**Creator's answers to the four questions**
1. Bar slots: 2 ranked groups + Groups + Today + Map (Kit folded into the sheet), and
   "scale it for smaller phones than a Pro Max, for non-iOS, and for tablets."
2. Ranking: **this device's own tab-open counts in localStorage**.
3. Swipe scope: content groups only.
4. Haptics: on where supported, all three surfaces.

**Where the plan was wrong, and why**

- **"Telemetry-ranked groups" was not buildable.** The telemetry silo is write-only on the
  client (`bumpCounter` posts to Firebase; nothing reads it back), and it is a
  cross-visitor aggregate besides. Ranking is now per-device localStorage — the
  traveller's own habit, not a stranger's average. `model/rank.ts`.
- **The current group always holds a slot.** Not in the plan; without it a bar showing 2 of
  11 groups can display a set that excludes where the reader actually is. `seat()` then
  keeps a promoted group in the slot it already occupies, so the two buttons never trade
  places under the thumb that tapped them.
- **The bar is NOT a `role="tablist"`.** A tablist claiming to be the tab set while showing
  a fifth of it misreports the guide to a screen reader. Plain buttons + `aria-current`;
  the real strip keeps the tab semantics, and the sheet is the complete list.
- **The day scrubber is the EXISTING rail, not a right-edge dot column.** On a phone the
  itinerary is a horizontal snap deck, so a vertical rail would ask for a downward drag to
  move right — and `#dayScrub` already is the accessible day navigator. A second one
  beside it is what "merge before adding" forbids. The rail compacts to fit (4–12 days)
  and takes the drag on its own axis. `model/scrub.ts`.
- **`sheet-drag.js` lives in `src/scripts`, not the silo.** guide-ui needs it, and
  importing mobile-nav's index would self-boot that silo before guide-ui picks the initial
  tab — the ordering the bar's counting depends on.

**Two bugs only running it could find** (boundary check #2, forcing the failure path):
- Yielding chrome never yielded: every settled scroll rebounded ~2px from scroll anchoring
  (measured 430 → 428 → 430) and the "any upward pixel resets" rule wiped the accumulator
  on every sample. Fixed with a jitter floor + an upward-intent threshold in
  `model/yield.ts`; the exact rebound sequence is now a test.
- The day scrub landed on the wrong card: day-rail measures its deck delta from the
  CURRENT position, so a second request arriving mid-animation measures a moving target.
  day-rail now exposes `goTo(idx, instant)` and the scrubber asks for instant.

**Also shipped in the same pass (creator, mid-session):** the masthead pill row went from
six pills to three. `{n} days` was the third telling of the trip's dates, `{n} sights` was
an inventory count, and `✓ Works offline` read identically on every guide — a promise
about the site, not a fact about the page. Its honest per-page replacement
(`✓ Saved on this device`, matched against the real cache) is in the colophon. Row height
58px → 36px, and it no longer scrolls sideways at 320px.

**Not built:** nothing from the plan was dropped.
