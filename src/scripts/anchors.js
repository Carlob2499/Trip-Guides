// R5 section-anchor client behavior (docs/reference/motion.md — "one draw-in per figure on first
// view, then stillness"). Three jobs, all progressive enhancement over figures that are
// already COMPLETE in the server-rendered markup:
//
//   1. The overture: figures get .anch-pending (held at zero) only when motion is
//      welcome, then .anch-in exactly once as each scrolls into view — the safety
//      pattern: JS adds the hiding class, never the markup, so nothing can be left
//      hidden if this module never runs.
//   2. Today on the Days timeline: ring the stop whose data-tl-date matches the
//      visitor's local "Www Mmm D" — the same matching the journey bar's Today uses.
//   3. Progress rings: count each ring's own card checkboxes (state restored by
//      guide-ui before this module evaluates — import order in GuideLayout) and keep
//      counting on every change. The ring's fill transition is its own draw-in.

import { reducedMotion } from "./util.js";

(function () {
  /* ── today's stop ─────────────────────────────────────────────────────── */
  var DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var d = new Date();
  var todayStr = DOW[d.getDay()] + " " + MON[d.getMonth()] + " " + d.getDate();
  var todayStop = document.querySelector('.jl-stop[data-tl-date="' + todayStr + '"]');
  if (todayStop) todayStop.classList.add("jl-now");

  /* ── progress rings ───────────────────────────────────────────────────── */
  var rings = Array.prototype.slice.call(document.querySelectorAll("[data-ring]"));
  function updateRings() {
    rings.forEach(function (ring) {
      // .pnl: a Panel-hosted section (Atlas Phase 2) has no .card wrapper — the Panel
      // IS the card. Without this the ring ships live but never fills.
      var card = ring.closest(".card, .pnl");
      if (!card) return;
      var boxes = card.querySelectorAll('.check input[type=checkbox]');
      if (!boxes.length) return;
      var done = 0;
      boxes.forEach(function (b) { if (b.checked) done++; });
      var out = ring.querySelector("[data-ring-done]");
      if (out) out.textContent = String(done);
      ring.style.setProperty("--ring-frac", String(done / boxes.length));
      ring.classList.toggle("ring-done", done === boxes.length);
    });
  }
  if (rings.length) {
    // rAF: guide-ui (imported first) restores saved checkbox state during its own
    // evaluation — one frame later is safely after it, without coupling to its internals.
    requestAnimationFrame(updateRings);
    document.addEventListener("change", function (e) {
      if (e.target && e.target.matches && e.target.matches('.check input[type=checkbox]')) updateRings();
    });
  }

  /* ── the draw-in overture ─────────────────────────────────────────────── */
  if (reducedMotion()) return;                       // finished frames, no entrance
  if (!("IntersectionObserver" in window)) return;   // ancient browser: finished frames
  var figs = Array.prototype.slice.call(document.querySelectorAll("[data-anch]"));
  if (!figs.length) return;
  figs.forEach(function (f) { f.classList.add("anch-pending"); });
  // Hard safety rail: if the observer never delivers, finish every frame.
  var rail = setTimeout(function () { figs.forEach(show); }, 4000);
  function show(f) {
    f.classList.add("anch-in");
    f.classList.remove("anch-pending");
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { io.unobserve(e.target); show(e.target); }
    });
  }, { threshold: 0.35 });
  figs.forEach(function (f) { io.observe(f); });
  window.addEventListener("pagehide", function () { clearTimeout(rail); });
})();
