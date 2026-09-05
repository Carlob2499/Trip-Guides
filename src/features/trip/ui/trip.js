/* Trip — the clock-dependent half (design-system.md D6-19/31/48). The layout rendered every
   phase's markup; this decides which phase is true against the DESTINATION's calendar and
   paints the parts that cannot be known at build time:

     · the lifecycle stamp, countdown and destination clock in the hero;
     · the ACTIVE cockpit (board 02): the left rail's standing answers — how far into the
       trip today is, the next stop with its first Get-there link, today's row of the wired
       forecast, the day's focus — the day's stops as photo ROWS in the centre in the order
       Now → Next → rest of day, and the measured strip beside today's map;
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

/* One stop, as the board draws it: a 96×72 photo, a time kicker, the name, the guide's own
   note, and a chevron into the day's plan. Now and Next carry the Get-there links; the rest of
   the day is the same row without them. Nothing is estimated — a stop with no clock time keeps
   its authored label ("morning") and no time is invented for it. */
function stopRow(stop, role, country, origin, images, anchor, leave) {
  var branch = stop.branch ? '<span class="tn-branch">' + esc(stop.branch) + "</span>" : "";
  var kick = role === "now" ? "Now" : role === "next" ? "Up next" : "";
  var time = stop.time ? '<span class="tn-row-time">' + esc(stop.time) + "</span>" : "";
  var note = stop.note ? '<p class="tn-row-note">' + esc(stop.note) + "</p>" : "";
  var media = imageHtml(images, stop, "96px");
  var links = role === "rest" ? "" : linksHtml(stop, country, origin);
  var go = anchor
    ? '<a class="tn-row-go" href="#' + esc(anchor) + '" data-dest-go="itinerary" aria-label="' + esc(stop.name) + ' in the itinerary"><span aria-hidden="true">›</span></a>'
    : "";
  return '<article class="tn-row tn-row--' + role + (media ? " tn-row--photo" : "") + '" data-tn-role="' + role + '">' +
    media +
    '<div class="tn-row-body">' +
      '<p class="tn-row-k">' + (kick ? '<span class="tn-row-role">' + kick + "</span>" : "") + time + branch + "</p>" +
      '<h3 class="tn-row-name">' + esc(stop.name) + "</h3>" + note + (leave || "") +
      (links ? '<div class="tn-go"><span class="tn-go-label">Get there</span>' + links + "</div>" : "") +
    "</div>" + go + "</article>";
}

/* Haversine, in km — the STRAIGHT-LINE separation of today's located stops in the order the
   itinerary puts them. It is labelled as such: the product routes nothing, so it must never
   read as a travelled or walked distance. */
