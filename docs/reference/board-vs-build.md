# Board vs build — fidelity diff

Status: **OPEN — all 10 surfaces diffed, awaiting creator acceptance per surface**
Boards: `docs/mockups/compare/*.webp` · Contract: `docs/mockups/VISUAL_LINEAGE.md`
Opened: 2026-09-07

Each surface below is diffed against its approved board. Findings are split into two kinds,
because they need different decisions from you:

- **Measured** — an objective defect with a number attached. No taste required; these get fixed.
- **Fidelity** — the build and the board differ in composition. Only you can say which wins,
  because `VISUAL_LINEAGE.md` makes the board mandatory ancestry and some divergences are later
  product decisions that legitimately supersede it.

The active-trip surfaces were captured with the clock set to `2026-07-11` (Korea day 4), the
exact state board 02 composes. Both shipped guides have trips in the past, so the active cockpit
is unreachable at real time — worth knowing, because it means every screenshot gate in the repo
has only ever photographed the finished state of these surfaces.

---

## 01 · Atlas

**Measured — FIXED.** `.atlas-sheet-body` collapsed to 98px inside a 424px card, because
`flex: 1 1 auto` let the trailing chips (COMPLETE stamp, country code, weather) take their
content width first. "South Korea" wrapped onto three lines while most of the row sat empty.
`min-width: 0` was already present and cannot help — it permits shrinking, it reserves nothing.
Now 228px, one line.

**Fidelity — open.** The board's globe is a photographic Earth with visible landmass colour;
the build's is a flat navy silhouette. On a surface whose entire subject is the globe, this is
the largest single divergence in the pack.

**Fidelity — open.** The board carries four ivory cards under the frame (Upcoming trips, Saved
guides, Trip learnings, Atlas controls), each with photo thumbnails, plus an "Explore South
Korea" photo card. The build has a sparser set.

---

## 02 · Trip

**Measured — recorded, not fixed.** The metric strip stands 192px in the ~450px right rail
because PACE carries a sentence while STOPS TODAY ("5") and STRAIGHT-LINE ("151 km") sit in
~120px of dead space each.

Two fixes were tried and reverted, and the reasoning is in `trip.css`:
`grid auto-fit` orphaned the third tile on its own row at 234px — taller than the problem.
`-webkit-line-clamp: 3` closes it to 142px, but hides "LBF 17:00 KST (both inside the arena)"
and "your third is in Tokyo this weekend", which appear nowhere else in full.

The same strip renders correctly full-width on Itinerary, with PACE on one line. So this is a
**container-width** problem, not a content one: three tiles do not fit a 450px rail. The fix is
to stack the strip in the narrow rail. Listed here rather than done, because it changes the
composition board 02 draws.

**Fidelity — open.** The board's stop cards each carry a photo thumbnail. The build's are
text-only. The board is photo-led throughout and the build is text-led; this is the same gap as
Atlas's globe, in a different place.

**Fidelity — open.** The board's left rail has a WEATHER NOW card (24°, H27/L20, wind). The
build has no weather in the rail.

**Fidelity — open.** The board has a four-panel row inside the frame — RESERVATIONS, ESSENTIALS,
TRIP COMPANIONS, NOTES & DOCUMENTS. Not present in the build.

---

## 03 · Itinerary

No measured defects found at 1440. Day tabs, the day card, the timeline and the map pane all
align; the metric strip is correct at this width. Closest surface to its board so far.

---

## 04 · Map

**Changed this session.** The map now composes edge to edge on desktop, as the single documented
exemption to the frame (`design-system.md`, "The frame"). A map has no edges for a frame to
honour. Awaiting your acceptance as a deliberate departure.

---

## 05 · Guide

**Measured — FIXED.** The cover plate hung 86px past the bottom of the photograph with the dek's
last line on cream. Now flush; a containment gate in `resilience.spec.ts` fails if it recurs.

**Measured — FIXED.** Cover contrast failed after that fix at 2.93:1 (title) and 4.23:1 (dek),
and 1.71:1 / 1.94:1 on a phone, where the dek reflows to five full-width lines and a corner-shaped
scrim cannot serve it. The scrim now takes the shape of its text: 6.10 / 7.93 at 375, 8.97 / 12.04
at 768, 6.08 / 8.21 at 1440.

**Fidelity — needs your call.** The board puts the search pill *inside* the hero. You asked for it
to be removed and it has been. Your instruction wins over a board; recorded here because
`VISUAL_LINEAGE.md` makes the board mandatory and the disagreement should be visible.

**Fidelity — open.** The board's "Explore by topic" is a six-up row of photo cards with captions
beneath. The build is a numbered 01–09 grid of dark cards with small thumbnails. Largest
composition divergence on this surface.

---

## 06 · Search

No defects found. The overlay looked unscrimmed in a screenshot and is not: `.srch` is fixed at
`rgba(15,20,26,.45)`, z-960, with `body.srch-lock`. Recorded because the eye said otherwise and
the measurement settled it.

---

## 07 · Builder

**Measured — FIXED.** Arriving on `/new/` scrolled the page to y=151, past the strip and the
page's own heading, before the reader had seen either. The initial render already passes
`{ focus: false }` to say "do not take over on arrival", and `focus()` honoured it with
`preventScroll` — but the `scrollIntoView` on the next line ran unconditionally and undid it.
Gated on the same flag. Arrival is now y=0; advancing still scrolls, which is where that
behaviour belongs.

**Fidelity — open.** "Which country?" renders "Brazil" as both the sub-label and the input
placeholder, which reads as a stray value rather than an example.

---

## 08 · Split

**Fidelity — open.** The build centres a cream slab on the painted-atlas landscape, leaving large
empty painted areas either side, and the frame terminates mid-page with content continuing on
cream below. Reads as unresolved rather than composed.

---

## 09 · SOS

Not separately diffed: `prep()` in the a11y sweep opens this sheet on every page it scans, so it
is already measured for contrast and touch targets across ten devices on four pages.

---

## 10 · Learnings

No measured defects. The recap's stat tiles (STOPS MADE 21 of 37, DAYS 8, SKIPPED 16) are wide
and short with correct rhythm — the same component that is cramped in the Trip rail, which
confirms the board-02 finding as container width rather than content.

**Fidelity — open.** The ESSENTIALS and SPLIT cards share a two-column row and have very unequal
heights, leaving a large void under SPLIT.

---

## Cross-cutting

**Off-token colour.** `painted-atlas.css`, `sights.css` and `trip-split.css` paint hard-coded hex
outside the token system; the drift checker lists 360 colour findings. Any palette change has to
convert these or they will not follow it.

**Photography.** The single most consistent difference between board and build is that the boards
are photo-led — globe, stop cards, topic cards, trip cards all carry real imagery — and the build
renders the same slots as text or small thumbnails. It shows up independently on 01, 02 and 05,
which suggests one decision rather than three.
