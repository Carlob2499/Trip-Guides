// Guide interactive UI — the ONE router for the five destinations, plus the small per-page
// behaviours that have no silo of their own (checklists, budget rows, jet lag, day state,
// the share panel, folds, the change-request link). Config comes from the #tgConfig JSON the
// layout emits. Each independent leaf runs in its own try so one failure cannot kill the rest.
import { todayInTz, trapFocus, migrateStorageKey, tapHaptic, readStoredRecord } from "./util.js";
import { initDarkToggle } from "./theme.js";
import { tripWindow, dayState } from "../lib/trip-dates";
import { initRate, initWeather, initDaySwap, initSun } from "../features/live-data/index.js";
import { initJetLag } from "./jetlag-ui.js";
import { initSharePanel } from "../features/share/index.js";
import { initChangeLink } from "../features/change-request/index.js";
import { reportError } from "../features/firebase/index.js";
import { initBudgetPact } from "../features/budget-pact/index.js";
import { initFolds } from "./fold.js";
import { initPacking } from "../features/trip/index";

const _cfgEl = document.getElementById("tgConfig");
const _cfg = _cfgEl ? JSON.parse(_cfgEl.textContent || "{}") : {};
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

/* --hdr-h is shared geometry, not a guessed compensation. The fallback token keeps the
   no-JS layout usable; the guide chrome writes its actual responsive height for workbench
   and sticky consumers once JavaScript is available. */
const _chrome = document.querySelector(".chrome");
if (_chrome) {
  const setHeaderHeight = () => document.documentElement.style.setProperty("--hdr-h", `${_chrome.offsetHeight}px`);
  setHeaderHeight();
  if ("ResizeObserver" in window) new ResizeObserver(setHeaderHeight).observe(_chrome);
}

function fail(name, err) {
  console.error("[guide-ui] " + name + " failed:", err);
  try { reportError({ guide: storeKey, feature: name, message: (err && err.message) || String(err) }); } catch (_) {}
}

/* ── SHARED: SCROLL LOCK (share modal, sheets) ─────────────────────────────────────────── */
var _lockCount = 0;
function _lockScroll()   { if (++_lockCount === 1) document.body.classList.add("sheet-lock"); }
function _unlockScroll() { if (--_lockCount <= 0) { _lockCount = 0; document.body.classList.remove("sheet-lock"); } }

/* ═══ THE ROUTER ══════════════════════════════════════════════════════════════════════════
   Five destinations, one switch. Every entry point — the bottom bar, the desktop row, a
   hash deep link, a `data-dest-go` button inside a destination, the search overlay — calls
   showDest(), so the remembered route, the nav state and the scroll memory all see one path.
   The destination model never changes (D6-01): keys and order are the layout's. */
var DEST_KEYS = ["trip", "itinerary", "map", "guide", "split"];
var destPanels = {};
DEST_KEYS.forEach(function (k) { var el = document.getElementById("dest-" + k); if (el) destPanels[k] = el; });
var STORE_KEY = "tripguide-" + storeKey;
var ROUTE_KEY = "tg-d7-dest-" + storeKey;
var currentDest = null;

function showDest(key, opts) {
  if (!destPanels[key]) return false;
  opts = opts || {};
  var changed = currentDest !== key;
  currentDest = key;
  Object.keys(destPanels).forEach(function (k) { destPanels[k].hidden = k !== key; });
  // Map embeds load when their destination is first shown, never for a region the reader
  // has not opened (offline and data honesty: no hidden frames failing behind the page).
  destPanels[key].querySelectorAll("iframe[data-src]").forEach(function (f) { f.src = f.getAttribute("data-src"); f.removeAttribute("data-src"); });
  document.querySelectorAll("[data-dest-nav]").forEach(function (btn) {
    if (btn.dataset.dest === key) btn.setAttribute("aria-current", "true");
    else btn.removeAttribute("aria-current");
  });
  document.body.setAttribute("data-dest", key);
  try { sessionStorage.setItem(ROUTE_KEY, key); } catch (_) {}
  if (changed) {
    try { document.dispatchEvent(new CustomEvent("tg:dest", { detail: { dest: key, reason: opts.reason || "nav" } })); } catch (_) {}
  }
  return true;
}
window.__tgShowDest = showDest;

