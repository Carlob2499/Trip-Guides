/**
 * Pure logic for the day scrubber (ui/day-scrub.js).
 *
 * The plan asked for a right-edge VERTICAL dot rail. Two things ruled that out once the
 * real layout was read: on a phone the itinerary is a HORIZONTAL snap deck, so a vertical
 * rail would ask the reader to drag down to move right; and `#dayScrub` already exists as
 * the accessible, keyboard-first day navigator. A second navigator beside it would be the
 * thing "merge before adding" exists to prevent.
 *
 * So the existing rail becomes the scrubber, on its own axis: on a phone its chips compact
 * to fit the width (every day reachable without scrolling the rail), and dragging across it
 * scrubs the deck with the date shown in a bubble. Taps keep working exactly as before.
 */

/** A drag shorter than this on the rail is a tap, not a scrub. */
export const SCRUB_LOCK = 8;

/**
 * The rail can only BE a scrubber when every day fits across it. Past this the chips keep
 * scrolling and drag stays off: a 14-day rail on a 320px phone gives each chip under the
 * 24px minimum target (WCAG 2.5.8), and a scrub that fine is jumpier than a tap.
 */
export const SCRUB_MAX_DAYS = 12;

/** Whether this guide's day rail can act as a scrubber at all. */
export function canScrub(dayCount: number): boolean {
  return dayCount >= 4 && dayCount <= SCRUB_MAX_DAYS;
}

/** Which day the thumb is over: x mapped across the rail's width, clamped to the ends. */
export function dayFromX(x: number, left: number, width: number, count: number): number {
  if (count <= 0 || width <= 0) return 0;
  const i = Math.floor(((x - left) / width) * count);
  return Math.max(0, Math.min(count - 1, i));
}
