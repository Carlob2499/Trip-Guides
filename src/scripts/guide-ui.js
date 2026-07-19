// Guide interactive UI — extracted from GuideLayout.astro so it bundles into a
// single hashed module cached across every guide page (was ~950 lines inline per
// page). Config that used to come from Astro define:vars is now read from the
// #tgConfig JSON script tag emitted by the layout.
import { todayInTz } from "./util.js";
import { resolveTripDate } from "../lib/trip-dates";
import { initRate, initWeather, initDaySwap, initSun } from "../features/live-data/index.js";
import { initJetLag } from "./jetlag-ui.js";
import { initSharePanel } from "../features/share/index.js";
import { reportError } from "../features/firebase/index.js";

const _cfgEl = document.getElementById("tgConfig");
const _cfg = _cfgEl ? JSON.parse(_cfgEl.textContent || "{}") : {};
const order             = _cfg.order || [];
const storeKey          = _cfg.storeKey || "guide";
const mapCenter         = _cfg.mapCenter || null;
const firstDayDate      = _cfg.firstDayDate || null;
const lastDayDate       = _cfg.lastDayDate || null;
const hasWeatherSection = !!_cfg.hasWeatherSection;
const destTzIana        = _cfg.destTzIana || null;
const curCode           = _cfg.curCode || null;
const curFallbackRate   = _cfg.curFallbackRate || null;
const daysForBanner     = _cfg.daysForBanner || [];
      // Fault isolation: the coupled core (tab bar → budget, all bound by shared
      // closures like showTab/hashKey) runs in one try; each independent leaf feature
      // after it gets its own, so a throw in one leaf can no longer kill the rest and
      // the console names the culprit instead of a single generic message.
      function fail(name, e) {
        console.error("[guide-ui] " + name + " failed:", e);
        // Also beacon it so the maker can SEE production failures, not just the traveler's own
        // console. Best-effort + rate-limited inside reportError; never let it mask the original.
        try { reportError({ guide: storeKey, feature: name, message: (e && e.message) || String(e) }); } catch (_) {}
      }


      /* ── SHARED: SCROLL LOCK (used by both sheet and share modal) ─────── */
      var _lockCount = 0;
      function _lockScroll()   { if (++_lockCount === 1) document.body.classList.add("sheet-lock"); }
      function _unlockScroll() { if (--_lockCount <= 0) { _lockCount = 0; document.body.classList.remove("sheet-lock"); } }

      (function () {
        try {
          var STORE_KEY = "tripguide-" + (storeKey || "guide");

          // Single source of month names, shared by every section below that parses
          // a guide date string like "Wed Jul 8" (jump-to-today, trip countdown,
          // weather window). 0-indexed (MONTHS[0] === "Jan"), matching Date's own
          // month numbering — sections needing a 1-indexed month use "+ 1".
          var MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

          // resolveTripDate now comes from ../lib/trip-dates (imported above) — it's
          // shared with the live-data silo's weather window, and the year-rollover rule
          // it encodes is the kind that fails silently and only in December. It has
          // tests there; it had none here.

          // tzOffsetHours moved to ../lib/tz-offset — its only caller was the jet-lag
          // calculator, which now imports it directly inside jetlag-ui.js (imported
          // above). (The "local time" pill below uses Intl.DateTimeFormat directly and
          // never called this — that stale claim in the old comment here is gone too.)

          /* ── TAB BAR ─────────────────────────────────────────────────── */
          var guideTabs  = document.getElementById("guideTabs");
          var catblocks  = Array.prototype.slice.call(document.querySelectorAll(".catblock"));
          // Non-numeric tabs (each a standalone panel, not a section group).
          // Add a new one here + its DOM id — everything else generalizes.
          var specialPanels = {
            split:  document.getElementById("tripSplit"),
            vote:   document.getElementById("tripVote"),
            learn:  document.getElementById("tripLearn"),
            remind: document.getElementById("tripRemind"),
            kit:    document.getElementById("tripKit"),
          };
          var TAB_KEY = "tg-tab-" + STORE_KEY;

          function showTab(idx) {
            var isSpecial = typeof idx === "string" && specialPanels.hasOwnProperty(idx);
            catblocks.forEach(function (b, i) { b.hidden = isSpecial || i !== idx; });
            Object.keys(specialPanels).forEach(function (key) {
              var panel = specialPanels[key];
              if (panel) panel.hidden = !(isSpecial && idx === key);
            });
            if (guideTabs) {
              guideTabs.querySelectorAll(".gtab").forEach(function (btn) {
                var match = btn.dataset.tab === (isSpecial ? idx : String(idx));
                btn.setAttribute("aria-selected", match ? "true" : "false");
                btn.classList.toggle("gtab-active", match);
              });
              // Scroll active tab into view
              var active = guideTabs.querySelector(".gtab-active");
              if (active) active.scrollIntoView({ block: "nearest", inline: "nearest" });
            }
            try { sessionStorage.setItem(TAB_KEY, isSpecial ? idx : String(idx)); } catch (_) {}
            syncTabIndex();
          }

          function syncTabIndex() {
            if (!guideTabs) return;
            guideTabs.querySelectorAll(".gtab").forEach(function (btn) {
              btn.setAttribute("tabindex", btn.classList.contains("gtab-active") ? "0" : "-1");
            });
          }

          if (guideTabs) {
            guideTabs.querySelectorAll(".gtab").forEach(function (btn) {
              btn.addEventListener("click", function () {
                var t = this.dataset.tab;
                showTab(specialPanels.hasOwnProperty(t) ? t : parseInt(t, 10));
                // Post-switch scrolling is owned by scroll-memory.js (per-tab
                // position restore) — a hard jump to page top re-showed the
                // hero on every section change and lost the reader's place.
              });
            });
            guideTabs.addEventListener("keydown", function (e) {
              // Skip hidden tabs (e.g. Learnings before a trip is reflected on) so arrow
              // navigation never lands focus on an invisible control.
              var tabs = Array.prototype.slice.call(guideTabs.querySelectorAll(".gtab:not([hidden])"));
              var idx  = tabs.indexOf(document.activeElement);
              if (idx === -1) return;
              var next;
              if      (e.key === "ArrowRight") { next = (idx + 1) % tabs.length; }
              else if (e.key === "ArrowLeft")  { next = (idx - 1 + tabs.length) % tabs.length; }
              else if (e.key === "Home")        { next = 0; }
              else if (e.key === "End")         { next = tabs.length - 1; }
              if (next !== undefined) {
                e.preventDefault();
                tabs[next].focus();
                tabs[next].click();
              }
            });
          }

          // Activate tab from URL hash on page load
          function tabForHash() {
            var hash = window.location.hash;
            if (!hash) return -1;
            var target = document.querySelector(hash);
            if (!target) return -1;
            var cb = target.closest(".catblock");
            if (!cb) return -1;
            return parseInt(cb.dataset.ci, 10);
          }

          // Default tab: try session storage, then hash, then 0
          var savedTab;
          try { savedTab = sessionStorage.getItem(TAB_KEY); } catch (_) {}
          var hashTabIdx = tabForHash();
          // An explicit deep link (e.g. #grp-9) is a deliberate destination — it must
          // win over the automatic "jump to today" below during the trip window.
          var deepLinkedTab = hashTabIdx >= 0;
          if (deepLinkedTab) {
            showTab(hashTabIdx);
          } else if (specialPanels.hasOwnProperty(savedTab)) {
            showTab(savedTab);
          } else {
            var si = parseInt(savedTab || "0", 10);
            showTab(isNaN(si) || si >= catblocks.length ? 0 : si);
          }

          /* ── SCROLL POSITION MEMORY ──────────────────────────────────── */
          var SCROLL_KEY = "scroll-" + STORE_KEY;
          var _savedY = sessionStorage.getItem(SCROLL_KEY);
          if (_savedY) { requestAnimationFrame(function () { window.scrollTo(0, parseInt(_savedY, 10) || 0); }); }
          var _scrollTimer;
          window.addEventListener("scroll", function () {
            clearTimeout(_scrollTimer);
            _scrollTimer = setTimeout(function () {
              try { sessionStorage.setItem(SCROLL_KEY, String(window.pageYOffset)); } catch (e) {}
            }, 250);
          }, { passive: true });

          /* ── 1. DARK MODE TOGGLE ──────────────────────────────────────── */
          var darkBtn = document.getElementById("btnDark");
          function syncDarkUI() {
            var dark = document.documentElement.getAttribute("data-theme") === "dark";
            // Keep the PWA / browser-chrome tint (address bar, iOS status bar) in sync
            // with the real theme. Reading computed --bg covers the manual toggle AND
            // the OS-preference auto-dark path, so it can never drift from the page.
            var tc = document.querySelector('meta[name="theme-color"]');
            if (tc) {
              var bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
              if (bg) tc.setAttribute("content", bg);
            }
            if (!darkBtn) return;
            var moon = "<svg class='tb-ico' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z'/></svg>";
            var sun = "<svg class='tb-ico' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><circle cx='12' cy='12' r='4'/><path d='M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4'/></svg>";
            darkBtn.innerHTML = dark ? sun : moon;
            darkBtn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
            darkBtn.title = dark ? "Switch to light mode" : "Switch to dark mode";
          }
          syncDarkUI();
          if (darkBtn) {
            darkBtn.addEventListener("click", function () {
              var dark = document.documentElement.getAttribute("data-theme") === "dark";
              var next = dark ? "light" : "dark";
              document.documentElement.setAttribute("data-theme", next);
              try { localStorage.setItem("tg-theme", next); } catch (e) {}
              syncDarkUI();
            });
          }

          /* ── 2. MOBILE SHEET ─────────────────────────────────────────── */
          var sheet    = document.querySelector(".sheet");
          var backdrop = document.querySelector(".sheet-backdrop");
          var sheetBtn = document.getElementById("sheetOpen");
          function openSheet() {
            sheet.classList.add("open"); backdrop.classList.add("open");
            _lockScroll();
            sheetBtn.setAttribute("aria-expanded", "true");
            var f = sheet.querySelector("a"); if (f) f.focus();
          }
          function closeSheet() {
            sheet.classList.remove("open"); backdrop.classList.remove("open");
            _unlockScroll();
            sheetBtn.setAttribute("aria-expanded", "false"); sheetBtn.focus();
          }
          if (sheet && sheetBtn && backdrop) {
            sheetBtn.addEventListener("click", openSheet);
            backdrop.addEventListener("click", closeSheet);
            sheet.querySelectorAll("a").forEach(function (a) {
              a.addEventListener("click", function () {
                var t = this.dataset.tab;
                if (specialPanels.hasOwnProperty(t)) {
                  showTab(t);
                } else if (t !== undefined && t !== "") {
                  showTab(parseInt(t, 10));
                }
                closeSheet();
              });
            });
            document.addEventListener("keydown", function (e) {
              if (e.key === "Escape" && sheet.classList.contains("open")) { closeSheet(); return; }
              if (e.key === "Tab" && sheet.classList.contains("open")) {
                var fs = sheet.querySelectorAll("a"); if (!fs.length) return;
                var first = fs[0], last = fs[fs.length - 1];
                if (e.shiftKey && document.activeElement === first)      { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
              }
            });
            // Swipe down to close on mobile
            var _swipeY = 0;
            sheet.addEventListener("touchstart", function (e) { _swipeY = e.touches[0].clientY; }, { passive: true });
            sheet.addEventListener("touchend", function (e) {
              if (e.changedTouches[0].clientY - _swipeY > 60) closeSheet();
            }, { passive: true });
          }

          /* ── 3. SCROLL-SPY ───────────────────────────────────────────── */
          function setActive(secId, cat) {
            var cur = document.getElementById("curCat"); if (cur) cur.textContent = order[cat] || "";
            document.querySelectorAll(".sheet-link").forEach(function (a) {
              var on = a.getAttribute("href") === "#" + secId;
              a.classList.toggle("active", on);
              on ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current");
            });
            document.querySelectorAll(".sheet-cat").forEach(function (a) {
              a.classList.toggle("active", a.dataset.cat === String(cat));
            });
          }
          var blocks = Array.prototype.slice.call(document.querySelectorAll(".block"));
          function spy() {
            // Only spy blocks inside the currently-visible catblock
            var visBlocks = blocks.filter(function (b) { return b.offsetParent !== null; });
            if (!visBlocks.length) return;
            var line = 120, idx = 0;
            if (window.innerHeight + window.pageYOffset >= document.body.scrollHeight - 4) {
              idx = visBlocks.length - 1;
            } else {
              for (var i = 0; i < visBlocks.length; i++) {
                if (visBlocks[i].getBoundingClientRect().top <= line) { idx = i; } else { break; }
              }
            }
            var b = visBlocks[idx]; setActive(b.id, b.dataset.cat);
          }
          var ticking = false;
          function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(function () { spy(); ticking = false; }); } }
          window.addEventListener("scroll", onScroll, { passive: true });
          window.addEventListener("resize", onScroll);
          spy();

          /* ── 3a. JUMP TO TODAY ──────────────────────────────────────── */
          (function () {
            // "Today" means the traveler's day AT THE DESTINATION — a viewer
            // checking from another timezone must see the in-country day, not
            // their device's (falls back to the device date without a tz).
            var destToday = todayInTz(destTzIana);
            var now = new Date();
            var mo  = destToday ? destToday.m : now.getMonth() + 1;
            var d   = destToday ? destToday.d : now.getDate();
            // Match day cards whose .d label contains today's month-day (e.g. "Jul 9", "Jul 14")
            var plain  = MONTHS[mo - 1] + " " + d;
            document.querySelectorAll(".day").forEach(function (card) {
              var dEl = card.querySelector(".d");
              if (!dEl) return;
              var txt = dEl.textContent || "";
              if (txt.indexOf(plain) !== -1 || txt.indexOf(plain.replace(/ /g, " ")) !== -1 ||
                  txt.replace(/ /g, " ").indexOf(plain) !== -1) {
                card.classList.add("day-today");
                // Keep the today marker (the Focus Today chip depends on it), but don't
                // hijack the tab/scroll if the visitor arrived via an explicit deep link.
                if (!deepLinkedTab) {
                  var _cb = card.closest(".catblock"); if (_cb) { var _ci = parseInt(_cb.dataset.ci, 10); if (!isNaN(_ci)) showTab(_ci); }
                  setTimeout(function () { card.scrollIntoView({ behavior: "smooth", block: "center" }); }, 160);
                }
              }
            });
          })();

          /* ── 3b. SECTION DEEP LINKS ──────────────────────────────────── */
          document.querySelectorAll(".anchor-btn").forEach(function (btn) {
            btn.addEventListener("click", function () {
              var sid = btn.getAttribute("data-sid");
              var url = window.location.href.split("#")[0] + "#" + sid;
              if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(function () {
                  btn.textContent = "✓";
                  setTimeout(function () { btn.textContent = "#"; }, 1800);
                }).catch(function () {
                  btn.textContent = "✓";
                  setTimeout(function () { btn.textContent = "#"; }, 1800);
                });
              }
            });
          });

          /* ── 3c. COPY KOREAN ADDRESS ────────────────────────────────── */
          document.querySelectorAll("[data-addr-kr]").forEach(function (el) {
            var addr = el.getAttribute("data-addr-kr");
            if (!addr) return;
            var btn = document.createElement("button");
            btn.className = "copy-addr";
            btn.setAttribute("aria-label", "Copy Korean address");
            btn.innerHTML = '<svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="9" height="9" rx="1.5"/><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5"/></svg> <span lang="ko">주소 복사</span>';
            el.parentNode.insertBefore(btn, el.nextSibling);
            btn.addEventListener("click", function () {
              if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(addr).then(function () {
                  btn.innerHTML = '<span lang="ko">✓ 복사됨</span>';
                  btn.classList.add("copied");
                  setTimeout(function () {
                    btn.innerHTML = '<svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="9" height="9" rx="1.5"/><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5"/></svg> <span lang="ko">주소 복사</span>';
                    btn.classList.remove("copied");
                  }, 1900);
                });
              }
            });
          });

          /* ── 4. CHECKLISTS ───────────────────────────────────────────── */
          // hashKey is still used by the budget calculator below.
          function hashKey(s) {
            var h = 5381; s = String(s);
            for (var i = 0; i < s.length; i++) { h = ((h << 5) + h + s.charCodeAt(i)) | 0; }
            return "k" + (h >>> 0).toString(36);
          }
          // data-pkey is stamped at build time by PanelBlock/ListBlock/DaysBlock —
          // no client-side hash or dedup needed.
          var boxes = Array.prototype.slice.call(document.querySelectorAll("input[type=checkbox]"));

          function loadState()  { try { return JSON.parse(localStorage.getItem(STORE_KEY) || "{}"); } catch (e) { return {}; } }
          function saveState(s) { try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); flash("✓ saved"); } catch (e) { flash("Storage full"); } }
          function currentState() { var s = {}; boxes.forEach(function (b) { if (b.checked) s[b.dataset.pkey] = 1; }); return s; }

          function flash(t) {
            var n = document.getElementById("savedNote"); if (!n) return;
            n.textContent = t;
            if (t) { clearTimeout(n._t); n._t = setTimeout(function () { n.textContent = ""; }, 2200); }
          }

          // Per-day "Day kit N/M" badge — counts only the checkboxes inside each
          // day card's .daykit. Hidden until populated; turns green when complete.
          function updateDayCounts() {
            document.querySelectorAll(".day").forEach(function (card) {
              var badge = card.querySelector(".day-kitcount");
              var kit   = card.querySelector(".daykit");
              if (!badge || !kit) return;
              var cbs = kit.querySelectorAll("input[type=checkbox]");
              if (!cbs.length) return;
              var done = 0;
              cbs.forEach(function (c) { if (c.checked) done++; });
              badge.textContent = "Day kit " + done + "/" + cbs.length;
              badge.hidden = false;
              badge.classList.toggle("done", done === cbs.length);
            });
          }

          // Load saved state on page open
          var saved = loadState();
          boxes.forEach(function (b) { if (saved[b.dataset.pkey]) b.checked = true; });
          updateDayCounts();
          boxes.forEach(function (b) {
            b.addEventListener("change", function () { saveState(currentState()); updateDayCounts(); });
          });

          /* ── 5. BUDGET CALCULATORS ───────────────────────────────────── */
          document.querySelectorAll(".budget").forEach(function (bud) {
            var BKEY   = STORE_KEY + "-budget";
            var bstore = {};
            try { bstore = JSON.parse(localStorage.getItem(BKEY) || "{}"); } catch (e) { bstore = {}; }
            var cur    = bud.getAttribute("data-cur") || "$";
            var inputs = Array.prototype.slice.call(bud.querySelectorAll(".bactual"));
            inputs.forEach(function (inp) {
              var row = inp.closest(".brow");
              var k   = hashKey((row && row.getAttribute("data-key")) || "");
              inp.dataset.pkey = k;
              if (bstore[k] != null) inp.value = bstore[k];
            });
            function fmt(n)    { return cur + (Math.round(n * 100) / 100).toLocaleString("en-US"); }
            function recalcB() {
              var sum = 0;
              var catSums = {};
              inputs.forEach(function (inp) {
                var v = parseFloat(inp.value);
                if (!isNaN(v)) {
                  sum += v;
                  var row = inp.closest(".brow");
                  var cat = row ? (row.getAttribute("data-bcat") || "") : "";
                  catSums[cat] = (catSums[cat] || 0) + v;
                }
              });
              var t = bud.querySelector(".bact-total"); if (t) t.textContent = fmt(sum);
              // Update per-category "Your spend" subtotal cells
              bud.querySelectorAll(".bsubtotal").forEach(function (row) {
                var cat = row.getAttribute("data-sub-cat") || "";
                var el  = row.querySelector(".bsub-act");
                if (el) el.textContent = catSums[cat] != null ? fmt(catSums[cat]) : "—";
              });
            }
            function persistB() {
              var o = {}; inputs.forEach(function (inp) { if (inp.value !== "") o[inp.dataset.pkey] = inp.value; });
              try { localStorage.setItem(BKEY, JSON.stringify(o)); flash("✓ saved"); } catch (e) { flash("Storage full"); }
            }
            inputs.forEach(function (inp) { inp.addEventListener("input", function () { recalcB(); persistB(); }); });
            recalcB();
          });

        } catch (e) { fail("core", e); }
        try {
          /* ── 6. JET-LAG CALCULATOR ────────────────────────────────────
             Moved to src/scripts/jetlag-ui.js — the direction/day/body-clock math
             (and its boundary conditions) now lives in src/lib/jetlag.ts, tested,
             instead of inline with zero tests. */
          initJetLag();

        } catch (e) { fail("jet-lag", e); }
        try {
          /* ── 7. READING PROGRESS BAR ────────────────────────────────── */
          (function () {
            var bar = document.getElementById("readProg");
            if (!bar) return;
            function updateBar() {
              var max = document.body.scrollHeight - window.innerHeight;
              bar.style.width = (max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0) + "%";
            }
            window.addEventListener("scroll", updateBar, { passive: true });
            window.addEventListener("resize", updateBar);
            updateBar();
          })();

        } catch (e) { fail("progress bar", e); }
        try {
          /* ── 8. TRIP COUNTDOWN ──────────────────────────────────────── */
          (function () {
            var statsEl = document.getElementById("guideStats");
            if (!statsEl || !firstDayDate) return;
            var now  = new Date();
            var trip = resolveTripDate(firstDayDate, now);
            if (!trip) return;
            // Midnight-to-midnight, matching the hub's countdown — "days to go"
            // must read the same on both surfaces regardless of time of day.
            var todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            var diff = Math.round((trip.getTime() - todayMid.getTime()) / 86400000);
            var pill = document.createElement("span");
            if (diff > 1)       { pill.className = "gstat gstat-countdown"; pill.textContent = diff + " days to go"; }
            else if (diff === 1){ pill.className = "gstat gstat-countdown"; pill.textContent = "Tomorrow!"; }
            else if (diff === 0){ pill.className = "gstat gstat-active";    pill.textContent = "Trip starts today!"; }
            else if (diff >= -7){ pill.className = "gstat gstat-active";    pill.textContent = "Happening now!"; }
            else                { pill.className = "gstat gstat-past";      pill.textContent = Math.abs(diff) + " days ago"; }
            statsEl.insertBefore(pill, statsEl.firstChild);
          })();

          /* ── 8a. WHAT'S NEXT BANNER ─────────────────────────────────────
             Only appears during the trip's own date range (degrades to
             nothing before/after — the countdown pill above already covers
             those states). Shows the specific day's title (+ fit note if
             present), not just an abstract day-count, so it adds real info
             rather than duplicating the pill. No intraday time exists in the
             schema — day-level granularity only, same convention as above. */
          (function () {
            var box   = document.getElementById("whatsNext");
            var label = document.getElementById("wnLabel");
            var text  = document.getElementById("wnText");
            if (!box || !text || !daysForBanner.length) return;

            // Destination-calendar "today" (see 3a) — device date only as fallback.
            var _dt = todayInTz(destTzIana);
            var now = _dt ? new Date(_dt.y, _dt.m - 1, _dt.d) : new Date();
            var firstParts = String(daysForBanner[0].date).split(/\s+/);
            var firstMoIdx = MONTHS.indexOf(firstParts[1]);
            var firstDay   = parseInt(firstParts[2], 10);
            if (firstMoIdx === -1 || isNaN(firstDay)) return;
            var year  = now.getFullYear();
            var probe = new Date(year, firstMoIdx, firstDay);
            if (probe < now && (now - probe) > 180 * 86400000) year++;

            // Sequential parse; roll the year forward again if a later entry's
            // month precedes the previous one (a trip spanning New Year's).
            var prevMoIdx = -1;
            var days = [];
            daysForBanner.forEach(function (d) {
              var parts = String(d.date).split(/\s+/);
              var moIdx = MONTHS.indexOf(parts[1]);
              var day   = parseInt(parts[2], 10);
              if (moIdx === -1 || isNaN(day)) return;
              if (prevMoIdx !== -1 && moIdx < prevMoIdx) year++;
              prevMoIdx = moIdx;
              var dt = new Date(year, moIdx, day);
              dt.setHours(0, 0, 0, 0);
              days.push({ date: dt, title: d.title, fit: d.fit });
            });
            if (!days.length) return;

            var today = new Date(now); today.setHours(0, 0, 0, 0); // dest-calendar day (from `now` above)
            if (today < days[0].date || today > days[days.length - 1].date) return;

            var match    = days.find(function (d) { return d.date.getTime() === today.getTime(); });
            var upcoming = !match && days.find(function (d) { return d.date.getTime() > today.getTime(); });
            var entry    = match || upcoming;
            if (!entry) return;

            label.textContent = match ? "Today" : "Next up";
            text.textContent  = entry.title + (entry.fit ? " — " + entry.fit : "");
            box.hidden = false;
          })();

        } catch (e) { fail("countdown", e); }
        try {
          /* ── 9. LOCAL TIME AT DESTINATION ───────────────────────────── */
          (function () {
            if (!destTzIana) return;
            var statsEl = document.getElementById("guideStats");
            if (!statsEl) return;
            // Format directly in the destination's IANA zone — DST is handled by Intl,
            // so this is correct year-round (the old fixed-offset math was an hour off
            // for European destinations in winter).
            var fmt;
            try {
              fmt = new Intl.DateTimeFormat("en-GB", { timeZone: destTzIana, hour: "2-digit", minute: "2-digit", hour12: false });
              fmt.format(new Date()); // probe: throws on an invalid zone
            } catch (e) { return; }
            var pill = document.createElement("span");
            pill.className = "gstat gstat-time";
            pill.id = "localTimePill";
            function tick() { pill.textContent = "Local " + fmt.format(new Date()); }
            tick();
            statsEl.appendChild(pill);
            setInterval(tick, 60000);
          })();

        } catch (e) { fail("local time", e); }
        try {
          /* ── 10. OFFLINE-READY BADGE ────────────────────────────────── */
          (function () {
            if (!("caches" in window)) return;
            // Match any "tripguides-*" cache so a version bump in sw.js (v3→v4)
            // never silently breaks this badge.
            caches.keys().then(function (keys) {
              if (!keys.some(function (k) { return k.indexOf("tripguides-") === 0; })) return;
              var statsEl = document.getElementById("guideStats");
              if (!statsEl) return;
              var pill = document.createElement("span");
              pill.className = "gstat gstat-offline";
              pill.title = "This guide is cached and readable without a connection";
              pill.textContent = "✓ Works offline";
              statsEl.appendChild(pill);
            }).catch(function () {});
          })();

        } catch (e) { fail("offline badge", e); }
        try {
          /* ── 11+12. LIVE DATA (exchange rate + weather strip) ───────────
             Both moved to src/features/live-data/ — ~285 lines of fetch/validate/
             cache/render whose sanity checks (the bands that stop a 10x-wrong rate
             or a 200°C day reaching a traveler) had no tests while they lived here.
             The silo owns its own DOM mounts (#liveRatePill/#liveRateFoot, #wxWrap)
             and is inert without config, so a guide with no currency or no map
             section simply never lights them up. */
          initRate({ curCode: curCode, curFallbackRate: curFallbackRate });
          // Day-swap BEFORE weather: the cached-forecast path renders (and dispatches
          // tg:wx) synchronously inside initWeather, so the listener must exist first
          // (getLastWx covers the reverse order too — belt and braces).
          initDaySwap({ daysForBanner: daysForBanner });
          initWeather({
            mapCenter: mapCenter,
            hasWeatherSection: hasWeatherSection,
            firstDayDate: firstDayDate,
            lastDayDate: lastDayDate,
          });
          // Sun & daylight strip — pure math (no fetch), same mapCenter as weather.
          initSun({ mapCenter: mapCenter, destTzIana: destTzIana });
          // ── 13. MAP FULLSCREEN BUTTON — moved to src/features/maps/ui/fullscreen.js
          // (imported by the maps silo, right beside the Google upgrade that can make
          // its button stale — the two now live together instead of racing blind).
        } catch (e) { fail("live-data", e); }
      })();

      /* ── SHARE PANEL — moved to src/features/share/ ───────────────────────
         URL/text building lives in model/share-links.ts, tested. The DOM wiring
         moved carries a real fix: the "Share trip summary" button used to reference
         a variable declared inside a SIBLING function (openShare) — undefined unless
         the share modal had already been opened first. Reproduced live: a cold click
         threw "pageUrl is not defined" and did nothing. Every share-URL consumer now
         computes its own fresh copy, matching the pattern the copy-link button already
         used. lockScroll/unlockScroll are still shared with the mobile sheet below —
         passed in rather than duplicated, so the two keep coordinating one counter. */
      try { initSharePanel(_lockScroll, _unlockScroll); } catch (e) { fail("share panel", e); }

      /* ── BUDGET PER-PERSON TOGGLE ─────────────────────────────────────── */
      document.querySelectorAll(".budget-toggle").forEach(function (tog) {
        var bud = tog.closest(".budget");
        if (!bud) return;
        var btns  = tog.querySelectorAll(".btog-btn");
        var party = parseInt(bud.getAttribute("data-party") || "1", 10);
        var cur   = bud.getAttribute("data-cur") || "$";

        function fmt(n) { return cur + Math.round(n).toLocaleString("en-US"); }

        function applyMode(mode) {
          btns.forEach(function (b) {
            b.classList.toggle("btog-active", b.getAttribute("data-mode") === mode);
          });

          bud.querySelectorAll(".brow[data-key]").forEach(function (row) {
            var valEl = row.querySelector(".best-val");
            var ranEl = row.querySelector(".brange");
            if (!valEl) return;
            var tv = parseFloat(row.getAttribute("data-trip")    || "0");
            var pv = parseFloat(row.getAttribute("data-person")  || "0");
            var tl = row.getAttribute("data-trip-lo");
            var th = row.getAttribute("data-trip-hi");
            var pl = row.getAttribute("data-pp-lo");
            var ph = row.getAttribute("data-pp-hi");
            valEl.textContent = fmt(mode === "person" ? pv : tv);
            if (ranEl) {
              var lo = mode === "person" ? pl : tl;
              var hi = mode === "person" ? ph : th;
              if (lo !== "" && hi !== "" && lo !== null && hi !== null) {
                ranEl.textContent = cur + Math.round(parseFloat(lo)).toLocaleString("en-US") +
                  "–" + cur + Math.round(parseFloat(hi)).toLocaleString("en-US");
              }
            }
          });

          bud.querySelectorAll(".bsubtotal").forEach(function (row) {
            var el = row.querySelector(".bsub-est");
            if (!el) return;
            var t = parseFloat(row.getAttribute("data-sub-trip")   || "0");
            var p = parseFloat(row.getAttribute("data-sub-person") || "0");
            el.textContent = fmt(mode === "person" ? p : t);
          });

          var totEl = bud.querySelector(".best-total");
          if (totEl) {
            var t = parseFloat(totEl.getAttribute("data-trip-total") || "0");
            var p = parseFloat(totEl.getAttribute("data-pp-total")   || "0");
            totEl.textContent = fmt(mode === "person" ? p : t);
          }
        }

        btns.forEach(function (b) {
          b.addEventListener("click", function () { applyMode(b.getAttribute("data-mode") || "total"); });
        });
      });

