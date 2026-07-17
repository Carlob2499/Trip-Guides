/* Jet-lag calculator — pure decision layer.
   Lifted out of guide-ui.js's jet-lag IIFE, where the direction/day/body-clock math
   (and its boundary conditions — the ±0.4h dead zone, the eastward/westward asymmetry,
   the melatonin threshold) had no tests. The UI layer (src/scripts/jetlag-ui.js) turns
   this into HTML; nothing here touches the DOM. */

export type JetLagDirection = "east" | "west";

export interface JetLagResult {
  /** Under 1 hour of real difference, or inside the ±0.4h "same day" dead zone —
      not worth alarming a traveler about. */
  negligible: true;
}

export interface JetLagAdvice {
  negligible: false;
  direction: JetLagDirection;
  /** Absolute hour gap, rounded to 1 decimal. */
  hours: number;
  /** Days to fully adapt. */
  days: number;
  /** What the body clock reads (12h, e.g. "4am") at 11pm local on arrival night —
      the concrete "why you'll feel off" anchor. */
  bodyClockAt11pmLocal: string;
  /** ≥7h gaps are large enough that a melatonin tip is worth surfacing. */
  showMelatoninTip: boolean;
}

/**
 * Compute jet-lag advice from two UTC offsets (hours, fractional for zones like IST
 * UTC+5:30). Direction is signed by `dest - origin`: positive means flying east.
 *
 * The ±0.4h dead zone exists because two zones 0.5h apart (crossing a half-hour
 * boundary) shouldn't read as "jet lag" — that's noise, not a real time-zone crossing.
 *
 * Adaptation rate is asymmetric by design: eastward crossings cost ~1 day per hour of
 * gap; westward is treated as 1.5x easier (~1 day per 1.5h) — the well-documented
 * asymmetry in how circadian rhythm re-entrains (easier to delay your clock, flying
 * west, than to advance it, flying east).
 */
export function computeJetLag(destOffsetHours: number, originOffsetHours: number): JetLagResult | JetLagAdvice {
  const diff = destOffsetHours - originOffsetHours;
  const hours = Math.round(Math.abs(diff) * 10) / 10;
  const direction: JetLagDirection | null = diff > 0.4 ? "east" : diff < -0.4 ? "west" : null;

  if (!direction || hours < 1) {
    return { negligible: true };
  }

  const days = direction === "east" ? Math.ceil(hours) : Math.ceil(hours / 1.5);

  // What 11pm local (arrival night) reads as on the body's still-origin-zone clock.
  let bodyAt11 = 23 - diff;
  while (bodyAt11 < 0) bodyAt11 += 24;
  while (bodyAt11 >= 24) bodyAt11 -= 24;
  const bh = Math.round(bodyAt11);
  const h12 = bh % 12 || 12;
  const ampm = bh >= 12 ? "pm" : "am";

  return {
    negligible: false,
    direction,
    hours,
    days,
    bodyClockAt11pmLocal: h12 + ampm,
    showMelatoninTip: hours >= 7,
  };
}
