/* Waypoint STORY MODE — the itinerary as a full-screen, one-day-per-view deck.
   The days rail (segments = days, the signature) becomes navigation: tap the side
   chevrons, swipe, arrow-key, or tap a segment to move day to day. Structured data
   from #storyDays; opens from any [data-story-open] trigger. Scroll-locked while
   open, Esc / ✕ / swipe-down to exit, aria-live announces each day.

   Confident slide/fade motion; reduced-motion → instant. Fault-safe: if the data or
   trigger is missing it simply never opens — the normal scrollable itinerary is
   always there underneath. Reuses the tested gesture model (resolveSwipe). */

import { reducedMotion, tapHaptic } from "../../../scripts/util.js";
import { resolveSwipe } from "../model/gesture";

(function () {
  var dataEl = document.getElementById("storyDays");
  var triggers = document.querySelectorAll("[data-story-open]");
  if (!dataEl || !triggers.length) return;
  var days;
  try { days = JSON.parse(dataEl.textContent || "[]"); } catch (e) { return; }
  if (!Array.isArray(days) || !days.length) return;

  var N = days.length;
  var reduce = reducedMotion();
  function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; }

  var overlay = null, panel = null, rail = null, liveEl = null, cur = 0, lastFocus = null;

  function stopsHtml(d) {
    if (!d.stops || !d.stops.length) return "";
    var h = '<ol class="sm-stops" aria-label="Stops this day">';
    for (var i = 0; i < d.stops.length; i++) {
      var w = d.stops[i];
      h += '<li class="sm-stop"><span class="sm-stop-n">' + String(i + 1).padStart(2, "0") + "</span>" +
        '<span class="sm-stop-main"><span class="sm-stop-name">' + esc(w.name) + "</span>" +
        (w.note ? '<span class="sm-stop-note">' + esc(w.note) + "</span>" : "") + "</span>" +
        (w.time ? '<span class="sm-stop-time">' + esc(w.time) + "</span>" : "") + "</li>";
    }
    return h + "</ol>";
  }
  function panelHtml(i) {
    var d = days[i];
    return '<p class="sm-eyebrow">Day ' + (i + 1) + " of " + N + " · " + esc(d.date) + "</p>" +
      '<h2 class="sm-title">' + esc(d.title || d.date) + "</h2>" +
      (d.tldr ? '<p class="sm-tldr">' + esc(d.tldr) + "</p>" : "") +
      (d.pace ? '<p class="sm-pace">⏱ ' + esc(d.pace) + "</p>" : "") +
      stopsHtml(d);
  }

  function render(i, dir) {
    cur = Math.max(0, Math.min(N - 1, i));
    panel.innerHTML = panelHtml(cur);
    panel.scrollTop = 0;
    var segs = rail.children;
    for (var s = 0; s < segs.length; s++) segs[s].className = "sm-seg" + (s < cur ? " done" : s === cur ? " now" : "");
    var pos = overlay.querySelector(".sm-pos");
    if (pos) pos.textContent = "Day " + (cur + 1) + " / " + N;
    var prev = overlay.querySelector(".sm-prev"), next = overlay.querySelector(".sm-next");
    if (prev) prev.disabled = cur === 0;
    if (next) next.disabled = cur === N - 1;
    if (!reduce) {
      panel.classList.remove("sm-in-l", "sm-in-r");
      void panel.offsetWidth; // restart the animation
      panel.classList.add(dir < 0 ? "sm-in-l" : "sm-in-r");
    }
    if (liveEl) liveEl.textContent = "Day " + (cur + 1) + " of " + N + ": " + (days[cur].title || days[cur].date);
  }
  function go(delta) {
    var next = cur + delta;
    if (next < 0 || next >= N) {
      if (!reduce) { panel.classList.remove("sm-bounce"); void panel.offsetWidth; panel.classList.add("sm-bounce"); }
      return;
    }
    tapHaptic();
    render(next, delta);
  }

  function open() {
    lastFocus = document.activeElement;
    if (!overlay) build();
    overlay.hidden = false;
    document.body.classList.add("sm-lock");
    render(0, 1);
    overlay.querySelector(".sm-close").focus();
  }
  function close() {
    if (!overlay) return;
    overlay.hidden = true;
    document.body.classList.remove("sm-lock");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function build() {
    overlay = document.createElement("div");
    overlay.className = "sm-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Trip, day by day");
    overlay.hidden = true;
    var railHtml = '<div class="sm-rail" aria-hidden="true">';
    for (var i = 0; i < N; i++) railHtml += '<span class="sm-seg" data-seg="' + i + '"></span>';
    railHtml += "</div>";
    overlay.innerHTML =
      railHtml +
      '<button class="sm-close" type="button" aria-label="Close day-by-day view">✕</button>' +
      '<div class="sm-stage"><article class="sm-panel" tabindex="-1"></article></div>' +
      // Prev/next live in a control bar BELOW the panel — never overlaying the day's
      // text at any viewport (they used to float mid-stage and sat on top of content).
      '<div class="sm-foot">' +
        '<button class="sm-nav sm-prev" type="button" aria-label="Previous day">‹</button>' +
        '<span class="sm-pos" aria-hidden="true"></span>' +
        '<button class="sm-nav sm-next" type="button" aria-label="Next day">›</button>' +
      '</div>' +
      '<p class="sm-hint">Swipe, tap ‹ ›, or use arrow keys · Esc to close</p>' +
      '<span class="sm-live" role="status" aria-live="polite"></span>';
    document.body.appendChild(overlay);
    panel = overlay.querySelector(".sm-panel");
    rail = overlay.querySelector(".sm-rail");
    liveEl = overlay.querySelector(".sm-live");

    overlay.querySelector(".sm-close").addEventListener("click", close);
    overlay.querySelector(".sm-prev").addEventListener("click", function () { go(-1); });
    overlay.querySelector(".sm-next").addEventListener("click", function () { go(1); });
    rail.addEventListener("click", function (e) {
      var seg = e.target.closest && e.target.closest(".sm-seg"); if (!seg) return;
      var i = parseInt(seg.getAttribute("data-seg"), 10);
      if (!isNaN(i) && i !== cur) render(i, i < cur ? -1 : 1);
    });
    overlay.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    });

    // Swipe: horizontal moves days (tested gesture model); a clear downward drag closes.
    var sx = 0, sy = 0, st = 0, tr = false;
    var stage = overlay.querySelector(".sm-stage");
    stage.addEventListener("touchstart", function (e) {
      tr = e.touches.length === 1; if (!tr) return;
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now();
    }, { passive: true });
    stage.addEventListener("touchend", function (e) {
      if (!tr) return; tr = false;
      var t = e.changedTouches[0];
      var dx = t.clientX - sx, dy = t.clientY - sy, dt = Date.now() - st;
      if (dy > 90 && Math.abs(dx) < 60) { close(); return; }
      var next = resolveSwipe(dx, dy, dt, cur, N);
      if (next !== null && next !== cur) { tapHaptic(); render(next, next < cur ? -1 : 1); }
    }, { passive: true });
  }

  for (var t = 0; t < triggers.length; t++) triggers[t].addEventListener("click", open);
})();
