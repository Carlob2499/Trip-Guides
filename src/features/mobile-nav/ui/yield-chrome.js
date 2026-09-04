/* Yielding chrome — the page gives its edges back to the content while you read (D6-43).

   Two states, one model (../model/yield):
     · `chrome-scrolled`  the expanded Search field folds into the compact control as soon as
                          the reader is past the top of the page — cheap vertical space back,
                          Search still one tap away in the topbar.
     · `chrome-yield`     the bottom bar slides off while the reader is actively scrolling
                          DOWN; scrolling up, stopping, or focusing anything in the chrome
                          brings it back immediately. Never gesture-only: the bar returns on
                          its own the moment the finger lifts.

   It stands down entirely while a sheet, the search overlay or another modal owns the
   screen — chrome sliding under an overlay reads as a glitch. */

import { nextYield, initialYield, TOP_ZONE } from "../model/yield";

var RETURN_MS = 600; // a pause this long counts as "done scrolling — give it back"

export function initYieldChrome(ctx) {
  var body = document.body;
  var bar = ctx && ctx.bar;

  function blocked() {
    return body.classList.contains("sheet-lock") ||
      body.classList.contains("srch-lock") ||
      !!document.querySelector(".sos-sheet:not([hidden])") ||
      !!document.querySelector(".lnw-modal:not([hidden])");
  }

  var lastY = window.scrollY, state = initialYield(), idle = 0, ticking = false;

  function apply() {
    if (body.classList.contains("chrome-yield") !== state.yielded) body.classList.toggle("chrome-yield", state.yielded);
  }
  function applyScrolled(y) {
    var scrolled = y > TOP_ZONE / 2;
    if (body.classList.contains("chrome-scrolled") !== scrolled) body.classList.toggle("chrome-scrolled", scrolled);
  }
  function restore() { state = initialYield(); apply(); }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.scrollY;
      var dy = y - lastY;
      lastY = y;
      clearTimeout(idle);
      idle = setTimeout(restore, RETURN_MS);
      state = nextYield(state, dy, y, blocked());
      apply();
      applyScrolled(y);
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  applyScrolled(window.scrollY);
  // A destination change resets the page to its top state: the chrome comes back whole.
  document.addEventListener("tg:dest", function () { restore(); applyScrolled(window.scrollY); });
  document.addEventListener("focusin", function (e) {
    var chrome = document.getElementById("chrome");
    if (state.yielded && ((chrome && chrome.contains(e.target)) || (bar && bar.contains(e.target)))) restore();
    if (chrome && chrome.contains(e.target) && e.target.matches("[data-search-field]")) body.classList.remove("chrome-scrolled");
  });
}
