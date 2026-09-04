/* Destination arrival — the one owner of "you just flew here" motion (design-system.md §12,
   §18; motion.md §1 "First-entry arrival", "Scene transition", §11).

   Three entry kinds, decided once per page load and stamped on <body data-arrival>:
     first   the first time this browser session opens this destination: hero media settles,
             identity type rises, then the interface assembles around it — under 1.2s in
             total, and nothing waits on it (transforms/opacity only, pointer events live).
     repeat  a shorter scene reveal (one lift) that keeps the identity moment.
     none    prefers-reduced-motion, or a hash deep link into a specific place — the reader
             asked for a spot, not a ceremony.
   Every later destination switch gets the routine scene lift (data-scene), never the arrival.
   The keyframes live in styles/transitions.css so a reduced-motion query can silence them
   without JS; this file only decides and stamps. */

import { reducedMotion } from "./util.js";

(function () {
  var body = document.body;
  var slug = body.getAttribute("data-storekey") || "guide";
  var KEY = "tg-arrived-" + slug;
  var kind = "first";
  if (reducedMotion() || (location.hash && location.hash.length > 1)) kind = "none";
  else {
    try { if (sessionStorage.getItem(KEY)) kind = "repeat"; } catch (_) { /* private mode: every visit is a first visit */ }
  }
  try { sessionStorage.setItem(KEY, "1"); } catch (_) { /* ignore */ }
  body.setAttribute("data-arrival", kind);
  // The stamp is a one-shot: once the choreography has played the page is an ordinary page,
  // so a later destination switch cannot replay the arrival.
  var total = kind === "first" ? 1400 : kind === "repeat" ? 700 : 0;
  setTimeout(function () { body.removeAttribute("data-arrival"); }, total);

  // Destination switches: a routine scene lift on the incoming region (motion.md §1).
  document.addEventListener("tg:dest", function (e) {
    if (reducedMotion() || !e.detail || e.detail.reason === "hash") return;
    var panel = document.getElementById("dest-" + e.detail.dest);
    if (!panel) return;
    panel.removeAttribute("data-scene");
    void panel.offsetWidth; // restart the animation for the same region
    panel.setAttribute("data-scene", "in");
    setTimeout(function () { panel.removeAttribute("data-scene"); }, 700);
  });
})();
