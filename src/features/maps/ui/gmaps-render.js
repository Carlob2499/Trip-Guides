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
       and their route, following `tg:day`), "today" (the Trip cockpit — today's stops, following
       `tg:trip-day`), "chapter" (a Guide chapter's own places).
     · selection is a shared state: clicking a pin dispatches `tg:map-select`; a row in the
       inspector focuses the pin through `focusPin`. Live routing is the map app's — every
       pin hands off with a Directions URL built from its verified coordinates. */

import { clusterPins } from "../model/cluster";
import { esc as escapeHtml, safeHttpUrl } from "../../../scripts/util.js";

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
  /* The day route is Waypoint's furniture, not the guide's identity — same ruling as the pins
     (base.css --brand). It was --accent, which is the destination's own colour, so Korea drew
     its route in olive on a green map. */
  var ACCENT = cssVar("--brand") || cssVar("--accent");
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
    /* Google's own container carries role="region" aria-label="Map", and a guide renders SEVERAL
       maps — so every one announced itself as "Map" and axe reported landmark-unique. Every mount
       already sits inside a NAMED landmark of ours ("Map of today's stops", "Map of the selected
       day"), so the injected one is a redundant landmark nested inside a real one: drop its role
       rather than give it a name, which would only move the collision up a level (copying the
       parent's label is exactly what the first attempt did, and it collided with the parent).
       Nothing is lost — the map keeps its own focus and keyboard handling; it simply stops
       claiming to be a second region. The node appears after init, hence the frame wait. */
    (function unlandmark() {
      var region = host.querySelector('[role="region"]');
      if (!region) { requestAnimationFrame(unlandmark); return; }
      /* All three go together: aria-label on a role-less div is a prohibited attribute
         (axe aria-prohibited-attr), so dropping the role alone trades one violation for
         another. The element becomes plain markup inside our named landmark. */
      region.removeAttribute("role");
      region.removeAttribute("aria-roledescription");
      region.removeAttribute("aria-label");
    })();
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
        if (lens === "days" || lens === "today") return p.dayIdx === dayFilter;
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
          polyline = new google.maps.Polyline({ path: stops.map(function (p) { return { lat: p.lat, lng: p.lng }; }), geodesic: true, strokeColor: ACCENT, strokeOpacity: .9, strokeWeight: 4, map: map });
        }
      }
      var places = pins.filter(function (p) { return p.dayIdx == null; });
      /* The cluster radius is in screen pixels, so the SAME number covers a far bigger share of a
         375px phone than of a 1440px desktop — which is why the phone piled a dozen overlapping
         discs over Seoul while desktop looked fine. Widen it where the screen is narrow. */
      clusterPins(places, map.getZoom() || 13, host.clientWidth < 600 ? 92 : 60).forEach(function (c) {
        markers.push(c.pins.length === 1 ? markerFor(c.pins[0], null) : clusterMarker(c));
      });
    }

    /* WHERE THE MAP OPENS. Not fitBounds over every pin: the Korea guide carries 94 places in
       Korea and 9 around Tokyo, 1,150 km away, so fitting everything framed two countries and
       left Seoul unreadable on the first screen — worse on a phone, where the same box has a
       third of the width.

       The guide already answers this. `center`/`span` are authored per guide (Seoul, 0.07),
       which is the frame someone who knows the trip would choose, and no statistic recovers
       that from the coordinates: those 9 Tokyo pins are a real leg of the trip, not outliers to
       be trimmed away. (An earlier pass here did try trimming the tails. It was the wrong tool
       — at 9% the leg is bigger than any honest trim, and a trim big enough to drop it would
       drop a genuine second city on some other guide.)

       So: the authored frame is home, and a FILTER fits exactly what the reader asked for —
       every pin in the filtered set, no trimming, because they chose those pins. */
    function homeView() {
      map.setCenter({ lat: data.center.lat, lng: data.center.lng });
      map.setZoom(zoomFromSpan(data.span));
    }
    function fitTo(pins) {
      if (!pins.length) return;
      if (pins.length === 1) { map.setCenter({ lat: pins[0].lat, lng: pins[0].lng }); map.setZoom(15); return; }
      var b = new google.maps.LatLngBounds();
      pins.forEach(function (p) { b.extend({ lat: p.lat, lng: p.lng }); });
      map.fitBounds(b, 48);
    }
    /* Unfiltered means "show me the guide", which is the authored frame — not the extent of its
       furthest two pins. Filtered means "show me these", which is an exact fit. */
    function refit() {
      if (dayFilter == null && !Object.keys(off).some(function (k) { return off[k]; })) homeView();
      else fitTo(visible());
    }

    function select(id, source) {
      selectedId = id;
      var pin = all.find(function (p) { return p.id === id; }) || null;
      draw();
      if (pin) {
        /* The Map destination has a panel whose whole job is the selected place — name, local
           name, photo and the same Get-there links. Opening an info window there says the same
           thing twice, in a floating box that covers the pins around the one just chosen. Every
           OTHER mount (a guide chapter map, the itinerary bench) has no such panel, so there the
           window IS the only answer to "what did I just click" and it stays. */
        if (!mount.closest("[data-mapdest]")) {
          info.setContent("<b>" + escapeHtml(pin.name) + "</b>" + (pin.local ? "<div class='wpop-local'>" + escapeHtml(pin.local) + "</div>" : "") +
            "<a class='wpop-dir' href='" + dirUrl(pin) + "' target='_blank' rel='noopener'>Directions ↗</a>");
          var m = markers.find(function (x) { return x.title === pin.name; });
          if (m) info.open({ map: map, anchor: m });
        }
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
      refit();
    });

    if (lens === "all" && (cats.length > 1 || all.some(function (p) { return p.dayIdx != null; }))) buildChips(mount, cats, off, data.dayDates || [], function (cat, on) {
      off[cat] = !on; dayFilter = null; draw();
    }, function (dayIdx) { dayFilter = dayIdx; draw(); fitTo(visible()); });

    if (lens === "today") {
      dayFilter = parseInt(mount.getAttribute("data-map-day") || "0", 10) || 0;
      document.addEventListener("tg:trip-day", function (e) {
        dayFilter = e.detail.index;
        if (!ready) return;
        draw();
        fitTo(visible());
      });
    }
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
    document.addEventListener("tg:dest", function () { if (ready) setTimeout(function () { google.maps.event.trigger(map, "resize"); refit(); }, 60); });
    mount.__focusPin = function (id) { select(id, "row"); };
    mount.__fitDay = function (dayIdx) { dayFilter = dayIdx; if (ready) { draw(); fitTo(visible()); } };
    /* "My location" (map-dest.js): centre on a reading the reader asked for. Deliberately a pan
       and a zoom-in rather than a marker — the browser's own blue dot is the reading, and a
       second pin of ours claiming to be "you" would be a fact we did not measure. */
    mount.__panTo = function (lat, lng) {
      if (!ready) return;
      map.panTo({ lat: lat, lng: lng });
      if ((map.getZoom() || 0) < 14) map.setZoom(14);
    };
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
    /* The fade at the row's right edge (map.css .map-chips) says "there is more"; it must come
       off once there is not, or the last chip looks permanently clipped. Cheap to compute and
       only on scroll/resize, so it never runs during a pan of the map itself. */
    var markEnd = function () {
      var end = bar.scrollLeft + bar.clientWidth >= bar.scrollWidth - 1;
      if (end) bar.setAttribute("data-scroll-end", "");
      else bar.removeAttribute("data-scroll-end");
    };
    bar.addEventListener("scroll", markEnd, { passive: true });
    if (typeof ResizeObserver === "function") new ResizeObserver(markEnd).observe(bar);
    mount.insertBefore(bar, mount.firstChild);
    markEnd();
  }

  /* Google did not become the map: wake the dormant OSM embed (Google-primary mounts) and say
     so on the mount for CSS and the canary. Idempotent — the watchdog and a load error can
     both arrive. */
  function fallBack(mount, why) {
    if (mount.getAttribute("data-map-provider") === "google") return;
    var frame = mount.querySelector(".osmmap");
    if (frame && frame.hasAttribute("data-fallback-src")) {
      // The embed URL was rendered at build time, but it is read back out of the DOM here, so
      // it goes through the same credited http(s) step every page-read URL does.
      var url = safeHttpUrl(frame.getAttribute("data-fallback-src"));
      if (url) frame.setAttribute("src", url);
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
