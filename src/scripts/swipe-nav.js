/* Waypoint swipe navigation — the flight gesture on mobile. A deliberate
   horizontal swipe on the content area flies to the previous/next section
   (through the real tab buttons, so flight direction, saved-tab state, and
   scroll behavior all hold). Conservative by design — a page must never feel
   hijacked:
   · only on coarse-pointer/small screens
   · only clearly horizontal swipes (|dx| ≥ 72px, |dy| < 46px, < 650ms)
   · never when the touch starts inside anything that scrolls horizontally
     itself (tab bar, day scrubber, maps, tables) or an open overlay
   · never fights text selection (single touch only). */

import { tapHaptic } from "./util.js";

(function () {
  if (!window.matchMedia("(max-width: 899px)").matches &&
      !window.matchMedia("(pointer: coarse)").matches) return;
  var tabs = document.getElementById("guideTabs");
  var content = document.getElementById("content");
  if (!tabs || !content) return;

  var catCount = document.querySelectorAll(".catblock").length;
  if (catCount < 2) return;

  function currentIdx() {
    var active = tabs.querySelector(".gtab-active");
    var v = active ? parseInt(active.getAttribute("data-tab"), 10) : NaN;
    return isNaN(v) ? -1 : v; // -1 on special panels (budget/vote) → no swipe
  }

  // A touch that begins inside a horizontally scrollable region (or a Leaflet
  // map, which owns its gestures) belongs to that region.
  function ownsGesture(el) {
    while (el && el !== content) {
      if (el.hasAttribute && el.hasAttribute("data-itin-map")) return true;
      if (el.scrollWidth > el.clientWidth + 4) {
        var ox = getComputedStyle(el).overflowX;
        if (ox === "auto" || ox === "scroll") return true;
      }
      el = el.parentElement;
    }
    return false;
  }
  function overlayOpen() {
    return document.body.classList.contains("sheet-lock") ||
      document.querySelector(".pal-backdrop.pal-open");
  }

  var sx = 0, sy = 0, st = 0, tracking = false;
  function clearHint() { document.documentElement.removeAttribute("data-swipe-hint"); }

  content.addEventListener("touchstart", function (e) {
    tracking = e.touches.length === 1 && !overlayOpen() && !ownsGesture(e.target);
    if (!tracking) return;
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now();
  }, { passive: true });

  // Live edge glow while a horizontal swipe is forming — the page answers the
  // gesture before it completes, so the traveler learns it's working.
  content.addEventListener("touchmove", function (e) {
    if (!tracking) return;
    var t = e.touches[0];
    var dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) > 34 && Math.abs(dy) < 46) {
      document.documentElement.setAttribute("data-swipe-hint", dx < 0 ? "fwd" : "back");
    } else clearHint();
  }, { passive: true });
  content.addEventListener("touchcancel", clearHint, { passive: true });

  content.addEventListener("touchend", function (e) {
    if (!tracking) return;
    tracking = false;
    clearHint();
    var t = e.changedTouches[0];
    var dx = t.clientX - sx, dy = t.clientY - sy, dt = Date.now() - st;
    if (Math.abs(dx) < 72 || Math.abs(dy) > 46 || dt > 650) return;
    var cur = currentIdx();
    if (cur < 0) return;
    var next = dx < 0 ? cur + 1 : cur - 1; // swipe left = next section
    if (next < 0 || next >= catCount) return;
    tapHaptic();
    var btn = tabs.querySelector('.gtab[data-tab="' + next + '"]');
    if (btn) btn.click();
  }, { passive: true });
})();
