import { describe, it, expect } from "vitest";
import { solvePlacement, type SolverCard, type Obstacle } from "./solver";

const BOUNDS = { w: 1200, h: 800 };

function card(code: string, x: number, y: number, extra: Partial<SolverCard> = {}): SolverCard {
  return { code, x, y, w: 220, fullH: 140, compactH: 60, ...extra };
}

describe("solvePlacement — single card, empty field", () => {
  it("takes the first seat (directly above the pin) and marks it a tail", () => {
    const result = solvePlacement([card("kr", 600, 400)], [], BOUNDS);
    expect(result.clean).toBe(true);
    const seat = result.seats[0];
    expect(seat.code).toBe("kr");
    expect(seat.compact).toBe(false);
    expect(seat.tail).toBe(true);
    // Above: bottom edge sits GAP(26) above the pin.
    expect(seat.t + seat.h).toBeCloseTo(400 - 26, 0);
    expect(seat.l + seat.w / 2).toBeCloseTo(600, 0);
  });

  it("never overlaps a passed-in obstacle", () => {
    const blockAbove: Obstacle = { l: 0, t: 0, r: 1200, b: 400 };
    const result = solvePlacement([card("kr", 600, 400)], [blockAbove], BOUNDS);
    const seat = result.seats[0];
    const box: Obstacle = { l: seat.l, t: seat.t, r: seat.l + seat.w, b: seat.t + seat.h };
    const overlapsBlock = box.l < blockAbove.r && box.r > blockAbove.l && box.t < blockAbove.b && box.b > blockAbove.t;
    expect(overlapsBlock).toBe(false);
    expect(result.clean).toBe(true);
  });
});

describe("solvePlacement — multiple cards", () => {
  it("later cards route around earlier ones placed in the same pass (no two seats overlap)", () => {
    // Two pins close enough that "above" for the second would land on the first card.
    const result = solvePlacement([card("kr", 600, 400), card("jp", 610, 405)], [], BOUNDS);
    expect(result.clean).toBe(true);
    const [a, b] = result.seats;
    const boxA: Obstacle = { l: a.l, t: a.t, r: a.l + a.w, b: a.t + a.h };
    const boxB: Obstacle = { l: b.l, t: b.t, r: b.l + b.w, b: b.t + b.h };
    const overlap = boxA.l < boxB.r && boxA.r > boxB.l && boxA.t < boxB.b && boxA.b > boxB.t;
    expect(overlap).toBe(false);
  });

  it("solves in the order given — does not re-sort by position", () => {
    const result = solvePlacement(
      [card("us", 900, 700), card("kr", 100, 100)],
      [],
      BOUNDS,
    );
    expect(result.seats.map((s) => s.code)).toEqual(["us", "kr"]);
  });
});

describe("solvePlacement — compaction retry (ANTIPATTERNS: greedy per-card solving is rejected)", () => {
  it("re-solves the WHOLE pass with plates hidden when the full-height pass can't go clean, and takes it if clean", () => {
    // A tight field: four pins packed so close that full-height (140px) cards can't all fit
    // without overlap, but compact (60px) cards can.
    const cards = [
      card("kr", 300, 300),
      card("jp", 340, 300),
      card("dk", 300, 340),
      card("us", 340, 340),
    ];
    const bounds = { w: 500, h: 500 };
    const result = solvePlacement(cards, [], bounds);
    expect(result.clean).toBe(true);
    // At least one card had to compact for the tight field to go clean.
    expect(result.seats.some((s) => s.compact)).toBe(true);
    // No two placed cards overlap.
    for (let i = 0; i < result.seats.length; i++) {
      for (let j = i + 1; j < result.seats.length; j++) {
        const a = result.seats[i], b = result.seats[j];
        const boxA: Obstacle = { l: a.l, t: a.t, r: a.l + a.w, b: a.t + a.h };
        const boxB: Obstacle = { l: b.l, t: b.t, r: b.l + b.w, b: b.t + b.h };
        const overlap = boxA.l < boxB.r && boxA.r > boxB.l && boxA.t < boxB.b && boxA.b > boxB.t;
        expect(overlap).toBe(false);
      }
    }
  });

  it("a card with no plate (compactH: null) cannot shrink even during the compaction retry", () => {
    const result = solvePlacement(
      [card("kr", 300, 300, { compactH: null })],
      [{ l: 0, t: 0, r: 500, b: 500 }], // the whole field is blocked
      { w: 500, h: 500 },
    );
    // Falls to grid search; height must stay fullH (140) throughout — never silently compacts.
    expect(result.seats[0].h).toBe(140);
    expect(result.seats[0].compact).toBe(false);
  });
});

describe("solvePlacement — total failure (grid-search fallback)", () => {
  it("returns clean:false and a least-bad position when nothing fits", () => {
    const wallToWall: Obstacle = { l: 0, t: 0, r: 500, b: 500 };
    const result = solvePlacement([card("kr", 250, 250)], [wallToWall], { w: 500, h: 500 });
    expect(result.clean).toBe(false);
    expect(result.seats).toHaveLength(1);
    expect(Number.isFinite(result.seats[0].l)).toBe(true);
    expect(Number.isFinite(result.seats[0].t)).toBe(true);
  });

  it("still returns one seat per input card even when every seat is bad", () => {
    const wallToWall: Obstacle = { l: 0, t: 0, r: 500, b: 500 };
    const cards = [card("kr", 100, 100), card("jp", 200, 200), card("dk", 300, 300)];
    const result = solvePlacement(cards, [wallToWall], { w: 500, h: 500 });
    expect(result.seats).toHaveLength(3);
    expect(result.seats.map((s) => s.code)).toEqual(["kr", "jp", "dk"]);
  });
});

describe("solvePlacement — never lets a card escape the bounds padding", () => {
  it("clamps a pin near the edge so its card still respects PAD", () => {
    const result = solvePlacement([card("kr", 5, 5)], [], BOUNDS);
    const seat = result.seats[0];
    expect(seat.l).toBeGreaterThanOrEqual(10);
    expect(seat.t).toBeGreaterThanOrEqual(10);
    expect(seat.l + seat.w).toBeLessThanOrEqual(BOUNDS.w - 10 + 0.01);
  });
});
