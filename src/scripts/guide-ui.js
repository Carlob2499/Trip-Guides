// Guide interactive UI — extracted from GuideLayout.astro so it bundles into a
// single hashed module cached across every guide page (was ~950 lines inline per
// page). Config that used to come from Astro define:vars is now read from the
// #tgConfig JSON script tag emitted by the layout.
import { todayInTz, trapFocus, migrateStorageKey, tapHaptic } from "./util.js";
import { attachSheetDrag } from "./sheet-drag.js";
import { initDarkToggle } from "./theme.js";
import { resolveTripDate, tripWindow } from "../lib/trip-dates";
import { initRate, initWeather, initDaySwap, initSun } from "../features/live-data/index.js";
import { initJetLag } from "./jetlag-ui.js";
import { initSharePanel } from "../features/share/index.js";
import { initChangeRequest } from "../features/change-request/index.js";
import { reportError } from "../features/firebase/index.js";
import { initBudgetPact } from "../features/budget-pact/index.js";
import { initPacking } from "../features/trip-kit/index.js";

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
const legacyStoreKey    = _cfg.legacyStoreKey || null;
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
          var LEGACY_STORE_KEY = legacyStoreKey ? "tripguide-" + legacyStoreKey : null;
          // R8: one-time migration of this guide's checklist + budget localStorage from
          // the old title-derived key to the new slug-derived one (see storeKey's own
          // comment in GuideLayout.astro). No-op for every current guide (slug already
          // normalizes to the same string as the title), and never overwrites data
          // already saved under the new key.
          migrateStorageKey(localStorage, STORE_KEY, LEGACY_STORE_KEY);
          migrateStorageKey(localStorage, STORE_KEY + "-budget", LEGACY_STORE_KEY ? LEGACY_STORE_KEY + "-budget" : null);

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
          // Via Object.prototype, not specialPanels.hasOwnProperty: the keys come from a URL
          // hash and localStorage, so a tab named "hasOwnProperty" or "__proto__" would
          // otherwise call something that isn't the check we meant.
          function hasPanel(key) { return Object.prototype.hasOwnProperty.call(specialPanels, key); }

          var TAB_KEY = "tg-tab-" + STORE_KEY;

          /* R3 — the journey line's stations. A section you have moved on from stays solid;
             the one you are in fills as you scroll it (the progress-bar block below). Kept in
             sessionStorage so a reload inside one visit doesn't wipe the route walked, and NOT
             in localStorage — next week's visit is a new journey. */
          var SEEN_KEY = "tg-seen-" + STORE_KEY;
          var seen = {};
          try { seen = JSON.parse(sessionStorage.getItem(SEEN_KEY) || "{}") || {}; } catch (_) { seen = {}; }
          function markSeen(key) {
            if (key == null || seen[key]) return;
            seen[key] = 1;
            try { sessionStorage.setItem(SEEN_KEY, JSON.stringify(seen)); } catch (_) {}
          }

          function showTab(idx) {
            var isSpecial = typeof idx === "string" && hasPanel(idx);
            catblocks.forEach(function (b, i) { b.hidden = isSpecial || i !== idx; });
            Object.keys(specialPanels).forEach(function (key) {
              var panel = specialPanels[key];
              if (panel) panel.hidden = !(isSpecial && idx === key);
            });
            if (guideTabs) {
              // Leaving a section counts as having been through it.
              var leaving = guideTabs.querySelector(".gtab-active:not(.gtab-tool)");
              if (leaving && leaving.dataset.tab !== (isSpecial ? idx : String(idx))) markSeen(leaving.dataset.tab);
              guideTabs.querySelectorAll(".gtab").forEach(function (btn) {
                var match = btn.dataset.tab === (isSpecial ? idx : String(idx));
                btn.setAttribute("aria-selected", match ? "true" : "false");
                btn.classList.toggle("gtab-active", match);
                if (Object.prototype.hasOwnProperty.call(seen, btn.dataset.tab)) btn.dataset.visited = "";
                // A section not yet walked starts empty; the scroll handler fills it.
                if (match && !(btn.dataset.tab in seen)) btn.style.setProperty("--st-fill", "0");
              });
              // Scroll active tab into view
              var active = guideTabs.querySelector(".gtab-active");
              if (active) active.scrollIntoView({ block: "nearest", inline: "nearest" });
            }
            try { sessionStorage.setItem(TAB_KEY, isSpecial ? idx : String(idx)); } catch (_) {}
            syncTabIndex();
            syncJetLag(isSpecial ? null : idx);
          }

          /* The jet-lag calculator is an ARRIVAL tool. It used to sit above every tab of
             every guide; it now appears only on the group whose own content covers jet lag
             or landing (data-jl-group, derived in GuideLayout from the section titles), and
             not at all once the trip has ended — after the last day there is nothing left
             to adapt to, so the control is pure chrome. */
          var jlWrap = document.querySelector(".jl-wrap");
          var jlDead = false;
          if (jlWrap) {
            jlDead = tripWindow(firstDayDate, lastDayDate, new Date()).isPast;
          }
          function syncJetLag(idx) {
            if (!jlWrap) return;
            jlWrap.hidden = jlDead || String(idx) !== jlWrap.getAttribute("data-jl-group");
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
                showTab(hasPanel(t) ? t : parseInt(t, 10));
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
          } else if (hasPanel(savedTab) && specialPanels[savedTab]) {
            // R6: `hasOwnProperty` alone only proves the KEY is a known special-tab name —
            // not that THIS guide actually rendered that panel (e.g. a Learnings tab from a
            // prior guide visit, saved under the same per-storeKey session key, before this
            // guide has a `learnings` block: the DOM element is null). Restoring into a
            // panel that doesn't exist hid every catblock (isSpecial short-circuits them
            // all) with nothing left to un-hide — a blank content area with no active tab.
            // Requiring the element to actually exist falls through to the numeric-tab
            // branch below instead.
            showTab(savedTab);
          } else {
            var si = parseInt(savedTab || "0", 10);
            showTab(isNaN(si) || si >= catblocks.length ? 0 : si);
          }

          /* R4: the old whole-page scroll-position system that lived here (a raw
             pageYOffset saved to sessionStorage, restored on load regardless of which
             tab ended up active) has been REMOVED — it fought with scroll-memory.js's
             PER-TAB system (src/scripts/scroll-memory.js), which now also restores at
             load time, not just on tab click. One system, not two. */

          /* ── 1. DARK MODE TOGGLE ──────────────────────────────────────── */
          // A2: shared with the hub via src/scripts/theme.js — was a byte-different
          // duplicate implementation here (SVG icons + theme-color sync) vs. index.astro's
          // own copy (plain-text glyph, no theme-color sync). Same "tg-theme" key both
          // copies already used, so no migration needed.
          initDarkToggle("btnDark");

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
                if (hasPanel(t)) {
                  showTab(t);
                } else if (t !== undefined && t !== "") {
                  showTab(parseInt(t, 10));
                }
                closeSheet();
              });
            });
            document.addEventListener("keydown", function (e) {
              if (e.key === "Escape" && sheet.classList.contains("open")) { closeSheet(); return; }
            });
            // R3: shared trap (src/scripts/util.js) — this WAS the one dialog of four
            // that actually trapped focus; extracted so lightbox/SOS/addr-card/new-guide
            // modal can all share the same, single-tested implementation instead of each
            // claiming aria-modal without backing it.
            trapFocus(sheet, function () { return sheet.classList.contains("open"); });
            // Drag down to dismiss — shared with the SOS sheet (src/scripts/sheet-drag.js).
            // Replaces a bare 60px touchend check that moved nothing while the thumb was
            // down: the sheet now follows the finger and either falls away or springs back,
            // and it stands down when the list underneath is mid-scroll.
            attachSheetDrag(sheet, closeSheet);
          }

          /* ── 2b. JOURNEY BAR DESTINATIONS (R2) ───────────────────────── */
          // Today: open the Days group and land on today's card when the trip is live
          // (data-date matches the visitor's local "Www Mmm D"), else the group's top.
          var botToday = document.getElementById("botToday");
          if (botToday) botToday.addEventListener("click", function () {
            var dayEl = document.querySelector(".day");
            if (!dayEl) return;
            var grp = dayEl.closest('[id^="grp-"]');
            var cat = grp ? parseInt(grp.id.slice(4), 10) : 0;
            showTab(cat);
            var d = new Date();
            var DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"], MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
            var todayStr = DOW[d.getDay()] + " " + MON[d.getMonth()] + " " + d.getDate();
            var hit = document.querySelector('.day[data-date="' + todayStr + '"]');
            (hit || grp || dayEl).scrollIntoView({ behavior: "smooth", block: "start" });
          });
          // Kit left the bottom bar in the tab-bar rebuild (2026-07-30) — the sheet's
          // Trip Kit link, wired by the sheet handler above, is now its only entry.
          // Map: an anchor into the map's section — just activate its tab first.
          var botMap = document.getElementById("botMap");
          if (botMap) botMap.addEventListener("click", function () {
            var t = parseInt(this.dataset.tab, 10);
            if (!isNaN(t)) showTab(t);
          });

          /* ── 3. SCROLL-SPY ───────────────────────────────────────────── */
          function setActive(secId, cat) {
            var cur = document.getElementById("curCat"); if (cur) cur.textContent = order[cat] || "";
            document.querySelectorAll(".sheet-link").forEach(function (a) {
              var on = a.getAttribute("href") === "#" + secId;
              a.classList.toggle("active", on);
              if (on) a.setAttribute("aria-current", "true");
            else a.removeAttribute("aria-current");
            });
            document.querySelectorAll(".sheet-cat").forEach(function (a) {
              a.classList.toggle("active", a.dataset.cat === String(cat));
            });
            // One spy, many listeners: the mobile-nav silo records "where you were"
            // per group from this verdict rather than running a second spy of its own.
            // Fire-and-forget — no listener is required for anything here to work.
            try {
              document.dispatchEvent(new CustomEvent("tg:section", { detail: { secId: secId, cat: cat } }));
            } catch (_) { /* very old browsers: the resume lines simply stay blank */ }
          }
          var blocks = Array.prototype.slice.call(document.querySelectorAll(".block"));
          function spy() {
            // Only spy blocks inside the currently-visible catblock
            var visBlocks = blocks.filter(function (b) { return b.offsetParent !== null; });
            if (!visBlocks.length) return;
            // VISUAL order, not capture order: Panel-hosted blocks (Atlas Phase 2) get
            // reordered by the reader, and the early-break walk below assumes
            // ascending tops — a stale document-order array names the wrong section.
            visBlocks.sort(function (a, b) { return a.getBoundingClientRect().top - b.getBoundingClientRect().top; });
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
              if (txt.indexOf(plain) !== -1 || txt.indexOf(plain.replace(/ /g, "\u00a0")) !== -1 ||
                  txt.replace(/\u00a0/g, " ").indexOf(plain) !== -1) {
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
              function marked() {
                btn.textContent = "✓";
                setTimeout(function () { btn.textContent = "#"; }, 1800);
              }
              // R7: without the fallback, a button was dead-silent (no copy, no feedback,
              // no error) anywhere navigator.clipboard is absent (non-HTTPS context, older
              // browser, some in-app webviews) — field-tools.js already had this pattern
              // (window.prompt lets the reader select-and-copy by hand); this brought
              // guide-ui.js's two copy buttons in line with it.
              if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(marked).catch(function () {
                  window.prompt("Copy this link:", url);
                });
              } else {
                window.prompt("Copy this link:", url);
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
            function markCopied() {
              btn.innerHTML = '<span lang="ko">✓ 복사됨</span>';
              btn.classList.add("copied");
              setTimeout(function () {
                btn.innerHTML = '<svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="9" height="9" rx="1.5"/><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5"/></svg> <span lang="ko">주소 복사</span>';
                btn.classList.remove("copied");
              }, 1900);
            }
            btn.addEventListener("click", function () {
              // R7: same fallback as the anchor-copy button above (and field-tools.js's
              // existing pattern) — without it this button was silently dead wherever
              // navigator.clipboard is absent.
              if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(addr).then(markCopied).catch(function () {
                  window.prompt("Copy this address:", addr);
                });
              } else {
                window.prompt("Copy this address:", addr);
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
            b.addEventListener("change", function () {
              // A tick is a commitment ("packed", "booked") made without looking up from
              // the bag — the buzz is the confirmation. Silent no-op off Android.
              tapHaptic();
              saveState(currentState());
              updateDayCounts();
            });
          });

          /* ── 5. BUDGET CALCULATORS ───────────────────────────────────── */
          document.querySelectorAll(".budget").forEach(function (bud) {
            var BKEY   = STORE_KEY + "-budget";
            var bstore = {};
            try { bstore = JSON.parse(localStorage.getItem(BKEY) || "{}"); } catch (e) { bstore = {}; }
            var cur    = bud.getAttribute("data-cur") || "$";
            var inputs = Array.prototype.slice.call(bud.querySelectorAll(".bactual"));
            inputs.forEach(function (inp, i) {
              var row = inp.closest(".brow");
              var dataKey = row && row.getAttribute("data-key");
              // R5: rows without data-key used to all hash the same empty string, so their
              // saved values clobbered each other (every undeclared row shared one storage
              // slot). Falling back to a per-ROW-INDEX key keeps them independent — still
              // stable across reloads (row order doesn't change), just not stable across a
              // guide edit that reorders rows, same caveat any index-based key would have.
              var k = hashKey(dataKey || ("row-" + i));
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
            /* R3: on desktop the fixed bar retires and the journey line carries the same
               percentage. It used to be a second accent bar sliding along the track, over the
               circles — which read as a separate object crossing them, and never lined up with
               either. The percentage now fills the ACTIVE STATION itself, and a station you
               have finished with stays solid (data-visited, set in showTab). One thing filling,
               instead of three things at three offsets. */
            var horizonNav = document.querySelector(".guide-tabs-nav");
            function updateBar() {
              var max = document.body.scrollHeight - window.innerHeight;
              var pct = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
              bar.style.width = pct + "%";
              if (!horizonNav) return;
              horizonNav.style.setProperty("--journey-read", String(pct));
              var active = horizonNav.querySelector(".gtab-active:not(.gtab-tool)");
              if (active) active.style.setProperty("--st-fill", String(Math.round(pct)));
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
            // R1: whether the trip is still ongoing is a real fact — the LAST day's date,
            // not a hardcoded "within 7 days of the start" guess. That guess lied on any
            // trip longer than 8 days (day 9 read "9 days ago" while the trip was still
            // running). tripWindow() reads lastDayDate (already threaded through _cfg)
            // and falls back to the single-day case when there's no last day.
            var win = tripWindow(firstDayDate, lastDayDate, now);
            var pill = document.createElement("span");
            if (diff > 1)         { pill.className = "gstat gstat-countdown"; pill.textContent = diff + " days to go"; }
            else if (diff === 1)  { pill.className = "gstat gstat-countdown"; pill.textContent = "Tomorrow!"; }
            else if (diff === 0)  { pill.className = "gstat gstat-active";    pill.textContent = "Trip starts today!"; }
            else if (win.isOngoing) { pill.className = "gstat gstat-active";    pill.textContent = "Happening now!"; }
            else                  { pill.className = "gstat gstat-past";      pill.textContent = Math.abs(diff) + " days ago"; }
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
        /* ── 10. OFFLINE-READY BADGE — RETIRED 2026-07-30 ─────────────────
           It read "✓ Works offline" identically on every guide, and it only ever proved
           that SOME tripguides-* cache existed — not that THIS page was in it. The
           honest version now lives in the colophon (offline-pill.js), where it matches
           this page against the cache and appears only when the answer is yes. */
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
          // Budget pact (F1's neighbor, F2) — joins the Budget tab's own plan against its own
          // "your spend" actuals; needs the same trip dates weather/sun already have.
          initBudgetPact({ firstDayDate: firstDayDate, lastDayDate: lastDayDate });
          // Packing strip (F4) — piggybacks on whatever initWeather already fetched above
          // (getLastWx/tg:wx); never triggers its own fetch.
          initPacking({ mapCenter: mapCenter, firstDayDate: firstDayDate, lastDayDate: lastDayDate });
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
      // Guided change request. _cfg carries navSections (the guide's own tabs) so the
      // wizard can offer a real section hint instead of asking a reader to name one.
      try { initChangeRequest(_cfg, _lockScroll, _unlockScroll); } catch (e) { fail("change request", e); }

      /* ── BUDGET PER-PERSON TOGGLE ─────────────────────────────────────── */
      document.querySelectorAll(".budget-toggle").forEach(function (tog) {
        var bud = tog.closest(".budget");
        if (!bud) return;
        var btns  = tog.querySelectorAll(".btog-btn");
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

