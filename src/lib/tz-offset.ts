/* DST-aware UTC offset of an IANA timezone at a given instant.
   Lifted out of guide-ui.js, where it fed the jet-lag calculator's destination offset
   with zero tests — the one thing this function gets wrong (a DST edge case, an unknown
   zone) silently mis-times every jet-lag calculation downstream of it. */

/**
 * Hours a timezone is offset from UTC at `date` (fractional for half-hour zones like
 * India, positive east of UTC). Uses Intl rather than a fixed lookup table specifically
 * so DST is handled by the platform's own tz database, not a number that goes stale
 * twice a year.
 *
 * Returns null for an unknown/invalid IANA zone — the caller's signal to fall back
 * rather than compute jet-lag against a wrong offset.
 */
export function tzOffsetHours(tz: string | null | undefined, date: Date): number | null {
  if (!tz) return null;
  try {
    const f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    const p: Record<string, string> = {};
    f.formatToParts(date).forEach((x) => { p[x.type] = x.value; });
    const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, (+p.hour) % 24, +p.minute, +p.second);
    return (asUTC - date.getTime()) / 3600000;
  } catch {
    return null;
  }
}
