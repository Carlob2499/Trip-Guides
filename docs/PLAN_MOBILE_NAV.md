# PLAN — Mobile Layout & Navigation ("feels like an app")

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
