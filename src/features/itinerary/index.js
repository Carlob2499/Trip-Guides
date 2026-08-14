/** itinerary — the day-by-day interaction cluster: the day scrubber rail
    (day-rail), the reading spine (spine), the live now-line, per-day/full-pack
    printing (print-day), and story mode (the full-screen one-day-per-view deck).

    Each is a self-mounting IIFE with no cross-module coupling (only util.js).
    Import ORDER here reproduces their original execution order in the page
    bundle exactly — day-rail → now-line → spine → print-day →
    story-mode — so listener attachment relative to each other is unchanged;
    the one bundle-wide invariant (guide-ui runs before all of these) is
    preserved by importing this barrel after guide-ui in GuideLayout.
    Purely a side-effecting UI feature — no public API to export.

    A1: story-mode.js used to be deep-imported separately by GuideLayout.astro
    (bypassing this silo's own index contract) even though it executed
    immediately after this barrel anyway — folded in here instead, same
    execution position, one fewer deep import into the silo. */
/* swipe-nav.js left this silo on 2026-07-30 — it became the finger-tracked
   src/features/mobile-nav/ui/swipe-tabs.js. It attached only to #content and shared no
   element with anything below, so its removal does not disturb the order invariant. */
import "./ui/day-rail.js";
import "./ui/now-line.js";
import "./ui/spine.js";
import "./ui/print-day.js";
import "./ui/story-mode.js";
