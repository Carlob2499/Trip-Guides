/* Waypoint flight direction + guided reading chain.
   - Tracks which way a tab change travels (forward/back along the section
     order) and sets html[data-flight] BEFORE guide-ui's own click handler
     re-renders, so flight.css can bank the incoming panel along the travel
     direction (capture phase guarantees ordering).
   - Binds the end-of-section "Next: …" CTAs to the real tab buttons, so the
     guided chain reuses the existing navigation (state, scroll, persistence)
     rather than reimplementing it. */

(function () {
  var tabs = document.getElementById("guideTabs");
  if (!tabs) return;

  function currentIdx() {
    var active = tabs.querySelector(".gtab-active");
    var v = active ? parseInt(active.getAttribute("data-tab"), 10) : NaN;
    return isNaN(v) ? -1 : v;
  }
  function setFlight(nextTab) {
    var next = parseInt(nextTab, 10);
    var cur = currentIdx();
    var dir = (!isNaN(next) && cur >= 0 && next < cur) ? "back" : "fwd";
    document.documentElement.setAttribute("data-flight", dir);
  }

  // Capture phase: runs before guide-ui's bubbling click handler shows the panel.
  tabs.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest(".gtab");
    if (btn) setFlight(btn.getAttribute("data-tab"));
  }, true);

  // Next-section CTAs → fly forward via the real tab button.
  document.addEventListener("click", function (e) {
    var cta = e.target.closest && e.target.closest("[data-next-tab]");
    if (!cta) return;
    var target = tabs.querySelector('.gtab[data-tab="' + cta.getAttribute("data-next-tab") + '"]');
    if (!target) return;
    document.documentElement.setAttribute("data-flight", "fwd");
    target.click();
  });
})();
