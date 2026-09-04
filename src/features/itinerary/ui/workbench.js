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

  /* Pin-to-compare (design-system.md §16 "Multi-panel policy"): single focus is the default;
     the traveler may deliberately pin up to two stops, which sit as compact tiles above the
     map — the same objects, lifted out of the chronology, never a third pane. A third pin
     replaces the oldest. Everything shown is read from the pinned row itself. */
  var pinned = [];
  var tray = document.createElement("div");
  tray.className = "itin-compare";
  tray.setAttribute("aria-label", "Pinned to compare");
  tray.hidden = true;
  var head = mapPane ? mapPane.querySelector(".itin-mappane-head") : null;
  if (head && head.parentNode) head.parentNode.insertBefore(tray, head.nextSibling);
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function readStop(id) {
    var btn = bench.querySelector('[data-pin-compare="' + id + '"]');
    var row = btn && btn.closest(".stop");
    if (!row) return null;
    var q = function (sel) { var el = row.querySelector(sel); return el ? el.textContent.trim() : ""; };
    var lat = parseFloat(row.getAttribute("data-lat")), lng = parseFloat(row.getAttribute("data-lng"));
    return { id: id, name: q(".stop-name"), time: q(".stop-time"), note: q(".stop-note"), day: btn.getAttribute("data-pin-day") || "", date: btn.getAttribute("data-pin-date") || "",
      lat: isFinite(lat) ? lat : null, lng: isFinite(lng) ? lng : null, mapId: row.getAttribute("data-map-stop") };
  }
  function kmBetween(a, b) {
    if (a.lat == null || b.lat == null) return null;
    var R = 6371, toRad = function (d) { return d * Math.PI / 180; };
    var dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function paintTray() {
    var stops = pinned.map(readStop).filter(Boolean);
    bench.querySelectorAll("[data-pin-compare]").forEach(function (b) {
      b.setAttribute("aria-pressed", pinned.indexOf(b.getAttribute("data-pin-compare")) >= 0 ? "true" : "false");
    });
    tray.hidden = !stops.length;
    if (!stops.length) { tray.innerHTML = ""; return; }
    var h = '<p class="itin-compare-k">Pinned to compare <span class="itin-compare-n">' + stops.length + " of 2</span></p><div class=\"itin-compare-row\">";
    stops.forEach(function (s) {
      h += '<article class="itin-compare-tile" data-compare-id="' + esc(s.id) + '">' +
        '<p class="itin-compare-day">Day ' + esc(s.day) + (s.date ? " · " + esc(s.date) : "") + (s.time ? ' <span class="itin-compare-time">' + esc(s.time) + "</span>" : "") + "</p>" +
        '<h4 class="itin-compare-name">' + esc(s.name) + "</h4>" +
        (s.note ? '<p class="itin-compare-note">' + esc(s.note) + "</p>" : "") +
        (s.mapId ? '<button class="itin-compare-focus" type="button" data-compare-focus="' + esc(s.mapId) + '">Show on the map</button>' : "") +
        '<button class="itin-compare-unpin" type="button" data-compare-unpin="' + esc(s.id) + '" aria-label="Unpin ' + esc(s.name) + '">Unpin</button>' +
        "</article>";
    });
    h += "</div>";
    if (stops.length === 2) {
      var km = kmBetween(stops[0], stops[1]);
      h += '<p class="itin-compare-gap">' + (km != null ? "≈" + (km < 10 ? km.toFixed(1) : Math.round(km)) + " km apart, straight-line" : "Distance unknown — one stop has no verified coordinates") + "</p>";
    }
    tray.innerHTML = h;
  }
  bench.addEventListener("click", function (e) {
    var pin = e.target.closest && e.target.closest("[data-pin-compare]");
    if (pin) {
      var id = pin.getAttribute("data-pin-compare");
      var at = pinned.indexOf(id);
      if (at >= 0) pinned.splice(at, 1);
      else { pinned.push(id); if (pinned.length > 2) pinned.shift(); }
      paintTray();
      if (collapsed && pinned.length) { collapsed = false; apply(); }
      return;
    }
    var un = e.target.closest && e.target.closest("[data-compare-unpin]");
    if (un) { pinned = pinned.filter(function (x) { return x !== un.getAttribute("data-compare-unpin"); }); paintTray(); return; }
    var fo = e.target.closest && e.target.closest("[data-compare-focus]");
    if (fo) {
      var mid = fo.getAttribute("data-compare-focus");
      var row = bench.querySelector('[data-map-stop="' + mid + '"]');
      var day = row && row.closest(".day[data-day]");
      if (day && day.hidden) { var jump = doc.querySelector('.itin-daynav [data-day-jump="' + day.getAttribute("data-day") + '"]'); if (jump) jump.click(); }
      selectStop(mid, { reveal: true });
      if (mapMount && mapMount.getAttribute("data-map-provider") === "google" && typeof mapMount.__focusPin === "function") mapMount.__focusPin(mid);
      else focusOsmPin(mid);
    }
  });

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
    // Coordinates are numbers or nothing, and the embed URL is built from those numbers
    // through encoded parts — never from a string read back out of the page's JSON block.
    var pts = pins
      .map(function (pin) { return { lat: Number(pin.lat), lng: Number(pin.lng) }; })
      .filter(function (p) { return isFinite(p.lat) && isFinite(p.lng); });
    if (!pts.length) return null;
    var lats = pts.map(function (p) { return p.lat; });
    var lngs = pts.map(function (p) { return p.lng; });
    var minLat = Math.min.apply(Math, lats), maxLat = Math.max.apply(Math, lats);
    var minLng = Math.min.apply(Math, lngs), maxLng = Math.max.apply(Math, lngs);
    var latPad = Math.max(.006, (maxLat - minLat) * .18);
    var lngPad = Math.max(.008, (maxLng - minLng) * .18);
    var part = function (n) { return encodeURIComponent(String(n)); };
    var bbox = [minLng - lngPad, minLat - latPad, maxLng + lngPad, maxLat + latPad].map(part).join("%2C");
    return "https://www.openstreetmap.org/export/embed.html?bbox=" + bbox + "&layer=mapnik&marker=" + part(pts[0].lat) + "%2C" + part(pts[0].lng);
  }
  function setOsmPins(pins) {
    if (!mapFrame) return;
    var url = osmUrl(pins);
    mapFrame.hidden = !url;
    if (!url) return;
    if (mapFrame.hasAttribute("src")) mapFrame.setAttribute("src", url);
    else if (mapFrame.hasAttribute("data-fallback-src")) mapFrame.setAttribute("data-fallback-src", url);
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
