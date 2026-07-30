/**
 * Pure swipe-decision logic for STORY MODE — the full-screen one-day-per-view deck,
 * where a horizontal swipe moves between days.
 *
 * This file used to serve the guide's tab swipe as well. That gesture moved to
 * src/features/mobile-nav on 2026-07-30 (swiping between GROUPS is guide navigation,
 * and it now drives the bottom bar's indicator) and was rewritten to track the finger,
 * so it needs different thresholds entirely. What is left here is story mode's own
 * discrete swipe, which is the right shape for a full-screen deck: one card at a time,
 * committed or not, with nothing partial to show mid-gesture.
 *
 * The UI measures the raw touch (dx/dy/dt); this owns the thresholds and bounds, so the
 * edges stay testable without dispatching synthetic TouchEvents.
 */

/**
 * Decide whether a completed touch is a day swipe, and where it lands.
 * Returns the target index, or null when the gesture is not a commit:
 *   · too small / too vertical / too slow  (|dx|<72, |dy|>46, dt>650)
 *   · out of range                         (cur < 0, or past the first/last day)
 * Swipe left (dx<0) = next; swipe right = previous.
 */
export function resolveSwipe(
  dx: number,
  dy: number,
  dt: number,
  cur: number,
  count: number,
): number | null {
  if (Math.abs(dx) < 72 || Math.abs(dy) > 46 || dt > 650) return null;
  if (cur < 0) return null;
  const next = dx < 0 ? cur + 1 : cur - 1;
  if (next < 0 || next >= count) return null;
  return next;
}
