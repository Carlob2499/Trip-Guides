/* Waypoint Google Maps provider — the opt-in interactive map upgrade.
   Self-boots ONLY when PUBLIC_GMAPS_KEY is present at build (via tgConfig);
   with no key, the OSM iframe embed in each map section is the map and this
   never runs. Upgrades every [data-itin-map] mount to a Google map with
   accent-styled markers + info windows. Lazy-loaded per mount.

   Key safety: the key is a PUBLIC browser key by design — restrict it to this
   site's HTTP referrers and to the Maps JavaScript API in Google Cloud Console. */

export function boot(cfg) {
  var mounts = Array.prototype.slice.call(document.querySelectorAll("[data-itin-map]"));
  if (!mounts.length) return;

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
    var html = "<b>" + escapeHtml(pin.name) + "</b>" +
      (pin.local ? "<div class='wpop-local'>" + escapeHtml(pin.local) + "</div>" : "") +
      (pin.kind === "sight" ? "<a class='wpop-jump' href='#sight-" + pin.id + "'>Details ↓</a>" : "");
    m.addListener("click", function () {
      sharedInfo.setContent(html);
      sharedInfo.open({ map: map, anchor: m });
    });
    return m;
  }

  function initMap(api, mount, data) {
    var map = makeMap(api, mount, data);
    var coords = [];
    (data.pins || []).forEach(function (pin) {
      if (typeof pin.lat !== "number" || typeof pin.lng !== "number") return;
      addMarker(api, map, pin);
      coords.push([pin.lat, pin.lng]);
    });
    if (coords.length > 1) {
      var b = new google.maps.LatLngBounds();
      coords.forEach(function (c) { b.extend({ lat: c[0], lng: c[1] }); });
      map.fitBounds(b, 40);
    }
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
