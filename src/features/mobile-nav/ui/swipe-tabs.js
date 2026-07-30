/* Finger-tracked swipe between content groups (was itinerary/ui/swipe-nav.js, a
   discrete 72px-threshold swipe; rewritten and moved 2026-07-30).

   The difference is that the page now answers DURING the gesture instead of after it:
   content translates under the thumb, the bottom bar's indicator slides off its slot,
   and a release either carries through or springs back. A gesture you can see failing
   is a gesture you can learn; the old version either did nothing or teleported.

   Conservative by design — a page must never feel hijacked:
   · only on coarse-pointer / small screens, and only across CONTENT groups
     (creator's call: a tool panel is entered and left deliberately, so a stray swipe
     can't drop you out of a half-filled budget form)
   · axis-locked: |dx| > |dy| AND > 24px before anything moves, so a diagonal scroll
     stays a scroll
   · never when the touch starts inside something that scrolls horizontally itself
     (day deck, tab strip, tables) or owns its own gestures (maps), or under an overlay
   · single touch only, so it never fights text selection or a pinch
   · reduced motion → no tracking and no slide; the commit still works, instantly.

   The old `data-swipe-hint` edge glow retired with this rewrite: it existed to answer a
   gesture that was otherwise invisible until it completed, and the content moving under
   the finger says the same thing better (and says it continuously). */

import { tapHaptic } from "../../../scripts/util.js";
import { reducedMotion } from "../../../scripts/util.js";
import { axisLocked, resolveCommit, damp, atEdge } from "../model/gesture";

export function initSwipeTabs(ctx) {
  if (!window.matchMedia("(max-width: 899px)").matches &&
      !window.matchMedia("(pointer: coarse)").matches) return;
  var tabs = ctx.tabs;
  var content = document.getElementById("content");
  if (!content) return;
  var count = document.querySelectorAll(".catblock").length;
  if (count < 2) return;
  var reduced = reducedMotion();
  var bar = ctx.bar;
  var ind = bar && bar.__mnIndicator ? bar.__mnIndicator : null;

  function currentIdx() {
    var a = tabs.querySelector(".gtab-active");
    if (!a) return -1;
    var v = parseInt(a.getAttribute("data-tab"), 10);
    return isNaN(v) ? -1 : v; // a tool panel is open → no swipe
  }

  // A touch that begins inside a horizontally scrollable region (or an itinerary map,
  // which owns its own pan/zoom) belongs to that region, not to us.
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

  // No gesture-start timestamp: commit is decided by distance and INSTANTANEOUS velocity
  // (the old discrete swipe used total elapsed time; a finger-tracked one must not care
  // how long you spent aiming).
  var sx = 0, sy = 0, lx = 0, lt = 0, vx = 0;
  var tracking = false, locked = false;

  function paint(dx) {
    if (reduced) return;
    var edge = atEdge(dx, currentIdx(), count);
    var d = damp(dx, edge);
    content.style.transform = "translate3d(" + d + "px,0,0)";
    content.style.opacity = String(1 - Math.min(Math.abs(d) / (window.innerWidth * 0.9), 0.35));
    if (ind && ind.el && ind.el.classList.contains("on")) {
      var on = bar.querySelector(".botslot-on");
      // The indicator leaves with the group it marks: the destination is usually not
      // one of the two promoted slots, so sliding it TOWARD a slot would point at the
      // wrong group. It drifts and fades instead, then re-seats after the commit.
      if (on) ind.el.style.setProperty("--mn-ind-x", (on.offsetLeft + d * 0.35) + "px");
      ind.el.style.opacity = String(1 - Math.min(Math.abs(d) / 260, 0.75));
    }
  }
  function release(animateFrom) {
    document.body.classList.remove("botbar-dragging");
    if (ind && ind.el) { ind.el.style.opacity = ""; }
    if (reduced) { content.style.transform = ""; content.style.opacity = ""; return; }
    if (animateFrom != null) {
      // Direction-aware arrival: the new group enters from the side the old one left.
      content.style.transition = "none";
      content.style.transform = "translate3d(" + animateFrom + "px,0,0)";
      content.style.opacity = "0.4";
      // Two frames — one to commit the jump, one for the transition to have a start.
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          content.style.transition = "";
          content.style.transform = "";
          content.style.opacity = "";
        });
      });
      return;
    }
    content.style.transform = "";
    content.style.opacity = "";
  }

  content.addEventListener("touchstart", function (e) {
    tracking = e.touches.length === 1 && !overlayOpen() && !ownsGesture(e.target);
    locked = false;
    if (!tracking) return;
    sx = lx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
    lt = Date.now();
    vx = 0;
  }, { passive: true });

  content.addEventListener("touchmove", function (e) {
    if (!tracking) return;
    var t = e.touches[0];
    var dx = t.clientX - sx, dy = t.clientY - sy;
    if (!locked) {
      // Give up for this touch the moment it commits to vertical — re-arming
      // mid-scroll is how a page ends up stealing a fling.
      if (Math.abs(dy) > 18 && Math.abs(dy) >= Math.abs(dx)) { tracking = false; return; }
      if (!axisLocked(dx, dy)) return;
      locked = true;
      document.body.classList.add("botbar-dragging");
      content.classList.add("mn-swiping");
    }
    var now = Date.now(), dt = now - lt;
    if (dt > 0) vx = (t.clientX - lx) / dt; // instantaneous, so a flick beats an average
    lx = t.clientX; lt = now;
    paint(dx);
  }, { passive: true });

  function cancel() {
    if (!tracking) return;
    tracking = false;
    if (locked) { content.classList.remove("mn-swiping"); release(null); }
    locked = false;
  }
  content.addEventListener("touchcancel", cancel, { passive: true });

  content.addEventListener("touchend", function (e) {
    if (!tracking) return;
    tracking = false;
    if (!locked) return;
    locked = false;
    content.classList.remove("mn-swiping");
    var t = e.changedTouches[0];
    var dx = t.clientX - sx;
    // A finger resting at the end of a drag has no velocity, however fast it got there.
    if (Date.now() - lt > 90) vx = 0;
    var next = resolveCommit(dx, vx, window.innerWidth, currentIdx(), count);
    if (next === null) { release(null); return; }
    tapHaptic();
    var btn = tabs.querySelector('.gtab[data-tab="' + next + '"]');
    if (!btn) { release(null); return; }
    btn.click();
    release(dx < 0 ? window.innerWidth * 0.28 : -window.innerWidth * 0.28);
  }, { passive: true });
}
