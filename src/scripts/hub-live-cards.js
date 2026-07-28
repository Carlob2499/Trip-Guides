// R5 hub hover previews (deferred from R4, docs/PLAN_VISUAL_REDESIGN.md) — a hub card
// whose guide carries a living cover (`cover.video`) previews it on hover. Desktop-only
// by capability, not by width: requires a real hover + fine pointer, and every R4 gate
// applies (reduced-motion, Save-Data). The photo is always the complete resting state —
// footage fades in only while the pointer dwells, and any error retires the preview for
// the session. Nothing downloads until the first hover (preload="none" + src-on-hover).
import { reducedMotion } from "./util.js";

(function () {
  if (reducedMotion()) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (navigator.connection && navigator.connection.saveData) return;

  var covers = Array.prototype.slice.call(document.querySelectorAll("[data-live-cover]"));
  covers.forEach(function (cover) {
    var video = null;
    var dead = false;

    cover.addEventListener("mouseenter", function () {
      if (dead) return;
      if (!video) {
        video = document.createElement("video");
        video.className = "hubcard-video";
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.setAttribute("aria-hidden", "true");
        video.addEventListener("playing", function () { cover.classList.add("is-live"); });
        video.addEventListener("error", function () {
          dead = true;
          cover.classList.remove("is-live");
          video.remove();
          video = null;
        });
        // Before the gradient/scrim overlay, so the surface's text treatment stays on
        // top (grid card and featured hero alike — both carry data-live-cover).
        var overlay = cover.querySelector(".hubcard-cover-grad, .hub-hero-scrim");
        cover.insertBefore(video, overlay || null);
        video.src = cover.dataset.liveCover;
      }
      var p = video.play();
      if (p && p.catch) p.catch(function () { /* refused → photo stands */ });
    });

    cover.addEventListener("mouseleave", function () {
      if (!video) return;
      video.pause();
      cover.classList.remove("is-live");
    });
  });
})();
