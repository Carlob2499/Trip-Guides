/* Shared client helpers. Bundled once by Astro across the modules that import
   it (guide bundle + hub bundle), so this is the single home for the tiny
   cross-module checks that were previously copy-pasted per file. */

/* True when the visitor has asked the OS to minimize motion. Callers gate
   every non-essential animation / smooth-scroll behind this. */
export function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* A single short vibration for a confirmed tap. No-ops silently where the
   Vibration API is absent (all desktop, iOS Safari) — callers don't guard. */
export function tapHaptic() {
  try { navigator.vibrate && navigator.vibrate(9); } catch (e) {}
}

/* Today's calendar date AT THE DESTINATION (IANA tz), not on the device —
   "today" for a trip means the traveler's day in-country (WayFinder
   retrospective: using the device clock breaks today-semantics for anyone
   checking the guide from another timezone). Returns {y, m (1-12), d}, or
   null when tz is absent/invalid (callers fall back to the device date).
   `now` is injectable for tests. */
export function todayInTz(tz, now) {
  if (!tz) return null;
  try {
    var parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(now || new Date());
    var get = function (t) { return Number((parts.find(function (p) { return p.type === t; }) || {}).value); };
    var y = get("year"), m = get("month"), d = get("day");
    return y && m && d ? { y: y, m: m, d: d } : null;
  } catch (e) { return null; }
}
