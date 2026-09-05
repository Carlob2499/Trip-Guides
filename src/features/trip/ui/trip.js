/* Trip — the clock-dependent half (design-system.md D6-19/31/48). The layout rendered every
   phase's markup; this decides which phase is true against the DESTINATION's calendar and
   paints the parts that cannot be known at build time:

     · the lifecycle stamp, countdown and destination clock in the hero;
     · the ACTIVE composition: today's Now → Next → Get there → warning → fallback → rest of
       day, as large structured atoms, from the canonical #tripData days (the arrival day
       renders as autopilot: current step dominant, the next two compressed);
     · the "N of M still open" summary over the readiness stack.

   Every minute it re-reads the clock; every check-off in the Itinerary re-focuses it. It
   never invents a time: a stop with no clock time is placed by the day's own order. */

import { tripPhase, todayIndex, focusFor, daysToGo, minutesUntil, untilLabel } from "../model/lifecycle";
import { tripWindow } from "../../../lib/trip-dates";
import { todayInTz, esc, readStoredRecord } from "../../../scripts/util.js";
import { universalTransitLinks, nativeTransitLinks } from "../../../lib/transit-links";
import { osmEmbedUrl } from "../../../lib/map-embed";

function destNowMinutes(tz) {
  try {
    var p = {};
    new Intl.DateTimeFormat("en-US", { timeZone: tz, hour12: false, hour: "2-digit", minute: "2-digit" })
      .formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    return (parseInt(p.hour, 10) % 24) * 60 + parseInt(p.minute, 10);
  } catch (e) { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
}

function linksHtml(stop, country, origin) {
  if (stop.lat == null || stop.lng == null) return "";
  var links = universalTransitLinks(stop.lat, stop.lng, null).concat(nativeTransitLinks(country, stop.lat, stop.lng, stop.name, origin));
  return '<span class="transit-links">' + links.map(function (l) {
    return '<a class="transit-link" href="' + esc(l.href) + '" target="_blank" rel="noopener">' + esc(l.label) + ' ↗</a>';
  }).join("") + "</span>";
}

/* The same name key guide-view.ts builds #tripImages with: a stop shows the repository photo
   of the place it names, or nothing — never a guessed picture. */
function placeKey(name) {
  return String(name || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\u3131-\uD79D]+/g, " ").trim();
}
function imageHtml(images, stop, sizes) {
  var im = images && images[placeKey(stop.name)];
  if (!im) return "";
  return '<span class="tn-media"><img class="tn-img" src="' + esc(im.src) + '"' + (im.srcset ? ' srcset="' + esc(im.srcset) + '"' : "") +
    ' sizes="' + sizes + '" alt="" loading="eager" decoding="async" onerror="var a=this.closest(\'.tn-atom\');this.closest(\'.tn-media\').hidden=true;if(a)a.classList.remove(\'tn-atom--photo\')"></span>';
}

/* "Leave by" (design-system.md §24, third in the hierarchy) is shown only from data the guide
   holds: an authored leave-by on the current stop, or the next stop's own clock time with a
   countdown against the destination clock. Never a travel-time estimate. */
function leaveHtml(stop, next, nowMinutes) {
  if (stop.leaveBy) return '<p class="tn-leave"><span class="tn-leave-k">Leave by</span><span class="tn-leave-t">' + esc(stop.leaveBy) + "</span></p>";
  if (!next) return "";
  var until = minutesUntil(next.time, nowMinutes);
  if (until === null) return "";
  return '<p class="tn-leave"><span class="tn-leave-k">Next at</span><span class="tn-leave-t">' + esc(next.time) + '</span><span class="tn-leave-in">' + esc(untilLabel(until)) + "</span></p>";
}

