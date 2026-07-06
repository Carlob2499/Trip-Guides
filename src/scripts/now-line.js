/* Waypoint now-line — live "you are here" in today's itinerary.
   During the trip, today's day card (guide-ui already marks .day-today) gets
   its stop ladder annotated against the DESTINATION clock (IANA zone from
   tgConfig, DST-correct): stops whose time has passed dim, and the next
   upcoming stop carries a pulsing "next" marker. Stops with unparseable
   times ("morning", "evening") are left untouched — never guessed.
   Refreshes each minute; does nothing outside the trip window. */

(function () {
  var cfgEl = document.getElementById("tgConfig");
  var cfg = cfgEl ? JSON.parse(cfgEl.textContent || "{}") : {};
  var tz = cfg.destTzIana;
  if (!tz) return;

  // Destination wall-clock minutes since midnight, via Intl (DST-correct).
  function destNowMinutes() {
    try {
      var p = {};
      new Intl.DateTimeFormat("en-US", { timeZone: tz, hour12: false, hour: "2-digit", minute: "2-digit" })
        .formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      return (parseInt(p.hour, 10) % 24) * 60 + parseInt(p.minute, 10);
    } catch (e) { return null; }
  }
  // First HH:MM in a stop-time string ("~06:15", "17:00–21:00" → start time).
  function parseStart(str) {
    var m = /(\d{1,2}):(\d{2})/.exec(String(str || ""));
    return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null;
  }

  function refresh() {
    var today = document.querySelector(".day-today");
    if (!today) return;
    var now = destNowMinutes();
    if (now == null) return;
    var stops = Array.prototype.slice.call(today.querySelectorAll(".stop"));
    var nextMarked = false;
    stops.forEach(function (stop) {
      var t = parseStart((stop.querySelector(".stop-time") || {}).textContent);
      stop.classList.remove("stop-past", "stop-next");
      if (t == null) return;
      if (t < now) stop.classList.add("stop-past");
      else if (!nextMarked) { stop.classList.add("stop-next"); nextMarked = true; }
    });
  }

  refresh();
  // Battery-conscious: the minute tick only runs while the page is visible;
  // returning to the tab refreshes immediately.
  var timer = setInterval(refresh, 60000);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { clearInterval(timer); timer = null; }
    else if (!timer) { refresh(); timer = setInterval(refresh, 60000); }
  });
})();
