/* The desktop workbench (design-system.md D6-21/35): timeline left, map right, one divider.

   The divider is a real control — drag with a pointer, ←/→ with the keyboard (5% steps,
   Home/End to the limits) — and the ratio is remembered per device. Either pane collapses:
   the map's own toggle folds it to a strip and the divider hides; below the desktop
   threshold the panes stack (itinerary.css) and the divider is inert. Minimums are held
   (30–70%) so neither pane can be dragged into uselessness; a double-tap on the divider
   resets to the default. The map itself follows the selected day through `tg:day`
   (features/maps listens), so this file owns geometry only. */

export function initWorkbench(root) {
  var doc = root || document;
  var bench = doc.querySelector("[data-workbench]");
  if (!bench) return;
  var divider = bench.querySelector("[data-pane-divider]");
  var mapPane = bench.querySelector('[data-pane="map"]');
  var collapseBtn = bench.querySelector('[data-pane-collapse="map"]');
  var storeKey = doc.body.getAttribute("data-storekey") || "guide";
  var KEY = "tg-d7-bench-" + storeKey;
  var MIN = 30, MAX = 70, DEFAULT = 52;
  var ratio = DEFAULT;
  try { var s = parseInt(localStorage.getItem(KEY), 10); if (!isNaN(s) && s >= MIN && s <= MAX) ratio = s; } catch (_) {}
  var collapsed = false;
  try { collapsed = localStorage.getItem(KEY + "-map") === "0"; } catch (_) {}

  function apply() {
    bench.style.setProperty("--bench-timeline", ratio + "%");
    if (divider) divider.setAttribute("aria-valuenow", String(ratio));
    bench.classList.toggle("itin-bench--map-collapsed", collapsed);
    if (collapseBtn) {
      collapseBtn.setAttribute("aria-expanded", collapsed ? "false" : "true");
      collapseBtn.setAttribute("aria-label", collapsed ? "Expand the map" : "Collapse the map");
    }
    try { localStorage.setItem(KEY, String(ratio)); localStorage.setItem(KEY + "-map", collapsed ? "0" : "1"); } catch (_) {}
    try { doc.dispatchEvent(new CustomEvent("tg:bench", { detail: { ratio: ratio, mapCollapsed: collapsed } })); } catch (_) {}
  }

  if (divider) {
    var dragging = false;
    divider.addEventListener("pointerdown", function (e) {
      dragging = true;
      divider.setPointerCapture(e.pointerId);
      bench.classList.add("itin-bench--dragging");
      e.preventDefault();
    });
    divider.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var r = bench.getBoundingClientRect();
      var pct = ((e.clientX - r.left) / r.width) * 100;
      ratio = Math.round(Math.max(MIN, Math.min(MAX, pct)));
      bench.style.setProperty("--bench-timeline", ratio + "%");
      divider.setAttribute("aria-valuenow", String(ratio));
    });
    function endDrag() { if (!dragging) return; dragging = false; bench.classList.remove("itin-bench--dragging"); apply(); }
    divider.addEventListener("pointerup", endDrag);
    divider.addEventListener("pointercancel", endDrag);
    divider.addEventListener("dblclick", function () { ratio = DEFAULT; apply(); });
    divider.addEventListener("keydown", function (e) {
      var step = 5;
      if (e.key === "ArrowLeft") ratio = Math.max(MIN, ratio - step);
      else if (e.key === "ArrowRight") ratio = Math.min(MAX, ratio + step);
      else if (e.key === "Home") ratio = MIN;
      else if (e.key === "End") ratio = MAX;
      else if (e.key === "Enter") ratio = DEFAULT;
      else return;
      e.preventDefault();
      apply();
    });
  }
  if (collapseBtn) collapseBtn.addEventListener("click", function () { collapsed = !collapsed; apply(); });
  if (mapPane) mapPane.addEventListener("click", function (e) {
    // A collapsed strip re-opens on tap anywhere on it.
    if (collapsed && !(e.target.closest && e.target.closest("[data-pane-collapse]"))) { collapsed = false; apply(); }
  });
  apply();
}
