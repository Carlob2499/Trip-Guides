/* Waypoint connection state machine (R3) — one owner for "are we online?".
   Stamps <html data-conn="online|offline">, shows the quiet offline pill, and
   emits a `tg:connchange` CustomEvent for any silo that cares. CSS keys off the
   attribute so LIVE surfaces (weather tile, embedded maps, Trip Split's live dot)
   degrade EXPLICITLY — dimmed, not silently stale — while the PWA's saved copy
   keeps working. Content never depends on this; it only ever dims live chrome. */

(function () {
  var pill = document.createElement("div");
  pill.className = "offline-pill";
  pill.setAttribute("role", "status");
  pill.textContent = "Offline — using your saved copy · live data paused, maps & photos need a connection";
  pill.hidden = true;
  document.body.appendChild(pill);

  function sync() {
    var off = navigator.onLine === false;
    pill.hidden = !off;
    document.documentElement.setAttribute("data-conn", off ? "offline" : "online");
    try {
      window.dispatchEvent(new CustomEvent("tg:connchange", { detail: { online: !off } }));
    } catch (e) { /* CustomEvent ctor missing = ancient browser; the attribute still works */ }
  }
  window.addEventListener("online", sync);
  window.addEventListener("offline", sync);
  sync();
})();
