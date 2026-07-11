/** itinerary — the day-by-day interaction cluster: the day scrubber rail
    (day-rail), the reading spine (spine), the live now-line, mobile swipe
    navigation (swipe-nav), and per-day/full-pack printing (print-day).

    Each is a self-mounting IIFE with no cross-module coupling (only util.js).
    Import ORDER here reproduces their original execution order in the page
    bundle exactly — day-rail → swipe-nav → now-line → spine → print-day — so
    listener attachment relative to each other is unchanged; the one bundle-wide
    invariant (guide-ui runs before all of these) is preserved by importing this
    barrel after guide-ui in GuideLayout. Behavioral coverage:
    tests/visual/itinerary.spec.ts (must stay green across this move). Purely a
    side-effecting UI feature — no public API to export. */
import "./ui/day-rail.js";
import "./ui/swipe-nav.js";
import "./ui/now-line.js";
import "./ui/spine.js";
import "./ui/print-day.js";
