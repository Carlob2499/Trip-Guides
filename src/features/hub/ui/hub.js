/* Waypoint hub — next-trip hero live data + search/filter + upcoming-sort.
   All state is ephemeral (no persistence); filtering is pure DOM over a handful
   of cards. Weather peek reuses the guide pages' Open-Meteo + sessionStorage
   fetch-once pattern; offline or API failure just leaves the pill hidden. */

import { localISODate } from "../../../lib/trip-dates";

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
    // R5: the hero carries `.hubcard` (R3 made it a grid entry so it filters), but it must
    // NOT join the date sort — its `grid-column: 1/-1` spanning cell is the page's opening
    // frame, and a FINISHED featured trip (`heroIsPast`, i.e. most of the year) carries a
    // past `data-start` that sorted it into the past group, underneath ordinary cards.
    // Filtering still sees every card; only the re-append order excludes the hero.
    var sortable = cards.filter(function (c) { return !c.classList.contains("hub-hero"); });
    // R2: LOCAL calendar components (localISODate), NOT `.toISOString()` — that converts
    // to UTC first, so for any negative UTC offset "today" here could read as tomorrow's
    // date while `data-start` (built the same way, server-side, from index.astro) still
    // reads today's real local date — mis-sorting a trip starting today as already past.
    var todayISO = localISODate(new Date());
    // Future trips first (soonest first), then past/undated alphabetically as built.
    var keyOf = function (c) {
      var s = c.getAttribute("data-start") || "";
      return s >= todayISO ? "0" + s : "1" + (s || "~");
    };
    sortable
      .slice()
      .sort(function (a, b) { return keyOf(a) < keyOf(b) ? -1 : 1; })
      .forEach(function (c) { grid.appendChild(c); });

    /* ── Search + continent chips ───────────────────────────────────────────
       Chips filter by CONTINENT (data-continent). Search still matches the card's
       data-search blob, which includes the country name — so typing "korea" finds it
       even though there's no country chip. */
    var search = document.getElementById("hubSearch");
    // The reset control deliberately does NOT carry `.hub-chip` — it would otherwise join
    // this list and be treated as a continent filter with an empty `data-filter`.
    var chips = Array.prototype.slice.call(document.querySelectorAll(".hub-chip"));
    var empty = document.getElementById("hubEmpty");
    var emptyMsg = empty && empty.querySelector("[data-empty-msg]");
    var reset = document.querySelector("[data-hub-reset]");
    var status = document.getElementById("hubStatus");
    var activeContinent = "";
    var total = cards.length;
    var trips = total === 1 ? "trip" : "trips";
    if (reset) reset.textContent = "Show all " + total + " " + trips;

    function apply() {
      var raw = (search && search.value || "").trim();
      var q = raw.toLowerCase();
      var shown = 0;
      cards.forEach(function (c) {
        var ok =
          (!activeContinent || c.getAttribute("data-continent") === activeContinent) &&
          (!q || (c.getAttribute("data-search") || "").indexOf(q) !== -1);
        c.toggleAttribute("hidden", !ok);
        if (ok) shown++;
      });
      if (empty) empty.toggleAttribute("hidden", shown > 0);
      // R5: the empty state names what the visitor actually did — both filters, in their
      // own words — instead of a fixed sentence that guessed "country" while the chips
      // above it say continent. With nothing to reset the sentence never renders.
      if (emptyMsg && shown === 0) {
        emptyMsg.textContent =
          raw && activeContinent ? "No guides match “" + raw + "” in " + activeContinent + "."
          : raw                  ? "No guides match “" + raw + "”."
          : activeContinent      ? "No guides in " + activeContinent + " yet."
          : "No guides match.";
      }
      // R5: the grid mutated silently for anyone not watching it. One polite live region
      // carries the count, which covers the empty case too — so `#hubEmpty` stays a plain
      // visual element rather than a live region that is `hidden` most of the time.
      if (status) status.textContent = shown + " of " + total + " " + trips + " shown";
    }

    function setContinent(value) {
      activeContinent = value || "";
      chips.forEach(function (c) {
        var on = (c.getAttribute("data-filter") || "") === activeContinent;
        c.classList.toggle("hub-chip-active", on);
        c.setAttribute("aria-pressed", String(on));
      });
      apply();
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () { setContinent(chip.getAttribute("data-filter")); });
    });
    if (search) search.addEventListener("input", apply);
    if (reset) {
      reset.addEventListener("click", function () {
        if (search) search.value = "";
        setContinent("");
        // Focus lands on the search field, not on a button that just vanished with the
        // empty state — otherwise the keyboard user is dropped back at `<body>`.
        if (search) search.focus();
      });
    }
  }
})();
