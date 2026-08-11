/* The quick card's / pin card's ticking local clock (README §3, §"World view" pin cards) —
   one pure formatter shared by both surfaces so "HH:MM THERE" never drifts between them. */

/** `HH:MM THERE` in the guide's own tz, 24h, or null when the guide has no tz to read one
    from — honest absence, never a guessed zone. */
export function localClockLabel(tz: string | null | undefined, now: Date): string | null {
  if (!tz) return null;
  try {
    /* The zone travels with the time, because "07:28" alone does not say whose morning it is.
       It is the OFFSET (`GMT+9`), not the letter abbreviation the design shows (`KST`):
       Intl has no en-US abbreviation for most zones — it returns `GMT+9` for both Seoul and
       Tokyo — so printing `KST` would mean shipping a hand-written table of abbreviations.
       That table would be invented data, and wrong twice over: abbreviations collide across
       countries, and half of them change under DST. The offset is derived, unambiguous, and
       already correct on both sides of a DST boundary. */
    const parts = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz, timeZoneName: "short",
    }).formatToParts(now);
    const at = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    const zone = at("timeZoneName");
    return `${at("hour")}:${at("minute")}${zone ? ` ${zone}` : ""}`;
  } catch {
    return null;
  }
}
