/* Waypoint GSAP signature motion — the masthead arrival sequence and the
   chapter-opener numerals, orchestrated on one timeline instead of scattered
   CSS keyframes (which this module replaces — masthead.css no longer animates
   these elements, so there is exactly one animation owner).
   GSAP is bundled locally (npm), lazy-imported, and skipped entirely under
   prefers-reduced-motion. hero-parallax.js still owns the photo transform. */

(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var mast = document.querySelector(".mast-hero");
  if (!mast) return;

  import("gsap").then(function (m) {
    var gsap = m.gsap || m.default;

    /* Arrival: eyebrow → title → dek rise on an overlapping timeline; the
       credit chip fades last. */
    var tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(".mast-eyebrow", { y: 22, autoAlpha: 0, duration: 0.6 }, 0.05)
      .from(".mast-title",   { y: 34, autoAlpha: 0, duration: 0.75 }, 0.16)
      .from(".mast-dek",     { y: 24, autoAlpha: 0, duration: 0.7 }, 0.3)
      .from(".mast-credit",  { autoAlpha: 0, duration: 0.8 }, 0.9)
      .from(".guide-stats .gstat, .wx-wrap, .whats-next", {
        y: 14, autoAlpha: 0, duration: 0.5, stagger: 0.06,
      }, 0.42);

    /* Chapter openers: on every section reveal, sweep the bearing numeral in
       with a blur→sharp settle and rise the title (replaces the CSS restart
       trick for these two elements — flight.css still banks the panel). */
    var tabs = document.getElementById("guideTabs");
    function openerIn() {
      var opener = document.querySelector(".catblock:not([hidden]) .cat-opener");
      if (!opener) return;
      var num = opener.querySelector(".cat-num");
      var title = opener.querySelector(".cat-title");
      var back = document.documentElement.getAttribute("data-flight") === "back";
      if (num) gsap.fromTo(num,
        { x: back ? -64 : 64, autoAlpha: 0, filter: "blur(7px)" },
        { x: 0, autoAlpha: 1, filter: "blur(0px)", duration: 0.6, ease: "power3.out" });
      if (title) gsap.fromTo(title,
        { yPercent: 115 }, { yPercent: 0, duration: 0.55, ease: "power3.out", delay: 0.06 });
    }
    if (tabs) tabs.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest(".gtab")) setTimeout(openerIn, 30);
    });
  }).catch(function () { /* motion is decoration — the page never depends on it */ });
})();
