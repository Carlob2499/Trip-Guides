/* Waypoint trip pulse — three time-aware nudges that only exist during the
   trip, all built on data the page already has (never invented):
   1. ARRIVAL AUTOPILOT — the first time the guide is opened on each trip
     day, Focus Today opens itself (once per day; dismiss and it stays away).
     The most disoriented hour of a trip gets the most guidance.
   2. WEATHER NUDGE — if today's Open-Meteo forecast at the destination says
     rain is likely, a quiet banner points at the day's own ⚠ contingencies.
     It never invents a plan B — it routes to the researched one.
   3. DEPARTURE GATE — in the evening (destination clock), if tomorrow's
     day-kit still has unchecked items, a banner says how many and jumps
     there. Prevents the forgotten-passport morning. */

(function () {
  var cfgEl = document.getElementById("tgConfig");
  var cfg = cfgEl ? JSON.parse(cfgEl.textContent || "{}") : {};
  var storeKey = document.body.getAttribute("data-storekey") || "guide";
  var todayCard = document.querySelector(".day-today");
  if (!todayCard) return; // pulse features exist only during the trip

  function destParts() {
    try {
      var p = {};
      new Intl.DateTimeFormat("en-US", { timeZone: cfg.destTzIana || undefined, hour12: false,
        year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit" })
        .formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      return { iso: p.year + "-" + p.month + "-" + p.day, hour: parseInt(p.hour, 10) % 24 };
    } catch (e) { return null; }
  }
  var dest = destParts();
  if (!dest) return;

  function banner(cls, text, onClick) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "pulse-banner " + cls;
    b.textContent = text;
    var host = document.querySelector(".masthead") || document.body;
    host.appendChild(b);
    b.addEventListener("click", function () { b.remove(); onClick(); });
    return b;
  }
  function goToday() {
    document.dispatchEvent(new CustomEvent("tg:focus-today"));
  }

  /* ── 1. Arrival autopilot ─────────────────────────────────────────────── */
  var AUTO_KEY = "tg-autofocus-" + storeKey;
  var last = null;
  try { last = localStorage.getItem(AUTO_KEY); } catch (e) {}
  if (last !== dest.iso) {
    try { localStorage.setItem(AUTO_KEY, dest.iso); } catch (e) {}
    setTimeout(goToday, 1200); // let the page settle first
  }

  /* ── 2. Weather nudge ─────────────────────────────────────────────────── */
  var c = cfg.mapCenter;
  if (c && typeof c.lat === "number") {
    var WX_KEY = "tg-pulse-wx-" + dest.iso;
    var seen = null;
    try { seen = sessionStorage.getItem(WX_KEY); } catch (e) {}
    if (!seen) {
      fetch("https://api.open-meteo.com/v1/forecast?latitude=" + c.lat + "&longitude=" + c.lng +
        "&daily=weathercode,precipitation_probability_max&forecast_days=1&timezone=auto")
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          try { sessionStorage.setItem(WX_KEY, "1"); } catch (e) {}
          var d = data && data.daily;
          if (!d) return;
          var code = d.weathercode && d.weathercode[0];
          var prob = d.precipitation_probability_max && d.precipitation_probability_max[0];
          var rainy = (typeof code === "number" && code >= 51) ||
                      (typeof prob === "number" && prob >= 60);
          if (!rainy) return;
          banner("pulse-wx",
            "☂ Rain likely today" + (typeof prob === "number" ? " (" + prob + "%)" : "") +
            " — check today's plan and its ⚠ contingencies →", goToday);
        })
        .catch(function () {});
    }
  }

  /* ── 3. Departure gate ────────────────────────────────────────────────── */
  if (dest.hour >= 18) {
    var tomorrow = todayCard.nextElementSibling;
    if (tomorrow && tomorrow.classList.contains("day")) {
      var unchecked = tomorrow.querySelectorAll(".daykit input[type=checkbox]:not(:checked)").length;
      var GATE_KEY = "tg-gate-" + dest.iso;
      var gateSeen = null;
      try { gateSeen = sessionStorage.getItem(GATE_KEY); } catch (e) {}
      if (unchecked > 0 && !gateSeen) {
        try { sessionStorage.setItem(GATE_KEY, "1"); } catch (e) {}
        banner("pulse-gate",
          "◻ " + unchecked + " kit item" + (unchecked > 1 ? "s" : "") +
          " unchecked for tomorrow — review before bed →",
          function () {
            var cat = tomorrow.closest(".catblock");
            if (cat) {
              var tab = document.querySelector('.gtab[data-tab="' + cat.getAttribute("data-ci") + '"]');
              if (tab) tab.click();
            }
            setTimeout(function () {
              window.scrollTo(0, tomorrow.getBoundingClientRect().top + window.scrollY - 120);
            }, 150);
          });
      }
    }
  }
})();
