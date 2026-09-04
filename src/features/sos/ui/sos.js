/* Waypoint SOS — the layered emergency tool (design-system.md §28; locked 2026-09-04).
   One action away from every guide surface (the topbar SOS control), never a destination.

   THREE FOCUSED LAYERS, in order:
     1. what help is needed — one large card per VERIFIED line (EMERGENCY in
        src/data/countries.mjs, delivered via tgConfig), plus the elevated advisory when one
        exists and a direct list of every number for the traveler who already knows;
     2. quick details + where you are — the chosen number, what it is for, and the context the
        page already holds: today's day and current stop (the Trip cockpit), the guide's own
        base address in native script when it carries one. Nothing is fetched, nothing guessed;
     3. connect / confirm — the call itself as one enormous tel: action, with copy as the
        fallback for a phone that cannot dial.

   Numbers are baked into the page, so every layer works offline. Countries without verified
   numbers get no control at all — never a guessed number. Conservative motion: layers cut,
   nothing slides. Focus moves with the layer and returns to the opener on close. */

import { trapFocus } from "../../../scripts/util.js";
import { attachSheetDrag } from "../../../scripts/sheet-drag.js";

(function () {
  var cfgEl = document.getElementById("tgConfig");
  var cfg = cfgEl ? JSON.parse(cfgEl.textContent || "{}") : {};
  var em = cfg.emergency;
  var adv = cfg.advisory && cfg.advisory.level >= 2 ? cfg.advisory : null;
  var hasEm = !!(em && em.lines && em.lines.length);
  if (!hasEm && !adv) return;

  var btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("aria-label", "Emergency help");
  btn.setAttribute("aria-haspopup", "dialog");
  btn.innerHTML = "<svg class='tb-ico' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><circle cx='12' cy='12' r='9'/><circle cx='12' cy='12' r='3.4'/><path d='m9.6 9.6-4-4M18.4 18.4l-4-4M14.4 9.6l4-4M9.6 14.4l-4 4'/></svg><span class='tb-label'>SOS</span>";
  var mountPoint = document.querySelector("[data-sos-mount]");
  var topRight = document.querySelector(".topbar-right");
  if (mountPoint) { btn.className = "topbar-btn topbar-sos"; mountPoint.appendChild(btn); }
  else if (topRight) { btn.className = "topbar-btn topbar-sos"; topRight.insertBefore(btn, topRight.firstChild); }
  else { btn.className = "sos-btn"; document.body.appendChild(btn); }

  var country = document.documentElement.getAttribute("data-country") || "";
  var PRIMARY = /police|fire|ambulance|all emergencies/i;
  function splitLabel(label) {
    var m = /^([^(—]+?)\s*(?:\(([^)]*)\)|—\s*(.+))?\s*$/.exec(label || "");
    if (!m) return { main: label || "", hint: "" };
    return { main: (m[1] || label).trim(), hint: (m[2] || m[3] || "").trim() };
  }
  var lines = hasEm ? em.lines.slice() : [];

  var sheet = document.createElement("div");
  sheet.className = "sos-sheet" + (hasEm && em.fallback ? " sos-sheet--fallback" : "");
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-modal", "true");
  sheet.setAttribute("aria-label", "Emergency help");
  sheet.hidden = true;
  sheet.innerHTML =
    '<div class="sos-inner" data-sos-step="1">' +
      '<p class="sos-head"><span class="sos-head-k">Emergency</span><span class="sos-head-where"></span><span class="sos-step" aria-live="polite"></span><button class="sos-x" type="button" aria-label="Close">✕</button></p>' +
      (adv ? '<a class="sos-advisory" target="_blank" rel="noopener"><span class="sos-advisory-level"></span><span class="sos-advisory-title"></span><span class="sos-advisory-summary"></span></a>' : "") +
      /* Layer 1 */
      '<section class="sos-layer" data-sos-layer="1" aria-label="What help do you need">' +
        (hasEm ? '<h2 class="sos-q">What do you need?</h2><div class="sos-cats"></div>' +
          '<details class="sos-all"><summary class="sos-all-k">Every verified number</summary><div class="sos-more"></div></details>' : "") +
        (hasEm ? '<p class="sos-note"></p>' : "") +
      "</section>" +
      /* Layer 2 */
      '<section class="sos-layer" data-sos-layer="2" aria-label="Details and where you are" hidden>' +
        '<button class="sos-back" type="button" data-sos-back>← Change</button>' +
        '<p class="sos-pick-k"></p><p class="sos-pick-num"></p><p class="sos-pick-hint"></p>' +
        '<div class="sos-ctx"><p class="sos-ctx-k">Where you are</p><dl class="sos-ctx-list"></dl></div>' +
        '<button class="sos-next" type="button" data-sos-next>Continue to call →</button>' +
      "</section>" +
      /* Layer 3 */
      '<section class="sos-layer" data-sos-layer="3" aria-label="Connect" hidden>' +
        '<button class="sos-back" type="button" data-sos-back>← Back</button>' +
        '<a class="sos-call sos-call--confirm" href="#"><span class="sos-call-num"></span><span class="sos-call-label"></span><span class="sos-call-hint">Tap to call now</span></a>' +
        '<button class="sos-copy" type="button" data-sos-copy>Copy the number</button>' +
        '<p class="sos-copied" role="status" aria-live="polite"></p>' +
      "</section>" +
      '<p class="sos-offline">Numbers are stored with this guide and dial without a connection.</p>' +
    "</div>";
  document.body.appendChild(sheet);
  var inner = sheet.querySelector(".sos-inner");
  var stepEl = sheet.querySelector(".sos-step");
  sheet.querySelector(".sos-head-where").textContent = country;

  // Every piece of text is set with textContent — the data is the repository's, the habit holds.
  function catCard(line) {
    var parts = splitLabel(line.label);
    var b = document.createElement("button");
    b.type = "button";
    b.className = "sos-cat" + (PRIMARY.test(line.label) ? " sos-cat--primary" : "");
    var k = document.createElement("span"); k.className = "sos-cat-label"; k.textContent = parts.main;
    var h = document.createElement("span"); h.className = "sos-cat-hint"; h.textContent = parts.hint || ("Dial " + line.num);
    var n = document.createElement("span"); n.className = "sos-cat-num"; n.textContent = line.num;
    b.appendChild(k); b.appendChild(h); b.appendChild(n);
    b.addEventListener("click", function () { choose(line); });
    return b;
  }
  function rowLink(line) {
    var parts = splitLabel(line.label);
    var a = document.createElement("a");
    a.className = "sos-row";
    a.href = "tel:" + encodeURIComponent(line.num);
    var n = document.createElement("span"); n.className = "sos-num"; n.textContent = line.num;
    var l = document.createElement("span"); l.className = "sos-label";
    var lm = document.createElement("span"); lm.className = "sos-label-main"; lm.textContent = parts.main; l.appendChild(lm);
    if (parts.hint) { var lh = document.createElement("span"); lh.className = "sos-label-hint"; lh.textContent = parts.hint; l.appendChild(lh); }
    a.appendChild(n); a.appendChild(l);
    return a;
  }
  if (hasEm) {
    var cats = sheet.querySelector(".sos-cats");
    var more = sheet.querySelector(".sos-more");
    lines.forEach(function (l) { cats.appendChild(catCard(l)); more.appendChild(rowLink(l)); });
    sheet.querySelector(".sos-note").textContent = em.note || "";
  }
  if (adv) {
    var advEl = sheet.querySelector(".sos-advisory");
    advEl.href = adv.source_url;
    advEl.querySelector(".sos-advisory-level").textContent = "⚠ Level " + adv.level;
    advEl.querySelector(".sos-advisory-title").textContent = adv.title;
    advEl.querySelector(".sos-advisory-summary").textContent = adv.summary || ("Official advisory — verified " + adv.verified_on + ". Tap for the source.");
  }

  /* Layer 2's context is read from what the page already shows — never composed here. */
  function context() {
    var out = [];
    var text = function (sel) { var n = document.querySelector(sel); return n ? (n.textContent || "").trim() : ""; };
    var dayTitle = text("[data-trip-now] .tn-title");
    var dayWhen = text("[data-trip-now] .tn-kicker > span");
    if (dayTitle) out.push(["Today", (dayWhen ? dayWhen + " — " : "") + dayTitle]);
    var now = text("[data-trip-now] .tn-atom--now .tn-name");
    if (now) out.push(["Current stop", now]);
    var addr = document.querySelector("[data-addr-kr]");
    if (addr) out.push(["Base address", addr.getAttribute("data-addr-kr") + ((addr.textContent || "").trim() && (addr.textContent || "").trim() !== addr.getAttribute("data-addr-kr") ? " · " + (addr.textContent || "").trim() : "")]);
    var title = cfg.title || text(".orient-title");
    if (title) out.push(["Trip", title + (country && country !== title ? " · " + country : "")]);
    return out;
  }

  var current = null;
  function show(step, focusSel) {
    inner.setAttribute("data-sos-step", String(step));
    sheet.querySelectorAll("[data-sos-layer]").forEach(function (l) { l.hidden = l.getAttribute("data-sos-layer") !== String(step); });
    stepEl.textContent = "Step " + step + " of 3";
    inner.scrollTop = 0;
    var f = focusSel ? sheet.querySelector(focusSel) : null;
    if (f) f.focus();
  }
  function choose(line) {
    current = line;
    var parts = splitLabel(line.label);
    sheet.querySelector(".sos-pick-k").textContent = parts.main;
    sheet.querySelector(".sos-pick-num").textContent = line.num;
    sheet.querySelector(".sos-pick-hint").textContent = parts.hint || "";
    var dl = sheet.querySelector(".sos-ctx-list");
    dl.innerHTML = "";
    var ctx = context();
    sheet.querySelector(".sos-ctx").hidden = !ctx.length;
    ctx.forEach(function (pair) {
      var dt = document.createElement("dt"); dt.textContent = pair[0];
      var dd = document.createElement("dd"); dd.textContent = pair[1];
      dl.appendChild(dt); dl.appendChild(dd);
    });
    var call = sheet.querySelector(".sos-call--confirm");
    call.href = "tel:" + encodeURIComponent(line.num);
    call.setAttribute("aria-label", "Call " + line.num + " — " + parts.main);
    call.querySelector(".sos-call-num").textContent = line.num;
    call.querySelector(".sos-call-label").textContent = parts.main;
    show(2, "[data-sos-next]");
  }
  sheet.querySelector("[data-sos-next]").addEventListener("click", function () { show(3, ".sos-call--confirm"); });
  sheet.querySelectorAll("[data-sos-back]").forEach(function (b) {
    b.addEventListener("click", function () {
      var step = parseInt(inner.getAttribute("data-sos-step"), 10);
      show(step === 3 ? 2 : 1, step === 3 ? "[data-sos-next]" : ".sos-cat");
    });
  });
  sheet.querySelector("[data-sos-copy]").addEventListener("click", function () {
    if (!current) return;
    var out = sheet.querySelector(".sos-copied");
    (navigator.clipboard ? navigator.clipboard.writeText(current.num) : Promise.reject()).then(
      function () { out.textContent = current.num + " copied"; },
      function () { window.prompt("Copy this number:", current.num); }
    );
  });

  var lastFocus = null;
  function open() {
    lastFocus = document.activeElement;
    sheet.hidden = false;
    show(1, hasEm ? ".sos-cat" : ".sos-x");
  }
  function close() {
    sheet.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  btn.addEventListener("click", open);
  sheet.querySelector(".sos-x").addEventListener("click", close);
  attachSheetDrag(inner, close);
  sheet.addEventListener("click", function (e) { if (e.target === sheet) close(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !sheet.hidden) close(); });
  trapFocus(sheet, function () { return !sheet.hidden; });
})();
