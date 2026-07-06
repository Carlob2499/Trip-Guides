/* Waypoint signature motion — the ONE orchestrated moment: the masthead
   arrival sequence (eyebrow → title → dek → stat tiles). GSAP is bundled
   locally (npm), lazy-imported, and skipped entirely under
   prefers-reduced-motion. hero-parallax.js owns the photo transform. */

(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var mast = document.querySelector(".mast-hero");
  if (!mast) return;

  import("gsap").then(function (m) {
    var gsap = m.gsap || m.default;
    var tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(".mast-eyebrow", { y: 22, autoAlpha: 0, duration: 0.6 }, 0.05)
      .from(".mast-title",   { y: 34, autoAlpha: 0, duration: 0.75 }, 0.16)
      .from(".mast-dek",     { y: 24, autoAlpha: 0, duration: 0.7 }, 0.3)
      .from(".mast-credit",  { autoAlpha: 0, duration: 0.8 }, 0.9)
      .from(".guide-stats .gstat, .wx-wrap, .whats-next", {
        y: 14, autoAlpha: 0, duration: 0.5, stagger: 0.06,
      }, 0.42);
  }).catch(function () { /* motion is decoration — the page never depends on it */ });
})();
