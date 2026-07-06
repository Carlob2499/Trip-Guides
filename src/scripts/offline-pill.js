/* Waypoint offline pill — a quiet fixed indicator when the connection drops.
   The PWA already serves the saved copy offline; this just tells the traveler
   that's what's happening (and that maps/photos need a connection), instead
   of letting broken tiles be the first signal. */

(function () {
  var pill = document.createElement("div");
  pill.className = "offline-pill";
  pill.setAttribute("role", "status");
  pill.textContent = "Offline — using your saved copy · maps & photos need a connection";
  pill.hidden = true;
  document.body.appendChild(pill);

  function sync() { pill.hidden = navigator.onLine !== false; }
  window.addEventListener("online", sync);
  window.addEventListener("offline", sync);
  sync();
})();
