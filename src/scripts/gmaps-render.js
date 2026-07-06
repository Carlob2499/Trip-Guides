/* Waypoint Google Maps provider — Wanderlog-class interactive maps.
   Activated ONLY when PUBLIC_GMAPS_KEY is present at build (tgConfig);
   otherwise itinerary-map.js keeps the zero-config Leaflet/OSM path. Feature
   parity with the Leaflet renderer, plus what Google adds: vector basemap,
   POI context, built-in fullscreen, and AdvancedMarkers styled to the
   guide's accent (day-colored on the planner, with per-day routes).
   Same mounts, same JSON payloads — every current and future guide gets
   this automatically the moment a key exists.

   Key safety: the key is a PUBLIC browser key by design — restrict it to
   this site's HTTP referrers and to the Maps JavaScript API in Google Cloud
   Console (see README instructions in the deploy notes). */

export function boot(cfg) {
  var mounts = Array.prototype.slice.call(document.querySelectorAll("[data-itin-map]"));
  if (!mounts.length) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Official async bootstrap (importLibrary pattern). */
  var loaded = null;
  function loadApi() {
    if (loaded) return loaded;
    loaded = new Promise(function (resolve, reject) {
      /* eslint-disable */
      (g => { var h, a, k, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary", q = "__ib__", m = document, b = window; b = b[c] || (b[c] = {}); var d = b.maps || (b.maps = {}), r = new Set, e = new URLSearchParams, u = () => h || (h = new Promise(async (f, n) => { await (a = m.createElement("script")); e.set("libraries", [...r] + ""); for (k in g) e.set(k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), g[k]); e.set("callback", c + ".maps." + q); a.src = `https://maps.${c}apis.com/maps/api/js?` + e; d[q] = f; a.onerror = () => h = n(Error(p + " could not load.")); a.nonce = m.querySelector("script[nonce]")?.nonce || ""; m.head.append(a) })); d[l] ? console.warn(p + " only loads once. Ignoring:", g) : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)) })({ key: cfg.gmapsKey, v: "weekly" });
      /* eslint-enable */
      Promise.all([
        google.maps.importLibrary("maps"),
        google.maps.importLibrary("marker"),
      ]).then(function (libs) { resolve({ maps: libs[0], marker: libs[1] }); }, reject);
    });
    return loaded;
  }

  /* Resolved colors (Google needs real hex, not CSS color-mix strings). */
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#2b5d86";
  }
  function hexToRgb(h) {
    var m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(h.trim());
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [43, 93, 134];
  }
  function mixHex(a, b, t) {
    var A = hexToRgb(a), B = hexToRgb(b);
    return "#" + A.map(function (v, i) {
      return Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0");
    }).join("");
  }
  var ACCENT = cssVar("--accent"), INK = cssVar("--ink");
  function dayColor(dayIdx) { return mixHex(ACCENT, INK, ((dayIdx % 6) * 12) / 100); }

  function zoomFromSpan(span) {
    var s = span || 0.05;
    return Math.max(5, Math.min(16, Math.round(13 - Math.log2(s / 0.05))));
  }
  function escapeHtml(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  var primaryMounts = mounts.filter(function (m) { return !m.hasAttribute("data-planner"); });
  var primary = { mount: primaryMounts[0] || mounts[0], map: null, markers: {}, queue: [] };
  var planner = { map: null, byDay: {}, all: [], pending: null };
  var sharedInfo = null;

  function makeMap(api, mount, data, pinsLen) {
    var map = new api.maps.Map(mount, {
      center: { lat: data.center.lat, lng: data.center.lng },
      zoom: zoomFromSpan(data.span),
      mapId: cfg.gmapsMapId || "DEMO_MAP_ID",
      fullscreenControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      gestureHandling: "cooperative", // no page-scroll hijack (ctrl/2-finger)
      clickableIcons: false,
    });
    if (!sharedInfo) sharedInfo = new api.maps.InfoWindow();
    return map;
  }

  function addMarker(api, map, pin, color) {
    var pinEl = new api.marker.PinElement({
      background: color || ACCENT,
      borderColor: mixHex(color || ACCENT, "#000000", 0.25),
      glyphColor: "#ffffff",
      scale: pin.kind === "center" ? 1.1 : 0.9,
    });
    var m = new api.marker.AdvancedMarkerElement({
      map: map, position: { lat: pin.lat, lng: pin.lng },
      content: pinEl.element, title: pin.name,
    });
    var html = "<b>" + escapeHtml(pin.name) + "</b>" +
      (pin.local ? "<div class='wpop-local'>" + escapeHtml(pin.local) + "</div>" : "") +
      (pin.time ? "<div class='wpop-local'>" + escapeHtml(pin.time) + "</div>" : "") +
      (pin.kind === "sight" ? "<a class='wpop-jump' href='#sight-" + pin.id + "'>Details ↓</a>" : "");
    m.addListener("click", function () {
      sharedInfo.setContent(html);
      sharedInfo.open({ map: map, anchor: m });
    });
    return m;
  }

  function fit(api, map, coords) {
    if (coords.length < 2) return;
    var b = new google.maps.LatLngBounds();
    coords.forEach(function (c) { b.extend({ lat: c[0], lng: c[1] }); });
    map.fitBounds(b, 40);
  }

  function initGuideMap(api, mount, data) {
    var map = makeMap(api, mount, data);
    var isPrimary = mount === primary.mount;
    var coords = [];
    (data.pins || []).forEach(function (pin) {
      if (typeof pin.lat !== "number" || typeof pin.lng !== "number") return;
      var m = addMarker(api, map, pin, null);
      coords.push([pin.lat, pin.lng]);
      if (isPrimary) primary.markers[pin.id] = m;
    });
    fit(api, map, coords);
    if (isPrimary) {
      primary.map = map;
      primary.queue.splice(0).forEach(function (fn) { fn(); });
    }
  }

  function initPlannerMap(api, mount, data) {
    var map = makeMap(api, mount, data);
    var dayPins = data.pins || [];
    var usingDays = dayPins.length > 0;
    var pins = usingDays ? dayPins : (data.fallbackPins || []);
    var coords = [], byDay = {};
    pins.forEach(function (pin) {
      if (typeof pin.lat !== "number" || typeof pin.lng !== "number") return;
      var color = usingDays ? dayColor(pin.dayIdx) : null;
      var m = addMarker(api, map, pin, color);
      coords.push([pin.lat, pin.lng]);
      planner.all.push(m);
      if (usingDays) {
        (byDay[pin.dayIdx] = byDay[pin.dayIdx] || { markers: [], coords: [] });
        byDay[pin.dayIdx].markers.push(m);
        byDay[pin.dayIdx].coords.push({ lat: pin.lat, lng: pin.lng });
      }
    });
    Object.keys(byDay).forEach(function (di) {
      var d = byDay[di];
      if (d.coords.length > 1) {
        new google.maps.Polyline({
          map: map, path: d.coords, strokeColor: dayColor(+di),
          strokeOpacity: 0.75, strokeWeight: 3,
        });
      }
    });
    planner.byDay = byDay;
    planner.map = map;
    fit(api, map, coords);
    if (planner.pending != null) { focusDay(planner.pending); planner.pending = null; }
  }

  function focusDay(dayIdx) {
    if (!planner.map) { planner.pending = dayIdx; return; }
    var d = planner.byDay[dayIdx];
    planner.all.forEach(function (m) { if (m.content) m.content.style.opacity = ".35"; });
    if (!d || !d.markers.length) {
      planner.all.forEach(function (m) { if (m.content) m.content.style.opacity = "1"; });
      return;
    }
    d.markers.forEach(function (m) { if (m.content) m.content.style.opacity = "1"; });
    if (d.coords.length > 1) {
      var b = new google.maps.LatLngBounds();
      d.coords.forEach(function (c) { b.extend(c); });
      planner.map.fitBounds(b, 48);
    } else {
      planner.map.setZoom(Math.max(planner.map.getZoom(), 14));
      planner.map.panTo(d.coords[0]);
    }
  }
  document.addEventListener("wp:day", function (e) {
    if (e.detail && typeof e.detail.dayIdx === "number") focusDay(e.detail.dayIdx);
  });

  function init(mount) {
    var dataEl = mount.querySelector("script[data-map-data]");
    if (!dataEl) return;
    var data;
    try { data = JSON.parse(dataEl.textContent); } catch (e) { return; }
    if (!data.center || typeof data.center.lat !== "number") return;
    // Replace the default OSM iframe fallback before rendering Google.
    var frame = mount.querySelector(".osmmap");
    if (frame) frame.remove();
    loadApi().then(function (api) {
      if (mount.hasAttribute("data-planner")) initPlannerMap(api, mount, data);
      else initGuideMap(api, mount, data);
    }).catch(function (err) {
      console.warn("[gmaps] failed to load:", err && err.message);
    });
  }

  /* Lazy init — same IO + wedge fallback + tab-reveal fallback as Leaflet. */
  var inited = new WeakSet();
  function initOnce(m) { if (m && !inited.has(m)) { inited.add(m); init(m); } }
  if ("IntersectionObserver" in window) {
    var ioEverFired = false;
    var io = new IntersectionObserver(function (entries) {
      ioEverFired = true;
      entries.forEach(function (e) {
        if (e.isIntersecting) { io.unobserve(e.target); initOnce(e.target); }
      });
    }, { rootMargin: "400px" });
    mounts.forEach(function (m) { io.observe(m); });
    setTimeout(function () {
      if (!ioEverFired) { io.disconnect(); initOnce(primary.mount); }
    }, 3000);
  } else {
    mounts.forEach(initOnce);
  }
  function maybeInitVisible() {
    mounts.forEach(function (m) {
      if (inited.has(m)) return;
      var r = m.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && r.top < innerHeight + 400 && r.bottom > -400) initOnce(m);
    });
  }
  document.addEventListener("click", function () { setTimeout(maybeInitVisible, 60); }, { passive: true });

  /* Sight-card "Show on map" → primary map. */
  document.addEventListener("click", function (ev) {
    var btn = ev.target.closest && ev.target.closest("[data-pin-jump]");
    if (!btn) return;
    var id = btn.getAttribute("data-pin-jump");
    primary.mount.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
    var focusPin = function () {
      var m = primary.markers[id];
      if (!m) return;
      primary.map.setZoom(Math.max(primary.map.getZoom(), 15));
      primary.map.panTo(m.position);
      google.maps.event.trigger(m, "click");
    };
    if (primary.map) focusPin();
    else { primary.queue.push(focusPin); initOnce(primary.mount); }
  });
}

/* Self-boot: the interactive Google map is opt-in. It runs only when a
   PUBLIC_GMAPS_KEY was set at build (surfaced via tgConfig). With no key, the
   OSM iframe embed in each map section is the map, and boot() never runs. */
(function () {
  var el = document.getElementById("tgConfig");
  var cfg = el ? JSON.parse(el.textContent || "{}") : {};
  if (cfg.gmapsKey) boot(cfg);
})();
