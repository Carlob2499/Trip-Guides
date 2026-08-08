/* The bottom tab bar's DOM glue. Five slots at phone width:

     [ current group ] [ tool ] [ ☰ Groups ] [ ◎ Today ] [ ⚲ Map ]

   Slot 1 is always the group you are reading, so the bar can never show a set that
   excludes where you actually are. Slot 2 is the TOOL this device opens most, defaulting
   to the budget split (creator, 2026-07-30: "the tools should be their own tab ... the
   Trip Split calculator is by far the most useful to have handy"). It replaced a second
   content group, which was the weaker of the two: the Groups sheet already reaches any
   group in one tap, while a tool panel took three.

   Groups opens the existing sheet — the FULL navigation, always one thumb away. Map only
   renders when the guide has a map section; Trip Kit lives in the sheet's tool row too.

   Nothing here switches tabs itself — a slot clicks the real `.gtab`, so scroll memory,
   the scroll-spy, telemetry and the saved-tab key all run unchanged. State flows the other
   way through a MutationObserver on the tab strip, which means every route in (bar, sheet,
   swipe, keyboard, deep link, session restore) updates the bar without knowing it exists. */

import { promoted, seat, slotLabel, recordOpen, parseCounts, rankOrder } from "../model/rank";
import { tapHaptic } from "../../../scripts/util.js";

/** Tool panels the slot can offer, in default preference order. */
var TOOL_KEYS = ["split", "vote", "remind", "kit", "learn"];
var TOOL_LABEL = { split: "Split", vote: "Vote", remind: "Alerts", kit: "Kit", learn: "Learnings" };

/** Which bar layout this device shows (Stage D, creator asked to compare both):
    "app"  — the shipped five-slot bar: [group][tool][Groups][Today][Map] (2026-07-30 ruling).
    "spec" — the design-handoff README's four: [group][group][ALL][TOOLS].
    `?bar=spec` / `?bar=app` picks one and remembers it, so the creator can flip the running
    site on a phone without a rebuild. Default stays the shipped bar: an A/B for a decision
    that hasn't been made must not quietly change what everyone else sees. */
function barMode(store) {
  var q = null;
  try { q = new URLSearchParams(location.search).get("bar"); } catch (e) { /* no URL API */ }
  if (q === "spec" || q === "app") { store.write("tg-barmode", q); return q; }
  return store.read("tg-barmode") === "spec" ? "spec" : "app";
}

