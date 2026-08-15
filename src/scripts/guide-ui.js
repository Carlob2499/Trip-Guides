// Guide interactive UI — extracted from GuideLayout.astro so it bundles into a
// single hashed module cached across every guide page (was ~950 lines inline per
// page). Config that used to come from Astro define:vars is now read from the
// #tgConfig JSON script tag emitted by the layout.
import { todayInTz, trapFocus, migrateStorageKey, tapHaptic } from "./util.js";
import { attachSheetDrag } from "./sheet-drag.js";
import { initDarkToggle } from "./theme.js";
import { resolveTripDate, tripWindow, dayState } from "../lib/trip-dates";
import { nextLeg } from "../lib/plate-line";
import { initRate, initWeather, initDaySwap, initSun } from "../features/live-data/index.js";
import { initJetLag } from "./jetlag-ui.js";
import { initSharePanel } from "../features/share/index.js";
import { initChangeRequest } from "../features/change-request/index.js";
import { reportError } from "../features/firebase/index.js";
import { initBudgetPact } from "../features/budget-pact/index.js";
import { initGuideRail } from "../features/guide-rail/index.ts";
import { initFolds } from "./fold.js";
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
      function fail(name, err) {
        console.error("[guide-ui] " + name + " failed:", err);
        // Also beacon it so the maker can SEE production failures, not just the traveler's own
        // console. Best-effort + rate-limited inside reportError; never let it mask the original.
        try { reportError({ guide: storeKey, feature: name, message: (err && err.message) || String(err) }); } catch (_) {}
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
          /* Every destination is a NUMBERED station now — Field log and Tools included. The
             string-keyed "special panel" map that used to sit here (Budget, Reminders, Vote,
             Trip kit, Learnings) is gone, and with it the whole string-vs-index branch showTab
             carried: `hasPanel()`, the `isSpecial` short-circuit, and the sessionStorage
             restore path that had to prove a named panel actually existed before trusting it.
             It was kept one revision longer than it was used, on the theory that a future
             station addressed by name would want it back. It would not: a station addressed by
             name is a station, and stations are what the rail already builds. */

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
            catblocks.forEach(function (block, i) { block.hidden = i !== idx; });
            if (guideTabs) {
              // Leaving a section counts as having been through it.
              var leaving = guideTabs.querySelector(".gtab-active");
              if (leaving && leaving.dataset.tab !== String(idx)) markSeen(leaving.dataset.tab);
              guideTabs.querySelectorAll(".gtab").forEach(function (btn) {
                var match = btn.dataset.tab === String(idx);
                /* R5: aria-current, not aria-selected. The rail is a <nav> of plain buttons
                   rather than a tablist (BEHAVIOR.md §4), and aria-selected on a button with
                   no tab role is invalid ARIA that axe reports. Removed rather than set to
                   "false": "current: false" is the default and stating it adds noise to every
                   screen-reader pass over thirteen stops. */
                if (match) btn.setAttribute("aria-current", "true");
                else btn.removeAttribute("aria-current");
                btn.classList.toggle("gtab-active", match);
                if (Object.prototype.hasOwnProperty.call(seen, btn.dataset.tab)) btn.dataset.visited = "";
                // A section not yet walked starts empty; the scroll handler fills it.
                if (match && !(btn.dataset.tab in seen)) btn.style.setProperty("--st-fill", "0");
              });
              /* Keep the active stop in view WITHIN THE RAIL'S OWN SCROLLER.
                 scrollIntoView() was here and is banned by ACCEPTANCE: it walks the ancestor
                 chain and scrolls every scrollable box it finds, the document included — so
                 switching station also threw away the reader's page position. Setting
                 scrollLeft on the one element that should move cannot do that. */
              var active = guideTabs.querySelector(".gtab-active");
              if (active && guideTabs.scrollWidth > guideTabs.clientWidth) {
                var want = active.offsetLeft - (guideTabs.clientWidth - active.offsetWidth) / 2;
                var max = guideTabs.scrollWidth - guideTabs.clientWidth;
                guideTabs.scrollLeft = Math.min(Math.max(want, 0), max);
              }
            }
            try { sessionStorage.setItem(TAB_KEY, String(idx)); } catch (_) {}
            syncTabIndex();
            syncJetLag(idx);
            syncRailContext();
          }

          /* The rail's context line — the active station's name and its descriptor. Both are
             read off the station button and the panel that is now visible, never restated: a
             hand-maintained label here is precisely the copy that drifts the moment a group is
             renamed, and TESTS.md §5 exists because that already happened once.
             The descriptor lives on the visible .catblock as data-desc; a group without one
             renders no descriptor line at all rather than an empty element. */
          var railKicker = document.querySelector("[data-rail-kicker]");
          var railDesc   = document.querySelector("[data-rail-desc]");
          function syncRailContext() {
            if (!guideTabs || !railKicker) return;
            var active = guideTabs.querySelector(".gtab-active");
            if (!active) return;
            railKicker.textContent = active.dataset.full || "";
            if (!railDesc) return;
            var panel = active.getAttribute("aria-controls")
              ? document.getElementById(active.getAttribute("aria-controls"))
              : null;
            var desc = panel && panel.dataset ? panel.dataset.desc : "";
            railDesc.textContent = desc || "";
            railDesc.hidden = !desc;
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
                var tab = this.dataset.tab;
                showTab(parseInt(tab, 10));
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
          /* ⌁ `inert`, not just the transform. The sheet ANIMATES out — translateY(100%) —
             which moves it off the screen and leaves all ~90 of its links in the tab order and
             in the accessibility tree. A keyboard or switch user tabbing the page walked
             through ninety invisible controls before reaching anything they could see, and
             axe cannot flag it: every one of those links is perfectly accessible, it is just
             somewhere nobody can look. The share modal and the SOS sheet were never affected
             because they use `hidden`; this one could not, because `display:none` cannot
             transition. `inert` is the tool that does both — it removes the subtree from
             focus and from AT entirely while leaving the element paintable and animatable.

             ACCEPTANCE §6.1 and regression pin 9.3 are the same sentence: sheets animate AND
             leave the tab order when closed. Both, not one. */
          function openSheet() {
            sheet.classList.add("open"); backdrop.classList.add("open");
            sheet.removeAttribute("inert");
            _lockScroll();
            sheetBtn.setAttribute("aria-expanded", "true");
            var firstLink = sheet.querySelector("a"); if (firstLink) firstLink.focus();
          }
          function closeSheet() {
            sheet.classList.remove("open"); backdrop.classList.remove("open");
            /* Set immediately, not after the 280ms slide. A control you cannot see is already
               unreachable to the reader; keeping it focusable for the length of an animation
               only preserves the bug for a fifth of a second. The slide is unaffected —
               `inert` does not change how an element paints. */
            sheet.setAttribute("inert", "");
            _unlockScroll();
            sheetBtn.setAttribute("aria-expanded", "false"); sheetBtn.focus();
          }
          if (sheet && sheetBtn && backdrop) {
            sheetBtn.addEventListener("click", openSheet);
            backdrop.addEventListener("click", closeSheet);
            sheet.querySelectorAll("a").forEach(function (link) {
              link.addEventListener("click", function () {
                var tab = this.dataset.tab;
                if (tab !== undefined && tab !== "") showTab(parseInt(tab, 10));
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
          // It lives in the Groups sheet's tool row since the bar went to four slots
          // (2026-08-08) — an <a href="#">, so the default jump-to-top has to be stopped
          // or it fights the scrollIntoView below.
          var botToday = document.getElementById("botToday");
          if (botToday) botToday.addEventListener("click", function (e) {
            e.preventDefault();
            var dayEl = document.querySelector(".day");
            if (!dayEl) return;
            var grp = dayEl.closest('[id^="grp-"]');
            var cat = grp ? parseInt(grp.id.slice(4), 10) : 0;
            showTab(cat);
            var now = new Date();
            var DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"], MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
            var todayStr = DOW[now.getDay()] + " " + MON[now.getMonth()] + " " + now.getDate();
            var hit = document.querySelector('.day[data-date="' + todayStr + '"]');
            (hit || grp || dayEl).scrollIntoView({ behavior: "smooth", block: "start" });
          });
          // Kit left the bottom bar in the tab-bar rebuild (2026-07-30) and Map left it
          // when the bar went to four slots (2026-08-08) — both are reached through the
          // Groups sheet now (Trip Kit in its tool row, the map as a section link under
          // its own group), wired by the generic sheet handler above.

          /* ── 3. SCROLL-SPY ───────────────────────────────────────────── */
          function setActive(secId, cat) {
            var cur = document.getElementById("curCat"); if (cur) cur.textContent = order[cat] || "";
            document.querySelectorAll(".sheet-link").forEach(function (link) {
              var on = link.getAttribute("href") === "#" + secId;
              link.classList.toggle("active", on);
              if (on) link.setAttribute("aria-current", "true");
            else link.removeAttribute("aria-current");
            });
            document.querySelectorAll(".sheet-cat").forEach(function (link) {
              link.classList.toggle("active", link.dataset.cat === String(cat));
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
            var visBlocks = blocks.filter(function (block) { return block.offsetParent !== null; });
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
            var block = visBlocks[idx]; setActive(block.id, block.dataset.cat);
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
            var dayNum = destToday ? destToday.d : now.getDate();
            // Match day cards whose .d label contains today's month-day (e.g. "Jul 9", "Jul 14")
            var plain  = MONTHS[mo - 1] + " " + dayNum;
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
          function hashKey(str) {
            var hash = 5381; str = String(str);
            for (var i = 0; i < str.length; i++) { hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0; }
            return "k" + (hash >>> 0).toString(36);
          }
          // data-pkey is stamped at build time by PanelBlock/ListBlock/DaysBlock —
          // no client-side hash or dedup needed.
          var boxes = Array.prototype.slice.call(document.querySelectorAll("input[type=checkbox]"));

          function loadState()  { try { return JSON.parse(localStorage.getItem(STORE_KEY) || "{}"); } catch (e) { return {}; } }
          function saveState(stateObj) { try { localStorage.setItem(STORE_KEY, JSON.stringify(stateObj)); flash("✓ saved"); } catch (e) { flash("Storage full"); } }
          function currentState() { var stateObj = {}; boxes.forEach(function (box) { if (box.checked) stateObj[box.dataset.pkey] = 1; }); return stateObj; }

          function flash(msg) {
            var note = document.getElementById("savedNote"); if (!note) return;
            note.textContent = msg;
            if (msg) { clearTimeout(note._t); note._t = setTimeout(function () { note.textContent = ""; }, 2200); }
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
              cbs.forEach(function (box) { if (box.checked) done++; });
              badge.textContent = "Day kit " + done + "/" + cbs.length;
              badge.hidden = false;
              badge.classList.toggle("done", done === cbs.length);
            });
          }

          // Load saved state on page open
          var saved = loadState();
          boxes.forEach(function (box) { if (saved[box.dataset.pkey]) box.checked = true; });
          updateDayCounts();
          boxes.forEach(function (box) {
            box.addEventListener("change", function () {
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
              var key = hashKey(dataKey || ("row-" + i));
              inp.dataset.pkey = key;
              if (bstore[key] != null) inp.value = bstore[key];
            });
            function fmt(num)    { return cur + (Math.round(num * 100) / 100).toLocaleString("en-US"); }
            function recalcB() {
              var sum = 0;
              var catSums = {};
              inputs.forEach(function (inp) {
                var val = parseFloat(inp.value);
                if (!isNaN(val)) {
                  sum += val;
                  var row = inp.closest(".brow");
                  var cat = row ? (row.getAttribute("data-bcat") || "") : "";
                  catSums[cat] = (catSums[cat] || 0) + val;
                }
              });
              var totalEl = bud.querySelector(".bact-total"); if (totalEl) totalEl.textContent = fmt(sum);
              // Update per-category "Your spend" subtotal cells
              bud.querySelectorAll(".bsubtotal").forEach(function (row) {
                var cat = row.getAttribute("data-sub-cat") || "";
                var el  = row.querySelector(".bsub-act");
                if (el) el.textContent = catSums[cat] != null ? fmt(catSums[cat]) : "—";
              });
            }
            function persistB() {
              var vals = {}; inputs.forEach(function (inp) { if (inp.value !== "") vals[inp.dataset.pkey] = inp.value; });
              try { localStorage.setItem(BKEY, JSON.stringify(vals)); flash("✓ saved"); } catch (e) { flash("Storage full"); }
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
            // R5: the rail replaced .guide-tabs-nav; the fill it writes is unchanged.
            var horizonNav = document.querySelector(".grail");
            function updateBar() {
              var max = document.body.scrollHeight - window.innerHeight;
              var pct = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
              // A custom property, not style.width — see the .read-prog note in guide.css.
              // This runs on every scroll frame, so it must not be able to trigger layout.
              bar.style.setProperty("--read-prog", (pct / 100).toFixed(4));
              if (!horizonNav) return;
              horizonNav.style.setProperty("--journey-read", String(pct));
              // :not(.gtab-tool) is gone with the tool tabs it excluded — every stop on the
              // rail is a station now, and every station's dot carries reading progress.
              var active = horizonNav.querySelector(".gtab-active");
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
            daysForBanner.forEach(function (dayEntry) {
              var parts = String(dayEntry.date).split(/\s+/);
              var moIdx = MONTHS.indexOf(parts[1]);
              var day   = parseInt(parts[2], 10);
              if (moIdx === -1 || isNaN(day)) return;
              if (prevMoIdx !== -1 && moIdx < prevMoIdx) year++;
              prevMoIdx = moIdx;
              var dt = new Date(year, moIdx, day);
              dt.setHours(0, 0, 0, 0);
              days.push({ date: dt, title: dayEntry.title, fit: dayEntry.fit });
            });
            if (!days.length) return;

            var today = new Date(now); today.setHours(0, 0, 0, 0); // dest-calendar day (from `now` above)
            if (today < days[0].date || today > days[days.length - 1].date) return;

            var match    = days.find(function (day) { return day.date.getTime() === today.getTime(); });
            var upcoming = !match && days.find(function (day) { return day.date.getTime() > today.getTime(); });
            var entry    = match || upcoming;
            if (!entry) return;

            label.textContent = match ? "Today" : "Next up";
            text.textContent  = entry.title + (entry.fit ? " — " + entry.fit : "");
            box.hidden = false;
          })();

          /* ── 8b. THE PLATE LINE'S NEXT LEG (R5 SCREENS §1) ────────────
             The one row of the plate line that depends on when the page is READ, so it is
             filled here rather than baked at build time — a static "next" is wrong the day
             after any deploy. The derivation is pure and tested (src/lib/plate-line.ts);
             this block only supplies the destination's calendar day and the DOM. Outside
             the trip window nextLeg() returns null and the row stays hidden, which is the
             FALLBACKS §1 rule for a trip not started or already finished. */
          (function () {
            var slot = document.getElementById("mastNextLeg");
            if (!slot) return;
            /* The timed stops live in #storyDays, not in tgConfig's daysForBanner — that one
               carries date/title/fit only. Read from where the data already is rather than
               growing tgConfig with a second copy of every waypoint on every guide. */
            var storyEl = document.getElementById("storyDays");
            var story;
            try { story = JSON.parse((storyEl && storyEl.textContent) || "[]") || []; } catch (_) { return; }
            if (!story.length) return;
            var _d = todayInTz(destTzIana);
            var when = _d ? new Date(_d.y, _d.m - 1, _d.d) : new Date();
            var leg = nextLeg(
              story.map(function (day) { return { date: day.date, waypoints: day.stops }; }),
              resolveTripDate,
              when,
            );
            if (!leg) return;
            slot.textContent = "Next · " + leg;
            slot.hidden = false;
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
          /* ── 9b. THE MASTHEAD'S LIVE-STATE COLUMN (DESIGN.md R5 §3) ──
             The stamp and the day/clock row. Both are answers to "when is it", so both are
             filled here rather than baked into the page: a build-time stamp would say
             UPCOMING for as long as the deploy lasted. The third row (stops · to book) is
             counted from the guide's own data and is already in the HTML.

             dayState() is the shared derivation the day station uses, so the stamp and the
             day card can never disagree about which day it is or whether the trip is on. */
          (function () {
            var stampEl = document.getElementById("mastState");
            var whenEl  = document.getElementById("mastWhen");
            if (!stampEl && !whenEl) return;

            var _d = todayInTz(destTzIana);
            var when = _d ? new Date(_d.y, _d.m - 1, _d.d) : new Date();
            var win = tripWindow(firstDayDate, lastDayDate, when);

            if (stampEl) {
              // Three states, and no fourth for "we are not sure": a guide with no dated days
              // has no window to be inside, so the stamp stays absent rather than guessing.
              var label = win.isOngoing ? "On this trip now" : win.isPast ? "Complete" : firstDayDate ? "Upcoming" : null;
              if (label) {
                stampEl.textContent = label;
                stampEl.dataset.state = win.isOngoing ? "now" : win.isPast ? "done" : "next";
                stampEl.hidden = false;
              }
            }

            /* The day and the local clock, together, and ONLY while the trip is running. Off
               the trip they are two true facts that mean nothing here — a day number for a
               trip nobody is on, and a clock for a city nobody is in. */
            if (whenEl && win.isOngoing && daysForBanner.length) {
              /* Which day is "now" comes from dayState itself rather than a second date
                 comparison here — one derivation, so the stamp and the day card cannot
                 disagree. It answers per-index, so the index is the one it calls "now". */
              var dates = daysForBanner.map(function (day) { return day.date; });
              var current = -1;
              for (var di = 0; di < dates.length; di++) {
                if (dayState(dates, di, when) === "now") { current = di; break; }
              }
              var parts = [];
              if (current >= 0) parts.push("Day " + (current + 1) + " of " + dates.length);
              if (destTzIana) {
                try {
                  var fmt2 = new Intl.DateTimeFormat("en-GB", { timeZone: destTzIana, hour: "2-digit", minute: "2-digit", hour12: false });
                  parts.push(fmt2.format(new Date()));
                  setInterval(function () {
                    var segs = whenEl.textContent.split(" · ");
                    segs[segs.length - 1] = fmt2.format(new Date());
                    whenEl.textContent = segs.join(" · ");
                  }, 60000);
                } catch (_) { /* an invalid zone drops the clock, not the day */ }
              }
              if (parts.length) { whenEl.textContent = parts.join(" · "); whenEl.hidden = false; }
            }
          })();

        } catch (e) { fail("live state", e); }
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
      /* The spine rail's runtime: the progress fill, keeping the active stop inside its own
         scroller, and republishing the measured header height into --hdr-h. It reacts to the
         router above rather than replacing it, so this failing costs the fill and the sticky
         offset — never the ability to change station. */
      try { initGuideRail(document); } catch (e) { fail("guide rail", e); }
      // Every fold in the product, delegated from the document — day bodies, Panels and
      // tool screens alike, including the ones built after this runs.
      try { initFolds(document); } catch (e) { fail("folds", e); }

      /* ── DAY STATE ────────────────────────────────────────────────────
         done / now / next / planned, resolved against the READER's clock rather than the
         build's. The model (lib/trip-dates.ts) owns the rule that matters — there is no `now`
         day unless today falls inside the trip — and this only paints what it returns. A day
         whose date will not resolve keeps its chip hidden rather than showing a guess. */
      try {
        var dayEls = Array.prototype.slice.call(document.querySelectorAll(".day[data-date]"));
        if (dayEls.length) {
          var dates = dayEls.map(function (el) { return el.getAttribute("data-date"); });
          var nowClock = new Date();
          dayEls.forEach(function (el, i) {
            var state = dayState(dates, i, nowClock);
            var chip = el.querySelector("[data-day-state]");
            if (!chip) return;
            if (!state) { chip.hidden = true; return; }
            chip.textContent = state;
            chip.setAttribute("data-state", state);
            chip.hidden = false;
            el.setAttribute("data-state", state);
          });
          /* The day scrubber's chips carry the same states, from the same call — two surfaces
             reading one answer, so they cannot disagree about which day it is. */
          document.querySelectorAll(".dchip[data-day-jump]").forEach(function (chip) {
            var i = parseInt(chip.getAttribute("data-day-jump"), 10);
            var state = dayState(dates, i, nowClock);
            if (state) chip.setAttribute("data-state", state);
          });
        }
      } catch (e) { fail("day state", e); }
      // Guided change request. _cfg carries navSections (the guide's own tabs) so the
      // wizard can offer a real section hint instead of asking a reader to name one.
      try { initChangeRequest(_cfg, _lockScroll, _unlockScroll); } catch (e) { fail("change request", e); }

      /* ── PLATE-LINE PRINT CONTROL ─────────────────────────────────────── */
      // The masthead plate line's "Print sheet" button. All the actual work — hiding
      // chrome, force-expanding collapsed Panels — is CSS-only (print.css's @media
      // print), so this is just the trigger.
      try {
        document.querySelectorAll("[data-print-sheet]").forEach(function (btn) {
          btn.addEventListener("click", function () { window.print(); });
        });
      } catch (e) { fail("print sheet", e); }

      /* ── BUDGET PER-PERSON TOGGLE ─────────────────────────────────────── */
      document.querySelectorAll(".budget-toggle").forEach(function (tog) {
        var bud = tog.closest(".budget");
        if (!bud) return;
        var btns  = tog.querySelectorAll(".btog-btn");
        var cur   = bud.getAttribute("data-cur") || "$";

        function fmt(num) { return cur + Math.round(num).toLocaleString("en-US"); }

        function applyMode(mode) {
          btns.forEach(function (btn) {
            btn.classList.toggle("btog-active", btn.getAttribute("data-mode") === mode);
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
            var tripVal = parseFloat(row.getAttribute("data-sub-trip")   || "0");
            var personVal = parseFloat(row.getAttribute("data-sub-person") || "0");
            el.textContent = fmt(mode === "person" ? personVal : tripVal);
          });

          var totEl = bud.querySelector(".best-total");
          if (totEl) {
            var tripVal = parseFloat(totEl.getAttribute("data-trip-total") || "0");
            var personVal = parseFloat(totEl.getAttribute("data-pp-total")   || "0");
            totEl.textContent = fmt(mode === "person" ? personVal : tripVal);
          }
        }

        btns.forEach(function (btn) {
          btn.addEventListener("click", function () { applyMode(btn.getAttribute("data-mode") || "total"); });
        });
      });

