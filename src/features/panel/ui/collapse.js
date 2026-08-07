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
      // Read the CURRENT state from the DOM, not the store's model: a deep link may
      // have force-opened this Panel without persisting (below), and a toggle that
      // consults stale state would then "close" an open Panel by re-opening it.
      var next = !panel.hasAttribute("data-collapsed");
      state = setCollapsed(state, id, next);
      apply(panel, next);
      store.write(key, serializeCollapsed(state));
      // The grid (and anything else layout-adjacent) reacts to toggles without the
      // collapse wiring knowing it exists. Restores do NOT fire this — the grid
      // sorts once after boot and only the reader's own toggles re-sort it.
      panel.dispatchEvent(new CustomEvent("panel:toggle", {
        bubbles: true,
        detail: { id: id, collapsed: next },
      }));
    });
  });

  // A deep link into a collapsed Panel must open it: `#sec-N` arrives from the anchor
  // copy button, the palette, and mobile-nav resume, and scrolling to a shut header
  // reads as a broken link. View-only — the store is NOT written, so the reader's
  // saved preference survives the visit (the DOM-read in the toggle handler keeps the
  // next click honest). The toggle event lets the grid re-sort the now-open Panel.
  function openForHash(isNavigation) {
    var h = location.hash && location.hash.slice(1);
    if (!h) return;
    var el;
    try { el = document.getElementById(decodeURIComponent(h)); } catch (e) { el = null; }
    var panel = el && el.closest && el.closest("[data-panel]");
    if (!panel || !panel.hasAttribute("data-collapsed")) return;
    apply(panel, false);
    panel.dispatchEvent(new CustomEvent("panel:toggle", {
      bubbles: true,
      detail: { id: panel.getAttribute("data-panel"), collapsed: false },
    }));
    // Same-page navigation: the browser scrolled to where the COLLAPSED Panel sat —
    // band 3, sunk below the open ones — and the grid is about to resort it up into
    // the open band, leaving the viewport pointing at where it WAS. Re-scroll once
    // the toggle transition (and therefore the resort) has settled. The boot path
    // needs none of this: its resort runs before anything scrolls.
    if (isNavigation) {
      setTimeout(function () {
        // The PANEL, not the inner target: its .block scroll-margin-top keeps the
        // landing below the sticky chrome, which an inner element's box would not.
        try { panel.scrollIntoView({ block: "start" }); } catch (e) { /* detached */ }
      }, 520);
    }
  }
  openForHash(false);
  window.addEventListener("hashchange", function () { openForHash(true); });

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
