/* Waypoint itinerary maps — Leaflet progressive enhancement.
   Two mount flavors, one module:
   · [data-itin-map]              — guide map: pins for center/points/sights,
                                    popups, sight-card ↔ pin sync, fullscreen.
   · [data-itin-map][data-planner] — Plan-view map: day-indexed waypoint pins +
                                    a route polyline per day, synced to the day
                                    scrubber via `wp:day` CustomEvents. Falls
                                    back to the guide-level pin set until the
                                    guide's days carry `waypoints`.
   Markers are CSS divIcons (no image assets → no bundler icon-path breakage;
   accent-colored; monochrome convention). Leaflet is import()ed lazily when a
   map nears the viewport; a wedged-IO fallback initializes the primary map if
   the observer's guaranteed initial callback never arrives. Honors
   prefers-reduced-motion. OSM attribution + tile etiquette respected. */

(function () {
  var mounts = Array.prototype.slice.call(document.querySelectorAll("[data-itin-map]"));
  if (!mounts.length) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var leafletPromise = null;
  function loadLeaflet() {
    leafletPromise = leafletPromise || Promise.all([
      import("leaflet"),
      import("leaflet/dist/leaflet.css"),
    ]).then(function (mods) { return mods[0].default || mods[0]; });
    return leafletPromise;
  }

  // Primary map for sight-card jumps = first NON-planner mount (the planner map
  // serves the day flow; sights belong to the guide map).
  var plainMounts = mounts.filter(function (m) { return !m.hasAttribute("data-planner"); });
  var primary = { mount: plainMounts[0] || mounts[0], map: null, markers: {}, queue: [] };
  // Planner registry for wp:day sync.
  var planner = { map: null, byDay: {}, all: [], pending: null };

  var zoomFromSpan = function (span) {
    var s = span || 0.05;
    var z = Math.round(13 - Math.log2(s / 0.05));
    return Math.max(5, Math.min(16, z));
  };
  // Day color: accent mixed toward ink in steps — inline color-mix() keeps the
  // ramp anchored to the per-guide accent without resolving colors in JS.
  function dayColor(dayIdx) {
    var step = (dayIdx % 6) * 12;
    return "color-mix(in srgb, var(--accent) " + (100 - step) + "%, var(--ink))";
  }
  function escapeHtml(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function makeIcon(L, pin, colorExpr) {
    var style = colorExpr ? " style='background:" + colorExpr + ";box-shadow:0 0 0 1.5px " + colorExpr + ",0 1px 4px rgba(0,0,0,.35)'" : "";
    return L.divIcon({
      className: "wpin wpin-" + pin.kind,
      iconSize: [26, 26], iconAnchor: [13, 13], popupAnchor: [0, -12],
      html: "<span class='wpin-dot'" + style + "></span>",
    });
  }

  function baseMap(L, mount) {
    var map = L.map(mount, {
      scrollWheelZoom: false, // no page-scroll hijack; enabled on focus/click
      zoomAnimation: !reduced, fadeAnimation: !reduced, markerZoomAnimation: !reduced,
    });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    map.on("focus click", function () { map.scrollWheelZoom.enable(); });
    map.on("blur", function () { map.scrollWheelZoom.disable(); });
    return map;
  }

  function addFullscreen(mount, map) {
    var fsBtn = document.createElement("button");
    fsBtn.className = "map-fs-btn"; fsBtn.type = "button";
    fsBtn.title = "Fullscreen map"; fsBtn.setAttribute("aria-label", "Fullscreen map");
    fsBtn.textContent = "⤢";
    mount.appendChild(fsBtn);
    fsBtn.addEventListener("click", function () {
      if (document.fullscreenElement === mount) document.exitFullscreen();
      else if (mount.requestFullscreen) mount.requestFullscreen();
    });
    document.addEventListener("fullscreenchange", function () {
      fsBtn.textContent = document.fullscreenElement === mount ? "✕" : "⤢";
      setTimeout(function () { map.invalidateSize(); }, 120);
    });
  }

  function initGuideMap(L, mount, data) {
    var map = baseMap(L, mount);
    var isPrimary = mount === primary.mount;
    var bounds = [];
    (data.pins || []).forEach(function (pin) {
      if (typeof pin.lat !== "number" || typeof pin.lng !== "number") return;
      var html = "<b>" + escapeHtml(pin.name) + "</b>" +
        (pin.local ? "<span class='wpop-local'>" + escapeHtml(pin.local) + "</span>" : "") +
        (pin.kind === "sight" ? "<a class='wpop-jump' href='#sight-" + pin.id + "'>Details ↓</a>" : "");
      var m = L.marker([pin.lat, pin.lng], { icon: makeIcon(L, pin), title: pin.name }).addTo(map).bindPopup(html);
      bounds.push([pin.lat, pin.lng]);
      if (isPrimary) primary.markers[pin.id] = m;
    });
    if (bounds.length > 1) map.fitBounds(bounds, { padding: [34, 34], animate: false });
    else map.setView([data.center.lat, data.center.lng], zoomFromSpan(data.span), { animate: false });

    map.on("popupopen", function (e) {
      var a = e.popup.getElement() && e.popup.getElement().querySelector(".wpop-jump");
      if (!a) return;
      a.addEventListener("click", function () {
        var card = document.getElementById(a.getAttribute("href").slice(1));
        if (!card) return;
        card.classList.add("pin-flash");
        setTimeout(function () { card.classList.remove("pin-flash"); }, 1800);
      });
    });
    addFullscreen(mount, map);
    if (isPrimary) {
      primary.map = map;
      primary.queue.splice(0).forEach(function (fn) { fn(); });
    }
  }

  function initPlannerMap(L, mount, data) {
    var map = baseMap(L, mount);
    var dayPins = data.pins || [];
    var usingDays = dayPins.length > 0;
    var pins = usingDays ? dayPins : (data.fallbackPins || []);
    var bounds = [];

    // Group day pins in content order → markers + one route polyline per day.
    var byDay = {};
    pins.forEach(function (pin) {
      if (typeof pin.lat !== "number" || typeof pin.lng !== "number") return;
      var colorExpr = usingDays ? dayColor(pin.dayIdx) : null;
      var html = "<b>" + escapeHtml(pin.name) + "</b>" +
        (pin.time ? "<span class='wpop-local'>" + escapeHtml(pin.time) + "</span>" : "");
      var m = L.marker([pin.lat, pin.lng], { icon: makeIcon(L, pin, colorExpr), title: pin.name })
        .addTo(map).bindPopup(html);
      bounds.push([pin.lat, pin.lng]);
      planner.all.push(m);
      if (usingDays) {
        (byDay[pin.dayIdx] = byDay[pin.dayIdx] || { markers: [], coords: [] });
        byDay[pin.dayIdx].markers.push(m);
        byDay[pin.dayIdx].coords.push([pin.lat, pin.lng]);
      }
    });
    Object.keys(byDay).forEach(function (di) {
      var d = byDay[di];
      if (d.coords.length > 1) {
        L.polyline(d.coords, { color: dayColor(+di), weight: 3, opacity: 0.7, dashArray: "1 7", lineCap: "round" }).addTo(map);
      }
    });
    planner.byDay = byDay;
    planner.map = map;

    if (bounds.length > 1) map.fitBounds(bounds, { padding: [30, 30], animate: false });
    else map.setView([data.center.lat, data.center.lng], zoomFromSpan(data.span), { animate: false });
    addFullscreen(mount, map);
    if (planner.pending != null) { focusDay(planner.pending); planner.pending = null; }
  }

  // Day sync: dim other days' pins and fit the active day's route.
  function focusDay(dayIdx) {
    if (!planner.map) { planner.pending = dayIdx; return; }
    var d = planner.byDay[dayIdx];
    planner.all.forEach(function (m) {
      if (m._icon) m._icon.classList.add("wpin-dim");
    });
    if (!d || !d.markers.length) return; // day without stops: keep whole-trip view
    d.markers.forEach(function (m) { if (m._icon) m._icon.classList.remove("wpin-dim"); });
    if (d.coords.length > 1) planner.map.fitBounds(d.coords, { padding: [42, 42], maxZoom: 15, animate: !reduced });
    else planner.map.setView(d.coords[0], Math.max(planner.map.getZoom(), 14), { animate: !reduced });
  }
  document.addEventListener("wp:day", function (e) {
    if (e.detail && typeof e.detail.dayIdx === "number") focusDay(e.detail.dayIdx);
  });

  function init(mount) {
    var dataEl = mount.querySelector("script[data-map-data]");
    if (!dataEl) return;
    var data;
    try { data = JSON.parse(dataEl.textContent); } catch (e) { return; }
    loadLeaflet().then(function (L) {
      if (mount.hasAttribute("data-planner")) initPlannerMap(L, mount, data);
      else initGuideMap(L, mount, data);
    }).catch(function (err) {
      console.warn("[itinerary-map] Leaflet failed to load:", err && err.message);
    });
  }

  // Lazy init: only when a map nears the viewport.
  var inited = new WeakSet();
  function initOnce(m) { if (m && !inited.has(m)) { inited.add(m); init(m); } }
  if ("IntersectionObserver" in window) {
    var ioEverFired = false;
    var io = new IntersectionObserver(function (entries) {
      ioEverFired = true; // spec: the initial callback always fires with current state
      entries.forEach(function (e) {
        if (e.isIntersecting) { io.unobserve(e.target); initOnce(e.target); }
      });
    }, { rootMargin: "400px" });
    mounts.forEach(function (m) { io.observe(m); });
    // Wedged-IO fallback: if the guaranteed initial callback never arrived
    // (prerendered/backgrounded/wedged tabs), lazy loading can never trigger —
    // init the primary map so the guide's main map always works.
    setTimeout(function () {
      if (!ioEverFired) { io.disconnect(); initOnce(primary.mount); }
    }, 3000);
  } else {
    mounts.forEach(initOnce);
  }

  // Tab-switch fallback: maps inside initially-hidden tab panels have zero size
  // at load; if the observer misses the reveal (wedged/backgrounded tabs), a
  // click that made the panel visible initializes any now-visible mount.
  function maybeInitVisible() {
    mounts.forEach(function (m) {
      if (inited.has(m)) return;
      var r = m.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && r.top < innerHeight + 400 && r.bottom > -400) initOnce(m);
    });
  }
  document.addEventListener("click", function () {
    // setTimeout, not rAF — rAF is suspended in backgrounded tabs, and a tab
    // restored from the background is exactly the case this fallback covers.
    setTimeout(maybeInitVisible, 60);
  }, { passive: true });

  // Sight-card "◈ Map" buttons → scroll to the primary map and focus the pin.
  document.addEventListener("click", function (ev) {
    var btn = ev.target.closest && ev.target.closest("[data-pin-jump]");
    if (!btn) return;
    var id = btn.getAttribute("data-pin-jump");
    primary.mount.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
    var focusPin = function () {
      var m = primary.markers[id];
      if (!m) return;
      primary.map.setView(m.getLatLng(), Math.max(primary.map.getZoom(), 15), { animate: !reduced });
      m.openPopup();
    };
    if (primary.map) focusPin();
    else { primary.queue.push(focusPin); initOnce(primary.mount); }
  });
})();
