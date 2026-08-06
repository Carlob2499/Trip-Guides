/** DOM glue for the Panel grid. All ordering decisions live in ../model/sort.ts; this
    file only reads each Panel's declared span and current collapse state, and moves the
    ACTUAL nodes into the sorted order — never a CSS `order` reordering, so keyboard tab
    order and screen-reader reading order always match what is on screen. */
import { sortPanels } from "../model/sort";

function parseSeconds(s) {
  var n = parseFloat(s);
  if (isNaN(n)) return 0;
  return /ms\s*$/.test(s) ? n / 1000 : n;
}

/** The longest transition-duration on the Panel's body, in ms. 0 means "moves are
    instant" — reduced motion, no-anim gate yet, or no body at all. */
function bodyTransitionMs(panel) {
  var body = panel.querySelector("[data-panel-body]");
  if (!body) return 0;
  try {
    var durs = (getComputedStyle(body).transitionDuration || "0s").split(",");
    var max = 0;
    for (var i = 0; i < durs.length; i++) {
      var d = parseSeconds(durs[i]);
      if (d > max) max = d;
    }
    return max * 1000;
  } catch (e) {
    return 0;
  }
}

/**
 * Wire one grid: sort its Panels now (after collapse restore) and re-sort on every
 * toggle, once the collapse transition has finished — so the closing animation plays
 * where the reader clicked, and no stale gap survives it.
 *
 * ONE grid per root, by design: the page this ships for has a single Panel region.
 * A page with several would pass each grid's element as `root` — the wiring is
 * per-call, not per-document.
 */
export function initGrid(ctx) {
  var root = (ctx && ctx.root) || document;
  var grid = root.querySelector("[data-panel-grid]");
  if (!grid) return;

  var panels = Array.prototype.slice.call(grid.querySelectorAll("[data-panel]"));
  if (!panels.length) return;

  // The scope's declared order is the markup order, captured once before any move.
  var declared = new Map();
  panels.forEach(function (el, i) { declared.set(el, i); });

  function collect() {
    return panels.map(function (el) {
      return {
        el: el,
        id: el.getAttribute("data-panel") || "",
        fullWidth: el.hasAttribute("data-panel-full"),
        collapsed: el.hasAttribute("data-collapsed"),
        order: declared.get(el),
      };
    });
  }

  /* The final row must not strand a hole beside the last Panel, so the last Panel
     spans from wherever auto-placement put it to the row's end. That span cannot be
     said in CSS (`grid-column-end: -1` PINS the item to the final column, moving the
     hole into the middle of the row), so it is measured here: walk the sorted order,
     track the column each Panel lands in, and stretch only the true last one. This is
     a POSITION rule — a Panel's declared span still only ever comes from its type. */
  function fillLastRow() {
    var kids = Array.prototype.slice.call(grid.children);
    var cols = 1;
    try {
      cols = (getComputedStyle(grid).gridTemplateColumns || "")
        .split(" ").filter(Boolean).length || 1;
    } catch (e) { /* leave 1 — no stretch, never a wrong one */ }
    var pos = 0;
    kids.forEach(function (el) { el.style.gridColumn = ""; });
    kids.forEach(function (el) {
      if (el.hasAttribute("data-panel-full")) { pos = 0; return; }
      pos += 1;
      if (pos > cols) pos = 1;
    });
    var last = kids[kids.length - 1];
    if (last && !last.hasAttribute("data-panel-full") && pos > 0 && pos < cols) {
      last.style.gridColumn = "span " + (cols - pos + 1);
    }
  }

  function resort() {
    var sorted = sortPanels(collect());
    var changed = false;
    for (var i = 0; i < sorted.length; i++) {
      if (grid.children[i] !== sorted[i].el) { changed = true; break; }
    }
    if (!changed) { fillLastRow(); return; }

    // Moving a node blurs anything focused inside it, so the reader's focus is put
    // back where it was — a keyboard user mid-toggle must not be dumped to <body>.
    var active = document.activeElement;
    sorted.forEach(function (item) { grid.appendChild(item.el); });
    if (active && active !== document.body && document.activeElement !== active) {
      try { active.focus({ preventScroll: true }); } catch (e) { /* detached */ }
    }
    fillLastRow();
  }

  // One resort per settled toggle. A reader toggling again mid-transition just moves
  // the deadline; the eventual resort reads the CURRENT attributes, so it is always
  // right about the final state.
  var timer = 0;
  grid.addEventListener("panel:toggle", function (e) {
    var panel = e.target;
    var wait = bodyTransitionMs(panel);
    clearTimeout(timer);
    if (!wait) { resort(); return; }
    var body = panel.querySelector("[data-panel-body]");
    var done = false;
    var finish = function () {
      if (done) return;
      done = true;
      resort();
    };
    var onEnd = function (ev) {
      if (ev.target !== body || ev.propertyName !== "grid-template-rows") return;
      body.removeEventListener("transitionend", onEnd);
      finish();
    };
    body.addEventListener("transitionend", onEnd);
    // Fallback: transitionend is lost if the tab is hidden mid-animation.
    timer = setTimeout(finish, wait + 120);
  });

  // The column count changes with the viewport, so the last-row stretch is re-measured
  // on resize. Debounced: one measure per settled resize, not one per frame.
  var resizeTimer = 0;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(fillLastRow, 120);
  });

  // Initial order — runs before [data-panel-anim] exists, so restored state settles
  // into place with no motion, exactly like the collapse restore itself.
  resort();
}
