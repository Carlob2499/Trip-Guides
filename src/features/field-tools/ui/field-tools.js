/* Waypoint field tools — the on-the-street toolkit. Five small, high-value
   behaviors travelers use dozens of times a day, all progressive enhancement
   over data the guides already carry (works on every current and future
   guide automatically):
   1. Tap-to-copy native-script addresses ([data-addr-kr] spans) — hand the
      phone to a taxi driver.
   2. Stop check-off: tap a stop's number to tick it done (persists per guide).
   3. Currency quick-converter: tap the live rate pill for an inline converter.
   4. Haptic ticks on check-off (quiet, guarded).
   Every check-off announces itself (tg:stops) so the Trip destination's Now/Next follows. */

// Cross-feature, but through the silo's public surface (never a deep import) — the
// converter needs the rate live-data already applied, since this module loads after it.
import { getLastRate } from "../../live-data/index.js";
import { convertRate, decodeStops, encodeStops } from "../model/field-math";
import { trapFocus, migrateStorageKey, readStoredRecord } from "../../../scripts/util.js";

(function () {
  var storeKey = document.body.getAttribute("data-storekey") || "guide";
  var legacyStoreKey = document.body.getAttribute("data-legacy-storekey") || null;
  function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch { /* no haptics */ } }

  /* Shared mini-toast (independent of guide-ui internals). */
  var toast = document.createElement("div");
  toast.className = "ft-toast";
  toast.setAttribute("role", "status");
  document.body.appendChild(toast);
  var toastT = null;
  function say(msg) {
    toast.textContent = msg;
    toast.classList.add("ft-toast-on");
    clearTimeout(toastT);
    toastT = setTimeout(function () { toast.classList.remove("ft-toast-on"); }, 1800);
  }

  /* ── 1. Native addresses → the show-the-driver card ────────────────────────
     Tap opens a full-screen card with the address HUGE in native script —
     made to be held up to a taxi driver — plus a copy button for map apps. */
  var addrCard = null, addrLastFocus = null;
  function buildAddrCard() {
    if (addrCard) return;
    addrCard = document.createElement("div");
    addrCard.className = "addr-card";
    addrCard.setAttribute("role", "dialog");
    addrCard.setAttribute("aria-modal", "true");
    addrCard.setAttribute("aria-label", "Address card");
    addrCard.hidden = true;
    addrCard.innerHTML =
      '<div class="addr-card-inner">' +
      '<p class="addr-card-hint">Show this to the driver 기사님께 보여주세요</p>' +
      '<p class="addr-card-big"></p>' +
      '<p class="addr-card-en"></p>' +
      '<div class="addr-card-row">' +
      '<button class="addr-card-copy" type="button">⧉ Copy for Naver / Kakao</button>' +
      '<button class="addr-card-x" type="button">Close</button></div></div>';
    document.body.appendChild(addrCard);
    function closeCard() {
      addrCard.hidden = true;
      if (addrLastFocus && addrLastFocus.focus) addrLastFocus.focus();
    }
    addrCard.addEventListener("click", function (e) { if (e.target === addrCard) closeCard(); });
    addrCard.querySelector(".addr-card-x").addEventListener("click", closeCard);
    addrCard.querySelector(".addr-card-copy").addEventListener("click", function () {
      var addr = addrCard.querySelector(".addr-card-big").textContent;
      (navigator.clipboard ? navigator.clipboard.writeText(addr) : Promise.reject()).then(
        function () { say("주소 복사됨 — address copied"); buzz(10); },
        function () { window.prompt("Copy this address:", addr); }
      );
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !addrCard.hidden) closeCard();
    });
    // R3: claimed aria-modal without trapping focus — src/scripts/util.js's shared trap.
    trapFocus(addrCard, function () { return !addrCard.hidden; });
  }
  document.querySelectorAll("[data-addr-kr]").forEach(function (el) {
    el.classList.add("addr-copy");
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.setAttribute("title", "Tap for a show-the-driver address card");
    function show() {
      buildAddrCard();
      addrLastFocus = document.activeElement;
      addrCard.querySelector(".addr-card-big").textContent = el.getAttribute("data-addr-kr");
      // The span's visible text is the English form — show both scripts.
      var en = (el.textContent || "").trim();
      var enEl = addrCard.querySelector(".addr-card-en");
      enEl.textContent = en && en !== el.getAttribute("data-addr-kr") ? en : "";
      addrCard.hidden = false;
      addrCard.querySelector(".addr-card-copy").focus();
    }
    el.addEventListener("click", show);
    el.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); show(); }
    });
  });

  /* ── 2. Stop check-off ─────────────────────────────────────────────────── */
  var STOPS_KEY = "tg-stops-" + storeKey;
  // R8: migrate this guide's stop check-off state from the old title-derived key.
  try { migrateStorageKey(localStorage, STOPS_KEY, legacyStoreKey ? "tg-stops-" + legacyStoreKey : null); }
  catch (e) { /* storage unavailable */ }
  function loadStops() {
    return readStoredRecord(function () { return localStorage; }, STOPS_KEY);
  }
  var stopState = loadStops();
  document.querySelectorAll(".planner-days .day[data-day]").forEach(function (day) {
    var di = day.getAttribute("data-day");
    day.querySelectorAll(".stop").forEach(function (stop, si) {
      var key = di + "-" + si;
      var num = stop.querySelector(".stop-num");
      if (!num) return;
      if (stopState[key]) stop.classList.add("stop-done");
      num.setAttribute("role", "checkbox");
      num.setAttribute("tabindex", "0");
      num.setAttribute("aria-label", "Mark stop done");
      num.setAttribute("aria-checked", stopState[key] ? "true" : "false");
      function toggle() {
        var on = stop.classList.toggle("stop-done");
        num.setAttribute("aria-checked", on ? "true" : "false");
        if (on) { stopState[key] = 1; buzz(12); } else delete stopState[key];
        try { localStorage.setItem(STOPS_KEY, JSON.stringify(stopState)); } catch (e) {}
        try { document.dispatchEvent(new CustomEvent("tg:stops")); } catch (e) {}
      }
      num.addEventListener("click", toggle);
      num.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
      });
    });
  });

  /* ── 3. Currency quick-converter on the rate pill ──────────────────────── */
  // Seed from the live-data silo BEFORE listening: this module is imported after
  // guide-ui.js (a load-bearing order in GuideLayout), and on a warm rate cache the
  // silo applies the rate synchronously during guide-ui's evaluation — so tg:rate has
  // already fired by the time we get here and the converter read "Live rate not loaded"
  // on every second page view of the day. The listener still handles a cold fetch
  // resolving later; getLastRate() covers the event we were never around for.
  var seeded = getLastRate();
  var rate = seeded ? seeded.rate : null;
  // A currency code is three letters and nothing else. It reaches innerHTML below, and it
  // arrives from guide data or a CustomEvent detail — neither of which this module owns —
  // so it is narrowed here, at the boundary, instead of being escaped at every use site.
  var asCode = function (raw) { return /^[A-Za-z]{3}$/.test(String(raw || "")) ? String(raw).toUpperCase() : ""; };
  var code = seeded ? asCode(seeded.code) : null;
  var pill = document.getElementById("liveRatePill");
  if (pill) {
    var pop = document.createElement("div");
    pop.className = "cur-pop";
    pop.hidden = true;
    pop.innerHTML =
      '<input class="cur-in" type="number" inputmode="decimal" min="0" placeholder="Amount" aria-label="Amount to convert" />' +
      '<div class="cur-out" aria-live="polite"></div>';
    document.body.appendChild(pop);
    var inp = pop.querySelector(".cur-in");
    var out = pop.querySelector(".cur-out");
    function render() {
      var amount = parseFloat(inp.value);
      var res = convertRate(amount, rate); // math + branching in the tested model
      if (res.state === "no-rate") { out.textContent = "Live rate not loaded"; return; }
      if (res.state === "empty") { out.textContent = "Type an amount"; return; }
      // tg:rate is USD → local (1 USD = rate local), matching the pill.
      out.innerHTML =
        "<b>$" + amount.toLocaleString() + "</b> ≈ " + res.usdToLocal.toLocaleString(undefined, { maximumFractionDigits: 0 }) + " " + code +
        "<br><b>" + amount.toLocaleString() + " " + code + "</b> ≈ $" + res.localToUsd.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
    inp.addEventListener("input", render);
    // Registered here, not above, for two reasons: `render` is block-scoped to this `if`
    // (ES modules are strict, so a call from outside would throw), and with no pill there
    // is no converter to update. Re-rendering on arrival also fixes the case where a cold
    // fetch resolves while the popover is already open on a typed amount — it used to sit
    // on "Live rate not loaded" until the user typed again.
    document.addEventListener("tg:rate", function (e) {
      if (e.detail && e.detail.rate) { rate = e.detail.rate; code = asCode(e.detail.code); render(); }
    });
    pill.style.cursor = "pointer";
    pill.setAttribute("role", "button");
    pill.setAttribute("tabindex", "0");
    function togglePop() {
      pop.hidden = !pop.hidden;
      if (!pop.hidden) {
        var rect = pill.getBoundingClientRect();
        pop.style.top = (rect.bottom + window.scrollY + 8) + "px";
        // Clamp to the viewport using the popover's MEASURED width (it's visible by
        // now, so offsetWidth is real) — the old hardcoded 250px assumption clipped
        // the right edge on narrow screens whenever the popover rendered wider.
        var w = pop.offsetWidth || 250;
        pop.style.left = Math.max(8, Math.min(innerWidth - w - 8, rect.left)) + "px";
        render();
        inp.focus();
      }
    }
    pill.addEventListener("click", togglePop);
    pill.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); togglePop(); }
    });
    document.addEventListener("click", function (e) {
      if (!pop.hidden && !pop.contains(e.target) && e.target !== pill) pop.hidden = true;
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !pop.hidden) { pop.hidden = true; pill.focus(); }
    });
  }

  /* Focus Today (the floating chip + full-screen today view) retired with D7: the Trip
     destination IS the on-the-street view (design-system.md D6-19/48), painted from the same
     canonical days and the same check-off state this file persists. */

  /* ── 2b. Progress share: checked stops travel in a link ────────────────── */
  (function () {
    var params = new URLSearchParams(window.location.search);
    if (params.get("stops")) {
      // decodeStops validates + filters to <day>-<idx> keys (tamper-safe).
      var incoming = decodeStops(params.get("stops"));
      var incomingKeys = Object.keys(incoming);
      if (incomingKeys.length) {
        incomingKeys.forEach(function (key) { stopState[key] = 1; });
        try { localStorage.setItem(STOPS_KEY, JSON.stringify(stopState)); } catch (e) {}
        // Re-mark ticked stops now that state merged.
        document.querySelectorAll(".planner-days .day[data-day]").forEach(function (day) {
          var di = day.getAttribute("data-day");
          day.querySelectorAll(".stop").forEach(function (stop, si) {
            if (stopState[di + "-" + si]) stop.classList.add("stop-done");
          });
        });
      }
      params.delete("stops");
      var qs = params.toString();
      history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : "") + window.location.hash);
    }
    var modal = document.getElementById("shareModal");
    if (modal && Object.keys(stopState).length + document.querySelectorAll(".stop").length > 0) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "share-summary-btn";
      btn.textContent = "↗ Share trip progress (checked stops)";
      btn.addEventListener("click", function () {
        var url = window.location.origin + window.location.pathname +
          "?stops=" + encodeStops(stopState);
        (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(
          function () { say("Progress link copied"); },
          function () { window.prompt("Copy this link:", url); }
        );
      });
      modal.appendChild(btn);
    }
  })();

})();
