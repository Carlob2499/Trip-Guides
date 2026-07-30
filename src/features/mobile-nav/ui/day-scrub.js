/* Drag-to-scrub on the day rail (#dayScrub), phone and tablet only.

   The rail is already the itinerary's keyboard-first day navigator; this makes it a
   SCRUBBER too, so finding day 6 of 8 is one thumb sweep instead of a tap, a look, and
   another tap. Taps, arrow keys, aria-current and day-rail.js's scroll-spy are all
   untouched — this only adds a gesture and a bubble on top of them.

   Why the rail and not the plan's right-edge dot column: on a phone the itinerary is a
   HORIZONTAL snap deck, so a vertical rail would ask for a downward drag to move right,
   and a second day navigator beside the existing one is exactly what "merge before
   adding" forbids. Model + reasoning: ../model/scrub.ts.

   Every jump goes through the real chip's click, so day-rail owns the scrolling and
   there is no second implementation of "go to day N" to drift. */

import { canScrub, dayFromX, SCRUB_LOCK } from "../model/scrub";
import { tapHaptic } from "../../../scripts/util.js";

export function initDayScrub() {
  if (!window.matchMedia("(max-width: 899px)").matches) return;
  var rail = document.getElementById("dayScrub");
  if (!rail) return;
  var chips = Array.prototype.slice.call(rail.querySelectorAll("[data-day-jump]"));
  if (!canScrub(chips.length)) return;

  rail.classList.add("scrub-fit"); // compacts the chips so every day fits the width
  rail.setAttribute("aria-roledescription", "day scrubber");

  var bubble = document.createElement("span");
  bubble.className = "scrub-bubble";
  bubble.setAttribute("aria-hidden", "true"); // the chips already announce the day
  rail.appendChild(bubble);

  var startX = 0, scrubbing = false, last = -1, pid = null;

  function label(i) {
    var d = chips[i] && chips[i].querySelector(".dchip-date");
    return d ? (d.textContent || "").trim() : String(i + 1);
  }
  function goTo(i, x) {
    if (i === last) { place(x); return; }
    last = i;
    tapHaptic();
    // day-rail owns the scroll. Instant, not smooth: one sweep asks for several days,
    // and its deck delta is measured from the current position — a request landing
    // mid-animation measures a moving target and lands on the wrong card.
    var api = rail.__dayRail;
    if (api && api.goTo) api.goTo(i, true);
    else chips[i].click();
    bubble.textContent = label(i);
    place(x);
  }
  function place(x) {
    var r = rail.getBoundingClientRect();
    // Keep the bubble inside the rail even when the thumb is at either end.
    var px = Math.max(28, Math.min(r.width - 28, x - r.left));
    bubble.style.setProperty("--scrub-x", px + "px");
  }

  // Arrow keys move along the rail the way a slider does — the same day-to-day step the
  // drag makes, for anyone who isn't using a thumb.
  rail.addEventListener("keydown", function (e) {
    var i = chips.indexOf(document.activeElement);
    if (i === -1) return;
    var n = e.key === "ArrowRight" ? i + 1
      : e.key === "ArrowLeft" ? i - 1
      : e.key === "Home" ? 0
      : e.key === "End" ? chips.length - 1 : null;
    if (n === null) return;
    e.preventDefault();
    n = Math.max(0, Math.min(chips.length - 1, n));
    chips[n].focus();
    chips[n].click();
  });

  rail.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startX = e.clientX;
    scrubbing = false;
    last = -1;
    pid = e.pointerId;
  });

  rail.addEventListener("pointermove", function (e) {
    if (pid === null || e.pointerId !== pid) return;
    if (!scrubbing) {
      if (Math.abs(e.clientX - startX) < SCRUB_LOCK) return;
      scrubbing = true;
      rail.classList.add("scrubbing");
      // Capture so the gesture survives the thumb leaving the 44px rail vertically —
      // fingers drift, and losing the scrub mid-sweep feels like the page dropped it.
      try { rail.setPointerCapture(pid); } catch (err) { /* capture is a nicety */ }
    }
    var r = rail.getBoundingClientRect();
    goTo(dayFromX(e.clientX, r.left, r.width, chips.length), e.clientX);
  });

  function end(e) {
    if (pid === null || (e && e.pointerId !== pid)) return;
    try { rail.releasePointerCapture(pid); } catch (err) { /* already released */ }
    pid = null;
    if (!scrubbing) return;
    scrubbing = false;
    rail.classList.remove("scrubbing");
    // A scrub already landed on its day; letting the release also fire a chip click
    // would re-trigger the jump (and, at the edges, a different day).
    if (e) e.preventDefault();
  }
  rail.addEventListener("pointerup", end);
  rail.addEventListener("pointercancel", end);
  rail.addEventListener("click", function (e) {
    if (last !== -1 && !scrubbing) { e.stopPropagation(); e.preventDefault(); last = -1; }
  }, true);
}
