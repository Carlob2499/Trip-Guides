/* Waypoint scroll memory — each section remembers where you were.
   Replaces the old jump-to-page-top on tab change (which re-showed the hero
   and lost the reader's place on every switch). Behavior:
   · While reading, the active section's scroll position is saved (throttled)
     per guide+tab in localStorage — it survives app reopens mid-trip.
   · On a section change, scroll goes to that section's SAVED position; a
     never-visited section starts at the top of the content area (just under
     the sticky chrome), and if the reader is still up in the hero nothing
     moves at all.
   · The command palette's own element-targeted scroll (60ms later) wins over
     this module's landing scroll by design — a specific target beats a
     remembered position. */

import { reducedMotion } from "./util.js";

(function () {
  var tabs = document.getElementById("guideTabs");
  var content = document.getElementById("content");
  if (!tabs || !content) return;

  var storeKey = document.body.getAttribute("data-storekey") || "guide";
  var KEY = "tg-scrollmem-" + storeKey;
  var reduced = reducedMotion();

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function save(mem) {
    try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) {}
  }
  function activeTab() {
    var a = tabs.querySelector(".gtab-active");
    return a ? a.getAttribute("data-tab") : null;
  }
  function contentTop() {
    var chrome = document.querySelector(".sticky-chrome");
    var h = chrome ? chrome.getBoundingClientRect().height : 90;
    return content.getBoundingClientRect().top + window.scrollY - h - 8;
  }

  // Save the reader's place while they read (throttled; skip the first beat
  // right after a programmatic landing so we don't record our own scroll).
  var muteUntil = 0, ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      if (Date.now() < muteUntil) return;
      var t = activeTab();
      if (t == null) return;
      var mem = load();
      mem[t] = Math.round(window.scrollY);
      save(mem);
    });
  }, { passive: true });

  // Land on the switched-to section: saved spot, or the content top.
  tabs.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest(".gtab");
    if (!btn) return;
    var t = btn.getAttribute("data-tab");
    var mem = load();
    var ct = contentTop();
    var target = (mem[t] != null && mem[t] > ct) ? mem[t] : ct;
    // Always land on the switched-to section so the change is unmistakable —
    // including from the hero. (The old "if you're up in the hero, don't move"
    // behavior left the page on the same masthead for every tab, so testers
    // couldn't tell the tab had switched at all.)
    if (Math.abs(window.scrollY - target) < 4) return; // already there
    muteUntil = Date.now() + 900;
    window.scrollTo({ top: target, behavior: reduced ? "auto" : "smooth" });
  });
})();
