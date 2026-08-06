/** DOM glue for reordering Panels — the last piece of the Panel primitive.
    A traveler drags a Panel by its handle to where it matters to them, or does the
    same with arrow keys on the handle, and the grid controller persists the result.
    All sequence decisions live in the controller (../ui/grid.js → ../model/order.ts);
    this file only translates pointers and keys into `moveTo`/`commitDomOrder` calls
    and speaks the outcome to assistive tech.

    The band rules stay in charge: a drop is a REQUEST, the sort decides the landing,
    and the announcement reports where the Panel actually ENDED UP — never where the
    reader let go of it. */

function titleOf(panel) {
  var t = panel.querySelector(".pnl-title");
  return (t && t.textContent) ? t.textContent.trim() : (panel.getAttribute("data-panel") || "Panel");
}

/** One polite live region per grid — text set on every settled reorder. */
function makeAnnouncer(grid) {
  var el = document.createElement("div");
  el.className = "pnl-sr";
  el.setAttribute("aria-live", "polite");
  grid.parentNode.insertBefore(el, grid.nextSibling);
  var setTimer = 0;
  var clearTimer = 0;
  return function (text) {
    // Cleared first so repeating the same message (two "stays at position 1") is
    // still seen as a change and re-announced. Both timers cancel, so two rapid
    // announcements can never interleave into a half-cleared message.
    el.textContent = "";
    clearTimeout(setTimer);
    clearTimeout(clearTimer);
    setTimer = setTimeout(function () { el.textContent = text; }, 30);
    clearTimer = setTimeout(function () { el.textContent = ""; }, 4000);
  };
}

export function initReorder(ctl, cfg) {
  if (!ctl) return;
  var grid = ctl.element;
  var root = (cfg && cfg.root) || document;
  var announce = makeAnnouncer(grid);

  function landed(panel, verb) {
    var at = ctl.positionOf(panel);
    announce(titleOf(panel) + " " + verb + " position " + at.pos + " of " + at.count + ".");
  }

  // ---- Keyboard: arrows on the handle move the Panel one step; Home/End to the ends.
  // Each keypress commits — there is no grab mode to learn or get stuck in.
  grid.addEventListener("keydown", function (e) {
    var grip = e.target && e.target.closest && e.target.closest("[data-panel-grip]");
    if (!grip) return;
    var panel = grip.closest("[data-panel]");
    if (!panel || panel.parentNode !== grid) return;
    var at = ctl.positionOf(panel); // 1-based — the controller owns sequence knowledge
    var idx = at.pos - 1;
    var to = null;
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") to = idx - 1;
    else if (e.key === "ArrowDown" || e.key === "ArrowRight") to = idx + 1;
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = at.count - 1;
    if (to === null) return;
    e.preventDefault();
    var moved = ctl.moveTo(panel.getAttribute("data-panel") || "", to);
    // A refused move (already at the end, or the bands put it straight back) still
    // answers — silence reads as broken to a reader who cannot see the grid.
    landed(panel, moved && ctl.positionOf(panel).pos !== at.pos ? "moved to" : "stays at");
  });

  // ---- Pointer drag: the dragged Panel ignores pointer events so elementFromPoint
  // sees the Panel underneath; nodes move LIVE while dragging, and pointerup adopts
  // the sequence (drop = commit), pointercancel discards it (the sort restores).
  var drag = null;

  function targetIndex(x, y) {
    var el = document.elementFromPoint(x, y);
    var over = el && el.closest && el.closest("[data-panel]");
    if (!over || over === drag.panel || over.parentNode !== grid) return -1;
    var r = over.getBoundingClientRect();
    var after = y > r.top + r.height / 2 ||
      (y >= r.top && y <= r.bottom && x > r.left + r.width / 2);
    var idx = Array.prototype.indexOf.call(grid.children, over);
    return after ? idx + 1 : idx;
  }

  grid.addEventListener("pointerdown", function (e) {
    var grip = e.target && e.target.closest && e.target.closest("[data-panel-grip]");
    if (!grip || (e.button !== undefined && e.button !== 0)) return;
    var panel = grip.closest("[data-panel]");
    if (!panel || panel.parentNode !== grid) return;
    e.preventDefault();
    try { grip.setPointerCapture(e.pointerId); } catch (err) { /* capture is best-effort */ }
    drag = { panel: panel, grip: grip, pointerId: e.pointerId, fromPos: ctl.positionOf(panel).pos };
    panel.classList.add("pnl--drag");
    document.documentElement.setAttribute("data-panel-dragging", "");
  });

  grid.addEventListener("pointermove", function (e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    var to = targetIndex(e.clientX, e.clientY);
    if (to < 0) return;
    var from = Array.prototype.indexOf.call(grid.children, drag.panel);
    if (to === from || to === from + 1) return; // already there
    var ref = grid.children[to] || null;
    grid.insertBefore(drag.panel, ref);
    drag.moved = true;
    ctl.fillLastRow();
  });

  function endDrag(commit) {
    if (!drag) return;
    var panel = drag.panel;
    var fromPos = drag.fromPos;
    var drag_moved = !!drag.moved;
    panel.classList.remove("pnl--drag");
    document.documentElement.removeAttribute("data-panel-dragging");
    drag = null;
    if (commit && drag_moved) {
      ctl.commitDomOrder();
      // Same honesty as the keyboard path: a drop the bands snapped back says so,
      // it does not claim a move.
      landed(panel, ctl.positionOf(panel).pos !== fromPos ? "moved to" : "stays at");
    } else {
      // Cancelled — or a press-and-release that never moved the node. Nothing is
      // recorded: a decision the reader didn't take must not change future layout.
      ctl.restore();
      if (commit) landed(panel, "stays at");
    }
  }

  grid.addEventListener("pointerup", function (e) {
    if (drag && e.pointerId === drag.pointerId) endDrag(true);
  });
  grid.addEventListener("pointercancel", function (e) {
    if (drag && e.pointerId === drag.pointerId) endDrag(false);
  });

  // ---- Reset: any control marked data-panel-order-reset returns the scope to its
  // declared order — a reader can never strand themselves in a layout they dislike.
  var reset = root.querySelector("[data-panel-order-reset]");
  if (reset) {
    reset.addEventListener("click", function () {
      ctl.reset();
      announce("Panel order reset to default.");
    });
  }

  // The handle only becomes interactive once this wiring exists — the same rule as
  // the collapse toggle: no control is drawn that cannot work.
  document.documentElement.setAttribute("data-panel-reorder", "");
}
