/** DOM glue for Panel collapse. All decisions live in ../model/collapse.ts; this file
    only reads the store, applies the attribute, and writes back. */
import { parseCollapsed, serializeCollapsed, setCollapsed, isCollapsed, scopeKey } from "../model/collapse";

function apply(panel, collapsed) {
  if (collapsed) panel.setAttribute("data-collapsed", "1");
  else panel.removeAttribute("data-collapsed");
  var btn = panel.querySelector("[data-panel-toggle]");
  if (btn) btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
}

/**
 * Wire every Panel under `root` to one scope's persisted collapsed state.
 * `scope` keys the store — one scope's collapsed Panels never affect another's.
 */
export function initPanels(ctx) {
  var root = (ctx && ctx.root) || document;
  var panels = root.querySelectorAll("[data-panel]");
  if (!panels.length) return;
  var store = (ctx && ctx.store) || null;
  if (!store) return;
  var key = scopeKey(ctx && ctx.scope);
  var state = parseCollapsed(store.read(key));
  var seen = {};

  Array.prototype.forEach.call(panels, function (panel) {
    var id = panel.getAttribute("data-panel");
    if (!id) return;
    // Two Panels sharing an id share one store entry but not one element, so collapsing
    // either would leave the other visibly out of step until the next load — and their
    // derived DOM ids collide, pointing both aria-controls at the first body. Wire the
    // first and leave the rest inert (and open) rather than half-wire a broken pair.
    if (seen[id]) return;
    seen[id] = true;

    // Resolved BEFORE any state is applied: a Panel with no toggle must never be left
    // collapsed, or its content is unreachable with no control that can bring it back.
    var btn = panel.querySelector("[data-panel-toggle]");
    if (!btn) return;

    // Markup's own data-collapsed decides only where the reader never has.
    var dflt = panel.hasAttribute("data-collapsed");
    apply(panel, isCollapsed(state, id, dflt));

    btn.addEventListener("click", function () {
      var next = !isCollapsed(state, id, dflt);
      state = setCollapsed(state, id, next);
      apply(panel, next);
      store.write(key, serializeCollapsed(state));
    });
  });

  var html = document.documentElement;
  // Synchronous: this is what makes the collapse styles (and the toggle) live at all, so
  // a restored Panel is already shut in the first paint rather than after it.
  html.setAttribute("data-panel-ready", "");
  // One frame later: transitions come up only after that restored state has painted,
  // otherwise every load would animate the restore instead of simply arriving at it.
  // Two frames, because a single one can still be batched into the same style pass.
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { html.setAttribute("data-panel-anim", ""); });
  });
}
