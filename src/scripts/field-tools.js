/* Waypoint field tools — the on-the-street toolkit. Five small, high-value
   behaviors travelers use dozens of times a day, all progressive enhancement
   over data the guides already carry (works on every current and future
   guide automatically):
   1. Tap-to-copy native-script addresses ([data-addr-kr] spans) — hand the
      phone to a taxi driver.
   2. Stop check-off: tap a stop's number to tick it done (persists per guide).
   3. Currency quick-converter: tap the live rate pill for an inline converter.
   4. Jump-to-today chip: during the trip, one floating tap to today's card.
   5. Haptic ticks on check-off (quiet, guarded). */

(function () {
  var storeKey = document.body.getAttribute("data-storekey") || "guide";
  function buzz(ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} }

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

  /* ── 1. Tap-to-copy native addresses ───────────────────────────────────── */
  document.querySelectorAll("[data-addr-kr]").forEach(function (el) {
    el.classList.add("addr-copy");
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.setAttribute("title", "Tap to copy the Korean address");
    function copy() {
      var addr = el.getAttribute("data-addr-kr");
      (navigator.clipboard ? navigator.clipboard.writeText(addr) : Promise.reject()).then(
        function () { say("주소 복사됨 — address copied"); buzz(10); },
        function () { window.prompt("Copy this address:", addr); }
      );
    }
    el.addEventListener("click", copy);
    el.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); copy(); }
    });
  });

  /* ── 2. Stop check-off ─────────────────────────────────────────────────── */
  var STOPS_KEY = "tg-stops-" + storeKey;
  function loadStops() {
    try { return JSON.parse(localStorage.getItem(STOPS_KEY)) || {}; } catch (e) { return {}; }
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
      }
      num.addEventListener("click", toggle);
      num.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
      });
    });
  });

  /* ── 3. Currency quick-converter on the rate pill ──────────────────────── */
  var rate = null, code = null;
  document.addEventListener("tg:rate", function (e) {
    if (e.detail && e.detail.rate) { rate = e.detail.rate; code = e.detail.code; }
  });
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
      var v = parseFloat(inp.value);
      if (!rate || isNaN(v)) { out.textContent = rate ? "Type an amount" : "Live rate not loaded"; return; }
      // tg:rate is USD → local (1 USD = rate local), matching the pill.
      out.innerHTML =
        "<b>$" + v.toLocaleString() + "</b> ≈ " + (v * rate).toLocaleString(undefined, { maximumFractionDigits: 0 }) + " " + code +
        "<br><b>" + v.toLocaleString() + " " + code + "</b> ≈ $" + (v / rate).toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
    inp.addEventListener("input", render);
    pill.style.cursor = "pointer";
    pill.setAttribute("role", "button");
    pill.setAttribute("tabindex", "0");
    function togglePop() {
      pop.hidden = !pop.hidden;
      if (!pop.hidden) {
        var r = pill.getBoundingClientRect();
        pop.style.top = (r.bottom + window.scrollY + 8) + "px";
        pop.style.left = Math.max(8, Math.min(innerWidth - 250, r.left)) + "px";
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

  /* ── 4. Jump-to-today chip (during the trip only) ──────────────────────── */
  var todayCard = document.querySelector(".day-today");
  var TK = "tg-today-chip-" + storeKey;
  var dismissed = false;
  try { dismissed = !!sessionStorage.getItem(TK); } catch (e) {}
  if (todayCard && !dismissed) {
    var chipEl = document.createElement("button");
    chipEl.type = "button";
    chipEl.className = "today-chip";
    var dateTxt = (todayCard.querySelector(".d") || {}).textContent || "Today";
    chipEl.innerHTML = "→ Today · " + dateTxt.replace(/^\s*\d+\s*/, "").trim();
    document.body.appendChild(chipEl);
    chipEl.addEventListener("click", function () {
      var cat = todayCard.closest(".catblock");
      if (cat) {
        var tab = document.querySelector('.gtab[data-tab="' + cat.getAttribute("data-ci") + '"]');
        if (tab) tab.click();
      }
      setTimeout(function () {
        window.scrollTo(0, todayCard.getBoundingClientRect().top + window.scrollY - 120);
      }, 120);
      chipEl.remove();
      try { sessionStorage.setItem(TK, "1"); } catch (e) {}
    });
  }
})();
