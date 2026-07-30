/* Yielding chrome — the page gives its edges back to the content while you read.

   Scrolling DOWN past a short grace drops the bottom bar off-screen and condenses the
   top bar to a slim strip; scrolling UP, or simply stopping, brings both back. Reading
   is the one thing a guide is for, and on a 667px phone the two bars are a fifth of it.

   The strip is not empty chrome: it trades the wordmark (which says nothing you don't
   know) for the two facts that go out of reach as you scroll — which group you are in,
   and what time it is where you're going. The topbar's buttons never leave; SOS and
   search have to be reachable at every scroll position.

   It stands down entirely while a sheet, the story intro, Focus Today or the command
   palette is open — an overlay owns the screen, and chrome sliding underneath it reads
   as a glitch. */

import { nextYield, initialYield } from "../model/yield";

var RETURN_MS = 600; // a pause this long counts as "done scrolling — give it back"

export function initYieldChrome(ctx) {
  var body = document.body;
  var bar = ctx.bar;
  var chrome = document.querySelector(".sticky-chrome");
  if (!chrome) return;

  // The context line — created here rather than in the layout because it only ever
  // exists in this state, and an empty element in the markup is one more thing to
  // keep in sync with a feature that may be removed.
  var ctxEl = document.createElement("span");
  ctxEl.className = "topbar-ctx";
  ctxEl.setAttribute("aria-hidden", "true"); // #curCat already names the group to AT
  var grpEl = document.createElement("b");
  ctxEl.appendChild(grpEl);
  var timeEl = document.createElement("span");
  timeEl.className = "topbar-ctx-time";
  ctxEl.appendChild(timeEl);
  var home = chrome.querySelector(".topbar-home");
  if (home) home.insertAdjacentElement("afterend", ctxEl);

  var fmt = null;
  if (ctx.destTz) {
    try {
      fmt = new Intl.DateTimeFormat("en-GB", { timeZone: ctx.destTz, hour: "2-digit", minute: "2-digit", hour12: false });
      fmt.format(new Date()); // probe: an invalid zone throws here, not on every tick
    } catch (e) { fmt = null; }
  }
  function paintCtx() {
    var cur = document.getElementById("curCat");
    grpEl.textContent = cur ? (cur.textContent || "") : "";
    if (fmt) timeEl.textContent = fmt.format(new Date());
  }

  function blocked() {
    return body.classList.contains("sheet-lock") ||
      body.classList.contains("story-full") ||
      body.classList.contains("story-playing") ||
      body.classList.contains("story-pan") ||
      !!document.querySelector(".pal-backdrop.pal-open") ||
      !!document.querySelector(".focus-today:not([hidden])") ||
      !!document.querySelector(".sos-sheet.open");
  }

  var lastY = window.scrollY, state = initialYield(), idle = 0, ticking = false;

  /** Push the model's verdict onto the page. */
  function apply() {
    if (body.classList.contains("chrome-yield") === state.yielded) return;
    body.classList.toggle("chrome-yield", state.yielded);
    if (state.yielded) paintCtx();
    // Nothing here removes the bar from the accessibility tree: it is navigation, and a
    // hidden-but-focusable control is a trap. It stays reachable, and focusing it (below)
    // brings it back into view.
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
      // Stopping is intent too — a reader who has settled wants their controls back.
      idle = setTimeout(restore, RETURN_MS);
      state = nextYield(state, dy, y, blocked());
      apply();
      if (state.yielded) paintCtx();
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  // Focus must never land on something that has slid off the screen.
  document.addEventListener("focusin", function (e) {
    if (state.yielded && (chrome.contains(e.target) || (bar && bar.contains(e.target)))) restore();
  });
}
