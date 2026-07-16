/* Waypoint hub — next-trip hero live data + search/filter + upcoming-sort.
   All state is ephemeral (no persistence); filtering is pure DOM over a handful
   of cards. Weather peek reuses the guide pages' Open-Meteo + sessionStorage
   fetch-once pattern; offline or API failure just leaves the pill hidden. */

(function () {
  /* ── Hero: live countdown ─────────────────────────────────────────────── */
  var hero = document.querySelector(".hub-hero");
  if (hero) {
    var cd = hero.querySelector("[data-hero-countdown]");
    var startISO = hero.getAttribute("data-hero-start");
    if (cd && startISO) {
      var parts = startISO.split("-").map(Number);
      var start = new Date(parts[0], parts[1] - 1, parts[2]); // local midnight
      var now = new Date();
      var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      var diff = Math.round((start - today) / 86400000);
      if (diff > 1) cd.textContent = diff + " days to go";
      else if (diff === 1) cd.textContent = "Tomorrow";
      else if (diff === 0) cd.textContent = "Today!";
      else cd.textContent = "In progress";
    }

    /* ── Hero: weather peek (today at the destination) ───────────────────── */
    var wx = hero.querySelector("[data-hero-wx]");
    var lat = parseFloat(hero.getAttribute("data-hero-lat"));
    var lng = parseFloat(hero.getAttribute("data-hero-lng"));
    if (wx && Number.isFinite(lat) && Number.isFinite(lng)) {
      var key = "hub-wx-" + lat.toFixed(2) + "," + lng.toFixed(2);
      var render = function (d) {
        var hi = d.temperature_2m_max && d.temperature_2m_max[0];
        var lo = d.temperature_2m_min && d.temperature_2m_min[0];
        if (typeof hi !== "number" || typeof lo !== "number") return;
        if (hi < -90 || hi > 60 || lo < -90 || lo > 60) return;
        wx.textContent = "☀ " + Math.round(hi) + "° / " + Math.round(lo) + "° today";
        wx.removeAttribute("hidden");
      };
      var cached = null;
      try { cached = JSON.parse(sessionStorage.getItem(key)); } catch (e) {}
      if (cached) render(cached);
      else {
        fetch("https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lng +
          "&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto&temperature_unit=celsius")
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (data) {
            if (!data || !data.daily) return;
            try { sessionStorage.setItem(key, JSON.stringify(data.daily)); } catch (e) {}
            render(data.daily);
          })
          .catch(function () {}); // offline → pill stays hidden
      }
    }
  }

  /* ── Grid: upcoming-first sort ────────────────────────────────────────── */
  var grid = document.getElementById("hubGrid");
  if (grid) {
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".hubcard"));
    var todayISO = new Date().toISOString().slice(0, 10);
    // Future trips first (soonest first), then past/undated alphabetically as built.
    var keyOf = function (c) {
      var s = c.getAttribute("data-start") || "";
      return s >= todayISO ? "0" + s : "1" + (s || "~");
    };
    cards
      .slice()
      .sort(function (a, b) { return keyOf(a) < keyOf(b) ? -1 : 1; })
      .forEach(function (c) { grid.appendChild(c); });

    /* ── Search + continent chips ───────────────────────────────────────────
       Chips filter by CONTINENT (data-continent). Search still matches the card's
       data-search blob, which includes the country name — so typing "korea" finds it
       even though there's no country chip. */
    var search = document.getElementById("hubSearch");
    var chips = Array.prototype.slice.call(document.querySelectorAll(".hub-chip"));
    var empty = document.getElementById("hubEmpty");
    var activeContinent = "";
    function apply() {
      var q = (search && search.value || "").trim().toLowerCase();
      var shown = 0;
      cards.forEach(function (c) {
        var ok =
          (!activeContinent || c.getAttribute("data-continent") === activeContinent) &&
          (!q || (c.getAttribute("data-search") || "").indexOf(q) !== -1);
        c.toggleAttribute("hidden", !ok);
        if (ok) shown++;
      });
      if (empty) empty.toggleAttribute("hidden", shown > 0);
    }
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        activeContinent = chip.getAttribute("data-filter") || "";
        chips.forEach(function (c) { c.classList.toggle("hub-chip-active", c === chip); });
        apply();
      });
    });
    if (search) search.addEventListener("input", apply);
  }
})();
