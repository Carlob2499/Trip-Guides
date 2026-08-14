/**
 * Pure swipe-decision logic for ui/swipe-tabs.js — the horizontal gesture that moves
 * between content groups on a phone.
 *
 * Moved here from the itinerary silo on 2026-07-30 with the rewrite from a discrete
 * threshold swipe to a finger-tracked one: swiping between GROUPS is guide navigation,
 * not itinerary behaviour, and it now has to drive the bottom bar's indicator — which
 * lives in this silo. Leaving it in itinerary would have meant a deep import across a
 * silo boundary, which the architecture contract forbids.
 *
 * The UI measures the raw touch; these functions own every threshold and bound, so the
 * edges are testable without dispatching synthetic TouchEvents.
 */

/** Claim the gesture only once it is unambiguously horizontal. */
export const AXIS_LOCK_PX = 24;
/** Commit when the drag crosses this share of the viewport… */
const COMMIT_FRACTION = 0.3;
/** …or when it is flicked at least this fast (px/ms), however short. */
const COMMIT_VELOCITY = 0.5;

/**
 * Has the drag declared itself horizontal? Deliberately strict: a diagonal reads as
 * vertical, because a page that steals a scroll feels broken in a way that a swipe
 * needing one more pixel never does.
 */
export function axisLocked(dx: number, dy: number): boolean {
  return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > AXIS_LOCK_PX;
}

/**
 * Where a released drag lands, or null to spring back.
 * `vx` is px/ms (signed, same direction as dx); `width` is the viewport width.
 * Swipe left (dx<0) = next group; swipe right = previous.
 */
export function resolveCommit(
  dx: number,
  vx: number,
  width: number,
  cur: number,
  count: number,
): number | null {
  if (cur < 0) return null; // a tool panel is open — it is entered and left deliberately
  const far = Math.abs(dx) >= width * COMMIT_FRACTION;
  // A flick has to actually travel far enough to be a gesture rather than a jitter, so
  // velocity still needs the axis lock's distance behind it.
  const fast = Math.abs(vx) >= COMMIT_VELOCITY && Math.abs(dx) > AXIS_LOCK_PX;
  if (!far && !fast) return null;
  const next = dx < 0 ? cur + 1 : cur - 1;
  if (next < 0 || next >= count) return null;
  return next;
}

/**
 * How far the content actually moves for a given finger travel.
 * Inside the range it tracks nearly 1:1 (the page belongs to the finger); at the first
 * or last group there is nothing to bring in, so the drag rubber-bands to a stop — the
 * platform's own way of saying "this is the end" without a message.
 */
export function damp(dx: number, atEdge: boolean): number {
  if (!atEdge) return dx * 0.9;
  return Math.sign(dx) * Math.min(Math.abs(dx) * 0.28, 56);
}

/** True when a swipe in this direction would run past the ends. */
export function atEdge(dx: number, cur: number, count: number): boolean {
  if (cur < 0) return true;
  const next = dx < 0 ? cur + 1 : cur - 1;
  return next < 0 || next >= count;
}
