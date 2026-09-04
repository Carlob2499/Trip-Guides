/* Waypoint Google Maps provider — the live map (design-system.md §15, §26).
   Self-boots ONLY when PUBLIC_GMAPS_KEY is present at build (via tgConfig); with no key the
   OpenStreetMap embed in each mount IS the map and this never runs.

   Reliability contract, in order:
     · a mount built with a key is Google-primary (data-map-primary="google"): its OSM iframe
       is DORMANT (the embed URL waits on data-fallback-src) and the mount says "Loading the
       map…" until Google's map fires its first `idle`. A failed SDK load, a bad key, a quota
       error, a network drop or 15 s without a first paint wakes the OSM embed as the honest
       fallback — never a blank mount. If Google fails AFTER init, the mount is marked
       degraded rather than emptied.
     · every mount declares a LENS in its data: "all" (the Map destination — every pin,
       category chips, day chips), "days" (the Itinerary workbench — the selected day's stops
       and their route, following `tg:day`), "chapter" (a Guide chapter's own places).
     · selection is a shared state: clicking a pin dispatches `tg:map-select`; a row in the
       inspector focuses the pin through `focusPin`. Live routing is the map app's — every
       pin hands off with a Directions URL built from its verified coordinates. */

import { clusterPins } from "../model/cluster";
import { esc as escapeHtml } from "../../../scripts/util.js";

