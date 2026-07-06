/* Waypoint SOS sheet — one tap to verified emergency numbers.
   The guides' Health & safety sections carry excellent emergency detail, but
   it sits five taps deep in prose — useless mid-crisis to a flustered,
   non-technical traveler. This surfaces ONLY verified data (EMERGENCY table
   in src/data/countries.mjs, delivered via tgConfig; countries without
   verified numbers get no button at all — never guessed) as tel: links in
   huge type. Works offline (numbers are baked into the page). */

(function () {
  var cfgEl = document.getElementById("tgConfig");
  var cfg = cfgEl ? JSON.parse(cfgEl.textContent || "{}") : {};
  var em = cfg.emergency;
  if (!em || !em.lines || !em.lines.length) return;

  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "sos-btn";
  btn.setAttribute("aria-label", "Emergency numbers");
  btn.setAttribute("aria-haspopup", "dialog");
  btn.textContent = "SOS";
  document.body.appendChild(btn);

  var sheet = document.createElement("div");
  sheet.className = "sos-sheet";
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-modal", "true");
  sheet.setAttribute("aria-label", "Emergency numbers");
  sheet.hidden = true;
  var rows = em.lines.map(function (l) {
    return '<a class="sos-row" href="tel:' + encodeURIComponent(l.num) + '">' +
      '<span class="sos-num"></span><span class="sos-label"></span></a>';
  }).join("");
  sheet.innerHTML =
    '<div class="sos-inner">' +
    '<p class="sos-head">Emergency<button class="sos-x" type="button" aria-label="Close">✕</button></p>' +
    rows +
    '<p class="sos-note"></p></div>';
  document.body.appendChild(sheet);
  // Text set via textContent (never innerHTML) — data is trusted but keep the habit.
  sheet.querySelectorAll(".sos-row").forEach(function (row, i) {
    row.querySelector(".sos-num").textContent = em.lines[i].num;
    row.querySelector(".sos-label").textContent = em.lines[i].label;
  });
  sheet.querySelector(".sos-note").textContent = em.note || "";

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
})();
