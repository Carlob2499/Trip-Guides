/* Live exchange rate — fetch + DOM. All decisions live in ../model/rate.ts.
   Mounts: #liveRatePill (stats bar), #liveRateFoot (budget footer). Broadcasts tg:rate.

   Failure ladder, in order of honesty: today's cache → live fetch → a stale-but-REAL
   cached rate, clearly labelled locked → the build-time fallback. A real rate from
   yesterday beats a hardcoded number from June, so long as it says so. */

import { fmtRate, isCacheFresh, parseRateResponse } from "../model/rate";

/* Last rate applied, remembered for LATE SUBSCRIBERS.
   `tg:rate` is a transient event, and guide-ui.js (which calls initRate) is imported
   BEFORE field-tools (which listens) — that order is a load-bearing invariant in
   GuideLayout, not an accident. On a cold cache the fetch resolves asynchronously, so the
   listener is registered by the time it fires and everything works. On a WARM cache
   applyLive runs synchronously during guide-ui's module evaluation, the event fires into
   an empty room, and the currency converter sat there reading "Live rate not loaded" —
   on every second page view of the day, which is the common case for a traveller.

   An event is the wrong contract for state someone might need after the fact. It stays
   (for updates), but the value is now also readable via getLastRate(), so a subscriber
   that arrives late can catch up instead of waiting for an event that already happened. */
var _lastRate = null;

/** The most recent rate applied this page-load, or null if none has been. Lets a module
    imported after initRate() seed itself instead of missing the event. */
export function getLastRate() {
  return _lastRate;
}

export function initRate(cfg) {
  var curCode = cfg && cfg.curCode;
  var curFallbackRate = cfg && cfg.curFallbackRate;
  if (!curCode || !curFallbackRate || !window.fetch) return;

  function remember(detail) {
    _lastRate = detail;
    document.dispatchEvent(new CustomEvent("tg:rate", { detail: detail }));
  }

  function applyLive(rate, date) {
    var pill = document.getElementById("liveRatePill");
    if (pill) {
      pill.textContent = "$1 = " + fmtRate(rate) + " " + curCode;
      pill.title = "Live rate · ECB via Frankfurter.dev · " + date;
      pill.removeAttribute("hidden");
    }
    var foot = document.getElementById("liveRateFoot");
    if (foot) {
      foot.textContent = fmtRate(rate) + " " + curCode + " = $1 · Live · ECB · " + date;
    }
    remember({ rate: rate, date: date, code: curCode });
  }

  function applyFallback(reason) {
    console.warn("[tg-rate] " + reason + " — using fallback " + curFallbackRate + " " + curCode);
    var foot = document.getElementById("liveRateFoot");
    if (foot) {
      foot.textContent = "≈₩" + curFallbackRate.toLocaleString() + " = $1 · Jun 2026 · live rate unavailable";
    }
  }

  // A stale-but-real cached rate beats the hardcoded build-time fallback — show it
  // clearly labeled as locked rather than silently discarding it.
  function applyLockedStale(c) {
    var pill = document.getElementById("liveRatePill");
    if (pill) {
      pill.textContent = "$1 = " + fmtRate(c.rate) + " " + curCode;
      pill.title = "Rate locked " + c.date + " (offline) · ECB via Frankfurter.dev";
      pill.removeAttribute("hidden");
    }
    var foot = document.getElementById("liveRateFoot");
    if (foot) {
      foot.textContent = fmtRate(c.rate) + " " + curCode + " = $1 · Rate locked " + c.date + " · offline";
    }
    remember({ rate: c.rate, date: c.date, code: curCode, locked: true });
  }

  // localStorage (not sessionStorage) so a previously-fetched rate survives across
  // sessions/offline visits. Keyed by currency so guides don't share stale rates.
  // "Today" is UTC — the same reference Frankfurter stamps its daily rate with; a
  // device-local date differs (e.g. UTC+9 at 00:30 UTC) and would refetch daily.
  var CACHE_KEY = "tg-rate-" + curCode;
  var todayUTC = new Date().toISOString().slice(0, 10);
  var cached = null;
  try { cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); } catch (_) {}

  if (isCacheFresh(cached, todayUTC)) {
    applyLive(cached.rate, cached.date);
    return; // served from today's cache — no network call
  }

  fetch("https://api.frankfurter.dev/v1/latest?base=USD&symbols=" + curCode)
    .then(function (r) { return r.ok ? r.json() : Promise.reject("non-200 " + r.status); })
    .then(function (data) {
      var parsed = parseRateResponse(data, curCode); // throws with a reason on bad data
      var date = parsed.date || todayUTC;
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ rate: parsed.rate, date: date, fetchedAt: todayUTC }));
      } catch (_) {}
      applyLive(parsed.rate, date);
    })
    .catch(function (err) {
      if (cached && cached.rate && cached.date) applyLockedStale(cached);
      else applyFallback(String(err));
    });
}
