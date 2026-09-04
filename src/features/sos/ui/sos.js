/* Waypoint SOS sheet — one tap to verified emergency numbers.
   The guides' Health & safety sections carry excellent emergency detail, but
   it sits five taps deep in prose — useless mid-crisis to a flustered,
   non-technical traveler. This surfaces ONLY verified data (EMERGENCY table
   in src/data/countries.mjs, delivered via tgConfig; countries without
   verified numbers get no button at all — never guessed) as tel: links in
   huge type. Works offline (numbers are baked into the page).

   Also surfaces the guide's official travel-advisory (docs/archive/INDEX.md → FEATURES #9), when
   elevated (level >= 2) — the button itself renders even with no emergency numbers
   researched yet, as long as an elevated advisory exists to show.

   R3: claimed aria-modal without trapping focus — Tab could walk out of the sheet into
   the page behind it. Now uses src/scripts/util.js's shared trapFocus. */

import { trapFocus } from "../../../scripts/util.js";
import { attachSheetDrag } from "../../../scripts/sheet-drag.js";

(function () {
  var cfgEl = document.getElementById("tgConfig");
  var cfg = cfgEl ? JSON.parse(cfgEl.textContent || "{}") : {};
  var em = cfg.emergency;
  // Advisory pill (docs/archive/INDEX.md → FEATURES #9) — honest-blank: a normal-precautions guide
  // (level 1, or the field absent/never researched) shows nothing here at all.
  var adv = cfg.advisory && cfg.advisory.level >= 2 ? cfg.advisory : null;
  if ((!em || !em.lines || !em.lines.length) && !adv) return;

  // Mount in the topbar chrome (top of screen, out of the thumb-rest zone —
  // far less likely to be hit by accident than a floating bottom-corner FAB),
  // falling back to a small floating button only if the topbar is absent.
  var btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("aria-label", "Emergency numbers");
  btn.setAttribute("aria-haspopup", "dialog");
  btn.innerHTML = "<svg class='tb-ico' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><circle cx='12' cy='12' r='9'/><circle cx='12' cy='12' r='3.4'/><path d='m9.6 9.6-4-4M18.4 18.4l-4-4M14.4 9.6l4-4M9.6 14.4l-4 4'/></svg><span class='tb-label'>SOS</span>";
  var mountPoint = document.querySelector("[data-sos-mount]");
  var topRight = document.querySelector(".topbar-right");
  if (mountPoint) {
    btn.className = "topbar-btn topbar-sos";
    mountPoint.appendChild(btn);
  } else if (topRight) {
    btn.className = "topbar-btn topbar-sos";
    topRight.insertBefore(btn, topRight.firstChild);
  } else {
    btn.className = "sos-btn";
    document.body.appendChild(btn);
  }

  var hasEm = !!(em && em.lines && em.lines.length);
  var country = document.documentElement.getAttribute("data-country") || "";

  /* The locked hierarchy (design-system.md §13): Police and Fire/Ambulance are the two
     enormous first-screen actions; every other verified line is visibly subordinate. A line
     is FIRST-LAYER by what it is, never by its position in the data. A researched label such
     as "Fire / Ambulance (free, say 'English please')" keeps its parenthetical as the hint
     under the button — nothing is dropped, nothing is invented. */
  var PRIMARY = /police|fire|ambulance|all emergencies/i;
  function splitLabel(label) {
    var m = /^([^(—]+?)\s*(?:\(([^)]*)\)|—\s*(.+))?\s*$/.exec(label || "");
    if (!m) return { main: label || "", hint: "" };
    return { main: (m[1] || label).trim(), hint: (m[2] || m[3] || "").trim() };
  }
  var lines = hasEm ? em.lines.slice() : [];
  var primary = lines.filter(function (l) { return PRIMARY.test(l.label); }).slice(0, 2);
  var secondary = lines.filter(function (l) { return primary.indexOf(l) === -1; });

  var sheet = document.createElement("div");
  // A fallback entry (EU-wide 112 only, no researched local numbers) renders
  // warn-toned so it never masquerades as a fully-verified emergency sheet.
  sheet.className = "sos-sheet" + (hasEm && em.fallback ? " sos-sheet--fallback" : "");
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-modal", "true");
  sheet.setAttribute("aria-label", "Emergency numbers");
  sheet.hidden = true;
  var primaryHtml = primary.map(function () {
    return '<a class="sos-call" href="#"><span class="sos-call-num"></span><span class="sos-call-label"></span><span class="sos-call-hint"></span></a>';
  }).join("");
  var secondaryHtml = secondary.map(function () {
    return '<a class="sos-row" href="#"><span class="sos-num"></span><span class="sos-label"><span class="sos-label-main"></span><span class="sos-label-hint"></span></span></a>';
  }).join("");
  sheet.innerHTML =
    '<div class="sos-inner">' +
    '<p class="sos-head"><span class="sos-head-k">Emergency</span><span class="sos-head-where"></span><button class="sos-x" type="button" aria-label="Close">✕</button></p>' +
    (adv ? '<a class="sos-advisory" target="_blank" rel="noopener"><span class="sos-advisory-level"></span><span class="sos-advisory-title"></span><span class="sos-advisory-summary"></span></a>' : '') +
    (primaryHtml ? '<div class="sos-primary">' + primaryHtml + '</div>' : '') +
    (secondaryHtml ? '<div class="sos-more"><p class="sos-more-k">More verified help</p>' + secondaryHtml + '</div>' : '') +
    (hasEm ? '<p class="sos-note"></p>' : '') +
    '<p class="sos-offline">Numbers are stored with this guide and dial without a connection.</p>' +
    '</div>';
  document.body.appendChild(sheet);
  // Text set via textContent (never innerHTML) — data is trusted but keep the habit.
  sheet.querySelector(".sos-head-where").textContent = country;
  if (hasEm) {
    sheet.querySelectorAll(".sos-call").forEach(function (row, i) {
      var l = primary[i], parts = splitLabel(l.label);
      row.href = "tel:" + encodeURIComponent(l.num);
      row.setAttribute("aria-label", "Call " + l.num + " — " + l.label);
      row.querySelector(".sos-call-num").textContent = l.num;
      row.querySelector(".sos-call-label").textContent = parts.main;
      row.querySelector(".sos-call-hint").textContent = parts.hint || "Tap to call";
    });
    sheet.querySelectorAll(".sos-row").forEach(function (row, i) {
      var l = secondary[i], parts = splitLabel(l.label);
      row.href = "tel:" + encodeURIComponent(l.num);
      row.querySelector(".sos-num").textContent = l.num;
      row.querySelector(".sos-label-main").textContent = parts.main;
      var hint = row.querySelector(".sos-label-hint");
      if (parts.hint) hint.textContent = parts.hint; else hint.remove();
    });
    sheet.querySelector(".sos-note").textContent = em.note || "";
  }
  if (adv) {
    var advEl = sheet.querySelector(".sos-advisory");
    advEl.href = adv.source_url;
    advEl.querySelector(".sos-advisory-level").textContent = "⚠ Level " + adv.level;
    advEl.querySelector(".sos-advisory-title").textContent = adv.title;
    advEl.querySelector(".sos-advisory-summary").textContent = adv.summary || ("Official advisory — verified " + adv.verified_on + ". Tap for the source.");
  }

  var lastFocus = null;
  function open() {
    lastFocus = document.activeElement;
    sheet.hidden = false;
    sheet.querySelector(".sos-x").focus();
  }
  function close() {
    sheet.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  btn.addEventListener("click", open);
  sheet.querySelector(".sos-x").addEventListener("click", close);
  // Drag the panel down to dismiss, same physics as the groups sheet. Attached to
  // .sos-inner, not the backdrop: dragging the dimmed area is not a sheet gesture.
  var inner = sheet.querySelector(".sos-inner");
  if (inner) attachSheetDrag(inner, close);
  sheet.addEventListener("click", function (e) { if (e.target === sheet) close(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !sheet.hidden) close();
  });
  trapFocus(sheet, function () { return !sheet.hidden; });
})();
