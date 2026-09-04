/* The Map destination's contextual sheet / inspector (design-system.md D6-22/36).

   One list of large rows beside (desktop) or under (phone, as a draggable sheet) the map.
   Selecting a row focuses the pin on the Google map when it is live and always shows the
   selected place's compact facts and its Get-there handoff in the sheet's selected panel;
   a pin click on the map selects the row. Without Google (no key, failed load, offline)
   the rows are still the map's index: the OSM embed stays and the written handoff works.

   The mobile sheet has three states — peek (a handle plus the selected place), half, and
   full list — driven by the grip drag and by taps; no state is gesture-only. */

import { attachSheetDrag } from "../../../scripts/sheet-drag.js";

export function initMapDestination(root) {
  var doc = root || document;
  var dest = doc.querySelector("[data-mapdest]");
  if (!dest) return;
  var mount = dest.querySelector("[data-itin-map]");
  var sheet = dest.querySelector("[data-map-sheet]");
  var selected = dest.querySelector("[data-map-selected]");
  if (!sheet || !selected) return;
  var nameEl = selected.querySelector("[data-map-sel-name]");
  var kindEl = selected.querySelector("[data-map-sel-kind]");
  var localEl = selected.querySelector("[data-map-sel-local]");
  var metaEl = selected.querySelector("[data-map-sel-meta]");
  var actionsEl = selected.querySelector("[data-map-sel-actions]");
  var detailsEl = selected.querySelector("[data-map-sel-details]");
  var thumbEl = selected.querySelector("[data-map-sel-thumb]");
  var rows = Array.prototype.slice.call(dest.querySelectorAll("[data-map-row]"));

  function rowFor(id) { return rows.find(function (r) { return r.getAttribute("data-map-row") === id; }) || null; }

  function showSelected(id) {
    var row = rowFor(id);
    rows.forEach(function (r) { r.classList.toggle("mapdest-row--sel", r === row); });
    if (!row) { selected.hidden = true; return; }
    var btn = row.querySelector(".mapdest-row-btn");
    nameEl.textContent = (row.querySelector(".mapdest-row-name") || {}).textContent || "";
    var meta = (row.querySelector(".mapdest-row-meta") || {}).textContent || "";
    kindEl.textContent = (row.closest(".mapdest-group") && row.closest(".mapdest-group").querySelector(".mapdest-group-title")) ? row.closest(".mapdest-group").querySelector(".mapdest-group-title").firstChild.textContent.trim() : "";
    metaEl.textContent = meta;
    metaEl.hidden = !meta;
    localEl.hidden = true;
    // The same Get-there links the row already carries — moved, not duplicated.
    var links = row.querySelector(".mapdest-row-links .transit-links");
    actionsEl.innerHTML = links ? links.outerHTML : "";
    // A place with a guide card gets a way to its dense detail; a day stop goes to its day.
    var anchorId = id.indexOf("d") === 0 && /^d\d+-/.test(id) ? "day-" + id.split("-")[0].slice(1) : null;
    var card = anchorId ? doc.getElementById(anchorId) : (doc.getElementById("sight-" + id) || doc.getElementById("venue-" + id));
    if (card) { detailsEl.hidden = false; detailsEl.setAttribute("href", "#" + card.id); detailsEl.textContent = anchorId ? "View in itinerary" : "Details in the guide"; }
    else detailsEl.hidden = true;
    // The card's own photo — the same repository image the Guide renders — identifies the place.
    if (thumbEl) {
      var img = card && !anchorId ? card.querySelector(".sight-media.media-ok .cardimg, .venue-img") : null;
      var src = img && img.naturalWidth > 0 ? (img.currentSrc || img.getAttribute("src")) : null;
      if (src) { thumbEl.src = src; thumbEl.hidden = false; }
      else { thumbEl.removeAttribute("src"); thumbEl.hidden = true; }
    }
    selected.hidden = false;
    sheet.setAttribute("data-sheet", "half");
    if (btn) btn.setAttribute("aria-current", "true");
    rows.forEach(function (r) { if (r !== row) { var b = r.querySelector(".mapdest-row-btn"); if (b) b.removeAttribute("aria-current"); } });
  }

  dest.addEventListener("click", function (e) {
    var focus = e.target.closest && e.target.closest("[data-map-focus]");
    if (focus) {
      var id = focus.getAttribute("data-map-focus");
      showSelected(id);
      if (mount && mount.__focusPin) mount.__focusPin(id);
      else {
        // No live map: recentre the OSM embed on the row's own coordinates, honestly.
        var row = rowFor(id), frame = mount && mount.querySelector(".osmmap");
        if (row && frame && !frame.hasAttribute("data-fallback-src")) {
          var lat = parseFloat(row.getAttribute("data-lat")), lng = parseFloat(row.getAttribute("data-lng"));
          if (isFinite(lat) && isFinite(lng)) {
            var s = 0.012;
            frame.src = "https://www.openstreetmap.org/export/embed.html?bbox=" + [lng - s, lat - s * .6, lng + s, lat + s * .6].join("%2C") + "&layer=mapnik&marker=" + lat + "%2C" + lng;
          }
        }
      }
      return;
    }
    var close = e.target.closest && e.target.closest("[data-map-sel-close]");
    if (close) {
      selected.hidden = true;
      rows.forEach(function (r) { r.classList.remove("mapdest-row--sel"); var b = r.querySelector(".mapdest-row-btn"); if (b) b.removeAttribute("aria-current"); });
      if (mount && mount.__clear) mount.__clear();
      sheet.setAttribute("data-sheet", "peek");
    }
  });
  if (mount) mount.addEventListener("tg:map-select", function (e) { if (e.detail && e.detail.id) showSelected(e.detail.id); });

  /* Sheet states. The grip toggles peek → half → full; a drag down from the grip goes
     back a state (sheet-drag's dismiss is "one state down", never off-screen). */
  var STATES = ["peek", "half", "full"];
  sheet.setAttribute("data-sheet", "peek");
  var grip = sheet.querySelector(".mapdest-sheet-grip");
  function stepSheet(delta) {
    var i = STATES.indexOf(sheet.getAttribute("data-sheet") || "peek");
    sheet.setAttribute("data-sheet", STATES[Math.max(0, Math.min(STATES.length - 1, i + delta))]);
  }
  if (grip) {
    grip.setAttribute("role", "button");
    grip.setAttribute("tabindex", "0");
    grip.setAttribute("aria-label", "Expand the places list");
    grip.addEventListener("click", function () { stepSheet(sheet.getAttribute("data-sheet") === "full" ? -2 : 1); });
    grip.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); stepSheet(1); }
      if (e.key === "ArrowDown") { e.preventDefault(); stepSheet(-1); }
      if (e.key === "ArrowUp") { e.preventDefault(); stepSheet(1); }
    });
    attachSheetDrag(sheet, function () { stepSheet(-1); });
  }

  // "This day on the map" from the Itinerary: switch destination and focus the day lens.
  doc.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-open-map-day]");
    if (!b) return;
    var idx = parseInt(b.getAttribute("data-open-map-day"), 10);
    if (window.__tgShowDest) window.__tgShowDest("map", { reason: "day" });
    var chip = dest.querySelector('[data-day-chip="' + idx + '"]');
    if (chip && chip.getAttribute("aria-pressed") !== "true") chip.click();
    else if (mount && mount.__fitDay) mount.__fitDay(idx);
    sheet.setAttribute("data-sheet", "peek");
  });
}

if (typeof document !== "undefined") initMapDestination(document);
