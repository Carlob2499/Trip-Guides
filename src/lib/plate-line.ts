/* The plate line's two derived rows — cities, and the next leg (DESIGN.md R5 §3).

   R4 put a decimal coordinate pair here at display scale. DESIGN.md R5 §3 retires it in one
   sentence: "a decimal coordinate pair is not information a traveller standing in Seoul uses."
   The same row retires guide numbering on this surface — `sheetOrdinal` and sheet-order.ts stay
   alive for the atlas hub, which indexes by number legitimately. What replaces both is the two
   things a traveller does use: which cities this trip touches, and what the next move is.

   Neither is a new content field. The retired R5 FALLBACKS §4 (git path in
   design_handoff_guide_ui/README.md) forbids adding one, and it is the right constraint
   here — a guide that had to be edited to gain a plate line would mean every
   existing guide shipped with an empty one. Both rows are read out of data the guides already
   carry, and a guide carrying neither renders neither. */

/** A day card's timed stop, as the guides already write them. */
export interface LegPoint {
  name?: string | null;
  time?: string | null;
}

/** A day card, reduced to what this file needs. */
export interface LegDay {
  date?: string | null;
  waypoints?: LegPoint[] | null;
}

/**
 * The trip's cities, from the guide's own kicker.
 *
 * Every guide's kicker is written as `Seoul · Daejeon · Busan — Jul 8–15, 2026` — the cities
 * and the dates, in one string, because R4's masthead had one eyebrow to put them in. R5 gives
 * them separate homes (SCREENS §1: the text column's kicker is the dates, the plate line is the
 * cities), so this splits rather than duplicates. Rendering the whole kicker in both places
 * would be the same datum shown twice as if it were two different things.
 *
 * Two things must both hold: a dash separating the halves, and a `·` list in the head. The
 * second is the strict one and it is deliberate. A SINGLE-city kicker — Sedona's
 * `Sedona, Arizona — Sep 2–8, 2026` — gets no cities row, because "the head of a dash split is
 * a place" is a guess that holds for the guides written so far and not for the sentence-shaped
 * kicker someone writes next. Nothing is lost when it declines: `dateLine` keeps that kicker
 * whole in the eyebrow, so the reader sees every word either way. The cost of being wrong here
 * is a fabricated place name on the loudest row of the masthead; the cost of being cautious is
 * one shorter plate line, which is the trade this product makes everywhere else too.
 */
export function cityLine(kicker: string | null | undefined): string | null {
  if (!kicker) return null;
  const head = String(kicker).split(/\s[—–]\s/)[0].trim();
  if (!head || head === String(kicker).trim()) return null;   // no separator = no city half
  if (!head.includes("·")) return null;                        // a single token is not a city list
  return head;
}

/**
 * The other half of the same kicker — the dates — for the masthead's text column.
 *
 * Exists so the split has exactly one rule rather than two that can disagree: whatever
 * `cityLine` takes, this leaves, and vice versa. When there is no city half the whole kicker
 * stays in the eyebrow, because a kicker that is only prose is not a date line either and
 * halving it would lose text rather than move it.
 */
export function dateLine(kicker: string | null | undefined): string | null {
  if (!kicker) return null;
  const whole = String(kicker).trim();
  if (!cityLine(whole)) return whole || null;
  return whole.split(/\s[—–]\s/).slice(1).join(" — ").trim() || whole;
}

/**
 * The next leg — `06:30 → Land ICN Terminal 1` — from the next day card that carries a timed
 * stop, on or after today.
 *
 * The guides have no structured leg: routes are prose, and day waypoints are the only place a
 * time and a destination sit together as data. So that is the source, and the format follows
 * the data rather than the spec's illustrative `Next: KTX 08:30 → Daejeon` — the mode is inside
 * the stop's own name where a guide states it, and inventing one where it doesn't is worse than
 * a shorter line.
 *
 * Returns null outside the trip window and whenever no stop ahead carries a time. FALLBACKS §1:
 * a trip not started or already finished gets no present moment invented for it.
 *
 * @param days      the day cards, in the guide's own order
 * @param resolve   the guide's own label→Date resolver, injected so this file holds no
 *                  year-inference rule of its own (there is exactly one, in trip-dates.ts)
 * @param now       injected clock — date logic that reaches for the real one cannot be tested
 */
export function nextLeg(
  days: LegDay[] | null | undefined,
  resolve: (label: string | null | undefined, now: Date) => Date | null,
  now: Date,
): string | null {
  if (!Array.isArray(days) || days.length === 0) return null;

  // Local calendar day, not a timestamp: a trip is "today" from midnight to midnight where the
  // reader is standing, and comparing instants would end the day at whatever hour the guide
  // was built in.
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const dated = days
    .map((d) => ({ day: d, at: resolve(d?.date, now) }))
    .filter((x): x is { day: LegDay; at: Date } => x.at instanceof Date);
  if (dated.length === 0) return null;

  /* The leg exists only INSIDE the trip window, which is the same window the what's-next
     banner beside it uses. Before the first day the loop below would happily return the first
     departure, and "Next · 06:30 → ICN T1" three months out reads as though it were this
     morning — the "never invent a present moment" rule (FALLBACKS §1) applied to a row whose
     whole framing is the present. After the last day there is simply nothing ahead.
     Both ends checked explicitly: "the trip is not on" and "no stop carries a time" are
     different absences, and only the second is ever worth revisiting. */
  const times = dated.map((x) => x.at.getTime());
  if (today < Math.min(...times) || today > Math.max(...times)) return null;

  for (const { day, at } of dated.sort((a, b) => a.at.getTime() - b.at.getTime())) {
    if (at.getTime() < today) continue;
    for (const w of day.waypoints || []) {
      const time = (w?.time || "").trim();
      const name = (w?.name || "").trim();
      if (time && name) return `${time} → ${name}`;
    }
  }
  return null;
}
