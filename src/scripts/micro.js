/* Waypoint micro-interactions — the small tactile layer on top of the CSS
   spring-press system (base/guide/planner/flight .css own the :active scale).
   Two behaviors, both progressive and cheap:
     1. Haptic tap — one short buzz on a real touch of a key control. One
        delegated listener; no-ops on every device without the Vibration API.
     2. Magnetic pull — the ONE cursor-following flourish, scoped to the
        "next section" CTA where a gentle pull toward the pointer reads as a
        real "come here" affordance, not decoration. Pointer-fine + non-touch
        + motion-allowed only. Uses the independent `translate` property so it
        composes with the CTA's CSS hover-lift and press-scale (which live on
        the `transform` channel) instead of fighting them. */

import { reducedMotion, tapHaptic } from "./util.js";

(function () {
  var HAPTIC = ".gtab,.dchip,.topbar-btn,.next-cta,.sos-btn,.sc-add-btn,.sc-add-expense-btn,.share-copy-btn";
  document.addEventListener("pointerdown", function (e) {
    if (e.pointerType !== "touch") return;
    var t = e.target;
    if (t && t.closest && t.closest(HAPTIC)) tapHaptic();
  }, { passive: true });

  // Magnetic pull — desktop pointer only, and never when motion is reduced.
  if (reducedMotion()) return;
  if (!window.matchMedia || !window.matchMedia("(hover:hover) and (pointer:fine)").matches) return;

  var PULL = 6; // px cap in each axis — deliberately subtle
  function clamp(n) { return n < -1 ? -1 : n > 1 ? 1 : n; }

  Array.prototype.forEach.call(document.querySelectorAll(".next-cta"), function (btn) {
    btn.addEventListener("pointermove", function (e) {
      var r = btn.getBoundingClientRect();
      var dx = clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2));
      var dy = clamp((e.clientY - (r.top + r.height / 2)) / (r.height / 2));
      btn.style.translate = (dx * PULL).toFixed(1) + "px " + (dy * PULL).toFixed(1) + "px";
    });
    btn.addEventListener("pointerleave", function () { btn.style.translate = "0 0"; });
  });
})();
