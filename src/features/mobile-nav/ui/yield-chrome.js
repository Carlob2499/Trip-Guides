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
  /* Hysteresis, not a single threshold. Folding the Search field shortens the sticky chrome
     by ~57px, which moves the page under the reader; a single threshold near that height
     re-crossed itself on the next scroll event and the field flickered open and shut (found
     by the 320px gate: a chapter card that never stopped moving). It folds once the reader is
     clearly past the top and unfolds only when they are back at the very top. */
  var FOLD_AT = TOP_ZONE / 2, UNFOLD_AT = Math.min(8, TOP_ZONE / 8);
  function applyScrolled(y) {
    var folded = body.classList.contains("chrome-scrolled");
    var next = folded ? y > UNFOLD_AT : y > FOLD_AT;
    if (next !== folded) body.classList.toggle("chrome-scrolled", next);
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