/* global google */
export function boot(cfg) {
  var mounts = Array.prototype.slice.call(document.querySelectorAll("[data-itin-map]"));
  if (!mounts.length) return;

  var loaded = null;
  function loadApi() {
    if (loaded) return loaded;
    loaded = new Promise(function (resolve, reject) {
      /* VENDOR CODE — Google's published inline bootstrap loader, verbatim. */
      /* eslint-disable */
      (g => { var h, a, k, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary", q = "__ib__", m = document, b = window; b = b[c] || (b[c] = {}); var d = b.maps || (b.maps = {}), r = new Set, e = new URLSearchParams, u = () => h || (h = new Promise(async (f, n) => { await (a = m.createElement("script")); e.set("libraries", [...r] + ""); for (k in g) e.set(k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), g[k]); e.set("callback", c + ".maps." + q); a.src = `https://maps.${c}apis.com/maps/api/js?` + e; d[q] = f; a.onerror = () => h = n(Error(p + " could not load.")); a.nonce = m.querySelector("script[nonce]")?.nonce || ""; m.head.append(a) })); d[l] ? console.warn(p + " only loads once. Ignoring:", g) : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)) })({ key: cfg.gmapsKey, v: "weekly" });
      /* eslint-enable */
      Promise.all([google.maps.importLibrary("maps"), google.maps.importLibrary("marker")])
        .then(function (libs) { resolve({ maps: libs[0], marker: libs[1] }); }, reject);
    });
    return loaded;
  }

  function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#9c4421"; }
  var ACCENT = cssVar("--accent");
  function zoomFromSpan(span) {
    var s = span || 0.05;
    return Math.max(5, Math.min(16, Math.round(13 - Math.log2(s / 0.05))));
  }

  function makeMap(api, host, data) {
    return new api.maps.Map(host, {
      center: { lat: data.center.lat, lng: data.center.lng },
      zoom: zoomFromSpan(data.span),
      mapId: cfg.gmapsMapId || "DEMO_MAP_ID",
      fullscreenControl: true, streetViewControl: false, mapTypeControl: false,
      gestureHandling: "cooperative", clickableIcons: false,
    });
  }

  function dirUrl(pin) { return "https://www.google.com/maps/dir/?api=1&destination=" + pin.lat + "," + pin.lng + (pin.placeId ? "&destination_place_id=" + encodeURIComponent(pin.placeId) : ""); }

  function initMap(api, mount, data) {
    var host = document.createElement("div");
    host.className = "gmap-host";
    mount.appendChild(host);
    var map = makeMap(api, host, data);
    var info = new api.maps.InfoWindow();
    var all = (data.pins || []).filter(function (p) { return typeof p.lat === "number" && typeof p.lng === "number"; });
    var lens = mount.getAttribute("data-map-lens") || "all";
    var cats = [];
    all.forEach(function (p) { if (p.cat && p.kind !== "center" && p.dayIdx == null && cats.indexOf(p.cat) === -1) cats.push(p.cat); });
    var off = {};
    var dayFilter = null; // the selected day (lens "days"), or a chosen day chip on "all"
    var markers = [], polyline = null, selectedId = null;
    var ready = false;

    function visible() {
      return all.filter(function (p) {
        if (p.kind === "center") return false;
        if (lens === "days") return p.dayIdx === dayFilter;
        if (dayFilter != null && p.dayIdx != null) return p.dayIdx === dayFilter;
        if (dayFilter != null && p.dayIdx == null) return false;
        return !p.cat || !off[p.cat];
      });
    }

    function markerFor(pin, index) {
      var el = document.createElement("div");
      el.className = "map-pin" + (pin.dayIdx != null ? " map-pin--stop" : pin.kind === "venue" ? " map-pin--venue" : "") + (pin.id === selectedId ? " map-pin--sel" : "");
      el.textContent = index != null ? String(index + 1) : "";
      var m = new api.marker.AdvancedMarkerElement({ map: map, position: { lat: pin.lat, lng: pin.lng }, content: el, title: pin.name, zIndex: pin.id === selectedId ? 10 : 1 });
      m.addListener("click", function () { select(pin.id, "map"); });
      return m;
    }
    function clusterMarker(c) {
      var el = document.createElement("div");
      el.className = "map-cluster";
      el.textContent = String(c.pins.length);
      var m = new api.marker.AdvancedMarkerElement({ map: map, position: { lat: c.lat, lng: c.lng }, content: el, title: c.pins.map(function (p) { return p.name; }).slice(0, 6).join("\n") });
      m.addListener("click", function () {
        var b = new google.maps.LatLngBounds();
        c.pins.forEach(function (p) { b.extend({ lat: p.lat, lng: p.lng }); });
        map.fitBounds(b, 60);
      });
      return m;
    }

    function draw() {
      markers.forEach(function (m) { m.map = null; });
      markers = [];
      if (polyline) { polyline.setMap(null); polyline = null; }
      var pins = visible();
      var stops = pins.filter(function (p) { return p.dayIdx != null; });
      if (stops.length) {
        // A day's stops keep their order and draw as a numbered route: the itinerary's own
        // sequence, straight lines between stops — never a routed path pretending to be one.
        stops.forEach(function (p, i) { markers.push(markerFor(p, i)); });
        if (stops.length > 1) {
          polyline = new google.maps.Polyline({ path: stops.map(function (p) { return { lat: p.lat, lng: p.lng }; }), geodesic: true, strokeColor: ACCENT, strokeOpacity: .75, strokeWeight: 3, map: map });
        }
      }
      var places = pins.filter(function (p) { return p.dayIdx == null; });
      clusterPins(places, map.getZoom() || 13).forEach(function (c) {
        markers.push(c.pins.length === 1 ? markerFor(c.pins[0], null) : clusterMarker(c));
      });
    }

    function fitTo(pins) {
      if (!pins.length) return;
      if (pins.length === 1) { map.setCenter({ lat: pins[0].lat, lng: pins[0].lng }); map.setZoom(15); return; }
      var b = new google.maps.LatLngBounds();
      pins.forEach(function (p) { b.extend({ lat: p.lat, lng: p.lng }); });
      map.fitBounds(b, 48);
    }

    function select(id, source) {
      selectedId = id;
      var pin = all.find(function (p) { return p.id === id; }) || null;
      draw();
      if (pin) {
        info.setContent("<b>" + escapeHtml(pin.name) + "</b>" + (pin.local ? "<div class='wpop-local'>" + escapeHtml(pin.local) + "</div>" : "") +
          "<a class='wpop-dir' href='" + dirUrl(pin) + "' target='_blank' rel='noopener'>Directions ↗</a>");
        var m = markers.find(function (x) { return x.title === pin.name; });
        if (m) info.open({ map: map, anchor: m });
        if (source !== "map") map.panTo({ lat: pin.lat, lng: pin.lng });
      } else { info.close(); }
      try { mount.dispatchEvent(new CustomEvent("tg:map-select", { bubbles: true, detail: { id: id, pin: pin, source: source } })); } catch (_) {}
    }

    map.addListener("zoom_changed", function () { if (ready) draw(); });
    google.maps.event.addListenerOnce(map, "idle", function () {
      ready = true;
      // ONLY NOW is Google the map: the fallback leaves once there is something to replace it.
      var frame = mount.querySelector(".osmmap");
      if (frame) frame.remove();
      var stale = mount.querySelector(".map-fs-btn");
      if (stale) stale.remove();
      mount.setAttribute("data-map-provider", "google");
      try { mount.dispatchEvent(new CustomEvent("tg:map-ready")); } catch (_) {}
      draw();
      var initial = visible();
      if (initial.length > 1) fitTo(initial);
    });

    if (lens === "all" && (cats.length > 1 || all.some(function (p) { return p.dayIdx != null; }))) buildChips(mount, cats, off, data.dayDates || [], function (cat, on) {
      off[cat] = !on; dayFilter = null; draw();
    }, function (dayIdx) { dayFilter = dayIdx; draw(); fitTo(visible()); });

    if (lens === "days") {
      var selectedDay = document.querySelector("[data-planner-days] .day[data-day]:not([hidden])");
      dayFilter = selectedDay ? parseInt(selectedDay.getAttribute("data-day"), 10) : 0;
      document.addEventListener("tg:day", function (e) {
        dayFilter = e.detail.index;
        if (!ready) return;
        draw();
        fitTo(visible());
      });
      document.addEventListener("tg:bench", function () { if (ready) setTimeout(function () { google.maps.event.trigger(map, "resize"); fitTo(visible()); }, 320); });
    }
    // The destination becoming visible is the moment a hidden map needs its size.
    document.addEventListener("tg:dest", function () { if (ready) setTimeout(function () { google.maps.event.trigger(map, "resize"); fitTo(visible()); }, 60); });
    mount.__focusPin = function (id) { select(id, "row"); };
    mount.__fitDay = function (dayIdx) { dayFilter = dayIdx; if (ready) { draw(); fitTo(visible()); } };
    mount.__clear = function () { selectedId = null; info.close(); draw(); };
  }

  function buildChips(mount, cats, off, dayDates, onCat, onDay) {
    var bar = document.createElement("div");
    bar.className = "map-chips";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "Show on the map");
    cats.forEach(function (cat) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "map-chip map-chip-on"; b.textContent = cat; b.setAttribute("aria-pressed", "true");
      b.addEventListener("click", function () {
        var on = b.getAttribute("aria-pressed") !== "true";
        b.classList.toggle("map-chip-on", on); b.setAttribute("aria-pressed", on ? "true" : "false");
        bar.querySelectorAll("[data-day-chip]").forEach(function (d) { d.classList.remove("map-chip-on"); d.setAttribute("aria-pressed", "false"); });
        onCat(cat, on);
      });
      bar.appendChild(b);
    });
    if (dayDates.length) {
      dayDates.forEach(function (date, i) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "map-chip map-chip--day"; b.setAttribute("data-day-chip", String(i)); b.setAttribute("aria-pressed", "false");
        var parts = String(date).split(/\s+/);
        b.textContent = "Day " + (i + 1) + (parts.length >= 3 ? " · " + parts[1] + " " + parts[2] : "");
        b.addEventListener("click", function () {
          var on = b.getAttribute("aria-pressed") !== "true";
          bar.querySelectorAll("[data-day-chip]").forEach(function (d) { d.classList.remove("map-chip-on"); d.setAttribute("aria-pressed", "false"); });
          if (on) { b.classList.add("map-chip-on"); b.setAttribute("aria-pressed", "true"); onDay(i); }
          else onDay(null);
        });
        bar.appendChild(b);
      });
    }
    mount.insertBefore(bar, mount.firstChild);
  }

  /* Google did not become the map: wake the dormant OSM embed (Google-primary mounts) and say
     so on the mount for CSS and the canary. Idempotent — the watchdog and a load error can
     both arrive. */
  function fallBack(mount, why) {
    if (mount.getAttribute("data-map-provider") === "google") return;
    var frame = mount.querySelector(".osmmap");
    if (frame && frame.hasAttribute("data-fallback-src")) {
      frame.setAttribute("src", frame.getAttribute("data-fallback-src"));
      frame.removeAttribute("data-fallback-src");
    }
    mount.setAttribute("data-map-provider", "osm");
    mount.setAttribute("data-map-google-failed", "");
    console.warn("[gmaps] fell back to the OpenStreetMap embed:", why);
  }

  function init(mount) {
    var dataEl = mount.querySelector("script[data-map-data]");
    if (!dataEl) return;
    var data;
    try { data = JSON.parse(dataEl.textContent); } catch (e) { return; }
    if (!data.center || typeof data.center.lat !== "number") return;
    var watchdog = setTimeout(function () { fallBack(mount, "no first paint within 15 s"); }, 15000);
    var stop = function () { clearTimeout(watchdog); };
    mount.addEventListener("tg:map-ready", stop, { once: true });
    loadApi().then(function (api) { initMap(api, mount, data); })
      .catch(function (err) { stop(); fallBack(mount, err && err.message); });
  }

  var inited = new WeakSet();
  function initOnce(m) { if (m && !inited.has(m)) { inited.add(m); init(m); } }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); initOnce(e.target); } });
    }, { rootMargin: "400px" });
    mounts.forEach(function (m) { io.observe(m); });
  } else {
    mounts.forEach(initOnce);
  }
  // A destination or chapter revealing a map that was display:none — the observer never
  // fired for it — initialises on the reveal.
  document.addEventListener("tg:dest", function () {
    setTimeout(function () { mounts.forEach(function (m) { if (!inited.has(m) && m.getBoundingClientRect().width > 0) initOnce(m); }); }, 60);
  });
  document.addEventListener("click", function () {
    setTimeout(function () { mounts.forEach(function (m) { if (!inited.has(m) && m.getBoundingClientRect().width > 0) initOnce(m); }); }, 120);
  }, { passive: true });
}

(function () {
  var el = document.getElementById("tgConfig");
  var cfg = el ? JSON.parse(el.textContent || "{}") : {};
  if (cfg.gmapsKey) boot(cfg);
})();
