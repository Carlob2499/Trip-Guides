/* Waypoint scroll memory — each destination remembers where you were (D6-03/43).
   · While reading, the shown destination's scroll position is saved (throttled) per
     guide + destination in localStorage — it survives app reopens mid-trip.
   · On a destination change the page lands on that destination's SAVED position, or at
     the top of the content for one never visited; a hash deep link's own targeted scroll
     (guide-ui.js goToHash) wins over this landing by design.
   · A FRESH navigation (Atlas click, external link) always opens at the top — reload and
     back/forward restore the spot. */

import { reducedMotion, migrateStorageKey, readStoredRecord } from "./util.js";

(function () {
  var content = document.getElementById("content");
  if (!content || !document.querySelector("[data-dest-nav]")) return;

  var storeKey = document.body.getAttribute("data-storekey") || "guide";
  var legacyStoreKey = document.body.getAttribute("data-legacy-storekey") || null;
  var KEY = "tg-d7-scrollmem-" + storeKey;
  try { migrateStorageKey(localStorage, KEY, legacyStoreKey ? "tg-d7-scrollmem-" + legacyStoreKey : null); }
  catch (e) { /* storage unavailable */ }
  var reduced = reducedMotion();

  function load() {
    var stored = readStoredRecord(function () { return localStorage; }, KEY);
    var mem = Object.create(null);
    Object.keys(stored).forEach(function (k) {
      if (typeof stored[k] === "number" && Number.isFinite(stored[k])) mem[k] = stored[k];
    });
    return mem;
  }
  function save(mem) { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) {} }
  function current() { return document.body.getAttribute("data-dest"); }
  function contentTop() {
    var chrome = document.getElementById("chrome");
    var h = chrome ? chrome.getBoundingClientRect().height : 60;
    return content.getBoundingClientRect().top + window.scrollY - h - 8;
  }

  var muteUntil = 0, ticking = false;

  (function restoreOnLoad() {
    var nav = (performance.getEntriesByType && performance.getEntriesByType("navigation")[0]) || null;
    if ((nav && nav.type === "navigate") || location.hash) return;
    var t = current();
    if (!t) return;
    var y = load()[t];
    if (y == null) return;
    var target = Math.max(y, contentTop());
    if (Math.abs(window.scrollY - target) < 4) return;
    muteUntil = Date.now() + 900;
    requestAnimationFrame(function () { window.scrollTo(0, target); });
  })();

  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      if (Date.now() < muteUntil) return;
      var t = current();
      if (!t) return;
      var mem = load();
      mem[t] = Math.round(window.scrollY);
      save(mem);
    });
  }, { passive: true });

  // Land on the switched-to destination: its saved spot, or the content top. A hash
  // reveal (reason "hash") scrolls to its own target and is left alone.
  document.addEventListener("tg:dest", function (e) {
    if (e.detail && e.detail.reason === "hash") return;
    var t = e.detail && e.detail.dest;
    if (!t) return;
    var mem = load();
    var ct = contentTop();
    var target = (mem[t] != null && mem[t] > ct) ? mem[t] : ct;
    if (Math.abs(window.scrollY - target) < 4) return;
    muteUntil = Date.now() + 900;
    window.scrollTo({ top: target, behavior: reduced ? "auto" : "smooth" });
  });
})();
