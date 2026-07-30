/**
 * Pure decision logic for the yielding chrome (ui/yield-chrome.js).
 *
 * This exists because the first cut got it wrong in a way no unit test would have been
 * written for: "any upward pixel returns the chrome" sounds right, but real pages jitter.
 * Scroll anchoring, sub-pixel rounding and lazy images all produce a 1–3px rebound right
 * after a scroll settles — measured in preview as 430 → 428 → 430 — and each rebound
 * wiped the downward accumulator, so the chrome could never yield at all. Intent has to
 * clear a threshold in BOTH directions, and that threshold belongs somewhere testable.
 */

/** Downward travel before the chrome gives way. */
export const YIELD_AT = 80;
/** Upward travel that counts as "bring it back" — a deliberate flick, not a rebound. */
export const RETURN_AT = 24;
/** Anything under this is page jitter and means nothing. */
export const JITTER = 6;
/** Above the masthead there is nothing to gain, and the cover reads better whole. */
export const TOP_ZONE = 140;

export type YieldState = { down: number; up: number; yielded: boolean };

export const initialYield = (): YieldState => ({ down: 0, up: 0, yielded: false });

/**
 * Fold one scroll sample into the state.
 * `dy` is the signed movement since the last sample, `y` the absolute position, and
 * `blocked` true while an overlay owns the screen (a sheet, the story intro, the
 * palette) — chrome sliding under an overlay reads as a glitch, so it stands down.
 */
export function nextYield(state: YieldState, dy: number, y: number, blocked = false): YieldState {
  if (blocked || y < TOP_ZONE) return { down: 0, up: 0, yielded: false };
  if (Math.abs(dy) < 1) return state;
  if (dy > 0) {
    const down = state.down + dy;
    return { down, up: 0, yielded: state.yielded || down > YIELD_AT };
  }
  const up = state.up - dy;
  if (up <= JITTER) return { ...state, up }; // a rebound: remember it, change nothing
  if (up > RETURN_AT) return { down: 0, up: 0, yielded: false };
  return { down: 0, up, yielded: state.yielded };
}
