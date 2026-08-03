/* Waypoint Google Maps provider — the opt-in interactive map upgrade.
   Self-boots ONLY when PUBLIC_GMAPS_KEY is present at build (via tgConfig);
   with no key, the OSM iframe embed in each map section is the map and this
   never runs. Upgrades every [data-itin-map] mount to a Google map with
   accent-styled markers + info windows. Lazy-loaded per mount.

   Key safety: the key is a PUBLIC browser key by design — restrict it to this
   site's HTTP referrers and to the Maps JavaScript API in Google Cloud Console. */

import { clusterPins } from "../model/cluster";

/* global google */ // injected on window by the Maps JS SDK once its loader script resolves
export function boot(cfg) {
  var mounts = Array.prototype.slice.call(document.querySelectorAll("[data-itin-map]"));
  if (!mounts.length) return;

  /* Official async bootstrap (importLibrary pattern). */
  var loaded = null;
  function loadApi() {
    if (loaded) return loaded;
    loaded = new Promise(function (resolve, reject) {
      /* VENDOR CODE — Google's published inline bootstrap loader, pasted verbatim and minified by
         them. TypeScript flags three hints inside it (window.maps ×2, a no-op await); all three are
         Google's, not ours, and they stay. Hand-editing minified upstream code to satisfy a linter
         means owning it forever and re-doing it at every Google update. Leave as-is; replace only
         by pasting a newer official snippet. */
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
  var ACCENT = cssVar("--accent");

  function zoomFromSpan(span) {
    var s = span || 0.05;
    return Math.max(5, Math.min(16, Math.round(13 - Math.log2(s / 0.05))));
  }
  function escapeHtml(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  var sharedInfo = null;

  function makeMap(api, mount, data) {
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

  function addMarker(api, map, pin) {
    var pinEl = new api.marker.PinElement({
      background: ACCENT,
      borderColor: mixHex(ACCENT, "#000000", 0.25),
      glyphColor: "#ffffff",
      scale: pin.kind === "center" ? 1.1 : 0.9,
    });
    var m = new api.marker.AdvancedMarkerElement({
      map: map, position: { lat: pin.lat, lng: pin.lng },
      content: pinEl.element, title: pin.name,
    });
    // Directions deep-link uses the pin's VERIFIED lat/lng, not a place_id: the guide's
    // place_id is an OSM/Nominatim id (the geocode's source record), which Google Maps
    // can't resolve — a coordinate destination is unambiguous and can't point at the
    // wrong business. `.local` (native-script name) rides above it for the show-the-driver
    // case; the two together are the "little translation available" answer.
    var dirUrl = "https://www.google.com/maps/dir/?api=1&destination=" + pin.lat + "," + pin.lng;
    var html = "<b>" + escapeHtml(pin.name) + "</b>" +
      (pin.local ? "<div class='wpop-local'>" + escapeHtml(pin.local) + "</div>" : "") +
      (pin.kind !== "center"
        ? "<a class='wpop-dir' href='" + dirUrl + "' target='_blank' rel='noopener'>Directions ↗</a>"
        : "") +
      (pin.kind === "sight" ? "<a class='wpop-jump' href='#sight-" + pin.id + "'>Details ↓</a>" : "");
    m.addListener("click", function () {
      sharedInfo.setContent(html);
      sharedInfo.open({ map: map, anchor: m });
    });
    return m;
  }

  /* A cluster of several pins draws as one count bubble; clicking it zooms in rather than
     opening a popup, because at that zoom the question is "what's in there", not "which one". */
  function addCluster(api, map, cluster) {
    var el = document.createElement("div");
    el.className = "map-cluster";
    el.textContent = String(cluster.pins.length);
    var m = new api.marker.AdvancedMarkerElement({
      map: map, position: { lat: cluster.lat, lng: cluster.lng }, content: el,
      title: cluster.pins.map(function (p) { return p.name; }).slice(0, 6).join("\n"),
    });
    m.addListener("click", function () {
      var b = new google.maps.LatLngBounds();
      cluster.pins.forEach(function (p) { b.extend({ lat: p.lat, lng: p.lng }); });
      map.fitBounds(b, 60);
    });
    return m;
  }

  function initMap(api, mount, data) {
    var map = makeMap(api, mount, data);
    var all = (data.pins || []).filter(function (p) {
      return typeof p.lat === "number" && typeof p.lng === "number";
    });
    if (!all.length) return;

    /* Which categories are switched on. Starts as everything — a map that hides content until
       you opt in would be a map that looks empty. */
    var cats = [];
    all.forEach(function (p) {
      if (p.cat && p.kind !== "center" && cats.indexOf(p.cat) === -1) cats.push(p.cat);
    });
    var off = {};
    var markers = [];

    function visible() {
      return all.filter(function (p) { return p.kind === "center" || !p.cat || !off[p.cat]; });
    }

    function draw() {
      markers.forEach(function (m) { m.map = null; });
      markers = [];
      var pins = visible();
      // The centre is chrome, not content — it never clusters and never counts.
      var centre = pins.filter(function (p) { return p.kind === "center"; });
      var rest = pins.filter(function (p) { return p.kind !== "center"; });
      centre.forEach(function (p) { markers.push(addMarker(api, map, p)); });
      clusterPins(rest, map.getZoom() || 13).forEach(function (c) {
        markers.push(c.pins.length === 1 ? addMarker(api, map, c.pins[0]) : addCluster(api, map, c));
      });
    }

    draw();
    // Re-cluster on zoom: the grouping is a function of zoom, so it has to follow it.
    map.addListener("zoom_changed", function () { draw(); });

    if (cats.length > 1) buildChips(mount, cats, off, function () { draw(); });

    if (all.length > 1) {
      var b = new google.maps.LatLngBounds();
      all.forEach(function (p) { b.extend({ lat: p.lat, lng: p.lng }); });
      map.fitBounds(b, 40);
    }
  }

  /* Filter chips, built from the categories the guide actually has (map-pins.ts derives them
     from section groups). Only rendered when there is more than one — a single chip is chrome
     that filters nothing. */
  function buildChips(mount, cats, off, onChange) {
    var bar = document.createElement("div");
    bar.className = "map-chips";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "Filter map by category");
    cats.forEach(function (cat) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "map-chip map-chip-on";
      b.textContent = cat;
      b.setAttribute("aria-pressed", "true");
      b.addEventListener("click", function () {
        off[cat] = !off[cat];
        b.classList.toggle("map-chip-on", !off[cat]);
        b.setAttribute("aria-pressed", off[cat] ? "false" : "true");
        onChange();
      });
      bar.appendChild(b);
    });
    mount.insertBefore(bar, mount.firstChild);
  }

  function init(mount) {
    var dataEl = mount.querySelector("script[data-map-data]");
    if (!dataEl) return;
    var data;
    try { data = JSON.parse(dataEl.textContent); } catch (e) { return; }
    if (!data.center || typeof data.center.lat !== "number") return;
    // Replace the default OSM iframe fallback before rendering Google.
    var frame = mount.querySelector(".osmmap");
    if (frame) {
      // fullscreen.js already wired a ⤢ button onto this iframe's wrapper at page
      // load (it runs eagerly; this upgrade is lazy and can fire minutes later, well
      // after that button exists). Capture the wrap BEFORE removing the frame —
      // frame.parentElement goes null the instant it's detached — and strip the now-
      // dangling button along with it. Google's own map ships fullscreenControl: true,
      // so nothing is lost; without this, the OSM button sits there pointing at a
      // removed element and silently does nothing on click.
      var wrap = frame.parentElement;
      frame.remove();
      if (wrap) {
        var staleBtn = wrap.querySelector(".map-fs-btn");
        if (staleBtn) staleBtn.remove();
      }
    }
    loadApi().then(function (api) { initMap(api, mount, data); })
      .catch(function (err) { console.warn("[gmaps] failed to load:", err && err.message); });
  }

  /* Lazy init — only when a map nears the viewport; wedge + tab-reveal fallbacks. */
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
    setTimeout(function () { if (!ioEverFired) { io.disconnect(); initOnce(mounts[0]); } }, 3000);
  } else {
    mounts.forEach(initOnce);
  }
  document.addEventListener("click", function () {
    setTimeout(function () {
      mounts.forEach(function (m) {
        if (inited.has(m)) return;
        var r = m.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && r.top < innerHeight + 400 && r.bottom > -400) initOnce(m);
      });
    }, 60);
  }, { passive: true });
}

/* Self-boot: opt-in only. Runs when a PUBLIC_GMAPS_KEY was set at build
   (surfaced via tgConfig); otherwise the OSM iframe embed is the map. */
(function () {
  var el = document.getElementById("tgConfig");
  var cfg = el ? JSON.parse(el.textContent || "{}") : {};
  if (cfg.gmapsKey) boot(cfg);
})();
