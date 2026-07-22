/* Waypoint SOS sheet — one tap to verified emergency numbers.
   The guides' Health & safety sections carry excellent emergency detail, but
   it sits five taps deep in prose — useless mid-crisis to a flustered,
   non-technical traveler. This surfaces ONLY verified data (EMERGENCY table
   in src/data/countries.mjs, delivered via tgConfig; countries without
   verified numbers get no button at all — never guessed) as tel: links in
   huge type. Works offline (numbers are baked into the page).

   Also surfaces the guide's official travel-advisory (docs/FEATURES.md #9), when
   elevated (level >= 2) — the button itself renders even with no emergency numbers
   researched yet, as long as an elevated advisory exists to show.

   R3: claimed aria-modal without trapping focus — Tab could walk out of the sheet into
   the page behind it. Now uses src/scripts/util.js's shared trapFocus. */

import { trapFocus } from "../../../scripts/util.js";

(function () {
  var cfgEl = document.getElementById("tgConfig");
  var cfg = cfgEl ? JSON.parse(cfgEl.textContent || "{}") : {};
  var em = cfg.emergency;
  // Advisory pill (docs/FEATURES.md #9) — honest-blank: a normal-precautions guide
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
  var topRight = document.querySelector(".topbar-right");
  if (topRight) {
    btn.className = "topbar-btn topbar-sos";
    topRight.insertBefore(btn, topRight.firstChild);
  } else {
    btn.className = "sos-btn";
    document.body.appendChild(btn);
  }

  var hasEm = !!(em && em.lines && em.lines.length);

  var sheet = document.createElement("div");
  // A fallback entry (EU-wide 112 only, no researched local numbers) renders
  // warn-toned so it never masquerades as a fully-verified emergency sheet.
  sheet.className = "sos-sheet" + (hasEm && em.fallback ? " sos-sheet--fallback" : "");
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-modal", "true");
  sheet.setAttribute("aria-label", "Emergency numbers");
  sheet.hidden = true;
  var rows = hasEm ? em.lines.map(function (l) {
    return '<a class="sos-row" href="tel:' + encodeURIComponent(l.num) + '">' +
      '<span class="sos-num"></span><span class="sos-label"></span></a>';
  }).join("") : "";
  sheet.innerHTML =
    '<div class="sos-inner">' +
    '<p class="sos-head">Emergency<button class="sos-x" type="button" aria-label="Close">✕</button></p>' +
    (adv ? '<a class="sos-advisory" target="_blank" rel="noopener"><span class="sos-advisory-level"></span><span class="sos-advisory-title"></span><span class="sos-advisory-summary"></span></a>' : '') +
    rows +
    (hasEm ? '<p class="sos-note"></p>' : '') + '</div>';
  document.body.appendChild(sheet);
  // Text set via textContent (never innerHTML) — data is trusted but keep the habit.
  if (hasEm) {
    sheet.querySelectorAll(".sos-row").forEach(function (row, i) {
      row.querySelector(".sos-num").textContent = em.lines[i].num;
      row.querySelector(".sos-label").textContent = em.lines[i].label;
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
  sheet.addEventListener("click", function (e) { if (e.target === sheet) close(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !sheet.hidden) close();
  });
  trapFocus(sheet, function () { return !sheet.hidden; });
})();
