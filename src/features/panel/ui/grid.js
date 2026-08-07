/** DOM glue for the Panel grid. All ordering decisions live in ../model/sort.ts and
    ../model/order.ts; this file only reads each Panel's declared span and current
    collapse state, and moves the ACTUAL nodes into the sorted order — never a CSS
    `order` reordering, so keyboard tab order and screen-reader reading order always
    match what is on screen.

    The tie-break inside the sort's bands is the READER'S saved order where one exists
    (per device, per scope — ../model/order.ts reconciles it against the page), and the
    scope's declared markup order otherwise. ui/reorder.js changes it through the
    controller this returns; the band rules re-assert on top of every change. */
import { sortPanels } from "../model/sort";
import { parseOrder, serializeOrder, effectiveOrder, movePanel, orderKey } from "../model/order";

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
 * where the reader clicked, and no stale gap survives it. Returns the controller
 * ui/reorder.js drives, or null when there is nothing to wire.
 *
 * ONE grid per root, by design: the page this ships for has a single Panel region.
 * A page with several would pass each grid's element as `root` — the wiring is
 * per-call, not per-document.
 */
export function initGrid(ctx) {
  var root = (ctx && ctx.root) || document;
  var grid = root.querySelector("[data-panel-grid]");
  if (!grid) return null;

  var panels = Array.prototype.slice.call(grid.querySelectorAll("[data-panel]"));
  if (!panels.length) return null;

  var store = (ctx && ctx.store) || null;
  var key = orderKey(ctx && ctx.scope);

  function idOf(el) { return el.getAttribute("data-panel") || ""; }

  // The scope's declared order is the markup order, captured once before any move.
  var declared = panels.map(idOf);
  var saved = store ? parseOrder(store.read(key)) : [];
  var orderIds = effectiveOrder(declared, saved);

  function persist() {
    if (store) store.write(key, serializeOrder(orderIds));
  }

  function collect() {
    return panels.map(function (el) {
      return {
        el: el,
        id: idOf(el),
        fullWidth: el.hasAttribute("data-panel-full"),
        collapsed: el.hasAttribute("data-collapsed"),
        // indexOf per Panel is O(n²) per resort — fine at MAX_PANELS scale (200).
        order: orderIds.indexOf(idOf(el)),
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
    // Clear every stretch BEFORE measuring cols, not after. A stale "span N" left over
    // from a previous (possibly wrong) measurement forces the grid to keep resolving to
    // N tracks — so measuring with it still applied reads back the very corruption it
    // caused, and the wrong value perpetuates itself forever. Clearing first forces the
    // browser to re-resolve the TRUE current column count on every call, which is what
    // makes this self-correcting instead of self-reinforcing. Reproduced live: Korea's
    // Gaming & anime group at 375px, one bad early measurement of cols=2 left a
    // permanent inline "span 2" on its last Panel, squeezing it to ~29px wide — every
    // later call kept reading 2 columns back because that span was still applied.
    kids.forEach(function (el) { el.style.gridColumn = ""; });
    var cols = 1;
    try {
      cols = (getComputedStyle(grid).gridTemplateColumns || "")
        .split(" ").filter(Boolean).length || 1;
    } catch (e) { /* leave 1 — no stretch, never a wrong one */ }
    var pos = 0;
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
  // A grid inside a hidden tab panel measures 0 columns at boot (getComputedStyle on
  // display:none), so the last-row stretch is wrong the moment the tab first shows.
  // ResizeObserver fires on that reveal (0 → real width) with no coupling to whoever
  // does the revealing; the same debounce keeps it one measure per settled change.
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(fillLastRow, 120);
    }).observe(grid);
  }

  // Initial order — runs before [data-panel-anim] exists, so restored state settles
  // into place with no motion, exactly like the collapse restore itself.
  resort();

  function domIds() {
    return Array.prototype.map.call(grid.children, idOf);
  }

  /* The controller ui/reorder.js drives. Every mutation goes back through the sort,
     so the band rules always re-assert — a reader can DROP a collapsed Panel above an
     open one, but it lands where the rules put it, and the announcement says where. */
  return {
    element: grid,

    /** 1-based visual position of a Panel and the count, for announcements. */
    positionOf: function (panel) {
      return {
        pos: Array.prototype.indexOf.call(grid.children, panel) + 1,
        count: grid.children.length,
      };
    },

    /** Move `id` to visual position `toIndex` (0-based, clamped). The reader's order
        becomes the resulting visual sequence, persisted; bands re-assert via resort.
        Returns whether anything changed — the no-op is the caller's announcement. */
    moveTo: function (id, toIndex) {
      var ids = domIds();
      var next = movePanel(ids, id, toIndex);
      if (next === ids) return false;
      orderIds = next;
      persist();
      resort();
      return true;
    },

    /** Adopt the CURRENT DOM sequence as the reader's order (after a live drag).
        A drag that went nowhere writes nothing — same contract as movePanel's no-op. */
    commitDomOrder: function () {
      var ids = domIds();
      if (ids.join(" ") !== orderIds.join(" ")) {
        orderIds = ids;
        persist();
      }
      resort();
    },

    /** Throw the reader's order away; the scope's declared order is the tie-break again. */
    reset: function () {
      orderIds = declared.slice();
      if (store) store.write(key, serializeOrder([]));
      resort();
    },

    /** Re-run the sort from current state (drag cancel: discard live DOM moves). */
    restore: function () { resort(); },

    /** Whether the reader has a persisted custom order for this scope — surfaces use
        it to show a reset control only when there is something to reset. */
    hasCustomOrder: function () {
      return !!store && parseOrder(store.read(key)).length > 0;
    },

    fillLastRow: fillLastRow,
  };
}