export function initBotBar(ctx) {
  var bar = ctx.bar, tabs = ctx.tabs, order = ctx.order;
  var mode = barMode(ctx.store);
  bar.setAttribute("data-bar-mode", mode);

  var allGroupSlots = Array.prototype.slice.call(bar.querySelectorAll(".botslot:not(.botslot-tool)"));
  // A guide with only ONE group can't fill a second content slot — asking for two would
  // seat a duplicate. Spec mode degrades to the slots the guide can actually fill.
  var wantGroups = mode === "spec" ? Math.min(2, order.length) : 1;
  var groupSlots = allGroupSlots.slice(0, wantGroups);
  // Park every slot this mode doesn't use, and keep renderGroups away from them.
  allGroupSlots.slice(wantGroups).forEach(function (el) { el.hidden = true; });
  if (mode === "spec") {
    // The README's bar carries no Today/Map minis — ALL and TOOLS are the other two slots.
    var today = bar.querySelector("#botToday");
    var map = bar.querySelector("#botMap");
    if (today) today.hidden = true;
    if (map) map.hidden = true;
  }

  var toolSlot = bar.querySelector(".botslot-tool");
  if (!groupSlots.length && !toolSlot) return;

  var COUNT_KEY = "tg-tabuse-" + ctx.storeKey;
  var TOOL_KEY = "tg-tooluse-" + ctx.storeKey;
  var counts = parseCounts(ctx.store.read(COUNT_KEY));
  var toolCounts = parseCounts(ctx.store.read(TOOL_KEY));
  var seated = groupSlots.map(function () { return null; });
  var ind = bar.querySelector(".botbar-ind");

  /** Tools this guide actually rendered — `learn` is hidden until a trip is reflected on. */
  function liveTools() {
    return TOOL_KEYS.filter(function (k) {
      var b = tabs.querySelector('.gtab[data-tab="' + k + '"]');
      return b && !b.hidden;
    });
  }

  /** Park the underline over the live group slot (or hide it inside a tool panel). */
  function moveIndicator() {
    if (!ind) return;
    var on = bar.querySelector(".botslot-on");
    if (!on || on.hidden) { ind.classList.remove("on"); return; }
    ind.classList.add("on");
    ind.style.width = on.offsetWidth + "px";
    ind.style.setProperty("--mn-ind-x", on.offsetLeft + "px");
  }
  // Exposed so the swipe gesture can drive the same element from a finger instead of
  // standing up a second indicator that could disagree with this one.
  bar.__mnIndicator = { move: moveIndicator, el: ind, slots: groupSlots };

  function currentIdx() {
    var a = tabs.querySelector(".gtab-active");
    if (!a) return -1;
    var v = parseInt(a.getAttribute("data-tab"), 10);
    return isNaN(v) ? -1 : v; // a tool panel is open → no content group is current
  }
  function currentTool() {
    var a = tabs.querySelector(".gtab-active");
    var t = a && a.getAttribute("data-tab");
    return t && TOOL_KEYS.indexOf(t) !== -1 ? t : null;
  }

  function renderGroups(cur) {
    seated = seat(seated, promoted(counts, order, cur, groupSlots.length));
    groupSlots.forEach(function (el, k) {
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
  }

  function renderTool(cur) {
    if (!toolSlot) return;
    var live = liveTools();
    if (!live.length) { toolSlot.hidden = true; return; }
    toolSlot.hidden = false;
    // The open tool holds the slot while it's open, for the same reason the current group
    // does: the bar must never point away from where the reader is.
    var key = cur || rankOrder(toolCounts, live)[0] || live[0];
    toolSlot.setAttribute("data-tab", key);
    var full = tabs.querySelector('.gtab[data-tab="' + key + '"]');
    toolSlot.setAttribute("aria-label", (full && full.getAttribute("aria-label")) || TOOL_LABEL[key] || key);
    var txt = toolSlot.querySelector(".bslot-txt");
    if (txt) txt.textContent = TOOL_LABEL[key] || key;
    // A class, not `hidden`: the UA's `[hidden]{display:none}` does not apply to SVG
    // elements inside an HTML document, so `hidden` left all five icons stacked.
    toolSlot.querySelectorAll(".bslot-ico").forEach(function (ico) {
      ico.classList.toggle("bsi-on", ico.classList.contains("bsi-" + key));
    });
    var on = key === cur;
    toolSlot.classList.toggle("botslot-on", on);
    if (on) toolSlot.setAttribute("aria-current", "true");
    else toolSlot.removeAttribute("aria-current");
  }

  function render() {
    renderGroups(currentIdx());
    renderTool(currentTool());
    moveIndicator();
  }

  groupSlots.concat(toolSlot ? [toolSlot] : []).forEach(function (el) {
    el.addEventListener("click", function () {
      var t = this.getAttribute("data-tab");
      if (t == null) return;
      tapHaptic();
      if (this.classList.contains("botslot-on") && !this.classList.contains("botslot-tool")) {
        // Tapping the group you are already in scrolls it back to the top — the platform
        // convention for re-tapping an active tab, and the cheapest "start over".
        var cb = document.getElementById("grp-" + t);
        if (cb) cb.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      var btn = tabs.querySelector('.gtab[data-tab="' + t + '"]');
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
  var mo = new MutationObserver(function () {
    var cur = currentIdx();
    if (cur >= 0 && order[cur]) {
      counts = recordOpen(counts, order[cur]);
      ctx.store.write(COUNT_KEY, JSON.stringify(counts));
    } else {
      var tool = currentTool();
      if (tool) {
        toolCounts = recordOpen(toolCounts, tool);
        ctx.store.write(TOOL_KEY, JSON.stringify(toolCounts));
      }
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