function stopAtom(stop, role, country, origin, index, images, leave) {
  var branch = stop.branch ? '<span class="tn-branch">' + esc(stop.branch) + "</span>" : "";
  var time = stop.time ? '<span class="tn-time">' + esc(stop.time) + "</span>" : "";
  var note = stop.note ? '<p class="tn-note">' + esc(stop.note) + "</p>" : "";
  var links = linksHtml(stop, country, origin);
  var num = index != null ? '<span class="tn-num">Stop ' + String(index + 1).padStart(2, "0") + "</span>" : "";
  var media = imageHtml(images, stop, role === "now" ? "(min-width:900px) 40vw, 100vw" : "96px");
  return '<article class="tn-atom tn-atom--' + role + (media ? " tn-atom--photo" : "") + '" data-tn-role="' + role + '">' +
    media +
    '<div class="tn-body">' +
      '<p class="tn-role"><span class="tn-role-k">' + (role === "now" ? "Now" : "Next") + "</span>" + time + branch + num + "</p>" +
      '<h3 class="tn-name">' + esc(stop.name) + "</h3>" + note + (leave || "") +
      (links ? '<div class="tn-go"><span class="tn-go-label">Get there</span>' + links + "</div>" : "") +
    "</div></article>";
}

export function initTrip() {
  var root = document.querySelector("[data-trip]");
  var dataEl = document.getElementById("tripData");
  if (!root || !dataEl) return;
  var days;
  try { days = JSON.parse(dataEl.textContent || "[]"); } catch (e) { return; }
  var images = {};
  try { var imEl = document.getElementById("tripImages"); images = imEl ? JSON.parse(imEl.textContent || "{}") : {}; } catch (e) { images = {}; }
  var cfgEl = document.getElementById("tgConfig");
  var cfg = cfgEl ? JSON.parse(cfgEl.textContent || "{}") : {};
  var tz = cfg.destTzIana || null;
  var country = document.documentElement.getAttribute("data-country") || "";
  var origin = location.origin + (document.body.getAttribute("data-base") || "");
  var storeKey = document.body.getAttribute("data-storekey") || "guide";
  var first = cfg.firstDayDate || null, last = cfg.lastDayDate || null;
  var stamp = root.querySelector("[data-trip-stamp]");
  var stats = root.querySelector("[data-trip-stats]");
  var nowEl = root.querySelector("[data-trip-now]");
  var phases = root.querySelectorAll("[data-trip-phase]");
  var mapAside = root.querySelector("[data-trip-map]");
  var mapMount = mapAside ? mapAside.querySelector("[data-itin-map]") : null;
  var mapDayShown = -1;

  /* Today's route on the map: tell the live map which day (gmaps-render lens "today") and, for the
     fallback embed, frame today's located stops — from the pins the page already carries. */
  function paintMap(idx) {
    if (!mapAside || idx === mapDayShown) return;
    mapDayShown = idx;
    var day = days[idx];
    var title = mapAside.querySelector("[data-trip-map-title]");
    if (title) title.textContent = (day && day.date ? day.date : "Today") + " on the map";
    var open = mapAside.querySelector("[data-trip-map-open]");
    if (open) open.setAttribute("data-open-map-day", String(idx));
    if (!mapMount) return;
    mapMount.setAttribute("data-map-day", String(idx));
    var pins;
    try { var dataEl = mapMount.querySelector("script[data-map-data]"); pins = (JSON.parse(dataEl.textContent || "{}").pins || []).filter(function (p) { return p.dayIdx === idx; }); } catch (e) { pins = []; }
    mapAside.hidden = !pins.length;
    var frame = mapMount.querySelector(".osmmap");
    var url = osmEmbedUrl(pins);
    if (frame && url) {
      if (frame.hasAttribute("src")) frame.setAttribute("src", url);
      else if (frame.hasAttribute("data-fallback-src")) frame.setAttribute("data-fallback-src", url);
      else frame.setAttribute("data-src", url);
    }
    try { document.dispatchEvent(new CustomEvent("tg:trip-day", { detail: { index: idx } })); } catch (e) { /* no listeners */ }
  }

  function destToday() {
    var t = todayInTz(tz);
    return t ? new Date(t.y, t.m - 1, t.d, 12) : new Date();
  }

  function paintPhase() {
    var now = destToday();
    var phase = tripPhase(first, last, now);
    root.setAttribute("data-phase", phase);
    phases.forEach(function (p) {
      var key = p.getAttribute("data-trip-phase");
      p.hidden = !(key === phase || (phase === "undated" && key === "pre"));
    });
    if (stamp) {
      stamp.textContent = phase === "active" ? "On this trip now" : phase === "post" ? "Trip complete" : phase === "pre" ? "Upcoming" : "Trip";
      stamp.setAttribute("data-state", phase);
    }
    if (stats) {
      var pills = [];
      var togo = daysToGo(first, last, now);
      if (phase === "pre" && togo !== null) pills.push({ cls: "trip-pill--accent", text: togo > 1 ? togo + " days to go" : togo === 1 ? "Tomorrow" : "Starts today" });
      if (phase === "active") {
        var idx = todayIndex(days.map(function (d) { return d.date; }), now);
        if (idx >= 0) pills.push({ cls: "trip-pill--accent", text: "Day " + (idx + 1) + " of " + days.length });
      }
      if (phase === "post") {
        var win = tripWindow(first, last, now);
        if (win.end) { var ago = Math.round((now - win.end) / 86400000); if (ago > 0) pills.push({ cls: "", text: ago + " days ago" }); }
      }
      if (tz && phase !== "post") {
        try {
          var fmt = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false });
          pills.push({ cls: "trip-pill--time", text: "Local " + fmt.format(new Date()) });
        } catch (_) {}
      }
      stats.innerHTML = pills.map(function (p) { return '<span class="trip-pill ' + p.cls + '">' + esc(p.text) + "</span>"; }).join("");
    }
    return phase;
  }

  function doneSet(dayIdx) {
    var state = readStoredRecord(function () { return localStorage; }, "tg-stops-" + storeKey);
    var set = new Set();
    Object.keys(state).forEach(function (k) {
      var parts = k.split("-");
      if (parseInt(parts[0], 10) === dayIdx) set.add(parseInt(parts[1], 10));
    });
    return set;
  }

  function paintNow() {
    if (!nowEl) return;
    var now = destToday();
    var idx = todayIndex(days.map(function (d) { return d.date; }), now);
    if (idx < 0) { nowEl.innerHTML = ""; if (mapAside) mapAside.hidden = true; return; }
    paintMap(idx);
    var day = days[idx];
    var arrival = idx === 0;
    var nowMin = destNowMinutes(tz);
    var f = focusFor(day.stops, nowMin, doneSet(idx));
    // 1 — where today sits: the day's own name and the way to its full plan.
    var h = '<div class="tn-day">' +
      '<p class="tn-kicker"><span>' + (arrival ? "Arrival" : "Today") + " · " + esc(day.date) + '</span><a href="#' + esc(day.anchor) + '" data-dest-go="itinerary" class="tn-daylink">Day ' + (idx + 1) + " of " + days.length + " in the itinerary →</a></p>" +
      '<h2 class="tn-title">' + esc(day.title) + "</h2>" +
      (day.tldr ? '<p class="tn-tldr">' + esc(day.tldr) + "</p>" : "") +
      "</div>";
    // 2 — Now, then Next: one dominant object, one compressed one. Get there rides inside each.
    if (!day.stops.length) {
      h += '<p class="tn-none">No timed stops today — the day\'s plan is in the itinerary.</p>';
    } else {
      h += '<div class="tn-stack">';
      if (f.now) h += stopAtom(f.now, "now", country, origin, day.stops.indexOf(f.now), images, leaveHtml(f.now, f.next, nowMin));
      if (f.next) h += stopAtom(f.next, "next", country, origin, day.stops.indexOf(f.next), images);
      if (!f.now && !f.next) h += '<p class="tn-none">Every stop today is checked off.</p>';
      h += "</div>";
    }
    // 3 — material problem: the official advisory when elevated. 4 — the fallback the guide
    // already carries. 5 — the day's fit note, quiet. Nothing here is invented.
    var side = "";
    var adv = cfg.advisory && cfg.advisory.level >= 2 ? cfg.advisory : null;
    if (adv) side += '<a class="tn-warn" href="' + esc(adv.source_url) + '" target="_blank" rel="noopener"><span class="tn-warn-k">Advisory · Level ' + adv.level + "</span><span>" + esc(adv.title) + "</span></a>";
    if (day.planB) side += '<div class="tn-planb planb-' + day.planB.trigger + '"><span class="tn-warn-k">' + (day.planB.trigger === "rain" ? "Rain plan" : "If it's closed") + "</span><span>" + day.planB.body + "</span></div>";
    if (day.fit) side += '<p class="tn-fit"><span class="tn-warn-k">Fit</span><span>' + esc(day.fit) + "</span></p>";
    // 6 — the remainder of the day, in the itinerary's own order, with its own times.
    var rest = arrival ? f.later.slice(0, 1) : f.later;
    if (rest.length) {
      side += '<div class="tn-rest"><p class="tn-rest-k">' + (arrival ? "Then" : "Rest of the day") + "</p><ol class=\"tn-rest-list\">" +
        rest.map(function (s) {
          var im = images && images[placeKey(s.name)];
          var thumb = im ? '<span class="tn-rest-thumb" aria-hidden="true"><img src="' + esc(im.thumb || im.src) + '" alt="" loading="lazy" decoding="async" onerror="this.parentNode.remove()"></span>' : "";
          return "<li" + (thumb ? ' class="tn-rest--photo"' : "") + ">" + (s.time ? '<span class="tn-rest-time">' + esc(s.time) + "</span>" : '<span class="tn-rest-time tn-rest-time--none" aria-hidden="true">—</span>') + thumb + '<span class="tn-rest-name">' + esc(s.name) + (s.branch ? ' <span class="tn-branch">' + esc(s.branch) + "</span>" : "") + "</span></li>";
        }).join("") +
        "</ol></div>";
    }
    if (f.done.length) side += '<p class="tn-done">' + f.done.length + " stop" + (f.done.length === 1 ? "" : "s") + " behind you</p>";
    if (side) h += '<div class="tn-side">' + side + "</div>";
    // The minute tick repaints only when something changed: a polite live region is not
    // re-announced, and the objects keep their identity (§8 reflow) between ticks.
    if (h === lastPaint) return;
    lastPaint = h;
    nowEl.innerHTML = h;
  }
  var lastPaint = null;

  function paintReadiness() {
    root.querySelectorAll("[data-readiness]").forEach(function (block) {
      var key = "tg-readiness-" + block.getAttribute("data-readiness");
      var ticked = readStoredRecord(function () { return localStorage; }, key);
      var boxes = block.querySelectorAll("[data-readiness-list] [data-rem-id]");
      var open = 0;
      boxes.forEach(function (b) { if (!ticked[b.getAttribute("data-rem-id")]) open++; });
      var sub = block.querySelector("[data-readiness-open]");
      if (sub) sub.textContent = boxes.length ? (open ? open + " of " + boxes.length + " still open" : "All " + boxes.length + " settled") : "";
      block.classList.toggle("trip-priorities--settled", boxes.length > 0 && open === 0);
    });
  }

  var phase = paintPhase();
  if (phase === "active") paintNow();
  paintReadiness();
  document.addEventListener("tg:readiness", paintReadiness);
  document.addEventListener("tg:stops", function () { if (root.getAttribute("data-phase") === "active") paintNow(); });
  var timer = setInterval(function () { var p = paintPhase(); if (p === "active") paintNow(); }, 60000);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { clearInterval(timer); timer = null; }
    else if (!timer) { var p = paintPhase(); if (p === "active") paintNow(); timer = setInterval(function () { var q = paintPhase(); if (q === "active") paintNow(); }, 60000); }
  });
}

if (typeof document !== "undefined" && document.querySelector("[data-trip]")) initTrip();
