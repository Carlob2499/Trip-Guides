/* Trip Learnings tab (P2) — the reality layer. Subscribes to the guide's Firebase feedback
   collection; the tab + sheet link stay HIDDEN until ≥1 record exists, then it renders the
   live OBJECTIVE aggregate (X/Y planned stops done + the skipped list with reasons). It never
   touches `freeform` — that stays the private channel. Dismissable per session (× hides the
   tab). The curated post-mortem (P3) renders into #learnCurated when the guide data carries it. */

import { hasFirebase, joinTrip, normalizeCode } from "../../firebase/index.js";
import { aggregateVisited } from "../model/feedback";

export function initLearningsTab() {
  var panel = document.getElementById("tripLearn");
  if (!panel || !hasFirebase()) return;

  var storeKey = panel.getAttribute("data-sk") || "guide";
  var gtab = document.querySelector(".gtab-learn");
  var sheetLink = document.querySelector(".sheet-learn-link");
  var aggEl = panel.querySelector("#learnAgg");
  if (!aggEl) return;

  var DISMISS_KEY = "tg-learn-dismiss-" + storeKey;
  var dismissed = false;
  try { dismissed = sessionStorage.getItem(DISMISS_KEY) === "1"; } catch (e) {}

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

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

  joinTrip(normalizeCode(storeKey)).then(function (room) {
    room.collection("feedback").onChange(function (map) {
      var records = map ? Object.keys(map).map(function (k) { return map[k]; }) : [];
      if (records.length && !dismissed) reveal(true);
      renderAgg(records);
    });
  }).catch(function () {});

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
