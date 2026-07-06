/* Waypoint day scrubber — the itinerary's wayfinding rail (units.-style numbered
   color chips). Scroll-syncs the active day, jumps on click, and broadcasts
   `wp:day` CustomEvents that the planner map (itinerary-map.js) listens to for
   day-filtered pins/route. Uses the same rAF + scroll-listener pattern as the
   tab scroll-spy in guide-ui.js (proven robust; no IntersectionObserver). */

(function () {
  var scrub = document.getElementById("dayScrub");
  if (!scrub) return;
  var chips = Array.prototype.slice.call(scrub.querySelectorAll("[data-day-jump]"));
  var dayEls = Array.prototype.slice.call(document.querySelectorAll(".planner-days .day[data-day]"));
  if (!chips.length || !dayEls.length) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var chromeH = 110; // sticky chrome + scrubber allowance
  var active = -1;

  function setActive(idx, broadcast) {
    if (idx === active || idx < 0 || idx >= chips.length) return;
    active = idx;
    chips.forEach(function (c, i) {
      c.classList.toggle("dchip-active", i === idx);
      c.setAttribute("aria-current", i === idx ? "true" : "false");
    });
    // Keep the active chip visible inside the horizontal scrubber.
    var chip = chips[idx];
    if (chip && scrub.scrollWidth > scrub.clientWidth) {
      var target = chip.offsetLeft - (scrub.clientWidth - chip.offsetWidth) / 2;
      scrub.scrollTo({ left: Math.max(0, target), behavior: reduced ? "auto" : "smooth" });
    }
    if (broadcast) document.dispatchEvent(new CustomEvent("wp:day", { detail: { dayIdx: idx } }));
  }

  // Click → jump to the day card.
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var idx = parseInt(chip.getAttribute("data-day-jump"), 10);
      var el = dayEls[idx];
      if (!el) return;
      var y = el.getBoundingClientRect().top + window.scrollY - chromeH;
      window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
      setActive(idx, true);
    });
  });

  // Scroll-spy: the active day is the last one whose top has crossed the chrome line.
  var ticking = false;
  function spy() {
    var idx = 0;
    for (var i = 0; i < dayEls.length; i++) {
      if (dayEls[i].getBoundingClientRect().top - chromeH - 40 <= 0) idx = i;
      else break;
    }
    setActive(idx, true);
  }
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { spy(); ticking = false; });
  }, { passive: true });
  spy();
})();
