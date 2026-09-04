/* Weather-aware packing strip — DOM half (decisions in ../../live-data/model/packing.ts).
   Same honesty pattern as the weather day-swap advisory: stays hidden until a real
   forecast resolves into a genuine packing signal, never renders a guess. The card's
   container is server-rendered (TripKit.astro) but hidden — only a guide with a `weather`
   section gets one at all, since only those guides ever fetch a forecast. */

import { getLastWx, weatherWindow, solarTimesFor, derivePackingList } from "../../live-data/index.js";
import { tripWindow } from "../../../lib/trip-dates";

export function initPacking(cfg) {
  const card = document.getElementById("tkPackingCard");
  if (!card) return;
  const mapCenter = cfg && cfg.mapCenter;

  function render(daily) {
    const now = new Date();
    const trip = tripWindow(cfg.firstDayDate, cfg.lastDayDate, now);
    const slice = weatherWindow(daily, trip);
    let daylightMin = null;
    if (mapCenter && trip.start) {
      daylightMin = solarTimesFor(mapCenter.lat, mapCenter.lng, trip.start).dayLengthMin;
    }
    const result = derivePackingList(daily, slice, daylightMin);
    if (!result) return; // nothing crosses a threshold — stays hidden, not an empty card
    const list = document.getElementById("tkPackingList");
    if (!list) return;
    list.innerHTML = "";
    result.items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    });
    card.hidden = false;
  }

  const wx = getLastWx();
  if (wx) render(wx);
  else document.addEventListener("tg:wx", (e) => { if (e.detail && e.detail.daily) render(e.detail.daily); });
}