/** Resolve a hash to the destination that contains it, then scroll the element itself. */
function goToHash(hash) {
  if (!hash || hash === "#") return false;
  var target;
  try { target = document.querySelector(hash); } catch (_) { return false; }
  if (!target) return false;
  var panel = target.closest(".dest");
  if (!panel) return false;
  showDest(panel.dataset.dest, { reason: "hash" });
  try { document.dispatchEvent(new CustomEvent("tg:reveal", { detail: { target: target } })); } catch (_) {}
  // Open the Guide chapter / Itinerary day that holds the target before scrolling to it.
  var chapter = target.closest("[data-chapter-panel]");
  if (chapter && chapter.hidden) {
    var go = document.querySelector('[data-chapter-go="' + chapter.dataset.chapterPanel + '"]');
    if (go) go.click();
  }
  var day = target.closest(".day[data-day]");
  if (day && day.hidden) {
    var jump = document.querySelector('[data-day-jump="' + day.dataset.day + '"]');
    if (jump) jump.click();
  }
  setTimeout(function () { target.scrollIntoView({ behavior: "auto", block: "start" }); }, 30);
  return true;
}

document.addEventListener("click", function (e) {
  var nav = e.target.closest && e.target.closest("[data-dest-nav]");
  if (nav) { showDest(nav.dataset.dest, { reason: "nav" }); return; }
  var go = e.target.closest && e.target.closest("[data-dest-go]");
  if (go) {
    var href = go.getAttribute("href");
    if (href && href.charAt(0) === "#" && href.length > 1) { e.preventDefault(); if (goToHash(href)) return; }
    e.preventDefault();
    showDest(go.dataset.destGo, { reason: "cta" });
    var content = document.getElementById("content");
    if (content) content.scrollIntoView({ behavior: "auto", block: "start" });
    return;
  }
  var anchor = e.target.closest && e.target.closest('a[href^="#"]');
  if (anchor && anchor.getAttribute("href").length > 1 && !anchor.hasAttribute("data-no-route")) {
    if (goToHash(anchor.getAttribute("href"))) e.preventDefault();
  }
});
window.addEventListener("hashchange", function () { goToHash(location.hash); });

// Keyboard: arrow keys move along the destination row/bar without leaving the group.
document.querySelectorAll(".destnav, .botbar").forEach(function (group) {
  group.addEventListener("keydown", function (e) {
    var btns = Array.prototype.slice.call(group.querySelectorAll("[data-dest-nav]"));
    var idx = btns.indexOf(document.activeElement);
    if (idx === -1) return;
    var next;
    if (e.key === "ArrowRight") next = (idx + 1) % btns.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + btns.length) % btns.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = btns.length - 1;
    if (next === undefined) return;
    e.preventDefault();
    btns[next].focus();
    btns[next].click();
  });
});

/* Launch: an explicit deep link wins; otherwise this session's remembered destination;
   otherwise Trip — lifecycle-aware, it is the right first screen at every phase (D6-02). */
(function launch() {
  if (goToHash(location.hash)) return;
  var saved = null;
  try { saved = sessionStorage.getItem(ROUTE_KEY); } catch (_) {}
  if (!(saved && showDest(saved, { reason: "restore" }))) showDest("trip", { reason: "launch" });
})();

