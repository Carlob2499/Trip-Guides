/** mobile-nav — the phone chrome's behaviour (design-system.md D6-05/D6-43).

    The five-slot bottom bar and the compact top chrome are MARKUP (AppChrome.astro); the
    router (guide-ui.js) sets their current state. This silo owns only what the page's
    scroll does to them: reading down lets the bar and the expanded Search field yield,
    stopping or scrolling up brings them straight back, and focus into yielded chrome
    restores it. The adaptive slot ranking, the section-resume lines, the swipe between
    destinations and the Groups sheet were retired by D6-01/D6-44 — the destination model is
    stable and tap-driven, and the same five slots render for everyone. */

import { initYieldChrome } from "./ui/yield-chrome.js";
import { MOBILE_MAX } from "../../lib/breakpoints";

export { nextYield, initialYield, YIELD_AT, RETURN_AT, TOP_ZONE } from "./model/yield";

if (typeof document !== "undefined") {
  var bar = document.querySelector(".botbar");
  // Chrome yields on phones only; the desktop row is part of a persistent utility bar.
  if (bar && window.matchMedia("(max-width: " + MOBILE_MAX + "px)").matches) initYieldChrome({ bar: bar });
}
