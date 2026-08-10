/* Current conditions on the atlas hub's sheet rows — fetch + DOM. The judgement lives in
   ../model/weather.ts (currentWxOf).

   ONE request for every guide on the page, not one per row: Open-Meteo takes comma-separated
   latitude/longitude and answers with a list of structures in request order (verified against
   open-meteo.com/en/docs, 2026-08-10). Four rows would otherwise be four round trips on a
   phone's first paint, for a decoration.

   Graceful failure means the slots stay hidden — the same rule weather.js follows. A row with
   no temperature is honest; a row with a dash where a temperature should be is a claim that
   something is missing, which is not what happened. */

import { wxIcon, currentWxOf } from "../model/weather";

const CACHE_KEY = "tg-hub-wx";

/**
 * @param {Document|Element} root
 * @param {Array<{slug: string, anchor: [number, number]|null}>} guides
 */
export function initHomeWeather(root, guides) {
  const slots = new Map();
  root.querySelectorAll("[data-atlas-wx]").forEach((el) => slots.set(el.dataset.atlasWx, el));
  if (!slots.size || !window.fetch) return;

  // Only guides that have BOTH a coordinate and a slot on this page — the two lists are
  // derived from the same content collection, but pairing them here rather than assuming
  // they match keeps a future page that renders a subset from asking about rows it lacks.
  const targets = guides.filter((g) => g.anchor && slots.has(g.slug));
  if (!targets.length) return;

  function paint(list) {
    targets.forEach((g, i) => {
      const wx = currentWxOf(list[i]);
      if (!wx) return; // this one location failed; the others still render
      const el = slots.get(g.slug);
      el.textContent = `${wxIcon(wx.code)} ${Math.round(wx.tempC)}°`;
      el.removeAttribute("hidden");
    });
  }

  const lats = targets.map((g) => g.anchor[1]).join(",");
  const lngs = targets.map((g) => g.anchor[0]).join(",");
  const url = "https://api.open-meteo.com/v1/forecast" +
    "?latitude=" + lats + "&longitude=" + lngs +
    "&current=temperature_2m,weather_code&timezone=auto&temperature_unit=celsius";

  // Keyed by the coordinate set, so adding a guide invalidates rather than silently reusing a
  // list whose positions no longer line up with the rows. Current conditions go stale in
  // minutes, not days — sessionStorage with a timestamp, refreshed after 30.
  const key = CACHE_KEY + ":" + lats + ";" + lngs;
  const now = Date.now();
  try {
    const cached = JSON.parse(sessionStorage.getItem(key) || "null");
    if (cached && Array.isArray(cached.list) && now - cached.at < 30 * 60 * 1000) {
      paint(cached.list);
      return; // served from cache — no network call
    }
  } catch (_) { /* unparseable or unavailable — fall through to the network */ }

  fetch(url)
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error("non-200 " + r.status))))
    .then((data) => {
      // The single-location form answers with one object rather than a list; normalising here
      // means a one-guide hub takes the same path as a four-guide one.
      const list = Array.isArray(data) ? data : [data];
      try { sessionStorage.setItem(key, JSON.stringify({ list, at: now })); } catch (_) { /* quota or private mode */ }
      paint(list);
    })
    .catch((err) => {
      console.warn("[tg-hub-weather] " + String(err) + " — row conditions hidden");
    });
}
