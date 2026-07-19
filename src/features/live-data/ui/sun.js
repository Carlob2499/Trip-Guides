/* Sun & daylight strip — pure math, no fetch (docs/FEATURES.md #8). All decisions
   live in ../model/sun.ts. Mounts into the `.day-sun` placeholder each day card
   already renders (same pattern as `.day-kitcount`), keyed off the guide's map-section
   coordinates (same `mapCenter` weather.js already reads — no new schema). */

import { solarTimesFor, fmtClock } from "../model/sun";
import { resolveTripDate } from "../../../lib/trip-dates";

export function initSun(cfg) {
  var mapCenter = cfg && cfg.mapCenter;
  if (!mapCenter) return;
  var tz = cfg.destTzIana || null; // sun times render in the destination's clock, not the viewer's — matters most when planning from home before departure

  var dayEls = document.querySelectorAll(".day[data-day]");
  if (!dayEls.length) return;
  var now = new Date();

  dayEls.forEach(function (dayEl) {
    var mount = dayEl.querySelector(".day-sun");
    var dEl = dayEl.querySelector(".d");
    if (!mount || !dEl) return;
    var dateTxt = dEl.textContent.replace(/^\s*\d+\s*/, "").trim();
    var date = resolveTripDate(dateTxt, now);
    if (!date) return;

    var t = solarTimesFor(mapCenter.lat, mapCenter.lng, date);
    if (!t.sunrise || !t.sunset) return; // midnight sun / polar night — nothing honest to show as a rise/set pair

    var hrs = t.dayLengthMin != null ? Math.floor(t.dayLengthMin / 60) : null;
    var mins = t.dayLengthMin != null ? t.dayLengthMin % 60 : null;
    var lenTxt = hrs != null ? hrs + "h " + mins + "m" : "";

    mount.innerHTML = '<span class="sun-ico" aria-hidden="true">☀︎</span>' +
      '<span class="sun-rise">' + fmtClock(t.sunrise, tz) + '</span>' +
      '<span class="sun-sep">–</span>' +
      '<span class="sun-set">' + fmtClock(t.sunset, tz) + '</span>' +
      (lenTxt ? '<span class="sun-sep">·</span><span class="sun-len">' + lenTxt + '</span>' : '') +
      (t.goldenHourEveningStart ? '<span class="sun-sep">·</span><span class="sun-golden">golden ' + fmtClock(t.goldenHourEveningStart, tz) + '</span>' : '');
    mount.removeAttribute("hidden");
    mount.setAttribute("aria-label", "Sunrise " + fmtClock(t.sunrise, tz) + ", sunset " + fmtClock(t.sunset, tz) + (lenTxt ? ", " + lenTxt + " of daylight" : ""));
  });
}
