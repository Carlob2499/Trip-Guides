/* Trip Learnings tab (P2) — the reality layer. Subscribes to the guide's Firebase feedback
   collection; the tab + sheet link stay HIDDEN until ≥1 record exists, then it renders the
   live OBJECTIVE aggregate (X/Y planned stops done + the skipped list with reasons). It never
   touches `freeform` — that stays the private channel. Dismissable per session (× hides the
   tab). The curated post-mortem (P3) renders into #learnCurated when the guide data carries it. */

import { esc } from "../../../scripts/util.js";
import { hasFirebase, joinTrip, normalizeCode } from "../../firebase/index.js";
import { aggregateVisited } from "../model/feedback";

/* Per-day Plan ⇄ Actual toggle (P3). Server-rendered by DaysBlock on ONLY the days the
   curated post-mortem covers, so this just wires the flip — no Firebase, no gating: if the
   maker wrote what really happened, it's shown regardless of live feedback state.
   The plan content is every .b child except the title, the toggle, and the actual panel —
   toggled in place rather than wrapped, so existing `.day .stop` selectors keep matching. */
export function initDayFlip() {
  document.querySelectorAll(".planner-days .day .day-flip").forEach(function (flip) {
    var body = flip.parentNode;
    var actual = body.querySelector(".day-actual");
    if (!actual) return;
    var planEls = Array.prototype.filter.call(body.children, function (el) {
      return !el.matches("strong, .day-flip, .day-actual");
    });
    flip.querySelectorAll(".day-flip-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var showActual = btn.getAttribute("data-flip") === "actual";
        planEls.forEach(function (el) { el.hidden = showActual; });
        actual.hidden = !showActual;
        flip.querySelectorAll(".day-flip-btn").forEach(function (b) {
          var on = b === btn;
          b.classList.toggle("on", on);
          b.setAttribute("aria-pressed", on ? "true" : "false");
        });
      });
    });
  });
}

export function initLearningsTab() {
  var panel = document.getElementById("tripLearn");
  if (!panel) return;

  var storeKey = panel.getAttribute("data-sk") || "guide";
  var gtab = document.querySelector(".gtab-learn");
  var sheetLink = document.querySelector(".sheet-learn-link");
  var aggEl = panel.querySelector("#learnAgg");
  var curatedEl = panel.querySelector("#learnCurated");
  if (!aggEl) return;

  var DISMISS_KEY = "tg-learn-dismiss-" + storeKey;
  var dismissed = false;
  try { dismissed = sessionStorage.getItem(DISMISS_KEY) === "1"; } catch (e) {}

  // A curated post-mortem is guide DATA, server-rendered — if the maker wrote one, the tab
  // opens on it whether or not live feedback exists (and even with Firebase unconfigured).
  // Live records are the OTHER unlock, handled by the subscription below.
  var hasCurated = !!(curatedEl && curatedEl.children.length);


  function reveal(show) {
    if (gtab) gtab.hidden = !show;
    if (sheetLink) sheetLink.hidden = !show;
  }

  function renderAgg(records) {
    var agg = aggregateVisited(records);
    if (!agg.total && !agg.skipped.length) {
      aggEl.innerHTML = '<p class="learn-empty">Feedback logged. Stop-level detail appears as travelers mark what they actually hit.</p>';
      return;
    }
    var html = "";
    if (agg.total) {
      var pct = Math.round((agg.done / agg.total) * 100);
      html += '<p class="learn-stat"><strong>' + agg.done + "</strong> of <strong>" + agg.total +
        "</strong> planned stops marked done <span class='learn-pct'>" + pct + "%</span></p>";
    }
    if (agg.skipped.length) {
      html += '<p class="learn-sub">Skipped</p><ul class="learn-skips">';
      agg.skipped.forEach(function (s) {
        html += '<li><span class="learn-skip-stop">' + esc(s.stop) + "</span>" +
          (s.reason ? '<span class="learn-skip-why">' + esc(s.reason) + "</span>" : "") + "</li>";
      });
      html += "</ul>";
    }
    aggEl.innerHTML = html;
  }

  if (hasCurated && !dismissed) reveal(true);

  // Live objective layer — only when Firebase is configured. With no config the curated
  // layer above still stands on its own.
  if (hasFirebase()) {
    joinTrip(normalizeCode(storeKey)).then(function (room) {
      room.collection("feedback").onChange(function (map) {
        var records = map ? Object.keys(map).map(function (k) { return map[k]; }) : [];
        if (records.length && !dismissed) reveal(true);
        renderAgg(records);
      });
    }).catch(function () {});
  } else if (!hasCurated) {
    return; // nothing to show and no way to get records — stay fully inert
  }

  // Dismiss: × hides the tab + sheet link for this session; if you're on the tab, fall back
  // to the first section so you're never stranded on a now-hidden panel.
  var xBtn = panel.querySelector("[data-learn-dismiss]");
  if (xBtn) xBtn.addEventListener("click", function () {
    dismissed = true;
    try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch (e) {}
    reveal(false);
    if (gtab && gtab.classList.contains("gtab-active")) {
      var first = document.querySelector('.gtab[data-tab="0"]');
      if (first) first.click();
    }
  });
}
