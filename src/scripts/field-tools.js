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

  /* ── 4. Focus Today — the on-the-street view ───────────────────────────────
     During the trip, the floating Today chip opens a stripped full-screen
     view of TODAY only: huge type, the stop ladder with times, tap-to-check
     (perfectly synced — checking here clicks the real stop's checkbox), and
     a link into the full plan. Built from the day-today card the page
     already rendered; no second source of truth. */
  var todayCard = document.querySelector(".day-today");
  if (todayCard) {
    var focusEl = null;
    function openFocus() {
      if (!focusEl) {
        focusEl = document.createElement("div");
        focusEl.className = "focus-today";
        focusEl.setAttribute("role", "dialog");
        focusEl.setAttribute("aria-modal", "true");
        focusEl.setAttribute("aria-label", "Today at a glance");
        var dateTxt = ((todayCard.querySelector(".d") || {}).textContent || "Today").replace(/^\s*\d+\s*/, "").trim();
        var title = (todayCard.querySelector(".b strong") || {}).textContent || "";
        var head = document.createElement("div");
        head.className = "focus-head";
        head.innerHTML = '<p class="focus-date"></p><h2 class="focus-title"></h2>' +
          '<p class="focus-tldr"></p>' +
          '<button class="focus-x" type="button" aria-label="Close today view">✕</button>';
        head.querySelector(".focus-date").textContent = dateTxt;
        head.querySelector(".focus-title").textContent = title;
        var tldrSrc = todayCard.querySelector(".day-tldr");
        var tldrEl = head.querySelector(".focus-tldr");
        if (tldrSrc) tldrEl.textContent = tldrSrc.textContent;
        else tldrEl.remove();
        focusEl.appendChild(head);
        var list = document.createElement("ol");
        list.className = "focus-stops";
        var srcStops = todayCard.querySelectorAll(".stop");
        srcStops.forEach(function (src, i) {
          var li = document.createElement("li");
          li.className = "focus-stop" + (src.classList.contains("stop-done") ? " focus-done" : "");
          li.setAttribute("role", "checkbox");
          li.setAttribute("tabindex", "0");
          li.setAttribute("aria-checked", src.classList.contains("stop-done") ? "true" : "false");
          li.innerHTML = '<span class="focus-time"></span><span class="focus-name"></span><span class="focus-note"></span>';
          li.querySelector(".focus-time").textContent = (src.querySelector(".stop-time") || {}).textContent || "·";
          li.querySelector(".focus-name").textContent = (src.querySelector(".stop-name") || {}).textContent || "";
          li.querySelector(".focus-note").textContent = (src.querySelector(".stop-note") || {}).textContent || "";
          function tick() {
            var num = src.querySelector(".stop-num");
            if (num) num.click(); // single source of truth — real stop toggles + persists
            var on = src.classList.contains("stop-done");
            li.classList.toggle("focus-done", on);
            li.setAttribute("aria-checked", on ? "true" : "false");
          }
          li.addEventListener("click", tick);
          li.addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tick(); }
          });
          list.appendChild(li);
        });
        focusEl.appendChild(list);
        var foot = document.createElement("button");
        foot.type = "button";
        foot.className = "focus-full";
        foot.textContent = "Open the full plan →";
        foot.addEventListener("click", function () {
          closeFocus();
          var cat = todayCard.closest(".catblock");
          if (cat) {
            var tab = document.querySelector('.gtab[data-tab="' + cat.getAttribute("data-ci") + '"]');
            if (tab) tab.click();
          }
          setTimeout(function () {
            window.scrollTo(0, todayCard.getBoundingClientRect().top + window.scrollY - 120);
          }, 120);
        });
        focusEl.appendChild(foot);
        document.body.appendChild(focusEl);
        head.querySelector(".focus-x").addEventListener("click", closeFocus);
        document.addEventListener("keydown", function (e) {
          if (e.key === "Escape" && focusEl.classList.contains("focus-on")) closeFocus();
        });
      }
      focusEl.classList.add("focus-on");
      document.body.classList.add("sheet-lock");
      focusEl.querySelector(".focus-x").focus();
    }
    function closeFocus() {
      if (focusEl) focusEl.classList.remove("focus-on");
      document.body.classList.remove("sheet-lock");
      if (chipEl && document.body.contains(chipEl)) chipEl.focus();
    }

    var chipEl = document.createElement("button");
    chipEl.type = "button";
    chipEl.className = "today-chip";
    var chipDate = ((todayCard.querySelector(".d") || {}).textContent || "Today").replace(/^\s*\d+\s*/, "").trim();
    chipEl.textContent = "◉ Today · " + chipDate;
    document.body.appendChild(chipEl);
    chipEl.addEventListener("click", openFocus);
  }

  /* ── 4a-ii. Data-freshness chip + budget burn tile in the masthead ─────── */
  (function () {
    var stats = document.getElementById("guideStats");
    if (!stats) return;
    var cfgEl2 = document.getElementById("tgConfig");
    var cfg2 = cfgEl2 ? JSON.parse(cfgEl2.textContent || "{}") : {};
    // Freshness: surface the guide's own verification date (already in data).
    if (cfg2.verifiedDate) {
      var vf = document.createElement("span");
      vf.className = "gstat";
      vf.textContent = "✓ data checked " + cfg2.verifiedDate;
      stats.appendChild(vf);
    }
    // Burn tile: total logged in the Budget calculator, tap to open it.
    function renderBurn() {
      try {
        var s = JSON.parse(localStorage.getItem("tg-split-" + storeKey) || "null");
        var total = (s && s.expenses || []).reduce(function (sum, ex) {
          return sum + (parseFloat(ex.amount) || 0);
        }, 0);
        var el = document.getElementById("burnPill");
        if (!total) { if (el) el.remove(); return; }
        if (!el) {
          el = document.createElement("button");
          el.id = "burnPill";
          el.type = "button";
          el.className = "gstat gstat-burn";
          el.addEventListener("click", function () {
            var t = document.querySelector('.gtab[data-tab="split"]');
            if (t) t.click();
          });
          stats.appendChild(el);
        }
        el.textContent = "$" + total.toLocaleString(undefined, { maximumFractionDigits: 0 }) + " logged →";
      } catch (e) {}
    }
    renderBurn();
    document.addEventListener("visibilitychange", renderBurn);
    var tabsForBurn = document.getElementById("guideTabs");
    if (tabsForBurn) tabsForBurn.addEventListener("click", function () { setTimeout(renderBurn, 300); });
  })();

  /* ── 2b. Progress share: checked stops travel in a link ────────────────── */
  (function () {
    var params = new URLSearchParams(window.location.search);
    if (params.get("stops")) {
      try {
        var incoming = JSON.parse(decodeURIComponent(escape(atob(params.get("stops")))));
        if (incoming && typeof incoming === "object") {
          Object.keys(incoming).forEach(function (k) {
            if (/^\d+-\d+$/.test(k)) stopState[k] = 1;
          });
          try { localStorage.setItem(STOPS_KEY, JSON.stringify(stopState)); } catch (e) {}
          // Re-mark ticked stops now that state merged.
          document.querySelectorAll(".planner-days .day[data-day]").forEach(function (day) {
            var di = day.getAttribute("data-day");
            day.querySelectorAll(".stop").forEach(function (stop, si) {
              if (stopState[di + "-" + si]) stop.classList.add("stop-done");
            });
          });
        }
      } catch (e) {}
      params.delete("stops");
      var qs = params.toString();
      history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : "") + window.location.hash);
    }
    var modal = document.getElementById("shareModal");
    if (modal && Object.keys(stopState).length + document.querySelectorAll(".stop").length > 0) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "share-summary-btn";
      b.textContent = "↗ Share trip progress (checked stops)";
      b.addEventListener("click", function () {
        var url = window.location.origin + window.location.pathname +
          "?stops=" + btoa(unescape(encodeURIComponent(JSON.stringify(stopState))));
        (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(
          function () { say("Progress link copied"); },
          function () { window.prompt("Copy this link:", url); }
        );
      });
      modal.appendChild(b);
    }
  })();

  /* ── 4b. Section position in the mobile bottom bar ("3/13") ────────────── */
  var bsCur = document.getElementById("curCat");
  var tabsEl = document.getElementById("guideTabs");
  if (bsCur && tabsEl) {
    var numTabs = tabsEl.querySelectorAll('.gtab[data-tab]');
    var totalSections = Array.prototype.filter.call(numTabs, function (t) {
      return /^\d+$/.test(t.getAttribute("data-tab"));
    }).length;
    var posEl = document.createElement("span");
    posEl.className = "bs-pos";
    bsCur.insertAdjacentElement("afterend", posEl);
    function syncPos() {
      var a = tabsEl.querySelector(".gtab-active");
      var v = a ? parseInt(a.getAttribute("data-tab"), 10) : NaN;
      posEl.textContent = isNaN(v) ? "" : (v + 1) + "/" + totalSections;
    }
    tabsEl.addEventListener("click", function () { setTimeout(syncPos, 50); });
    syncPos();
  }
})();
