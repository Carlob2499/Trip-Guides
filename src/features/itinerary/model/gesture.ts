/**
 * Pure swipe-decision logic for swipe-nav.js. The UI measures the raw touch
 * (dx/dy/dt) and reads the current section; these functions own the doctrine
 * thresholds and the direction/bounds rules, isolated so their edges are
 * testable without dispatching synthetic TouchEvents.
 */

/**
 * Decide whether a completed touch is a section swipe, and where it lands.
 * Returns the target section index, or null when the gesture is not a commit:
 *   · too small / too vertical / too slow  (|dx|<72, |dy|>46, dt>650)
 *   · started on a special panel           (cur < 0 — budget/vote/etc.)
 *   · would run past the first/last section (out of bounds)
 * Swipe left (dx<0) = next section; swipe right = previous.
 */
export function resolveSwipe(
  dx: number,
  dy: number,
  dt: number,
  cur: number,
  catCount: number,
): number | null {
  if (Math.abs(dx) < 72 || Math.abs(dy) > 46 || dt > 650) return null;
  if (cur < 0) return null;
  const next = dx < 0 ? cur + 1 : cur - 1;
  if (next < 0 || next >= catCount) return null;
  return next;
}

/**
 * The live edge-glow hint while a horizontal swipe is still forming. A weaker,
 * earlier threshold than the commit above (|dx|>34) so the page answers before
 * the gesture completes. Returns the glow direction or null (no hint).
 */
export function swipeHint(dx: number, dy: number): "fwd" | "back" | null {
  if (Math.abs(dx) > 34 && Math.abs(dy) < 46) return dx < 0 ? "fwd" : "back";
  return null;
}
