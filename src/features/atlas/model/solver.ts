/* Pin-card collision solver (SPEC-COMPONENTS.md §8, "do not simplify"; ANTIPATTERNS.md's
   "Greedy per-card collision solving" and "Animating left/top on pin cards" entries name
   exactly what this file must NOT do). Ported from the prototype's own `solvePlacement`
   (`docs/design-handoff/prototype/Waypoint Overdrive v2.dc.html`) — the prototype code is the
   tie-break authority for exact numbers (README's own rule), so PAD/GAP/the grid step and the
   eight seat offsets below are copied, not re-derived.

   Pure geometry only. It reads pin positions, card sizes, and obstacle rects and returns
   target offsets — it never touches layout or the DOM itself. The caller (ui/) is responsible
   for: measuring real card/obstacle rects, running this inside requestIdleCallback only when
   the visible pin set changes or a card has drifted >90px (never inside the frame loop), and
   animating toward the result via `translate3d` only.

   Two-pass strategy: solve once with every card at full height; if any card had to fall back
   to the grid search AND still overlapped there, re-solve the WHOLE pass with every
   plate-bearing card compacted (photo hidden) and take that result if IT came back clean.
   Solving each card greedily/independently was tried and rejected — the first card's
   full-size claim starves the rest (ANTIPATTERNS.md). */

export interface Obstacle {
  l: number;
  t: number;
  r: number;
  b: number;
}

export interface SolverCard {
  code: string;
  /** Pin position, in the same coordinate space as `bounds` and every obstacle rect. */
  x: number;
  y: number;
  /** Card width never compacts — only its height does, by hiding the plate photo. */
  w: number;
  fullH: number;
  /** Null when the card has no plate to hide (fullH === compactH, compaction is a no-op). */
  compactH: number | null;
}

export interface SeatPlacement {
  code: string;
  l: number;
  t: number;
  w: number;
  h: number;
  /** Whether this seat used the card's compacted (plate-hidden) height. */
  compact: boolean;
  /** True when the card sits directly above the pin with nothing between — draws a tail
      connecting the card's bottom edge to the pin. Only the "above" seat ever sets this. */
  tail: boolean;
}

export interface SolveResult {
  seats: SeatPlacement[];
  /** True when every card that needed the grid-search fallback found a zero-overlap spot
      there. A card satisfied by one of the eight named seats never affects this — those
      seats are only ever accepted when they already have zero overlap. */
  clean: boolean;
}

const PAD = 10;
const GAP = 26;
const GRID_STEP = 18;

function overlaps(r: Obstacle, o: Obstacle): boolean {
  return r.l < o.r && r.r > o.l && r.t < o.b && r.b > o.t;
}

/** The eight seats, in trial order: above, below, right, left, then the four diagonals.
    Only "above" is ever a tail candidate — a card below-left/right of its pin reads fine
    without a connector, but one sitting apart to the side or below needs a pointer back. */
function seatsFor(cw: number, ch: number, px: number, py: number) {
  return [
    { l: px - cw / 2, t: py - GAP - ch, tail: true },
    { l: px - cw / 2, t: py + GAP, tail: false },
    { l: px + GAP, t: py - ch / 2, tail: false },
    { l: px - GAP - cw, t: py - ch / 2, tail: false },
    { l: px + GAP, t: py - GAP - ch, tail: false },
    { l: px - GAP - cw, t: py - GAP - ch, tail: false },
    { l: px + GAP, t: py + GAP, tail: false },
    { l: px - GAP - cw, t: py + GAP, tail: false },
  ];
}

/** Last resort: scan a coarse grid for the lowest-overlap spot, preferring one close to the
    pin when overlap is tied. Settles early once a zero-overlap cell near the pin is found —
    it does not need to be a global optimum, only a clean or least-bad one. */
function gridSearch(cw: number, ch: number, px: number, py: number, W: number, H: number, occupied: Obstacle[]) {
  const maxT = Math.max(PAD, H - ch - PAD);
  const maxL = Math.max(PAD, W - cw - PAD);
  let best: { l: number; t: number; score: number; area: number } | null = null;
  let settled = false;
  for (let t = PAD; !settled; t = Math.min(t + GRID_STEP, maxT)) {
    for (let l = PAD; ; l = Math.min(l + GRID_STEP, maxL)) {
      let area = 0;
      const r = { l, t, r: l + cw, b: t + ch };
      for (const o of occupied) {
        const ow = Math.min(r.r, o.r) - Math.max(r.l, o.l);
        const oh = Math.min(r.b, o.b) - Math.max(r.t, o.t);
        if (ow > 0 && oh > 0) area += ow * oh;
      }
      const dist = Math.hypot(l + cw / 2 - px, t + ch / 2 - py);
      const score = area * 4 + dist;
      if (!best || score < best.score) best = { l, t, score, area };
      if (area === 0 && dist < GRID_STEP * 3) { settled = true; break; }
      if (l >= maxL) break;
    }
    if (t >= maxT) break;
  }
  return best;
}

/** One full pass over every card, in the order given — order is the caller's priority (e.g.
    sheet ordinal); this solver does not re-sort. `compactAll` hides the plate on every card
    that has one. */
function place(cards: SolverCard[], obstacles: Obstacle[], W: number, H: number, compactAll: boolean): SolveResult {
  const occupied = obstacles.slice();
  let clean = true;
  const seats: SeatPlacement[] = [];
  for (const card of cards) {
    const cw = card.w;
    const compact = compactAll && card.compactH != null;
    const ch = compact ? (card.compactH as number) : card.fullH;
    const px = card.x, py = card.y;

    let found: { l: number; t: number; tail: boolean } | null = null;
    for (const seat of seatsFor(cw, ch, px, py)) {
      const l = Math.max(PAD, Math.min(W - cw - PAD, seat.l));
      const t = Math.max(PAD, Math.min(H - ch - PAD, seat.t));
      const r = { l, t, r: l + cw, b: t + ch };
      if (!occupied.some((o) => overlaps(r, o))) {
        found = { l, t, tail: seat.tail && Math.abs(t + ch + GAP - py) < 2 };
        break;
      }
    }
    if (!found) {
      const best = gridSearch(cw, ch, px, py, W, H, occupied);
      clean = clean && !!best && best.area === 0;
      found = best ? { l: best.l, t: best.t, tail: false } : { l: PAD, t: PAD, tail: false };
    }

    seats.push({ code: card.code, l: found.l, t: found.t, w: cw, h: ch, compact, tail: found.tail });
    occupied.push({ l: found.l, t: found.t, r: found.l + cw, b: found.t + ch });
  }
  return { seats, clean };
}

/**
 * Solve placement for every visible pin card at once. Tries every card at full height first;
 * if that pass isn't clean, re-tries the WHOLE pass with plate-bearing cards compacted and
 * takes that result if it IS clean. If neither pass is fully clean, returns the full-height
 * pass anyway (its grid-searched cards already carry the least-bad position each found).
 */
export function solvePlacement(cards: SolverCard[], obstacles: Obstacle[], bounds: { w: number; h: number }): SolveResult {
  const full = place(cards, obstacles, bounds.w, bounds.h, false);
  if (full.clean) return full;
  const compacted = place(cards, obstacles, bounds.w, bounds.h, true);
  return compacted.clean ? compacted : full;
}
