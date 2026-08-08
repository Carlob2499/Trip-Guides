/* The quick card's / pin card's ticking local clock (README §3, §"World view" pin cards) —
   one pure formatter shared by both surfaces so "HH:MM THERE" never drifts between them. */

/** `HH:MM THERE` in the guide's own tz, 24h, or null when the guide has no tz to read one
    from — honest absence, never a guessed zone. */
export function localClockLabel(tz: string | null | undefined, now: Date): string | null {
  if (!tz) return null;
  try {
    const time = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz,
    }).format(now);
    return `${time} THERE`;
  } catch {
    return null;
  }
}
