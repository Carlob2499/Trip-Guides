/* Today's weather, wherever a surface asks for it (design-system.md §24, §23; boards 02/05).

   ONE painter for one fact: the row of the wired Open-Meteo forecast that belongs to today in
   the destination's own calendar. The payload is a DAILY high/low and a WMO code — there is no
   current temperature, no precipitation chance and no wind in it, so none of those are ever
   drawn, whatever a board shows.

   A mount is any `[data-wx-today]`; add `data-wx-chip` for the compact form a hero wears. A
   mount with nothing to show stays hidden — a heading over a blank row is not honest. */

import { wxIcon, wxLabel, wxDayOk } from "../model/weather";
import { getLastWx } from "./weather.js";
import { todayInTz, esc } from "../../../scripts/util.js";

function isoToday(tz) {
  var t = todayInTz(tz);
  return t ? [t.y, String(t.m).padStart(2, "0"), String(t.d).padStart(2, "0")].join("-")
           : new Date().toISOString().slice(0, 10);
}

function paint(mount, daily, tz) {
  if (!daily || !daily.time) { mount.hidden = true; return; }
  var k = daily.time.indexOf(isoToday(tz));
  if (k < 0 || !wxDayOk(daily, k)) { mount.hidden = true; return; }
  var code = daily.weathercode[k];
  var hi = Math.round(daily.temperature_2m_max[k]);
  var lo = Math.round(daily.temperature_2m_min[k]);
  if (mount.hasAttribute("data-wx-chip")) {
    mount.innerHTML = '<span class="wxt-ico" aria-hidden="true">' + wxIcon(code) + "</span>" +
      '<span class="wxt-hi">' + hi + "\u00b0</span>" +
      '<span class="wxt-word">' + esc(wxLabel(code)) + "</span>" +
      '<span class="wxt-lo">low ' + lo + "\u00b0</span>";
  } else {
    mount.innerHTML = '<p class="tn-card-k">Weather today</p>' +
      '<p class="tn-wx-row"><span class="tn-wx-ico" aria-hidden="true">' + wxIcon(code) + "</span>" +
      '<span class="tn-wx-hi">' + hi + "\u00b0</span>" +
      '<span class="tn-wx-lo">low ' + lo + "\u00b0</span></p>" +
      '<p class="tn-wx-word">' + esc(wxLabel(code)) + "</p>" +
      '<p class="tn-wx-src">Forecast \u00b7 <a href="https://open-meteo.com" target="_blank" rel="noopener">Open-Meteo</a></p>';
  }
  mount.hidden = false;
}

export function initWxToday(cfg) {
  var mounts = Array.prototype.slice.call(document.querySelectorAll("[data-wx-today]"));
  if (!mounts.length) return;
  var tz = (cfg && cfg.destTzIana) || null;
  function all(daily) { mounts.forEach(function (m) { paint(m, daily, tz); }); }
  // The forecast may land before or after this module: read what live-data already validated,
  // then keep listening. Same late-listener pattern the packing strip uses.
  all(getLastWx());
  document.addEventListener("tg:wx", function (e) { all(e && e.detail ? e.detail.daily : null); });
}
