/* Waypoint first-open STORY intro — a one-time, per-guide "story opening" of the
   cover masthead. A segmented progress rail whose segments are the trip's DAYS
   ticks across the top while the cover text reveals; then it settles into the guide.
   (docs/VISUAL_COVERS.md — the signature browsing motion.)

   - Plays ONCE per guide (localStorage `tg-story-<slug>`); repeat visits get the
     normal masthead arrival instead.
   - Skippable on the first real interaction (scroll / tap / key).
   - Disabled entirely under prefers-reduced-motion.
   - On the first visit it OWNS the arrival, so it tells gsap-hero.js to stand down
     (window.__storyIntro) — no double animation.
   - Fault-safe: the reveal lives only under body.story-playing, a class this always
     adds and removes; content is never left hidden. */

import { reducedMotion } from "./util.js";

(function () {
  if (reducedMotion()) return;
  var mast = document.querySelector(".masthead.mast-photo");
  if (!mast) return; // typographic scaffolds (no cover photo) get no story

  var slug = location.pathname.split("/").filter(Boolean).pop() || "guide";
  var KEY = "tg-story-" + slug;
  try { if (localStorage.getItem(KEY)) return; } catch (e) { /* private mode → just play */ }

  // First visit: own the arrival so gsap-hero.js stands down (set synchronously,
  // before gsap-hero's module runs — story-open is imported first).
  window.__storyIntro = true;

  var body = document.body;
  var rail = mast.querySelector(".mast-story-rail");
  var segs = rail ? rail.children.length : 0;

  // Pace the day-segments to a ~2.4s total, clamped so a 3-day trip isn't glacial
  // and a 14-day one isn't a blur. No rail (no days) → a short text-only reveal.
  var TOTAL = 2400;
  var segDur = segs ? Math.max(170, Math.min(430, Math.round(TOTAL / segs))) : 0;
  var DUR = segs ? segDur * segs : 1500;
  if (rail && segDur) rail.style.setProperty("--seg-dur", segDur + "ms");

  var done = false;
  function finish() {
    if (done) return; done = true;
    body.classList.remove("story-playing");
    body.classList.add("story-done");
    try { localStorage.setItem(KEY, "1"); } catch (e) {}
    window.removeEventListener("scroll", finish, true);
    window.removeEventListener("pointerdown", finish, true);
    window.removeEventListener("keydown", finish, true);
  }

  body.classList.add("story-playing");
  // End when the last segment completes (+ a beat).
  setTimeout(finish, DUR + 260);
  // Let the reader skip — but only after a short grace, so a restored scroll
  // position (scroll-memory.js) or a stray pointer doesn't insta-dismiss it.
  setTimeout(function () {
    if (done) return;
    window.addEventListener("scroll", finish, { passive: true, capture: true });
    window.addEventListener("pointerdown", finish, true);
    window.addEventListener("keydown", finish, true);
  }, 550);
})();