function straightLineKm(pins) {
  if (!pins || pins.length < 2) return null;
  var R = 6371, total = 0;
  for (var i = 1; i < pins.length; i++) {
    var a = pins[i - 1], b = pins[i];
    var dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
    var la = a.lat * Math.PI / 180, lb = b.lat * Math.PI / 180;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(la) * Math.cos(lb);
    total += 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  return total;
}

/* The day's pace, as the guide wrote it: the lead segment before the first "·" is the value,
   the remainder is its sub-line. A guide that authored no pace gets no cell. */
function paceCell(day) {
  var src = day.pace || day.fit;
  if (!src) return null;
  var parts = String(src).split("·");
  return { value: parts[0].trim(), sub: parts.slice(1).join("·").trim() };
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
  var progEl = root.querySelector("[data-trip-prog]");
  var nextEl = root.querySelector("[data-trip-nextstop]");
  var focusEl = root.querySelector("[data-trip-focus]");
  var metricsEl = root.querySelector("[data-trip-metrics]");
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

  function todayPins(idx) {
    if (!mapMount) return [];
    try {
      var el = mapMount.querySelector("script[data-map-data]");
      return (JSON.parse(el.textContent || "{}").pins || []).filter(function (p) { return p.dayIdx === idx; });
    } catch (e) { return []; }
  }

  /* The left rail: the standing answers for today. Every card hides itself when the guide has
     nothing to put in it — an empty shell would imply a certainty the data does not have. */
  function paintRail(idx, day, f) {
    if (progEl) {
      var label = progEl.querySelector("[data-trip-prog-label]");
      var fill = progEl.querySelector("[data-trip-prog-fill]");
      if (label) label.textContent = "Day " + (idx + 1) + " of " + days.length;
      if (fill) fill.style.width = Math.round(((idx + 1) / days.length) * 100) + "%";
      progEl.hidden = false;
    }
    if (nextEl) {
      var s = f.next || f.now;
      if (!s) { nextEl.hidden = true; nextEl.innerHTML = ""; }
      else {
        var im = images && images[placeKey(s.name)];
        var thumb = im ? '<span class="tn-ns-media"><img src="' + esc(im.thumb || im.src) + '" alt="" loading="lazy" decoding="async" onerror="this.parentNode.remove()"></span>' : "";
        var go = "";
        if (s.lat != null && s.lng != null) {
          var first = universalTransitLinks(s.lat, s.lng, null).concat(nativeTransitLinks(country, s.lat, s.lng, s.name, origin))[0];
          if (first) go = '<a class="tn-ns-go" href="' + esc(first.href) + '" target="_blank" rel="noopener">View directions on ' + esc(first.label) + " ↗</a>";
        }
        nextEl.innerHTML = '<p class="tn-card-k">' + (f.next ? "Next stop" : "Now") + "</p>" +
          '<div class="tn-ns-row">' + thumb + '<span class="tn-ns-txt"><b class="tn-ns-name">' + esc(s.name) + "</b>" +
          (s.time ? '<span class="tn-ns-sub">' + esc(s.time) + "</span>" : "") + "</span></div>" + go;
        nextEl.hidden = false;
      }
    }
    if (focusEl) {
      if (day.tldr) {
        focusEl.innerHTML = '<p class="tn-card-k">Today’s focus</p><p class="tn-focus-txt">' + esc(day.tldr) + "</p>";
        focusEl.hidden = false;
      } else { focusEl.hidden = true; focusEl.innerHTML = ""; }
    }
  }

  /* The measured strip beside the map: three cells, each COUNTED, SUMMED or QUOTED from the
     day. The board's step count and estimated active time have no source in this product. */
  function paintMetrics(idx, day) {
    if (!metricsEl) return;
    var cells = [];
    if (day.stops.length) cells.push({ k: "Stops today", v: String(day.stops.length), s: day.stops.length === 1 ? "one stop" : "in the day’s order" });
    var km = straightLineKm(todayPins(idx));
    if (km !== null) cells.push({ k: "Straight-line", v: (km < 10 ? km.toFixed(1) : String(Math.round(km))) + " km", s: "between today’s stops, not a route" });
    var pace = paceCell(day);
    if (pace) cells.push({ k: "Pace", v: pace.value, s: pace.sub });
    metricsEl.innerHTML = cells.map(function (c) {
      return '<div class="tn-metric"><dt>' + esc(c.k) + "</dt><dd>" + esc(c.v) + "</dd>" + (c.s ? '<p class="tn-metric-s">' + esc(c.s) + "</p>" : "") + "</div>";
    }).join("");
    metricsEl.hidden = !cells.length;
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
    paintRail(idx, day, f);
    paintMetrics(idx, day);
    // 1 — where today sits: the day's own name and the way to its full plan.
    var h = '<div class="tn-day">' +
      '<p class="tn-kicker"><span>' + (arrival ? "Arrival" : "Today") + " · " + esc(day.date) + '</span><a href="#' + esc(day.anchor) + '" data-dest-go="itinerary" class="tn-daylink">Day ' + (idx + 1) + " of " + days.length + " in the itinerary →</a></p>" +
      '<h2 class="tn-title">' + esc(day.title) + "</h2>" +
      "</div>";
    // 2 — the day as rows, in the itinerary's own order: Now, then Next, then the remainder.
    if (!day.stops.length) {
      h += '<p class="tn-none">No timed stops today — the day\'s plan is in the itinerary.</p>';
    } else {
      var rest = arrival ? f.later.slice(0, 1) : f.later;
      h += '<div class="tn-rows">';
      if (f.now) h += stopRow(f.now, "now", country, origin, images, day.anchor, leaveHtml(f.now, f.next, nowMin));
      if (f.next) h += stopRow(f.next, "next", country, origin, images, day.anchor);
      if (!f.now && !f.next) h += '<p class="tn-none">Every stop today is checked off.</p>';
      rest.forEach(function (st) { h += stopRow(st, "rest", country, origin, images, day.anchor); });
      h += "</div>";
      if (f.done.length) h += '<p class="tn-done">' + f.done.length + " stop" + (f.done.length === 1 ? "" : "s") + " behind you</p>";
    }
    // 3 — material problem: the official advisory when elevated. 4 — the fallback the guide
    // already carries. 5 — the day's fit note when the pace cell is not already carrying it.
    var side = "";
    var adv = cfg.advisory && cfg.advisory.level >= 2 ? cfg.advisory : null;
    if (adv) side += '<a class="tn-warn" href="' + esc(adv.source_url) + '" target="_blank" rel="noopener"><span class="tn-warn-k">Advisory · Level ' + adv.level + "</span><span>" + esc(adv.title) + "</span></a>";
    if (day.planB) side += '<div class="tn-planb planb-' + day.planB.trigger + '"><span class="tn-warn-k">' + (day.planB.trigger === "rain" ? "Rain plan" : "If it's closed") + "</span><span>" + day.planB.body + "</span></div>";
    if (day.fit && !day.pace) side += '<p class="tn-fit"><span class="tn-warn-k">Fit</span><span>' + esc(day.fit) + "</span></p>";
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
