/** itinerary — the day-by-day interaction cluster: the day scrubber rail
    (day-rail), the reading spine (spine), the live now-line, mobile swipe
    navigation (swipe-nav), per-day/full-pack printing (print-day), and story
    mode (the full-screen one-day-per-view deck).

    Each is a self-mounting IIFE with no cross-module coupling (only util.js).
    Import ORDER here reproduces their original execution order in the page
    bundle exactly — day-rail → swipe-nav → now-line → spine → print-day →
    story-mode — so listener attachment relative to each other is unchanged;
    the one bundle-wide invariant (guide-ui runs before all of these) is
    preserved by importing this barrel after guide-ui in GuideLayout.
    Behavioral coverage: tests/visual/itinerary.spec.ts (must stay green
    across this move). Purely a side-effecting UI feature — no public API to
    export.

    A1: story-mode.js used to be deep-imported separately by GuideLayout.astro
    (bypassing this silo's own index contract) even though it executed
    immediately after this barrel anyway — folded in here instead, same
    execution position, one fewer deep import into the silo. */
import "./ui/day-rail.js";
import "./ui/swipe-nav.js";
import "./ui/now-line.js";
import "./ui/spine.js";
import "./ui/print-day.js";
import "./ui/story-mode.js";
