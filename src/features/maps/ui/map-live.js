/* THE MAP'S LIVE FIELD DATA — loaded only once the Map destination is opened.

   Two things the board draws and the runtime can actually answer (PR #210): a place's live
   opening state, and "My location". Both are here rather than in map-dest.js because
   features/maps/index.js is imported eagerly by GuideLayout, so anything in that file is
   downloaded before a guide's first paint by every reader — including everyone who never opens
   the Map. check-perf-budget.mjs draws exactly that line and it caught this at 200/200 KB.

   Nothing here asks for anything on load: the places lookup happens when a place is selected,
   and the browser's location permission is requested from the button's own click. */

export function initMapLive(ctx) {
  var doc = ctx.doc, dest = ctx.dest, mount = ctx.mount, selected = ctx.selected;
  var liveEl = selected.querySelector("[data-map-sel-live]");

  /* ---- LIVE OPENING STATE (features/places via the runtime overlay, PR #210) --------------
     Asked for only when a place is actually selected, and only when that place carries a
     reviewed Google Place ID the guide already committed — this never geocodes a name to go
     looking. A place we cannot check says NOTHING rather than implying it is open, which is
     the same honesty rule the rest of the product follows for unverified facts. */
  var liveWant = null;
  /* Rendered in the DESTINATION's timezone, not the reader's. Caught in review: an 18:00 KST
     closing time formatted with the browser's own zone came out as "05:00 AM" on a US laptop —
     a wrong fact stated confidently, which is worse than no fact. The guide already carries
     destTzIana for exactly this. 24-hour to match how the guide writes hours everywhere else. */
  var TZ = (function () {
    try { return JSON.parse(doc.getElementById("tgConfig").textContent).destTzIana || null; }
    catch (_) { return null; }
  })();
  function clock(iso) {
    if (!iso) return null;
    var d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    var opts = { hour: "2-digit", minute: "2-digit", hour12: false };
    if (TZ) opts.timeZone = TZ;
    try { return d.toLocaleTimeString("en-GB", opts); }
    catch (_) {
      /* An unknown IANA zone throws rather than falling back — better to say nothing than to
         quietly print the reader's own clock as if it were the destination's. */
      return null;
    }
  }
  function paintLive(row) {
    if (!liveEl) return;
    liveEl.hidden = true;
    liveEl.textContent = "";
    liveEl.removeAttribute("data-open");
    /* `place_id` in guide data is MOSTLY a Google Place ID, but not always: korea carries 63
       ChIJ-prefixed Google ids and 5 of another kind (OSM relation ids on transit entries). The
       adapter is explicit that it never guesses an id — "IDs are resolved and reviewed by the
       existing research/tooling pipeline" — so sending it a non-Google id would be asking a paid
       API a question about something that is not a place there. Shape-check, and stay silent for
       the rest, which is also what they deserve: we cannot check their hours. */
    var placeId = row && row.getAttribute("data-place-id");
    if (!placeId || placeId.indexOf("ChIJ") !== 0) { liveWant = null; return; }
    liveWant = placeId;
    try {
      doc.dispatchEvent(new CustomEvent("waypoint:places-request", {
        detail: { places: [{ waypointId: row.getAttribute("data-map-row") || placeId, googlePlaceId: placeId }] },
      }));
    } catch (_) { /* runtime not configured — the line simply stays absent */ }
  }
  doc.addEventListener("waypoint:places-overlay", function (e) {
    if (!liveEl || !liveWant) return;
    var d = e.detail || {};
    var value = (d.value || []).find(function (v) { return v.googlePlaceId === liveWant; });
    if (!value) return;
    var text = null;
    if (value.businessStatus === "CLOSED_PERMANENTLY") text = "Permanently closed";
    else if (value.businessStatus === "CLOSED_TEMPORARILY") text = "Temporarily closed";
    else if (value.openNow === true) { var c = clock(value.nextCloseTime); text = c ? "Open now · closes " + c : "Open now"; }
    else if (value.openNow === false) { var o = clock(value.nextOpenTime); text = o ? "Closed · opens " + o : "Closed now"; }
    if (!text) return;
    /* Stale or offline data is labelled, never silently presented as current (§ perishable
       facts): the overlay tells us which it is, so say so instead of dropping the caveat. */
    if (d.status === "stale" || d.status === "offline") text += " · last checked";
    liveEl.textContent = text;
    liveEl.setAttribute("data-open", value.openNow === true ? "yes" : "no");
    liveEl.hidden = false;
  });

  /* ---- MY LOCATION (board 04) ---------------------------------------------------------------
     Shown only once something can answer it, and it asks the browser for permission from this
     click alone — importing the geolocation feature never prompts (features/geolocation). */
  var locate = dest.querySelector("[data-map-locate]");
  if (locate) {
    var probe = doc.createEvent ? true : false;
    if (probe && typeof navigator !== "undefined" && navigator.geolocation) locate.hidden = false;
    locate.addEventListener("click", function () {
      locate.setAttribute("data-busy", "");
      try { doc.dispatchEvent(new CustomEvent("waypoint:request-location", { detail: { context: "map" } })); }
      catch (_) { locate.removeAttribute("data-busy"); }
    });
    doc.addEventListener("waypoint:location", function (e) {
      locate.removeAttribute("data-busy");
      var r = e.detail || {};
      var pos = r.location || r;
      var lat = pos && (pos.latitude != null ? pos.latitude : pos.lat);
      var lng = pos && (pos.longitude != null ? pos.longitude : pos.lng);
      if (typeof lat !== "number" || typeof lng !== "number") {
        /* Denied, unavailable or timed out. Say so on the control rather than doing nothing —
           a button that silently does nothing reads as broken. */
        locate.setAttribute("data-failed", "");
        setTimeout(function () { locate.removeAttribute("data-failed"); }, 4000);
        return;
      }
      if (mount && mount.__panTo) mount.__panTo(lat, lng);
    });
  }


  /* map-dest.js calls this on every selection; it is installed here so the selection path costs
     nothing until this module exists. */
  dest.__paintLive = paintLive;
  var current = dest.querySelector(".mapdest-row--sel");
  if (current) paintLive(current);
}
