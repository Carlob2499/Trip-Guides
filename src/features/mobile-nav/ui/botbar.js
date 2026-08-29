/* The bottom tab bar manages only its two promoted canonical-destination slots. Today is a
   fixed contextual action and Groups opens the complete mobile sheet, so neither participates
   in ranking or seating.

   Nothing here switches tabs itself — a slot clicks the real `.gtab`, so scroll memory,
   the scroll-spy, telemetry and the saved-tab key all run unchanged. State flows the other
   way through a MutationObserver on the tab strip, which means every route in (bar, sheet,
   swipe, keyboard, deep link, session restore) updates the bar without knowing it exists. */

import { promoted, seat, slotLabel, recordOpen, parseCounts } from "../model/rank";
import { tapHaptic } from "../../../scripts/util.js";

export function initBotBar(ctx) {
  var bar = ctx.bar, tabs = ctx.tabs, order = ctx.order;

  var allGroupSlots = Array.prototype.slice.call(bar.querySelectorAll("[data-group-slot]"));
  // A guide with only ONE group can't fill a second content slot — asking for two would
  // seat a duplicate. The bar degrades to the slots the guide can actually fill.
  var wantGroups = Math.min(2, order.length);
  var groupSlots = allGroupSlots.slice(0, wantGroups);
  // Park any slot this guide can't fill, and keep renderGroups away from it.
  allGroupSlots.slice(wantGroups).forEach(function (el) { el.hidden = true; });

  if (!groupSlots.length) return;

  var COUNT_KEY = "tg-tabuse-" + ctx.storeKey;
  var counts = parseCounts(ctx.store.read(COUNT_KEY));
  var seated = groupSlots.map(function () { return null; });
  var ind = bar.querySelector(".botbar-ind");

  /** Park the underline over the live group slot (or hide it inside a tool panel). */
  function moveIndicator() {
    if (!ind) return;
    var on = bar.querySelector(".botslot-on");
    if (!on || on.hidden) { ind.classList.remove("on"); return; }
    ind.classList.add("on");
    // A scale factor, not a width — see the .botbar-ind note in mobile-nav.css. The element is
    // the full width of the bar, so the fraction IS slot width over bar width.
    var barW = bar.getBoundingClientRect().width || 1;
    ind.style.setProperty("--mn-ind-w", (on.offsetWidth / barW).toFixed(5));
    ind.style.setProperty("--mn-ind-x", on.offsetLeft + "px");
  }
  // Exposed so the swipe gesture can drive the same element from a finger instead of
  // standing up a second indicator that could disagree with this one.
  bar.__mnIndicator = { move: moveIndicator, el: ind, slots: groupSlots };

  function currentIdx() {
    var a = tabs.querySelector(".gtab-active");
    if (!a) return -1;
    var v = parseInt(a.getAttribute("data-tab"), 10);
    // Secondary stations are numbered after the canonical order; `promoted` rejects those
    // indices and keeps the best primary pair seated.
    return isNaN(v) ? -1 : v;
  }
  function renderGroups(cur) {
    seated = seat(seated, promoted(counts, order, cur, groupSlots.length));
    groupSlots.forEach(function (el, k) {
      var i = seated[k];
      if (i == null) { el.hidden = true; return; }
      el.hidden = false;
      var name = order[i];
      el.setAttribute("data-tab", String(i));
      var station = tabs.querySelector('.gtab[data-primary="true"][data-tab="' + i + '"]');
      if (station && station.getAttribute("data-route")) el.setAttribute("data-route", station.getAttribute("data-route"));
      el.setAttribute("aria-label", name);
      var txt = el.querySelector(".bslot-txt");
      if (txt) txt.textContent = slotLabel(name);
      var on = i === cur;
      el.classList.toggle("botslot-on", on);
      if (on) el.setAttribute("aria-current", "true");
      else el.removeAttribute("aria-current");
    });
  }

  function render() {
    renderGroups(currentIdx());
    moveIndicator();
  }

  groupSlots.forEach(function (el) {
    el.addEventListener("click", function () {
      var t = this.getAttribute("data-tab");
      var route = this.getAttribute("data-route");
      if (t == null || !route) return;
      tapHaptic();
      if (this.classList.contains("botslot-on")) {
        // Tapping the group you are already in scrolls it back to the top — the platform
        // convention for re-tapping an active tab, and the cheapest "start over".
        var cb = document.getElementById("dest-" + route);
        if (cb) cb.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      var btn = tabs.querySelector('.gtab[data-route="' + route + '"]');
      if (btn) btn.click();
    });
  });

  // One observer is the whole state channel: the tab strip's active class is the single
  // source of truth for "where am I", so the bar can't drift from it.
  //
  // Every change it sees is a real navigation, so every one is counted. The load-time
  // choice of tab (saved session tab / deep link / jump-to-today) is NOT counted and needs
  // no flag to exclude it: guide-ui runs its initial showTab during its own module
  // evaluation, which the layout's fixed import order puts strictly before this module —
  // the observer does not exist yet. If that order ever changes, the default tab starts
  // out-ranking the groups the traveller actually opens.
  //
  // Only canonical destinations are counted. Today and secondary routes are fixed actions,
  // so no ranking data is written for them.
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
