/* Waypoint reveal-on-scroll — one .reveal class, opacity/transform only.
   Progressive enhancement with a hard safety rail: content is NEVER left
   hidden. The pending class is added by JS (not markup), reduced-motion
   short-circuits at the top, and a timeout un-hides everything if the
   IntersectionObserver never delivers (wedged/backgrounded tabs). */

(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!("IntersectionObserver" in window)) return;

  var targets = Array.prototype.slice.call(
    document.querySelectorAll(".catblock .card, .catblock .day, .hubcard")
  );
  if (!targets.length) return;

  function show(el) {
    el.classList.add("reveal-in");
    el.classList.remove("reveal-pending");
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { io.unobserve(e.target); show(e.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px" });

  targets.forEach(function (el) {
    // Only hide what's below the fold at setup time — above-the-fold content
    // must never flash out.
    if (el.getBoundingClientRect().top > innerHeight) {
      el.classList.add("reveal-pending");
      io.observe(el);
    }
  });

  // Safety rail: whatever the observer hasn't revealed after 4s is shown.
  setTimeout(function () {
    document.querySelectorAll(".reveal-pending").forEach(show);
    io.disconnect();
  }, 4000);
})();
