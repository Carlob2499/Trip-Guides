/** itinerary — the day-by-day interaction cluster (design-system.md D6-20/34/35/49).

    · day-rail    — the ONE day switch: one day shown at a time, the thumb-zone rail, the
                    header date row, scrub/tap/keys/adjacent-day swipe (contextual, D6-44).
    · workbench   — the desktop timeline/map divider and pane collapse.
    · now-line    — live stop states on today's card (past / next) against the destination clock.
    · print-day   — per-day and full-pack printing.

    Story mode, the desktop reading spine and the SCRL-style day deck are retired (D6-45,
    D6-12): the timed-stop payload they consumed now lives in #tripData (features/trip).
    Order: the rail first (it decides which day is visible), then everything that reads it. */
import { initDayRail } from "./ui/day-rail.js";
import { initWorkbench } from "./ui/workbench.js";
import "./ui/now-line.js";
import "./ui/print-day.js";

export { resolveSwipe } from "./model/gesture";
export { initDayRail, initWorkbench };

if (typeof document !== "undefined") {
  initDayRail(document);
  initWorkbench(document);
}
