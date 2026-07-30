/* The bottom tab bar's DOM glue. Five slots at phone width:

     [ group ] [ group ] [ ☰ Groups ] [ ◎ Today ] [ ⚲ Map ]

   The two group slots are decided by ../model/rank (current group always seated,
   the other by this device's own open-counts, positions kept stable by `seat`).
   Groups opens the existing sheet — the FULL navigation, always one thumb away, so
   the promoted pair is a shortcut and never a ceiling. Map only renders when the
   guide has a map section; Trip Kit lives in the sheet's tool row (creator's call
   2026-07-30: a reference surface, not a wayfinding one).

   Nothing here switches tabs itself — a slot clicks the real `.gtab`, so scroll
   memory, the scroll-spy, telemetry and the saved-tab key all run unchanged. State
   flows the other way through a MutationObserver on the tab strip, which means every
   route in (bar, sheet, swipe, keyboard, deep link, session restore) updates the bar
   without any of them knowing it exists. */

import { promoted, seat, slotLabel, recordOpen, parseCounts } from "../model/rank";
import { tapHaptic } from "../../../scripts/util.js";

export function initBotBar(ctx) {
  var bar = ctx.bar, tabs = ctx.tabs, order = ctx.order;
  var slots = Array.prototype.slice.call(bar.querySelectorAll(".botslot"));
  if (!slots.length) return;

  var COUNT_KEY = "tg-tabuse-" + ctx.storeKey;
  var counts = parseCounts(ctx.store.read(COUNT_KEY));
  var seated = slots.map(function () { return null; });
  var ind = bar.querySelector(".botbar-ind");

  /** Park the underline over the live group slot (or hide it inside a tool panel). */
  function moveIndicator() {
    if (!ind) return;
    var on = bar.querySelector(".botslot-on");
    if (!on || on.hidden) { ind.classList.remove("on"); return; }
    ind.classList.add("on");
    ind.style.width = on.offsetWidth + "px";
    ind.style.setProperty("--mn-ind-x", on.offsetLeft + "px");
  }
  // Exposed so the swipe gesture can drive the same element from a finger (Phase B)
  // instead of standing up a second indicator that could disagree with this one.
  bar.__mnIndicator = { move: moveIndicator, el: ind, slots: slots };

  function currentIdx() {
    var a = tabs.querySelector(".gtab-active");
    if (!a) return -1;
    var v = parseInt(a.getAttribute("data-tab"), 10);
    return isNaN(v) ? -1 : v; // a tool panel is open → no content group is current
  }

  function render() {
    var cur = currentIdx();
    seated = seat(seated, promoted(counts, order, cur, slots.length));
    slots.forEach(function (el, k) {
      var i = seated[k];
      if (i == null) { el.hidden = true; return; }
      el.hidden = false;
      var name = order[i];
      el.setAttribute("data-tab", String(i));
      el.setAttribute("aria-label", name);
      var txt = el.querySelector(".bslot-txt");
      if (txt) txt.textContent = slotLabel(name);
      var on = i === cur;
      el.classList.toggle("botslot-on", on);
      if (on) el.setAttribute("aria-current", "true");
      else el.removeAttribute("aria-current");
    });
    moveIndicator();
  }

  slots.forEach(function (el) {
    el.addEventListener("click", function () {
      var t = this.getAttribute("data-tab");
      if (t == null) return;
      tapHaptic();
      if (this.classList.contains("botslot-on")) {
        // Tapping the group you are already in scrolls it back to the top — the
        // platform convention for re-tapping the active tab, and the cheapest
        // "start over" on a long group.
        var cb = document.getElementById("grp-" + t);
        if (cb) cb.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      var btn = tabs.querySelector('.gtab[data-tab="' + t + '"]');
      if (btn) btn.click();
    });
  });

  // One observer is the whole state channel: the tab strip's active class is the
  // single source of truth for "where am I", so the bar can't drift from it.
  //
  // Every change it sees is a real navigation, so every one is counted. The load-time
  // choice of tab (saved session tab / deep link / jump-to-today) is NOT counted and
  // needs no flag to exclude it: guide-ui runs its initial showTab during its own module
  // evaluation, which the layout's fixed import order puts strictly before this module —
  // the observer does not exist yet. If that order ever changes, the default tab starts
  // out-ranking the groups the traveller actually opens.
  var mo = new MutationObserver(function () {
    var cur = currentIdx();
    if (cur >= 0 && order[cur]) {
      counts = recordOpen(counts, order[cur]);
      ctx.store.write(COUNT_KEY, JSON.stringify(counts));
    }
    render();
  });
  mo.observe(tabs, { subtree: true, attributes: true, attributeFilter: ["class"] });

  // Slot widths change with the viewport (and when the bar becomes a floating pill on a
  // tablet), so a stale underline width would sit visibly off its slot after a rotation.
  window.addEventListener("resize", moveIndicator);
  window.addEventListener("orientationchange", function () { setTimeout(moveIndicator, 120); });

  render();
}
