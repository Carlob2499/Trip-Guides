/* Day-route optimizer — DOM half (decisions in ../model/optimize.ts). Advisory
   only, same doctrine as the weather day-swap note: it never reorders anything
   on its own. A chip appears on a qualifying day card ("Reorder could save
   ≈Nkm"); tapping it opens a sheet with the suggested order; Apply reorders
   that day's stop list in the DOM and remembers the choice per-device
   (localStorage, keyed by day — NEVER writes guide JSON, NEVER touches
   GPX/ICS/print, which stay in the guide's authored order). Restore undoes it.
   Silent whenever a day has <3 located stops or reordering wouldn't help. */

import { optimizeDayRoute } from "../model/optimize";
import { reducedMotion, tapHaptic, trapFocus } from "../../../scripts/util.js";

(function () {
  var days = document.querySelectorAll(".planner-days .day[data-day]");
  if (!days.length) return;

  var storeKey = document.body.getAttribute("data-storekey") || "guide";
  var STORAGE_KEY = "tg-routeopt-" + storeKey;
  function loadPersisted() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch (e) { return {}; } }
  function savePersisted(state) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {} }
  var persisted = loadPersisted();

  var sheet = null, sheetLastFocus = null;
  function buildSheet() {
    if (sheet) return;
    sheet = document.createElement("div");
    sheet.className = "ro-sheet";
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    sheet.setAttribute("aria-label", "Reorder this day's stops");
    sheet.hidden = true;
    sheet.innerHTML =
      '<div class="ro-sheet-inner">' +
        '<p class="ro-sheet-eyebrow">↻ Route suggestion</p>' +
        '<h3 class="ro-sheet-title"></h3>' +
        '<ol class="ro-sheet-order"></ol>' +
        '<p class="ro-sheet-note">This reorders your view only — the guide’s printed order, GPX, and calendar exports are unchanged.</p>' +
        '<div class="ro-sheet-row">' +
          '<button class="ro-sheet-apply" type="button">Apply this order</button>' +
          '<button class="ro-sheet-x" type="button">Not now</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(sheet);
    sheet.addEventListener("click", function (e) { if (e.target === sheet) closeSheet(); });
    sheet.querySelector(".ro-sheet-x").addEventListener("click", closeSheet);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !sheet.hidden) closeSheet(); });
    trapFocus(sheet, function () { return !sheet.hidden; });
  }
  function closeSheet() {
    if (!sheet) return;
    sheet.hidden = true;
    document.body.classList.remove("sheet-lock");
    if (sheetLastFocus && sheetLastFocus.focus) sheetLastFocus.focus();
  }

  days.forEach(function (day) {
    var di = day.getAttribute("data-day");
    var list = day.querySelector(".stops");
    if (!list) return;
    var stopEls = Array.prototype.slice.call(list.querySelectorAll(".stop"));
    if (stopEls.length < 3) return;

    var locatedFlags = stopEls.map(function (el) {
      var lat = parseFloat(el.getAttribute("data-lat"));
      var lng = parseFloat(el.getAttribute("data-lng"));
      return !isNaN(lat) && !isNaN(lng);
    });
    var waypoints = stopEls.map(function (el) {
      var lat = parseFloat(el.getAttribute("data-lat"));
      var lng = parseFloat(el.getAttribute("data-lng"));
      return { lat: isNaN(lat) ? undefined : lat, lng: isNaN(lng) ? undefined : lng };
    });
    var result = optimizeDayRoute(waypoints);
    if (!result) return; // <3 located stops, or reordering wouldn't meaningfully help

    // Full reordering across ALL of the day's stops: located slots get filled
    // from the suggestion, in that sequence; any stop with no coords stays in
    // its own original slot — a mixed day never has its untracked stops
    // shuffled or mislabeled.
    function fullOrderFor(locatedSequence) {
      var queue = locatedSequence.slice();
      var qi = 0;
      return stopEls.map(function (_, i) { return locatedFlags[i] ? queue[qi++] : i; });
    }
    var suggestedFullOrder = fullOrderFor(result.order);
    var originalFullOrder = stopEls.map(function (_, i) { return i; });

    function applyOrder(fullOrder) {
      fullOrder.forEach(function (origIdx, newIdx) {
        var el = stopEls[origIdx];
        var num = el.querySelector(".stop-num");
        if (num) num.textContent = String(newIdx + 1).padStart(2, "0");
        list.appendChild(el);
      });
    }

    var chip = document.createElement("button");
    chip.type = "button";
    chip.className = "ro-chip";
    function setChipState(applied) {
      chip.setAttribute("aria-pressed", applied ? "true" : "false");
      chip.textContent = applied
        ? "↻ Reordered — restore original order?"
        : "↻ Reorder could save ≈" + result.savedKm + "km";
    }

    var isApplied = Array.isArray(persisted[di]);
    if (isApplied) applyOrder(persisted[di]);
    setChipState(isApplied);

    chip.addEventListener("click", function () {
      var applied = chip.getAttribute("aria-pressed") === "true";
      if (applied) {
        applyOrder(originalFullOrder);
        delete persisted[di];
        savePersisted(persisted);
        setChipState(false);
        return;
      }
      buildSheet();
      sheetLastFocus = document.activeElement;
      sheet.querySelector(".ro-sheet-title").textContent = "Save ≈" + result.savedKm + "km today";
      var ol = sheet.querySelector(".ro-sheet-order");
      ol.innerHTML = "";
      suggestedFullOrder.forEach(function (origIdx) {
        var name = (stopEls[origIdx].querySelector(".stop-name") || {}).textContent || "";
        var li = document.createElement("li");
        li.textContent = name;
        ol.appendChild(li);
      });
      var applyBtn = sheet.querySelector(".ro-sheet-apply");
      applyBtn.onclick = function () {
        applyOrder(suggestedFullOrder);
        persisted[di] = suggestedFullOrder;
        savePersisted(persisted);
        setChipState(true);
        if (!reducedMotion()) tapHaptic();
        closeSheet();
      };
      sheet.hidden = false;
      document.body.classList.add("sheet-lock");
      applyBtn.focus();
    });

    day.querySelector(".b").appendChild(chip);
  });
})();
