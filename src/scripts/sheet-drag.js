/* Drag-to-dismiss for bottom sheets — the groups sheet and the SOS sheet.

   A sheet that only closes by a button or a backdrop tap reads like a dialog bolted to
   the bottom of a page. One that follows the thumb down and either falls away or springs
   back reads like a sheet. This is the shared implementation of that, so both sheets
   behave identically rather than each growing its own threshold.

   It lives in src/scripts, not in a feature silo, deliberately: it is one small piece of
   client behaviour with no state and no data access, and both of its callers already
   import from here. Putting it in the mobile-nav silo would have forced guide-ui to
   import that silo's index, which self-boots — and its boot MUST happen after guide-ui
   has chosen the initial tab.

   Two rules keep it from stealing gestures:
   · a drag that starts inside a scrolled list belongs to that list, so it only arms when
     the nearest scrollable ancestor is already at the top;
   · only downward movement moves the sheet — dragging up rubber-bands to nothing. */

import { tapHaptic, reducedMotion } from "./util.js";

/** Fraction of the sheet's height that counts as "let it go". */
export const DISMISS_FRACTION = 0.25;
/** …or a downward flick this fast (px/ms), however short. */
export const DISMISS_VELOCITY = 0.6;
/** Below this the drag is a tap or a jitter, not a gesture. */
export const DRAG_LOCK = 6;

/**
 * Should a released sheet drag dismiss? `dy` is downward-positive travel, `vy` px/ms,
 * `height` the sheet's own height. Pure so the thresholds are testable.
 */
export function sheetDismiss(dy, vy, height) {
  if (dy <= DRAG_LOCK) return false;
  if (height > 0 && dy >= height * DISMISS_FRACTION) return true;
  return vy >= DISMISS_VELOCITY;
}

/** The nearest ancestor that actually scrolls vertically, or null. */
function scrollableFrom(el, stop) {
  while (el && el !== stop) {
    if (el.scrollHeight > el.clientHeight + 2) {
      var oy = getComputedStyle(el).overflowY;
      if (oy === "auto" || oy === "scroll") return el;
    }
    el = el.parentElement;
  }
  return null;
}

/**
 * Wire drag-to-dismiss on one sheet panel.
 * `onClose` runs the caller's OWN close path — this never hides anything itself, so
 * focus restoration, scroll locking and aria state stay with whoever owns the sheet.
 */
export function attachSheetDrag(panel, onClose) {
  if (!panel || typeof onClose !== "function") return;
  var reduced = reducedMotion();
  var sy = 0, ly = 0, lt = 0, vy = 0, pid = null, dragging = false;

  panel.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse") return; // a mouse has the close button and the backdrop
    var sc = scrollableFrom(e.target, panel);
    if (sc && sc.scrollTop > 0) return;    // that list is mid-scroll; the gesture is its own
    pid = e.pointerId;
    sy = ly = e.clientY;
    lt = Date.now();
    vy = 0;
    dragging = false;
  });

  panel.addEventListener("pointermove", function (e) {
    if (pid === null || e.pointerId !== pid) return;
    var dy = e.clientY - sy;
    if (!dragging) {
      if (dy < DRAG_LOCK) return;          // upward or still — nothing to do
      dragging = true;
      panel.classList.add("sheet-dragging");
      try { panel.setPointerCapture(pid); } catch (err) { /* capture is a nicety */ }
    }
    var now = Date.now(), dt = now - lt;
    if (dt > 0) vy = (e.clientY - ly) / dt;
    ly = e.clientY; lt = now;
    if (!reduced) panel.style.transform = "translateY(" + Math.max(0, dy) + "px)";
  });

  function finish(e) {
    if (pid === null || (e && e.pointerId !== pid)) return;
    try { panel.releasePointerCapture(pid); } catch (err) { /* already released */ }
    pid = null;
    if (!dragging) return;
    dragging = false;
    panel.classList.remove("sheet-dragging");
    var dy = e ? e.clientY - sy : 0;
    // A thumb that stopped before lifting has no velocity, however fast it got there.
    if (Date.now() - lt > 90) vy = 0;
    panel.style.transform = "";
    if (sheetDismiss(dy, vy, panel.getBoundingClientRect().height)) {
      tapHaptic();
      onClose();
    }
  }
  panel.addEventListener("pointerup", finish);
  panel.addEventListener("pointercancel", finish);
}
