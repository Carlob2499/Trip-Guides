/* The desktop workbench (design-system.md D6-21/35): timeline left, map right, one divider.

   The divider is a real control — drag with a pointer, ←/→ with the keyboard (5% steps,
   Home/End to the limits) — and the ratio is remembered per device. Either pane collapses:
   the map's own toggle folds it to a strip and the divider hides; below the desktop
   threshold the panes stack (itinerary.css) and the divider is inert. Minimums are held
   (30–70%) so neither pane can be dragged into uselessness; a double-tap on the divider
   resets to the default. The workbench also owns the small shared selection contract between
   timeline rows and the map, plus the selected-day OSM fallback when Google is unavailable. */

export function initWorkbench(root) {
  var doc = root || document;
  var bench = doc.querySelector("[data-workbench]");
  if (!bench) return;
  var divider = bench.querySelector("[data-pane-divider]");
  var mapPane = bench.querySelector('[data-pane="map"]');
  var collapseBtn = bench.querySelector('[data-pane-collapse="map"]');
  var mapMount = bench.querySelector("[data-itin-map]");
  var mapFrame = mapMount ? mapMount.querySelector(".osmmap") : null;
  var storeKey = doc.body.getAttribute("data-storekey") || "guide";
  var KEY = "tg-d7-bench-" + storeKey;
  var MIN = 30, MAX = 70, DEFAULT = 52;
  var ratio = DEFAULT;
  try { var s = parseInt(localStorage.getItem(KEY), 10); if (!isNaN(s) && s >= MIN && s <= MAX) ratio = s; } catch (_) {}
  var collapsed = false;
  try { collapsed = localStorage.getItem(KEY + "-map") === "0"; } catch (_) {}
  var selectedPinId = null;

  function selectStop(id, opts) {
    opts = opts || {};
    selectedPinId = id;
    var rows = Array.prototype.slice.call(bench.querySelectorAll("[data-map-stop]"));
    var selected = null;
    rows.forEach(function (row) {
      var on = row.getAttribute("data-map-stop") === id;
      row.classList.toggle("stop-map-selected", on);
      var button = row.querySelector("[data-map-pin-id]");
      if (button) {
        if (on) button.setAttribute("aria-current", "location");
        else button.removeAttribute("aria-current");
      }
      if (on) selected = row;
    });
    if (selected && opts.reveal) {
      selected.scrollIntoView({ block: "nearest", behavior: "auto" });
      var button = selected.querySelector("[data-map-pin-id]");
      if (button && opts.focus) button.focus({ preventScroll: true });
    }
  }

  bench.addEventListener("click", function (e) {
    var button = e.target.closest && e.target.closest("[data-map-pin-id]");
    if (!button) return;
    var id = button.getAttribute("data-map-pin-id");
    selectStop(id);
    if (collapsed) { collapsed = false; apply(); }
    if (mapMount && mapMount.getAttribute("data-map-provider") === "google" && typeof mapMount.__focusPin === "function") mapMount.__focusPin(id);
    else focusOsmPin(id);
    if (mapPane) mapPane.scrollIntoView({ block: "nearest", behavior: "auto" });
  });
  if (mapMount) mapMount.addEventListener("tg:map-select", function (e) {
    var detail = e.detail || {};
    if (!detail.id) return;
    selectStop(detail.id, { reveal: detail.source === "map", focus: detail.source === "map" });
  });

  var mapData = null;
  if (mapMount) {
    var dataEl = mapMount.querySelector("script[data-map-data]");
    try { mapData = dataEl ? JSON.parse(dataEl.textContent || "{}") : null; } catch (_) { mapData = null; }
  }
  function osmUrl(pins) {
    if (!pins.length) return null;
    var lats = pins.map(function (pin) { return pin.lat; });
    var lngs = pins.map(function (pin) { return pin.lng; });
    var minLat = Math.min.apply(Math, lats), maxLat = Math.max.apply(Math, lats);
    var minLng = Math.min.apply(Math, lngs), maxLng = Math.max.apply(Math, lngs);
    var latPad = Math.max(.006, (maxLat - minLat) * .18);
    var lngPad = Math.max(.008, (maxLng - minLng) * .18);
    var bbox = [minLng - lngPad, minLat - latPad, maxLng + lngPad, maxLat + latPad].join("%2C");
    return "https://www.openstreetmap.org/export/embed.html?bbox=" + bbox + "&layer=mapnik&marker=" + pins[0].lat + "%2C" + pins[0].lng;
  }
  function setOsmPins(pins) {
    if (!mapFrame) return;
    var url = osmUrl(pins);
    mapFrame.hidden = !url;
    if (!url) return;
    if (mapFrame.hasAttribute("src")) mapFrame.setAttribute("src", url);
    else mapFrame.setAttribute("data-src", url);
  }
  function focusOsmPin(id) {
    if (!mapData || !Array.isArray(mapData.pins)) return;
    var pin = mapData.pins.find(function (candidate) { return candidate.id === id; });
    if (pin) setOsmPins([pin]);
  }
  function showFallbackDay(dayIdx) {
    bench.querySelectorAll("[data-map-fallback-day]").forEach(function (panel) {
      panel.hidden = parseInt(panel.getAttribute("data-map-fallback-day"), 10) !== dayIdx;
    });
    if (!mapData || !Array.isArray(mapData.pins)) return;
    var dayPins = mapData.pins.filter(function (pin) { return pin.dayIdx === dayIdx; });
    if (mapMount) {
      if (dayPins.length) mapMount.removeAttribute("data-map-empty-day");
      else mapMount.setAttribute("data-map-empty-day", "");
    }
    setOsmPins(dayPins);
  }
  if (mapFrame && mapMount) {
    mapFrame.addEventListener("load", function () {
      if (mapMount.getAttribute("data-map-provider") !== "google") mapMount.setAttribute("data-map-provider", "osm");
    });
    if (typeof MutationObserver === "function") {
      new MutationObserver(function () {
        if (mapMount.getAttribute("data-map-provider") === "google" && selectedPinId && typeof mapMount.__focusPin === "function") {
          mapMount.__focusPin(selectedPinId);
        }
      }).observe(mapMount, { attributes: true, attributeFilter: ["data-map-provider"] });
    }
  }
  doc.addEventListener("tg:day", function (e) {
    var index = e.detail && Number.isFinite(e.detail.index) ? e.detail.index : 0;
    selectStop(null);
    if (mapMount && typeof mapMount.__clear === "function") mapMount.__clear();
    showFallbackDay(index);
  });
  var initialDay = bench.querySelector("[data-planner-days] .day[data-day]:not([hidden])");
  showFallbackDay(initialDay ? parseInt(initialDay.getAttribute("data-day"), 10) : 0);

  function apply() {
    bench.style.setProperty("--bench-timeline", ratio + "%");
    if (divider) divider.setAttribute("aria-valuenow", String(ratio));
    bench.classList.toggle("itin-bench--map-collapsed", collapsed);
    if (collapseBtn) {
      collapseBtn.setAttribute("aria-expanded", collapsed ? "false" : "true");
      collapseBtn.setAttribute("aria-label", collapsed ? "Expand the map" : "Collapse the map");
    }
    try { localStorage.setItem(KEY, String(ratio)); localStorage.setItem(KEY + "-map", collapsed ? "0" : "1"); } catch (_) {}
    try { doc.dispatchEvent(new CustomEvent("tg:bench", { detail: { ratio: ratio, mapCollapsed: collapsed } })); } catch (_) {}
  }

  if (divider) {
    var dragging = false;
    divider.addEventListener("pointerdown", function (e) {
      dragging = true;
      divider.setPointerCapture(e.pointerId);
      bench.classList.add("itin-bench--dragging");
      e.preventDefault();
    });
    divider.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var r = bench.getBoundingClientRect();
      var pct = ((e.clientX - r.left) / r.width) * 100;
      ratio = Math.round(Math.max(MIN, Math.min(MAX, pct)));
      bench.style.setProperty("--bench-timeline", ratio + "%");
      divider.setAttribute("aria-valuenow", String(ratio));
    });
    function endDrag() { if (!dragging) return; dragging = false; bench.classList.remove("itin-bench--dragging"); apply(); }
    divider.addEventListener("pointerup", endDrag);
    divider.addEventListener("pointercancel", endDrag);
    divider.addEventListener("dblclick", function () { ratio = DEFAULT; apply(); });
    divider.addEventListener("keydown", function (e) {
      var step = 5;
      if (e.key === "ArrowLeft") ratio = Math.max(MIN, ratio - step);
      else if (e.key === "ArrowRight") ratio = Math.min(MAX, ratio + step);
      else if (e.key === "Home") ratio = MIN;
      else if (e.key === "End") ratio = MAX;
      else if (e.key === "Enter") ratio = DEFAULT;
      else return;
      e.preventDefault();
      apply();
    });
  }
  if (collapseBtn) collapseBtn.addEventListener("click", function () { collapsed = !collapsed; apply(); });
  if (mapPane) mapPane.addEventListener("click", function (e) {
    // A collapsed strip re-opens on tap anywhere on it.
    if (collapsed && !(e.target.closest && e.target.closest("[data-pane-collapse]"))) { collapsed = false; apply(); }
  });
  apply();
}
