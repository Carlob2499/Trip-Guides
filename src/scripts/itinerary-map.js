/* Waypoint itinerary maps — Leaflet progressive enhancement.
   Upgrades every [data-itin-map] mount (rendered by MapBlock.astro with a JSON
   pin payload) into an interactive map: divIcon markers (CSS-drawn, accent-
   colored — no image assets, so no bundler icon-path breakage), popups with
   native-script names, pin↔sight-card sync, and a fullscreen toggle.

   Cost discipline: Leaflet is dynamically import()ed only when the first map
   scrolls within 400px of the viewport — a page whose maps are never seen
   (or a map-less page) loads zero Leaflet bytes and requests zero OSM tiles.
   Honors prefers-reduced-motion (no flyTo animation). */

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

  // Registry so sight-card "show on map" buttons can address the primary map's
  // markers even before/after lazy init. primary = first mount on the page.
  var primary = { mount: mounts[0], map: null, markers: {}, queue: [] };

  var zoomFromSpan = function (span) {
    var s = span || 0.05;
    var z = Math.round(13 - Math.log2(s / 0.05));
    return Math.max(5, Math.min(16, z));
  };

  function init(mount) {
    var dataEl = mount.querySelector("script[data-map-data]");
    if (!dataEl) return;
    var data;
    try { data = JSON.parse(dataEl.textContent); } catch (e) { return; }

    loadLeaflet().then(function (L) {
      var map = L.map(mount, {
        // Scroll-wheel zoom only after the user clicks in — otherwise the map
        // hijacks page scrolling on the way through the guide.
        scrollWheelZoom: false,
        zoomAnimation: !reduced, fadeAnimation: !reduced, markerZoomAnimation: !reduced,
      });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      map.on("focus click", function () { map.scrollWheelZoom.enable(); });
      map.on("blur", function () { map.scrollWheelZoom.disable(); });

      var isPrimary = mount === primary.mount;
      var bounds = [];
      (data.pins || []).forEach(function (pin) {
        if (typeof pin.lat !== "number" || typeof pin.lng !== "number") return;
        var icon = L.divIcon({
          className: "wpin wpin-" + pin.kind,
          iconSize: [26, 26], iconAnchor: [13, 13], popupAnchor: [0, -12],
          html: "<span class='wpin-dot'></span>",
        });
        var html = "<b>" + escapeHtml(pin.name) + "</b>" +
          (pin.local ? "<span class='wpop-local'>" + escapeHtml(pin.local) + "</span>" : "") +
          (pin.kind === "sight" ? "<a class='wpop-jump' href='#sight-" + pin.id + "'>Details ↓</a>" : "");
        var m = L.marker([pin.lat, pin.lng], { icon: icon, title: pin.name }).addTo(map).bindPopup(html);
        bounds.push([pin.lat, pin.lng]);
        if (isPrimary) primary.markers[pin.id] = m;
      });

      if (bounds.length > 1) map.fitBounds(bounds, { padding: [34, 34], animate: false });
      else map.setView([data.center.lat, data.center.lng], zoomFromSpan(data.span), { animate: false });

      // Popup "Details ↓" → flash the sight card so the eye lands on it.
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

      // Fullscreen toggle — same look as the old iframe button (.map-fs-btn).
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

      if (isPrimary) {
        primary.map = map;
        primary.queue.splice(0).forEach(function (fn) { fn(); });
      }
    }).catch(function (err) {
      // Graceful: leave the styled mount + offline note; log for diagnosis.
      console.warn("[itinerary-map] Leaflet failed to load:", err && err.message);
    });
  }

  function escapeHtml(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Lazy init: only when a map nears the viewport.
  var inited = new WeakSet();
  function initOnce(m) { if (!inited.has(m)) { inited.add(m); init(m); } }
  if ("IntersectionObserver" in window) {
    var ioEverFired = false;
    var io = new IntersectionObserver(function (entries) {
      ioEverFired = true; // spec: the initial callback always fires with current state
      entries.forEach(function (e) {
        if (e.isIntersecting) { io.unobserve(e.target); initOnce(e.target); }
      });
    }, { rootMargin: "400px" });
    mounts.forEach(function (m) { io.observe(m); });
    // Wedged-IO fallback: if the guaranteed initial callback never arrived (seen in
    // prerendered/backgrounded/wedged tabs), lazy loading can never trigger — init
    // the primary map directly so the guide's main map always works; the rest stay
    // reachable via the pin-jump path below.
    setTimeout(function () {
      if (!ioEverFired) { io.disconnect(); initOnce(primary.mount); }
    }, 3000);
  } else {
    mounts.forEach(initOnce);
  }

  // Sight-card "◈ Map" buttons → scroll to the primary map and focus the pin.
  // Works pre-init: scrolling the map into view triggers the lazy init, and the
  // focus action is queued until the map is ready.
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
