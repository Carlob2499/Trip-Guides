/* Waypoint TITLE-CARD story intro — the guide opens as a full-bleed title card
   (cover + country name, day-segment rail, an accent gloss sweep, optional seasonal
   particle motif), holds a beat, then PANS up into the guide as the chrome returns.
   (docs/MOTION.md — the signature arrival; creator's spec 2026-07-30.)

   - The PRE-PAINT half lives in GuideLayout.astro's inline script: it sets
     body.story-full (the static full-bleed state) and window.__storyIntro before
     first paint, so the hub→guide cover morph lands INTO the title card and there
     is no flash of the normal hero. This module owns timing, pan, and cleanup.
   - Plays FULL once per guide per SESSION (sessionStorage `tg-story-s-<storeKey>`);
     re-entries that session get the normal fast arrival (inline script no-ops, this
     module returns on the missing class). Replaces the old once-ever localStorage
     rule (`tg-story-<slug>`, retired 2026-07-30 — stale keys are simply ignored).
   - Skippable after a short grace (wheel / touch / tap / key) — a skip jumps to the
     PAN, never a hard cut, so the exit always reads as intentional.
   - Disabled under prefers-reduced-motion (inline script AND this module check).
   - Fault-safe: everything lives under body classes this module always removes, and
     the inline script self-releases story-full after 9s if this module never runs. */

import { reducedMotion } from "./util.js";

(function () {
  var body = document.body;
  if (!body.classList.contains("story-full")) return; // fast path: normal arrival
  var mast = document.querySelector(".masthead.mast-photo");
  if (reducedMotion() || !mast) { body.classList.remove("story-full"); return; }

  var KEY = "tg-story-s-" + (body.getAttribute("data-storekey") || "guide");

  var rail = mast.querySelector(".mast-story-rail");
  var segs = rail ? rail.children.length : 0;
  // Pace the day-segments to a ~2.4s hold, clamped so a 3-day trip isn't glacial
  // and a 14-day one isn't a blur. No rail (no days) → a short text-only hold.
  var TOTAL = 2400;
  var segDur = segs ? Math.max(170, Math.min(430, Math.round(TOTAL / segs))) : 0;
  var HOLD = segs ? segDur * segs : 1500;
  if (rail && segDur) rail.style.setProperty("--seg-dur", segDur + "ms");

  var done = false, panned = false;

  // Optional seasonal particle motif (schema-gated canvas — japan's koyo leaves).
  // Lazy import: guides without a motif never load the engine.
  var petals = mast.querySelector(".mast-petals");
  var stopPetals = null;
  if (petals) {
    import("./story-petals.js")
      .then(function (m) { if (!done) stopPetals = m.start(petals); })
      .catch(function () { /* particles are garnish, never load-bearing */ });
  }

  function pan() {
    if (panned || done) return; panned = true;
    body.classList.add("story-pan");     // arms the transition rules (story.css)
    body.classList.remove("story-full"); // masthead collapses to hero; chrome returns
    setTimeout(finish, 950);             // pan duration (.8s) + a beat
  }
  function finish() {
    if (done) return; done = true;
    body.classList.remove("story-playing", "story-pan", "story-full");
    body.classList.add("story-done");
    // Pin the arrival to the top: scroll anchoring (and any stray restore) must not
    // turn the pan's masthead collapse into a mid-scroll landing.
    window.scrollTo(0, 0);
    if (stopPetals) stopPetals();
    try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
    window.removeEventListener("wheel", pan, true);
    window.removeEventListener("touchmove", pan, true);
    window.removeEventListener("pointerdown", pan, true);
    window.removeEventListener("keydown", pan, true);
  }

  body.classList.add("story-playing");
  setTimeout(pan, HOLD + 320); // hold the card, then pan into the guide
  // Skip → jump to the pan. Short grace so a stray pointer doesn't insta-dismiss.
  setTimeout(function () {
    if (done || panned) return;
    window.addEventListener("wheel", pan, { passive: true, capture: true });
    window.addEventListener("touchmove", pan, { passive: true, capture: true });
    window.addEventListener("pointerdown", pan, true);
    window.addEventListener("keydown", pan, true);
  }, 550);
})();