(function () {
  try {
    var LEGACY_STORE_KEY = legacyStoreKey ? "tripguide-" + legacyStoreKey : null;
    migrateStorageKey(localStorage, STORE_KEY, LEGACY_STORE_KEY);
    migrateStorageKey(localStorage, STORE_KEY + "-budget", LEGACY_STORE_KEY ? LEGACY_STORE_KEY + "-budget" : null);

    /* ── DARK MODE TOGGLE ─────────────────────────────────────────────── */
    initDarkToggle("btnDark");

    /* ── SECTION DEEP LINKS (the # copy button on cards) ──────────────── */
    document.querySelectorAll(".anchor-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var sid = btn.getAttribute("data-sid");
        var url = window.location.href.split("#")[0] + "#" + sid;
        function marked() { btn.textContent = "✓"; setTimeout(function () { btn.textContent = "#"; }, 1800); }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(marked).catch(function () { window.prompt("Copy this link:", url); });
        } else { window.prompt("Copy this link:", url); }
      });
    });

    /* ── COPY KOREAN ADDRESS ──────────────────────────────────────────── */
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
        }, 1800);
      }
      btn.addEventListener("click", function () {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(addr).then(markCopied).catch(function () { window.prompt("Copy this address:", addr); });
        } else { window.prompt("Copy this address:", addr); }
      });
    });

    /* ── CHECKLISTS (per device) ──────────────────────────────────────── */
    var boxes = Array.prototype.slice.call(document.querySelectorAll("input[type=checkbox][data-pkey]"));
    function hashKey(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return "k" + h.toString(36); }
    function loadState() { try { return JSON.parse(localStorage.getItem(STORE_KEY) || "{}"); } catch (e) { return {}; } }
    function saveState(stateObj) { try { localStorage.setItem(STORE_KEY, JSON.stringify(stateObj)); flash("✓ saved"); } catch (e) { flash("Storage full"); } }
    function currentState() { var stateObj = {}; boxes.forEach(function (box) { if (box.checked) stateObj[box.dataset.pkey] = 1; }); return stateObj; }
    function flash(msg) {
      var note = document.getElementById("savedNote"); if (!note) return;
      note.textContent = msg;
      if (msg) { clearTimeout(note._t); note._t = setTimeout(function () { note.textContent = ""; }, 2200); }
    }
    function updateDayCounts() {
      document.querySelectorAll(".day").forEach(function (card) {
        var badge = card.querySelector(".day-kitcount");
        var kit = card.querySelector(".daykit");
        if (!badge || !kit) return;
        var cbs = kit.querySelectorAll("input[type=checkbox]");
        if (!cbs.length) return;
        var done = 0;
        cbs.forEach(function (box) { if (box.checked) done++; });
        badge.textContent = done + "/" + cbs.length;
        badge.hidden = false;
        badge.classList.toggle("done", done === cbs.length);
      });
    }
    var saved = loadState();
    boxes.forEach(function (box) { if (saved[box.dataset.pkey]) box.checked = true; });
    updateDayCounts();
    boxes.forEach(function (box) {
      box.addEventListener("change", function () { tapHaptic(); saveState(currentState()); updateDayCounts(); });
    });

    /* ── BUDGET CALCULATORS (the Guide's researched budget rows) ──────── */
    document.querySelectorAll(".budget").forEach(function (bud) {
      var BKEY = STORE_KEY + "-budget";
      var bstore = {};
      try { bstore = JSON.parse(localStorage.getItem(BKEY) || "{}"); } catch (e) { bstore = {}; }
      var cur = bud.getAttribute("data-cur") || "$";
      var inputs = Array.prototype.slice.call(bud.querySelectorAll(".bactual"));
      inputs.forEach(function (inp, i) {
        var row = inp.closest(".brow");
        var dataKey = row && row.getAttribute("data-key");
        var key = hashKey(dataKey || ("row-" + i));
        inp.dataset.pkey = key;
        if (bstore[key] != null) inp.value = bstore[key];
      });
      function fmt(num) { return cur + (Math.round(num * 100) / 100).toLocaleString("en-US"); }
      function recalcB() {
        var sum = 0, catSums = {};
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
        bud.querySelectorAll(".bsubtotal").forEach(function (row) {
          var cat = row.getAttribute("data-sub-cat") || "";
          var el = row.querySelector(".bsub-act");
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

  try { initJetLag(); } catch (e) { fail("jet-lag", e); }

  /* The jet-lag calculator is an ARRIVAL tool: hidden once the trip has ended. */
  try {
    var jlWrap = document.querySelector(".jl-wrap");
    if (jlWrap && tripWindow(firstDayDate, lastDayDate, new Date()).isPast) jlWrap.hidden = true;
  } catch (e) { fail("jet-lag window", e); }

  try {
    initRate({ curCode: curCode, curFallbackRate: curFallbackRate });
    initDaySwap({ daysForBanner: daysForBanner });
    initWeather({ mapCenter: mapCenter, hasWeatherSection: hasWeatherSection, firstDayDate: firstDayDate, lastDayDate: lastDayDate });
    initSun({ mapCenter: mapCenter, destTzIana: destTzIana });
    initBudgetPact({ firstDayDate: firstDayDate, lastDayDate: lastDayDate });
    initPacking({ mapCenter: mapCenter, firstDayDate: firstDayDate, lastDayDate: lastDayDate });
  } catch (e) { fail("live-data", e); }
})();

try { initSharePanel(_lockScroll, _unlockScroll); } catch (e) { fail("share panel", e); }
try { initFolds(document); } catch (e) { fail("folds", e); }

/* ── DAY STATE — done / now / next / planned, against the reader's clock ───────────────── */
try {
  var dayEls = Array.prototype.slice.call(document.querySelectorAll(".day[data-date]"));
  if (dayEls.length) {
    var dates = dayEls.map(function (el) { return el.getAttribute("data-date"); });
    var _dt = todayInTz(destTzIana);
    var nowClock = _dt ? new Date(_dt.y, _dt.m - 1, _dt.d, 12) : new Date();
    dayEls.forEach(function (el, i) {
      var state = dayState(dates, i, nowClock);
      var chip = el.querySelector("[data-day-state]");
      if (state) { el.setAttribute("data-state", state); if (state === "now") el.classList.add("day-today"); }
      if (!chip) return;
      if (!state) { chip.hidden = true; return; }
      chip.textContent = state;
      chip.setAttribute("data-state", state);
      chip.hidden = false;
    });
    document.querySelectorAll("[data-day-jump]").forEach(function (chip) {
      var i = parseInt(chip.getAttribute("data-day-jump"), 10);
      var state = dayState(dates, i, nowClock);
      if (state) chip.setAttribute("data-state", state);
    });
  }
} catch (e) { fail("day state", e); }

try { initChangeLink(_cfg); } catch (e) { fail("change request", e); }

try {
  document.querySelectorAll("[data-print-sheet]").forEach(function (btn) {
    btn.addEventListener("click", function () { window.print(); });
  });
} catch (e) { fail("print sheet", e); }

/* ── BUDGET PER-PERSON TOGGLE ──────────────────────────────────────────────────────────── */
document.querySelectorAll(".budget-toggle").forEach(function (tog) {
  var bud = tog.closest(".budget");
  if (!bud) return;
  var btns = tog.querySelectorAll(".btog-btn");
  var cur = bud.getAttribute("data-cur") || "$";
  function fmt(num) { return cur + Math.round(num).toLocaleString("en-US"); }
  function applyMode(mode) {
    btns.forEach(function (btn) { btn.classList.toggle("btog-active", btn.getAttribute("data-mode") === mode); });
    bud.querySelectorAll(".brow[data-key]").forEach(function (row) {
      var valEl = row.querySelector(".best-val");
      var ranEl = row.querySelector(".brange");
      if (!valEl) return;
      var tv = parseFloat(row.getAttribute("data-trip") || "0");
      var pv = parseFloat(row.getAttribute("data-person") || "0");
      var tl = row.getAttribute("data-trip-lo"), th = row.getAttribute("data-trip-hi");
      var pl = row.getAttribute("data-pp-lo"), ph = row.getAttribute("data-pp-hi");
      valEl.textContent = fmt(mode === "person" ? pv : tv);
      if (ranEl) {
        var lo = mode === "person" ? pl : tl, hi = mode === "person" ? ph : th;
        if (lo !== "" && hi !== "" && lo !== null && hi !== null) {
          ranEl.textContent = cur + Math.round(parseFloat(lo)).toLocaleString("en-US") + "–" + cur + Math.round(parseFloat(hi)).toLocaleString("en-US");
        }
      }
    });
    bud.querySelectorAll(".bsubtotal").forEach(function (row) {
      var el = row.querySelector(".bsub-est");
      if (!el) return;
      el.textContent = fmt(mode === "person" ? parseFloat(row.getAttribute("data-sub-person") || "0") : parseFloat(row.getAttribute("data-sub-trip") || "0"));
    });
    var totEl = bud.querySelector(".best-total");
    if (totEl) totEl.textContent = fmt(mode === "person" ? parseFloat(totEl.getAttribute("data-pp-total") || "0") : parseFloat(totEl.getAttribute("data-trip-total") || "0"));
  }
  btns.forEach(function (btn) { btn.addEventListener("click", function () { applyMode(btn.getAttribute("data-mode") || "total"); }); });
});

/* ── GUIDE CHAPTERS — one visible level at a time (D6-11), last chapter remembered per device */
try {
  var gd = document.querySelector("[data-guide-dest]");
  if (gd) {
    var CH_KEY = "tg-d7-chapter-" + storeKey;
    var panels = Array.prototype.slice.call(gd.querySelectorAll("[data-chapter-panel]"));
    function showChapter(key, scroll) {
      var found = false;
      panels.forEach(function (p) { var on = p.dataset.chapterPanel === key; p.hidden = !on; if (on) found = true; });
      if (!found) { panels.forEach(function (p) { p.hidden = p.dataset.chapterPanel !== "overview"; }); key = "overview"; }
      gd.setAttribute("data-chapter", key);
      gd.querySelectorAll("[data-chapter-go]").forEach(function (b) {
        if (b.classList.contains("gd-index-btn")) {
          if (b.dataset.chapterGo === key) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
        }
      });
      try { localStorage.setItem(CH_KEY, key); } catch (_) {}
      if (scroll) {
        var top = key === "overview" ? gd.querySelector(".gd-overview") : gd.querySelector('[data-chapter-panel="' + key + '"]');
        if (top) top.scrollIntoView({ behavior: "auto", block: "start" });
      }
    }
    gd.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-chapter-go]");
      if (!b) return;
      showChapter(b.dataset.chapterGo, true);
      var head = gd.querySelector('[data-chapter-panel="' + b.dataset.chapterGo + '"] .gd-chapter-title');
      if (head) { head.setAttribute("tabindex", "-1"); head.focus({ preventScroll: true }); }
    });
    // Guide opens on the overview (D6-11). A remembered chapter is offered on return within
    // an active trip only — the overview stays the canonical default otherwise.
    var remembered = null;
    try { remembered = localStorage.getItem(CH_KEY); } catch (_) {}
    var win = tripWindow(firstDayDate, lastDayDate, new Date());
    showChapter(win.isOngoing && remembered ? remembered : "overview", false);
  }
} catch (e) { fail("guide chapters", e); }

export { showDest, goToHash, trapFocus, readStoredRecord, _lockScroll, _unlockScroll };
