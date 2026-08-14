/** mobile-nav — the phone's primary navigation: a bottom tab bar that promotes the
    groups this traveller actually uses, plus the Groups sheet's resume lines.

    Under 900px the top chip strip is hidden and THIS is how the guide is navigated
    (guide.css / mobile-nav.css). The bar never re-implements tab switching: it clicks
    the real `.gtab` buttons, so scroll-memory, scroll-spy, telemetry and the saved-tab
    session key all keep working through exactly one code path.

    Ranking is per-DEVICE and local (creator's call 2026-07-30). The telemetry silo is
    write-only on the client — `bumpCounter` posts to Firebase and nothing reads it back
    — and it is a cross-visitor aggregate besides. What belongs in one traveller's thumb
    reach is that traveller's own habit, so counts live in localStorage and never leave
    the device.

    Data access is an injectable gateway (the silo contract): pass your own `store` and
    a test or a future backend swaps the sink without touching ui/. */

import { initBotBar } from "./ui/botbar.js";
import { initResume, initSectionMemory, initResumeChip, initRailResume } from "./ui/resume.js";
import { initSwipeTabs } from "./ui/swipe-tabs.js";
import { initYieldChrome } from "./ui/yield-chrome.js";
import { initDayScrub } from "./ui/day-scrub.js";
import { MOBILE_MAX } from "../../lib/breakpoints";

export {
  parseCounts, recordOpen, rankOrder, promoted, seat, slotLabel, resumeLine,
} from "./model/rank";
export { axisLocked, resolveCommit, damp, atEdge } from "./model/gesture";

/** The default gateway — plain localStorage, every access already fail-safe. */
export const localStore = {
  read: function (key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  },
  write: function (key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* private mode / quota */ }
  },
};

/**
 * Boot the mobile navigation for one guide.
 * `cfg` = { order: string[], storeKey: string }. Returns silently on any page that
 * isn't a guide (no tab bar, no bottom bar) so importing is always safe.
 */
function initMobileNav(cfg, store) {
  var order = (cfg && cfg.order) || [];
  var storeKey = (cfg && cfg.storeKey) || "guide";
  var tabs = document.getElementById("guideTabs");
  var bar = document.querySelector(".botbar");
  if (!tabs || !order.length) return;
  var ctx = {
    order: order, storeKey: storeKey, tabs: tabs, bar: bar,
    destTz: (cfg && cfg.destTzIana) || null,
    store: store || localStore,
  };
  // Section memory feeds the sheet's resume lines and must run even where the bar
  // doesn't (a desktop session still records where you were, for the next phone one).
  initSectionMemory(ctx);
  initResume(ctx);
  initRailResume(ctx);
  initResumeChip(ctx);
  if (bar) initBotBar(ctx);
  // After the bar, which publishes the indicator the gesture drives.
  initSwipeTabs(ctx);
  // Chrome only yields where it is in the way — the bar's own breakpoint.
  if (bar && window.matchMedia("(max-width: " + MOBILE_MAX + "px)").matches) initYieldChrome(ctx);
  // After day-rail has wired the chips, which the scrubber drives through their clicks.
  initDayScrub();
}

// Self-boot on a guide page (the import-to-boot convention the other silos use).
// Guarded for non-browser so the model tests — and Astro's build-time import of this
// file for `slotLabel` — never touch the DOM.
if (typeof document !== "undefined") {
  try {
    var _el = document.getElementById("tgConfig");
    var _cfg = _el ? JSON.parse(_el.textContent || "{}") : {};
    initMobileNav(_cfg);
  } catch (e) { /* navigation degrades to the sheet; never breaks the page */ }
}
