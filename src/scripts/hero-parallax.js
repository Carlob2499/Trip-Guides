/* Waypoint hero parallax — the masthead photo drifts slower than the page as
   you scroll away, a restrained depth cue. Transform-only (GPU-cheap), rAF-
   throttled, and fully disabled under prefers-reduced-motion. No-op on the
   typographic scaffold heroes (no photo to move). */

(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var img = document.querySelector(".mast-photo .mast-img");
  var frame = document.querySelector(".mast-photo .mast-frame");
  if (!img || !frame) return;

  // Base scale > 1 gives headroom so the parallax translate never exposes an
  // edge. JS owns the transform end-to-end (see masthead.css note).
  var SCALE = 1.06;
  var ticking = false;
  function update() {
    ticking = false;
    var rect = frame.getBoundingClientRect();
    if (rect.bottom < 0) return; // scrolled fully past — nothing to move
    var shift = Math.max(0, -rect.top) * 0.14; // up to ~14% of scroll distance
    img.style.transform = "translate3d(0," + shift.toFixed(1) + "px,0) scale(" + SCALE + ")";
  }
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });

  // Ken Burns drift-in: start slightly larger, ease to the base scale once.
  img.style.transform = "translate3d(0,0,0) scale(1.12)";
  requestAnimationFrame(function () {
    img.style.transition = "transform 1.6s cubic-bezier(.2,.7,.2,1)";
    update();
    // Drop the transition after it plays so scroll parallax stays instant.
    setTimeout(function () { img.style.transition = ""; }, 1700);
  });
})();
