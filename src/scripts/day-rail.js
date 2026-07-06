/* Waypoint day scrubber — the itinerary's wayfinding rail, synced to whichever
   layout is live (planner.css):
     · phone   → a horizontal snap DECK (the .planner-days track scrolls x);
     · tablet  → vertical page-snap; desktop → a vertical list.
   A tapped chip pages/scrolls to that day; scrolling the deck/page updates the
   active chip. The chips stay the accessible, keyboard-first navigator. Uses a
   rAF + scroll-listener (proven robust; no IntersectionObserver). */

(function () {
  var scrub = document.getElementById("dayScrub");
  if (!scrub) return;
  var chips  = Array.prototype.slice.call(scrub.querySelectorAll("[data-day-jump]"));
  var track  = document.querySelector(".planner-days");
  var dayEls = Array.prototype.slice.call(document.querySelectorAll(".planner-days .day[data-day]"));
  if (!chips.length || !dayEls.length || !track) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var chromeH = 110; // sticky chrome + scrubber allowance (vertical modes)
  var active = -1;

  // Horizontal deck iff the track itself scrolls sideways (phone layout).
  function horizontal() {
    return track.scrollWidth > track.clientWidth + 4 &&
           getComputedStyle(track).overflowX !== "visible";
  }

  function setActive(idx) {
    if (idx < 0 || idx >= chips.length || idx === active) return;
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
  }

  // Click a chip → page/scroll to that day.
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var idx = parseInt(chip.getAttribute("data-day-jump"), 10);
      var el = dayEls[idx];
      if (!el) return;
      if (horizontal()) {
        // Center the card in the deck without moving the page vertically.
        var trackRect = track.getBoundingClientRect();
        var elRect = el.getBoundingClientRect();
        var delta = (elRect.left - trackRect.left) - (track.clientWidth - elRect.width) / 2;
        track.scrollBy({ left: delta, behavior: reduced ? "auto" : "smooth" });
      } else {
        var y = el.getBoundingClientRect().top + window.scrollY - chromeH;
        window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
      }
      setActive(idx);
    });
  });

  // Scroll-spy.
  function spyHorizontal() {
    var trackRect = track.getBoundingClientRect();
    var center = trackRect.left + track.clientWidth / 2;
    var best = 0, bestDist = Infinity;
    for (var i = 0; i < dayEls.length; i++) {
      var r = dayEls[i].getBoundingClientRect();
      var d = Math.abs(r.left + r.width / 2 - center);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    setActive(best);
  }
  function spyVertical() {
    var idx = 0;
    for (var i = 0; i < dayEls.length; i++) {
      if (dayEls[i].getBoundingClientRect().top - chromeH - 40 <= 0) idx = i;
      else break;
    }
    setActive(idx);
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      (horizontal() ? spyHorizontal : spyVertical)();
      ticking = false;
    });
  }
  track.addEventListener("scroll", onScroll, { passive: true });  // deck (x)
  window.addEventListener("scroll", onScroll, { passive: true });  // page (y)
  window.addEventListener("resize", function () { active = -1; onScroll(); });
  onScroll();
})();
