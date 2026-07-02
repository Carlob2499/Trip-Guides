// Guide interactive UI — extracted from GuideLayout.astro so it bundles into a
// single hashed module cached across every guide page (was ~950 lines inline per
// page). Config that used to come from Astro define:vars is now read from the
// #tgConfig JSON script tag emitted by the layout.
const _cfgEl = document.getElementById("tgConfig");
const _cfg = _cfgEl ? JSON.parse(_cfgEl.textContent || "{}") : {};
const order             = _cfg.order || [];
const storeKey          = _cfg.storeKey || "guide";
const mapCenter         = _cfg.mapCenter || null;
const firstDayDate      = _cfg.firstDayDate || null;
const hasWeatherSection = !!_cfg.hasWeatherSection;
const destTzIana        = _cfg.destTzIana || null;
const curCode           = _cfg.curCode || null;
const curFallbackRate   = _cfg.curFallbackRate || null;

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

          // DST-aware UTC offset (in hours) of an IANA zone at a given instant, via Intl.
          // Returns null if the zone is unknown. Used by the local-time pill + jet-lag calc.
          function tzOffsetHours(tz, date) {
            if (!tz) return null;
            try {
              var f = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour12: false,
                year: "numeric", month: "2-digit", day: "2-digit",
                hour: "2-digit", minute: "2-digit", second: "2-digit" });
              var p = {}; f.formatToParts(date).forEach(function (x) { p[x.type] = x.value; });
              var asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, (+p.hour) % 24, +p.minute, +p.second);
              return (asUTC - date.getTime()) / 3600000;
            } catch (e) { return null; }
          }

          /* ── TAB BAR ─────────────────────────────────────────────────── */
          var guideTabs  = document.getElementById("guideTabs");
          var catblocks  = Array.prototype.slice.call(document.querySelectorAll(".catblock"));
          var splitPanel = document.getElementById("tripSplit");
          var TAB_KEY    = "tg-tab-" + STORE_KEY;

          function showTab(idx) {
            var isSplit = idx === "split";
            catblocks.forEach(function (b, i) { b.hidden = isSplit || i !== idx; });
            if (splitPanel) splitPanel.hidden = !isSplit;
            if (guideTabs) {
              guideTabs.querySelectorAll(".gtab").forEach(function (btn) {
                var match = btn.dataset.tab === (isSplit ? "split" : String(idx));
                btn.setAttribute("aria-selected", match ? "true" : "false");
                btn.classList.toggle("gtab-active", match);
              });
              // Scroll active tab into view
              var active = guideTabs.querySelector(".gtab-active");
              if (active) active.scrollIntoView({ block: "nearest", inline: "nearest" });
            }
            try { sessionStorage.setItem(TAB_KEY, isSplit ? "split" : String(idx)); } catch (_) {}
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
                showTab(t === "split" ? "split" : parseInt(t, 10));
                window.scrollTo({ top: 0, behavior: "smooth" });
              });
            });
            guideTabs.addEventListener("keydown", function (e) {
              var tabs = Array.prototype.slice.call(guideTabs.querySelectorAll(".gtab"));
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
          if (hashTabIdx >= 0) {
            showTab(hashTabIdx);
          } else if (savedTab === "split") {
            showTab("split");
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
            if (!darkBtn) return;
            darkBtn.textContent = dark ? "☀" : "◑";
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
                if (t === "split") {
                  showTab("split");
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
            var now = new Date();
            var mo  = now.getMonth() + 1;
            var d   = now.getDate();
            // Match day cards whose .d label contains today's month-day (e.g. "Jul 9", "Jul 14")
            var plain  = MONTHS[mo - 1] + " " + d;
            document.querySelectorAll(".day").forEach(function (card) {
              var dEl = card.querySelector(".d");
              if (!dEl) return;
              var txt = dEl.textContent || "";
              if (txt.indexOf(plain) !== -1 || txt.indexOf(plain.replace(/ /g, " ")) !== -1 ||
                  txt.replace(/ /g, " ").indexOf(plain) !== -1) {
                card.classList.add("day-today");
                var _cb = card.closest(".catblock"); if (_cb) { var _ci = parseInt(_cb.dataset.ci, 10); if (!isNaN(_ci)) showTab(_ci); }
                setTimeout(function () { card.scrollIntoView({ behavior: "smooth", block: "center" }); }, 160);
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

          /* ── 6. JET-LAG CALCULATOR ───────────────────────────────────── */
          (function () {
            var jlBtn   = document.getElementById("jlToggle");
            var jlPanel = document.getElementById("jlPanel");
            if (!jlBtn || !jlPanel) return;

            // Destination offset computed from its IANA zone (DST-aware), not a fixed number.
            var destOffset = tzOffsetHours(jlPanel.getAttribute("data-dest-tz"), new Date());
            if (destOffset == null) return;

            // Toggle open / close
            jlBtn.addEventListener("click", function () {
              var wasHidden = jlPanel.hasAttribute("hidden");
              if (wasHidden) {
                jlPanel.removeAttribute("hidden");
                jlBtn.setAttribute("aria-expanded", "true");
              } else {
                jlPanel.setAttribute("hidden", "");
                jlBtn.setAttribute("aria-expanded", "false");
              }
            });

            // Recalculate when origin changes
            function recalcJL() {
              var sel = document.getElementById("jlOrigin");
              var out = document.getElementById("jlOutput");
              if (!sel || !out) return;
              if (!sel.value) { out.setAttribute("hidden", ""); return; }

              var origOffset = parseFloat(sel.value);
              if (isNaN(origOffset)) { out.setAttribute("hidden", ""); return; }

              var diff    = destOffset - origOffset;  // positive = flew east
              var absDiff = Math.round(Math.abs(diff) * 10) / 10;
              var dir     = diff > 0.4 ? "east" : diff < -0.4 ? "west" : null;

              if (!dir || absDiff < 1) {
                out.innerHTML = "<p class='jl-none'>Under 1 hour of difference — no meaningful jet lag expected.</p>";
                out.removeAttribute("hidden");
                return;
              }

              // Eastward ≈1 hr/day to adapt; westward ≈1.5 hr/day (easier direction)
              var days   = dir === "east" ? Math.ceil(absDiff) : Math.ceil(absDiff / 1.5);
              var harder = dir === "east" ? " — eastward crossings are tougher" : " — westward tends to be easier";

              // What your body clock reads at 11 pm local on arrival night
              var bodyAt11 = 23 - diff;
              while (bodyAt11 < 0)  bodyAt11 += 24;
              while (bodyAt11 >= 24) bodyAt11 -= 24;
              var bh    = Math.round(bodyAt11);
              var h12   = bh % 12 || 12;
              var ampm  = bh >= 12 ? "pm" : "am";
              var bodyTimeStr = h12 + ampm;

              var html = "";
              html += "<p class='jl-result'>";
              html += "<strong>" + absDiff + "-hour gap, flying " + dir + harder + ".</strong> ";
              html += "Expect roughly <strong>" + days + " day" + (days === 1 ? "" : "s") + "</strong> to fully adapt.";
              html += "</p>";
              html += "<p style='font-size:.84rem;color:var(--muted);margin-bottom:.5rem;line-height:1.45'>";
              html += "At 11 pm local on your first night, your body will still feel like it's <strong>" + bodyTimeStr + "</strong> back home.";
              html += "</p>";
              html += "<ul class='jl-tips'>";
              html += "<li>Get <strong>morning sunlight on arrival day</strong> — the single most effective clock reset</li>";
              if (dir === "east") {
                html += "<li>Stay awake until <strong>local 10–11 pm</strong> no matter how tired — sleeping too early makes it worse</li>";
                html += "<li>If you wake in the night, stay in dim light; avoid phones and bright screens until 7 am</li>";
              } else {
                html += "<li>Westward is easier — avoid napping more than 20 minutes on your first afternoon</li>";
                html += "<li>Get outside in the morning; resisting the urge to sleep in accelerates adjustment</li>";
              }
              html += "<li>Drink water on the flight; skip alcohol and heavy meals 4 hours before landing</li>";
              if (absDiff >= 7) {
                html += "<li>Large gap: melatonin 0.5–1 mg at local bedtime can help on nights 1–3 — check with your doctor first</li>";
              }
              html += "</ul>";

              out.innerHTML = html;
              out.removeAttribute("hidden");
            }

            var originSel = document.getElementById("jlOrigin");
            if (originSel) originSel.addEventListener("change", recalcJL);
          })();

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

          /* ── 8. TRIP COUNTDOWN ──────────────────────────────────────── */
          (function () {
            var statsEl = document.getElementById("guideStats");
            if (!statsEl || !firstDayDate) return;
            var parts  = String(firstDayDate).split(/\s+/);
            var mStr   = parts[1]; var day = parseInt(parts[2], 10);
            var moIdx  = mStr ? MONTHS.indexOf(mStr) : -1;
            if (moIdx === -1 || isNaN(day)) return;
            var now  = new Date();
            var trip = new Date(now.getFullYear(), moIdx, day);
            if (trip < now && (now - trip) > 180 * 86400000) trip.setFullYear(now.getFullYear() + 1);
            var diff = Math.round((trip.getTime() - now.getTime()) / 86400000);
            var pill = document.createElement("span");
            if (diff > 1)       { pill.className = "gstat gstat-countdown"; pill.textContent = diff + " days to go"; }
            else if (diff === 1){ pill.className = "gstat gstat-countdown"; pill.textContent = "Tomorrow!"; }
            else if (diff === 0){ pill.className = "gstat gstat-active";    pill.textContent = "Trip starts today!"; }
            else if (diff >= -7){ pill.className = "gstat gstat-active";    pill.textContent = "Happening now!"; }
            else                { pill.className = "gstat gstat-past";      pill.textContent = Math.abs(diff) + " days ago"; }
            statsEl.insertBefore(pill, statsEl.firstChild);
          })();

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

          /* ── 11. LIVE CURRENCY RATE (Frankfurter, canonical rate service) ─
             Pattern for all API integrations: fetch-once, sessionStorage cache,
             dispatch tg:rate event, graceful failure with fallback.           */
          (function () {
            if (!curCode || !curFallbackRate || !window.fetch) return;

            // Sanity band per currency — rates outside this are treated as bad data.
            var SANITY = { KRW: [500, 3000], JPY: [80, 250], DKK: [4, 12], EUR: [0.5, 1.5] };
            function inBand(r) {
              var b = SANITY[curCode];
              return !b || (r >= b[0] && r <= b[1]);
            }

            // Magnitude-aware display: KRW/JPY whole number, DKK/EUR decimal.
            // Math.round alone would turn EUR 0.93 into a useless "1".
            function fmtRate(r) {
              return r >= 100 ? Math.round(r).toLocaleString() : r >= 1 ? r.toFixed(2) : r.toFixed(3);
            }

            function applyLive(rate, date) {
              // Update stats-bar pill
              var pill = document.getElementById("liveRatePill");
              if (pill) {
                pill.textContent = "$1 = " + fmtRate(rate) + " " + curCode;
                pill.title = "Live rate · ECB via Frankfurter.dev · " + date;
                pill.removeAttribute("hidden");
              }

              // Update budget foot span
              var foot = document.getElementById("liveRateFoot");
              if (foot) {
                foot.textContent = fmtRate(rate) + " " + curCode + " = $1 · Live · ECB · " + date;
              }

              // Update TripSplit rate input only if the user hasn't manually changed it
              // (guard: current value still matches the build-time fallback ±1).
              var rateInp = document.getElementById("sRate");
              if (rateInp && Math.abs(parseFloat(rateInp.value) - curFallbackRate) <= 1) {
                rateInp.value = String(rate >= 1 ? Math.round(rate) : parseFloat(rate.toFixed(4)));
                rateInp.dispatchEvent(new Event("input"));
              }

              // Broadcast for any future listeners (Session 2/3 pattern).
              document.dispatchEvent(new CustomEvent("tg:rate", { detail: { rate: rate, date: date, code: curCode } }));
            }

            function applyFallback(reason) {
              console.warn("[tg-rate] " + reason + " — using fallback " + curFallbackRate + " " + curCode);
              var foot = document.getElementById("liveRateFoot");
              if (foot) {
                foot.textContent = "≈₩" + curFallbackRate.toLocaleString() + " = $1 · Jun 2026 · live rate unavailable";
              }
            }

            // Cache keyed by currency code so guides don't share stale rates.
            // "Today" is UTC (same reference Frankfurter uses for its daily timestamp;
            // device-local date can differ, e.g. user in UTC+9 at 00:30 UTC).
            var CACHE_KEY = "tg-rate-" + curCode;
            var todayUTC  = new Date().toISOString().slice(0, 10);

            try {
              var cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
              if (cached && cached.rate && cached.date && cached.fetchedAt === todayUTC) {
                applyLive(cached.rate, cached.date);
                return; // served from cache — no network call
              }
            } catch (_) {}

            fetch("https://api.frankfurter.dev/v1/latest?base=USD&symbols=" + curCode)
              .then(function (r) { return r.ok ? r.json() : Promise.reject("non-200 " + r.status); })
              .then(function (data) {
                var rate = data && data.rates && data.rates[curCode];
                if (!rate || !isFinite(rate)) throw new Error("missing or non-finite rate");
                if (!inBand(rate)) throw new Error("rate " + rate + " outside sanity band for " + curCode);
                var date = data.date || todayUTC;
                try {
                  sessionStorage.setItem(CACHE_KEY, JSON.stringify({ rate: rate, date: date, fetchedAt: todayUTC }));
                } catch (_) {}
                applyLive(rate, date);
              })
              .catch(function (err) { applyFallback(String(err)); });
          })();

          /* ── 12. WEATHER STRIP (Open-Meteo, canonical cached service) ───
             Same pattern as the rate service: fetch-once, sessionStorage cache,
             graceful failure (block hides, never errors), source + timestamp shown.
             Mount: #wxWrap (masthead OR in-flow weather section) → injects #wxMount. */
          (function () {
            var wxWrap = document.getElementById("wxWrap");
            if (!wxWrap) return; // no mount on this page (masthead suppressed, no section)

            // Breadcrumb for the forkable-template future: a weather section with no
            // map section to source coordinates from will silently hide otherwise.
            if (!mapCenter) {
              if (hasWeatherSection) {
                console.warn("weather section present but no map section found — no coordinates");
              }
              return;
            }
            if (!window.fetch) return;
            // Monochrome text-symbol icons (\uFE0E forces non-emoji rendering) to
            // match the editorial design and honor the no-emoji content rule.
            function wxIcon(code) {
              if (code === 0)  return "☀︎"; // clear  (sun)
              if (code <= 3)   return "⛅︎"; // partly cloudy
              if (code <= 48)  return "☁︎"; // cloud / fog
              if (code <= 67)  return "☂︎"; // drizzle + rain (umbrella)
              if (code <= 77)  return "❄︎"; // snow
              if (code <= 82)  return "☂︎"; // showers (umbrella)
              if (code <= 86)  return "❄︎"; // snow showers
              if (code >= 95)  return "☈";      // thunderstorm (inherently monochrome)
              return "⛅︎";
            }
            // Fetch the max free window (16 days) so we can show the TRIP dates
            // when they fall within range — not just the next 7 days from today.
            var url = "https://api.open-meteo.com/v1/forecast" +
              "?latitude=" + mapCenter.lat + "&longitude=" + mapCenter.lng +
              "&daily=temperature_2m_max,temperature_2m_min,weathercode" +
              "&forecast_days=16&timezone=auto&temperature_unit=celsius";

            // Build "-MM-DD" target from the guide's first day date (e.g. "Wed Jul 8").
            var TRIP_MD = null;
            if (firstDayDate) {
              var pp = String(firstDayDate).split(/\s+/);
              var ppMoIdx = MONTHS.indexOf(pp[1]);
              if (ppMoIdx !== -1 && !isNaN(parseInt(pp[2], 10))) {
                TRIP_MD = "-" + String(ppMoIdx + 1).padStart(2, "0") + "-" + String(parseInt(pp[2], 10)).padStart(2, "0");
              }
            }

            // Validate response shape + a coarse temperature sanity band (−90..60 °C
            // catches unit errors / garbage). Returns the `daily` object or null.
            function wxValidate(data) {
              if (!data || !data.daily) return null;
              var d = data.daily;
              if (!Array.isArray(d.time) || !d.time.length) return null;
              var n = d.time.length;
              if (!Array.isArray(d.temperature_2m_max) || d.temperature_2m_max.length !== n) return null;
              if (!Array.isArray(d.temperature_2m_min) || d.temperature_2m_min.length !== n) return null;
              if (!Array.isArray(d.weathercode)        || d.weathercode.length        !== n) return null;
              for (var k = 0; k < n; k++) {
                var H = d.temperature_2m_max[k], L = d.temperature_2m_min[k];
                if (typeof H !== "number" || H < -90 || H > 60) return null;
                if (typeof L !== "number" || L < -90 || L > 60) return null;
              }
              return d;
            }

            // Render takes the validated `daily` object + the retrieval date, and
            // recomputes the trip-window slice each call so a stale cached "today"
            // never freezes the window. WX_FETCH_DATE is the retrieval day (the honest
            // timestamp — Open-Meteo's daily call returns no forecast "issued at").
            function wxRender(d, WX_FETCH_DATE) {
                var DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
                var now = new Date();

                // Decide the 7-day window: start at the trip date if it's in range.
                var startI = 0, onTrip = false;
                if (TRIP_MD) {
                  for (var j = 0; j < d.time.length; j++) {
                    if (d.time[j].indexOf(TRIP_MD) !== -1) { startI = j; onTrip = true; break; }
                  }
                }
                var endI = Math.min(d.time.length, startI + 7);

                var html = '<div class="wx-strip" aria-label="Weather forecast">';
                for (var i = startI; i < endI; i++) {
                  var dt  = new Date(d.time[i] + "T12:00:00");
                  var hi  = Math.round(d.temperature_2m_max[i]);
                  var lo  = Math.round(d.temperature_2m_min[i]);
                  var isToday = dt.getDate() === now.getDate() && dt.getMonth() === now.getMonth();
                  var mo = dt.getMonth() + 1, da = dt.getDate();
                  html += '<div class="wx-day' + (isToday ? " wx-today" : "") + '">' +
                    '<span class="wx-name">' + (isToday ? "Today" : DAYS[dt.getDay()]) + '</span>' +
                    '<span class="wx-date">' + mo + "/" + da + '</span>' +
                    '<span class="wx-icon">' + wxIcon(d.weathercode[i]) + '</span>' +
                    '<span class="wx-hi">' + hi + '°</span>' +
                    '<span class="wx-lo">' + lo + '°</span>' +
                    '</div>';
                }
                html += '</div>';
                // Honest label: trip-date forecast vs. fallback next-days, with a
                // note when the trip is still beyond the 16-day forecast horizon.
                var label = onTrip ? "Trip-dates forecast" : "Next " + (endI - startI) + " days";
                var far = (TRIP_MD && !onTrip) ? " \u00b7 trip is beyond the 16-day forecast \u2014 check again closer to departure" : "";
                html += '<p class="wx-credit">Forecast \u00b7 ' + label + far +
                  ' \u00b7 retrieved ' + WX_FETCH_DATE +
                  ' \u00b7 <a href="https://open-meteo.com" target="_blank" rel="noopener" class="wx-src">Open-Meteo</a></p>';
                var mount = document.getElementById("wxMount") || wxWrap;
                mount.innerHTML = html;
                wxWrap.removeAttribute("hidden");
            }

            // Cache keyed by coordinates; "today" measured in UTC (matches the rate
            // service, avoiding a device-local off-by-one near midnight).
            var WX_CACHE = "tg-wx-" + mapCenter.lat + "," + mapCenter.lng;
            var wxToday  = new Date().toISOString().slice(0, 10);
            try {
              var wxCached = JSON.parse(sessionStorage.getItem(WX_CACHE) || "null");
              if (wxCached && wxCached.daily && wxCached.fetchedAt === wxToday) {
                wxRender(wxCached.daily, wxCached.fetchDate || wxToday);
                return; // served from cache — no network call
              }
            } catch (_) {}

            fetch(url)
              .then(function (r) { return r.ok ? r.json() : Promise.reject("non-200 " + r.status); })
              .then(function (data) {
                var d = wxValidate(data);
                if (!d) throw new Error("malformed or out-of-band weather data");
                try { sessionStorage.setItem(WX_CACHE, JSON.stringify({ daily: d, fetchDate: wxToday, fetchedAt: wxToday })); } catch (_) {}
                wxRender(d, wxToday);
              })
              .catch(function (err) {
                // Graceful failure: leave #wxWrap hidden (block renders nothing).
                console.warn("[tg-weather] " + String(err) + " — weather strip hidden");
              });
          })();

          /* ── 13. MAP FULLSCREEN BUTTON ──────────────────────────────── */
          (function () {
            document.querySelectorAll(".osmmap").forEach(function (frame) {
              var wrap = frame.parentElement;
              if (!wrap || !document.fullscreenEnabled) return;
              wrap.style.position = "relative";
              var btn = document.createElement("button");
              btn.className = "map-fs-btn";
              btn.setAttribute("aria-label", "View map fullscreen");
              btn.title = "Fullscreen";
              btn.textContent = "⤢";
              wrap.appendChild(btn);
              btn.addEventListener("click", function () {
                // Fullscreen the iframe itself so the .osmmap:fullscreen CSS applies
                // and the map fills the screen (wrap.requestFullscreen left it 300px).
                if (frame.requestFullscreen) frame.requestFullscreen();
                else if (frame.webkitRequestFullscreen) frame.webkitRequestFullscreen();
              });
              document.addEventListener("fullscreenchange", function () {
                btn.textContent = document.fullscreenElement ? "✕" : "⤢";
              });
            });
          })();

        } catch (err) { console.error("guide enhancement error:", err); }
      })();

      /* ── SHARE PANEL ──────────────────────────────────────────────────── */
      (function () {
        var shareBtn      = document.getElementById("btnShare");
        var shareModal    = document.getElementById("shareModal");
        var shareBackdrop = document.getElementById("shareBackdrop");
        var shareUrlTxt   = document.getElementById("shareUrlTxt");
        var shareCopyBtn  = document.getElementById("shareCopyBtn");
        var shareWALink   = document.getElementById("shareWA");
        var shareEmailLink = document.getElementById("shareEmail");
        var shareCloseBtn = document.getElementById("shareClose");
        var shareQrEl     = document.getElementById("shareQr");
        if (!shareBtn || !shareModal) return;

        var pageUrl      = window.location.href;
        var pageTitle    = document.title;
        var qrGenerated  = false;
        var qrLibLoaded  = false;

        function loadQRLib(cb) {
          if (qrLibLoaded || window.QRCode) { qrLibLoaded = true; cb(); return; }
          var s = document.createElement("script");
          s.src = "https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js";
          s.onload = function () { qrLibLoaded = true; cb(); };
          s.onerror = function () {
            // Offline or CDN failure — show a helpful message instead of an empty box
            if (shareQrEl) {
              shareQrEl.style.cssText = "display:flex;align-items:center;justify-content:center;height:80px;font-size:12px;color:var(--muted);text-align:center;padding:0 8px";
              shareQrEl.textContent = "QR unavailable offline — use Copy link";
            }
            cb();
          };
          document.head.appendChild(s);
        }

        function openShare() {
          // Always open the modal (on every device) so the QR, copy-link, social
          // links, file downloads (.gpx/.ics), and Share-summary action are all
          // reachable. Native OS share is offered by the Share-summary button.
          shareModal.removeAttribute("hidden");
          shareBackdrop.classList.add("open");
          _lockScroll();
          if (shareUrlTxt) shareUrlTxt.textContent = pageUrl;
          if (shareWALink)   shareWALink.href   = "https://wa.me/?text=" + encodeURIComponent(pageUrl);
          if (shareEmailLink) shareEmailLink.href = "mailto:?subject=" + encodeURIComponent(pageTitle) + "&body=" + encodeURIComponent(pageUrl);
          if (shareQrEl && !qrGenerated) {
            loadQRLib(function () {
              if (!window.QRCode) return;
              var dark = document.documentElement.getAttribute("data-theme") === "dark";
              try {
                new window.QRCode(shareQrEl, {
                  text: pageUrl, width: 148, height: 148,
                  colorDark:  dark ? "#ede5d4" : "#211e1a",
                  colorLight: dark ? "#27211a" : "#ffffff",
                  correctLevel: window.QRCode.CorrectLevel.M
                });
                qrGenerated = true;
              } catch (e) { /* QR lib unavailable */ }
            });
          }
          shareBtn && shareBtn.setAttribute("aria-expanded", "true");
        }

        function closeShare() {
          shareModal.setAttribute("hidden", "");
          shareBackdrop.classList.remove("open");
          _unlockScroll();
          shareBtn && shareBtn.setAttribute("aria-expanded", "false");
          shareBtn && shareBtn.focus();
        }

        shareBtn.addEventListener("click", openShare);
        if (shareCloseBtn)  shareCloseBtn.addEventListener("click", closeShare);
        if (shareBackdrop)  shareBackdrop.addEventListener("click", closeShare);

        // Share-summary — a brief theme + planned-days + key-spots digest. Native OS
        // share on devices that support it; clipboard copy (with a toast) otherwise.
        var summaryBtn = document.getElementById("btnShareSummary");
        var summaryEl  = document.getElementById("tripSummary");
        if (summaryBtn && summaryEl) {
          function summaryToast(m) {
            var n = document.getElementById("savedNote"); if (!n) return;
            n.textContent = m; clearTimeout(n._t);
            n._t = setTimeout(function () { n.textContent = ""; }, 2200);
          }
          summaryBtn.addEventListener("click", function () {
            var text = (summaryEl.textContent || "").trim();
            if (navigator.share) {
              navigator.share({ title: pageTitle, text: text, url: pageUrl }).catch(function () {});
              return;
            }
            var full = text + "\n\n" + pageUrl;
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(full)
                .then(function ()  { summaryToast("✓ Summary copied"); })
                .catch(function () { summaryToast("Copy failed — select the text manually"); });
            } else {
              summaryToast("Copy not supported here");
            }
          });
        }
        document.addEventListener("keydown", function (e) {
          if (e.key === "Escape" && !shareModal.hasAttribute("hidden")) closeShare();
        });

        if (shareCopyBtn) {
          shareCopyBtn.addEventListener("click", function () {
            var btn = shareCopyBtn;
            function flash() { btn.textContent = "Copied!"; setTimeout(function () { btn.textContent = "Copy link"; }, 2200); }
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(pageUrl).then(flash).catch(function () { fallbackCopy(); });
            } else { fallbackCopy(); }
            function fallbackCopy() {
              var ta = document.createElement("textarea");
              ta.value = pageUrl;
              ta.style.cssText = "position:fixed;opacity:0;top:0;left:0;width:1px;height:1px";
              document.body.appendChild(ta);
              ta.focus(); ta.select();
              try { document.execCommand("copy"); flash(); } catch (e) {}
              document.body.removeChild(ta);
            }
          });
        }
      })();

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

