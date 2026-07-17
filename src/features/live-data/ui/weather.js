/* Weather strip — fetch + DOM. All decisions live in ../model/weather.ts.
   Mount: #wxWrap (masthead OR an in-flow weather section) → injects into #wxMount.

   Graceful failure means the block stays hidden. It never renders an error, an empty
   strip, or a heading with nothing under it — a guide that says nothing about the weather
   is honest; one that says "Forecast" over a blank row is not. */

import { wxIcon, wxValidate, weatherWindow } from "../model/weather";
import { tripWindow } from "../../../lib/trip-dates";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function initWeather(cfg) {
  var wxWrap = document.getElementById("wxWrap");
  if (!wxWrap) return; // no mount on this page (masthead suppressed, no section)

  var mapCenter = cfg && cfg.mapCenter;
  if (!mapCenter) {
    // Breadcrumb for the forkable-template future: a weather section with no map section
    // to source coordinates from would silently hide otherwise.
    if (cfg && cfg.hasWeatherSection) {
      console.warn("weather section present but no map section found — no coordinates");
    }
    return;
  }
  if (!window.fetch) return;

  var now = new Date();
  var trip = tripWindow(cfg.firstDayDate, cfg.lastDayDate, now);

  // A concluded trip has nothing useful to show — same "don't show misleading weather"
  // reasoning as the beyond-horizon case in weatherWindow(), just checked before the
  // network call so a finished trip costs nothing.
  if (trip.isPast) return;

  var url = "https://api.open-meteo.com/v1/forecast" +
    "?latitude=" + mapCenter.lat + "&longitude=" + mapCenter.lng +
    "&daily=temperature_2m_max,temperature_2m_min,weathercode" +
    "&forecast_days=16&timezone=auto&temperature_unit=celsius";

  // Recomputes the window each call, so a cached "today" can never freeze it on an old day.
  // fetchDate is the retrieval day — the honest timestamp, since Open-Meteo's daily call
  // returns no forecast "issued at".
  function render(d, fetchDate) {
    var slice = weatherWindow(d, trip);
    if (!slice) return; // nothing worth showing — stay hidden
    var endI = slice.startI + slice.count;

    var html = '<div class="wx-strip" aria-label="Weather forecast">';
    for (var i = slice.startI; i < endI; i++) {
      var dt = new Date(d.time[i] + "T12:00:00");
      var hi = Math.round(d.temperature_2m_max[i]);
      var lo = Math.round(d.temperature_2m_min[i]);
      var isToday = dt.getDate() === now.getDate() && dt.getMonth() === now.getMonth();
      html += '<div class="wx-day' + (isToday ? " wx-today" : "") + '">' +
        '<span class="wx-name">' + (isToday ? "Today" : DAY_NAMES[dt.getDay()]) + '</span>' +
        '<span class="wx-date">' + (dt.getMonth() + 1) + "/" + dt.getDate() + '</span>' +
        '<span class="wx-icon">' + wxIcon(d.weathercode[i]) + '</span>' +
        '<span class="wx-hi">' + hi + '°</span>' +
        '<span class="wx-lo">' + lo + '°</span>' +
        '</div>';
    }
    html += '</div>';
    // Honest label: trip-date forecast vs. fallback next-days. (Trips beyond the 16-day
    // horizon hide entirely rather than showing an irrelevant "next N days" guess.)
    var label = slice.onTrip ? "Trip-dates forecast" : "Next " + slice.count + " days";
    html += '<p class="wx-credit">Forecast · ' + label +
      ' · retrieved ' + fetchDate +
      ' · <a href="https://open-meteo.com" target="_blank" rel="noopener" class="wx-src">Open-Meteo</a></p>';
    var mount = document.getElementById("wxMount") || wxWrap;
    mount.innerHTML = html;
    wxWrap.removeAttribute("hidden");
  }

  // Cache keyed by coordinates; "today" in UTC (matches the rate service, avoiding a
  // device-local off-by-one near midnight).
  var WX_CACHE = "tg-wx-" + mapCenter.lat + "," + mapCenter.lng;
  var wxToday = new Date().toISOString().slice(0, 10);
  try {
    var wxCached = JSON.parse(sessionStorage.getItem(WX_CACHE) || "null");
    if (wxCached && wxCached.daily && wxCached.fetchedAt === wxToday) {
      render(wxCached.daily, wxCached.fetchDate || wxToday);
      return; // served from cache — no network call
    }
  } catch (_) {}

  fetch(url)
    .then(function (r) { return r.ok ? r.json() : Promise.reject("non-200 " + r.status); })
    .then(function (data) {
      var d = wxValidate(data);
      if (!d) throw new Error("malformed or out-of-band weather data");
      try { sessionStorage.setItem(WX_CACHE, JSON.stringify({ daily: d, fetchDate: wxToday, fetchedAt: wxToday })); } catch (_) {}
      render(d, wxToday);
    })
    .catch(function (err) {
      // Graceful failure: leave #wxWrap hidden (block renders nothing).
      console.warn("[tg-weather] " + String(err) + " — weather strip hidden");
    });
}
