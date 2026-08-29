/* Waypoint reading spine — a slim fixed rail on wide desktop with one tick
   per section group: filled ticks are read, the active tick shows live
   progress through the current section, and clicking a tick flies there
   (through the real tab buttons). The compass answers "take me anywhere";
   the spine answers "where am I in the whole guide". ≥1100px only. */

/** The spine is a primary-destination progress indicator, not a route index. */
export function primarySpineTabs(tabs) {
  return Array.prototype.slice.call(tabs.querySelectorAll(".gtab"))
    .filter(function (t) {
      return t.getAttribute("data-primary") === "true" && !t.hidden &&
        /^\d+$/.test(t.getAttribute("data-tab") || "");
    });
}

/** Return the tick position, rather than the station's contiguous route index. */
export function spineActiveIndex(stations, active) {
  return active ? stations.indexOf(active) : -1;
}

(function () {
  if (typeof document === "undefined") return;
  var tabs = document.getElementById("guideTabs");
  if (!tabs) return;
  var gtabs = primarySpineTabs(tabs);
  if (gtabs.length < 3) return;

  var rail = document.createElement("nav");
  rail.className = "spine";
  rail.setAttribute("aria-label", "Reading progress");
  var ticks = gtabs.map(function (t) {
    var tick = document.createElement("button");
    tick.type = "button";
    tick.className = "spine-tick";
    tick.setAttribute("aria-label", (t.getAttribute("data-full") || t.textContent.trim()) + " — jump to section");
    tick.innerHTML = '<span class="spine-fill"></span><span class="spine-tip"></span>';
    tick.querySelector(".spine-tip").textContent = t.getAttribute("data-full") || t.textContent.trim();
    tick.addEventListener("click", function () { t.click(); });
    rail.appendChild(tick);
    return tick;
  });
  document.body.appendChild(rail);

  var seen = {};
  function activeIdx() {
    var a = tabs.querySelector(".gtab-active");
    return spineActiveIndex(gtabs, a);
  }
  var ticking = false;
  function update() {
    ticking = false;
    var cur = activeIdx();
    if (cur >= 0) seen[cur] = true;
    var max = document.body.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    ticks.forEach(function (tick, i) {
      tick.classList.toggle("spine-active", i === cur);
      tick.classList.toggle("spine-seen", !!seen[i] && i !== cur);
      // A 0..1 scale factor, not a height: the fill is transform-driven so this can run on
      // every scroll frame without touching layout (field-tools.css, .spine-fill).
      tick.querySelector(".spine-fill").style.setProperty(
        "--spine-fill", i === cur ? p.toFixed(3) : seen[i] ? "1" : "0",
      );
    });
  }
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });
  tabs.addEventListener("click", function () { setTimeout(update, 60); });
  update();
})();
