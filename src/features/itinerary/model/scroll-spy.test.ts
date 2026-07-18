import { describe, expect, it } from "vitest";
import { lastAboveFold, nearestToCenter } from "./scroll-spy";
import { DECK_CENTERS, DECK_VIEWPORT_CENTER, LIST_FOLD, LIST_TOPS } from "../mocks/seeds";

describe("nearestToCenter", () => {
  it("picks the card whose center is closest to the viewport center", () => {
    expect(nearestToCenter(DECK_CENTERS, DECK_VIEWPORT_CENTER)).toBe(1);
  });

  it("picks the first card when the deck is scrolled to the start", () => {
    expect(nearestToCenter([160, 480, 800], 160)).toBe(0);
  });

  it("picks the last card when the deck is scrolled to the end", () => {
    expect(nearestToCenter([-640, -320, 0], 0)).toBe(2);
  });

  it("resolves an exact tie to the earlier index", () => {
    // centers 100 and 300, target 200 — equidistant; forward scan keeps index 0
    expect(nearestToCenter([100, 300], 200)).toBe(0);
  });

  it("returns 0 for an empty deck (never called live, but must not throw)", () => {
    expect(nearestToCenter([], 187)).toBe(0);
  });
});

// lastAboveFold takes a lazy accessor (not an array) so the UI's early break can
// skip getBoundingClientRect calls past the fold; this helper adapts a test array.
const fold = (tops: number[], threshold: number) =>
  lastAboveFold(tops.length, (i) => tops[i], threshold);

describe("lastAboveFold", () => {
  it("selects the deepest day whose top has crossed the fold", () => {
    expect(fold(LIST_TOPS, LIST_FOLD)).toBe(2);
  });

  it("returns 0 while the first day is still below the fold", () => {
    expect(fold([200, 500, 800], 150)).toBe(0);
  });

  it("selects the last day once everything has scrolled past", () => {
    expect(fold([-900, -600, -300], 150)).toBe(2);
  });

  it("treats top exactly at the threshold as crossed (<= 0)", () => {
    expect(fold([-100, 150, 400], 150)).toBe(1); // day 1 top 150 - 150 = 0
  });

  it("stops at the first gap — does not skip to a later crossed day", () => {
    // day 1 is below the fold; a later day 3 sitting above must not be chosen
    expect(fold([-100, 300, -50, -20], 150)).toBe(0);
  });

  it("stops measuring at the first card below the fold (early break)", () => {
    // The whole point of the accessor: on a long list scrolled near the top, it
    // must not read every card's position — only down to the first one below.
    const tops = [-100, 300, -50, -20, 900];
    const read: number[] = [];
    const idx = lastAboveFold(tops.length, (i) => { read.push(i); return tops[i]; }, 150);
    expect(idx).toBe(0);
    expect(read).toEqual([0, 1]); // read day 0 (above) + day 1 (below → break); never 2,3,4
  });
});
