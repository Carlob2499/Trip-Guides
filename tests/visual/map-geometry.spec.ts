/* THE MAP COMPOSITION'S GEOMETRY GATE.

   Board 04 is one map filling the frame with panels floating on it. That composition dies in
   three specific ways, all of which shipped at least once before this file existed:
     · panels overlapping — the "Map" card sat on top of the chip row and ate three chips
     · dead ground — the map didn't fill its stage, leaving bands of empty page down two edges
     · a ragged gutter — each panel carrying its own offset, so nothing lined up with anything
   Screenshots do not catch these; a reviewer looks at a picture and sees "a map". So this reads
   the rendered rectangles and asserts the composition, in numbers.

   Everything here is measured against ONE value, --mapdest-gutter, read from the DOM rather
   than hardcoded — the point is that the panels agree with each other, so a deliberate change
   to the gutter must not require editing this file. */

import { test, expect, type Page } from "@playwright/test";

const KOREA = "/Trip-Guides/guides/korea/";
const DESKTOP = { width: 1440, height: 1000 };
/* Sub-pixel layout is normal (fractional rems, borders); a pixel of slack is not a ragged edge. */
const SLACK = 1.5;

type Box = { x: number; y: number; w: number; h: number };

async function openMap(page: Page) {
  await page.setViewportSize(DESKTOP);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(KOREA, { waitUntil: "domcontentloaded" });
  const nav = page.locator('[data-dest-nav][data-dest="map"]');
  const n = await nav.count();
  for (let i = 0; i < n; i += 1) {
    if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; }
  }
  await expect(page.locator("#dest-map")).toBeVisible();
  await page.waitForTimeout(600);
}

const boxOf = async (page: Page, sel: string): Promise<Box> => {
  const b = await page.locator(sel).first().boundingBox();
  expect(b, `${sel} has no box — it is not rendered`).not.toBeNull();
  return { x: b!.x, y: b!.y, w: b!.width, h: b!.height };
};

const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.w - SLACK && b.x < a.x + a.w - SLACK && a.y < b.y + b.h - SLACK && b.y < a.y + a.h - SLACK;

test.describe("⌁ the Map surface is one map with panels floating on it", () => {
  test("the map fills its stage — no dead ground on any edge", async ({ page }) => {
    await openMap(page);
    const bench = await boxOf(page, ".mapdest-bench");
    const map = await boxOf(page, ".mapdest-map");

    expect(Math.abs(map.x - bench.x), "dead ground on the left").toBeLessThanOrEqual(SLACK);
    expect(Math.abs(map.y - bench.y), "dead ground on the top").toBeLessThanOrEqual(SLACK);
    expect(Math.abs((map.x + map.w) - (bench.x + bench.w)), "dead ground on the right").toBeLessThanOrEqual(SLACK);
    expect(Math.abs((map.y + map.h) - (bench.y + bench.h)), "dead ground at the bottom").toBeLessThanOrEqual(SLACK);
  });

  test("every floating panel hangs off the one shared gutter", async ({ page }) => {
    await openMap(page);
    const gutter = await page.locator(".mapdest").first().evaluate((el) =>
      parseFloat(getComputedStyle(el).getPropertyValue("--mapdest-gutter")));
    expect(gutter, "--mapdest-gutter is not declared — the panels have no shared origin").toBeGreaterThan(0);

    const bench = await boxOf(page, ".mapdest-bench");
    const panel = await boxOf(page, ".mapdest-panel");
    const index = await boxOf(page, ".mapdest-sheet");
    const chips = await boxOf(page, ".mapdest .map-chips");

    expect(Math.abs(panel.x - (bench.x + gutter)), "left panel is off the gutter").toBeLessThanOrEqual(SLACK);
    expect(Math.abs((bench.x + bench.w) - (index.x + index.w) - gutter), "index panel is off the gutter").toBeLessThanOrEqual(SLACK);
    /* One top edge for all three — this is the line a reader actually sees. */
    expect(Math.abs(panel.y - (bench.y + gutter)), "left panel top is off the gutter").toBeLessThanOrEqual(SLACK);
    expect(Math.abs(index.y - (bench.y + gutter)), "index panel top is off the gutter").toBeLessThanOrEqual(SLACK);
    expect(Math.abs(chips.y - (bench.y + gutter)), "chip row top is off the gutter").toBeLessThanOrEqual(SLACK);
  });

  test("no floating panel sits on top of another", async ({ page }) => {
    await openMap(page);
    const named: [string, Box][] = [
      ["left panel", await boxOf(page, ".mapdest-panel")],
      ["chip row", await boxOf(page, ".mapdest .map-chips")],
      ["index panel", await boxOf(page, ".mapdest-sheet")],
    ];
    const clashes: string[] = [];
    for (let i = 0; i < named.length; i += 1) {
      for (let j = i + 1; j < named.length; j += 1) {
        if (overlaps(named[i][1], named[j][1])) clashes.push(`${named[i][0]} overlaps ${named[j][0]}`);
      }
    }
    expect(clashes, "floating panels are colliding").toEqual([]);
  });

  test("nothing escapes the stage, and the index keeps its bottom gutter", async ({ page }) => {
    await openMap(page);
    const gutter = await page.locator(".mapdest").first().evaluate((el) =>
      parseFloat(getComputedStyle(el).getPropertyValue("--mapdest-gutter")));
    const bench = await boxOf(page, ".mapdest-bench");
    for (const sel of [".mapdest-panel", ".mapdest-sheet", ".mapdest .map-chips"]) {
      const b = await boxOf(page, sel);
      expect(b.x, `${sel} escapes the stage on the left`).toBeGreaterThanOrEqual(bench.x - SLACK);
      expect(b.x + b.w, `${sel} escapes the stage on the right`).toBeLessThanOrEqual(bench.x + bench.w + SLACK);
      expect(b.y + b.h, `${sel} escapes the stage at the bottom`).toBeLessThanOrEqual(bench.y + bench.h + SLACK);
    }
    /* The index is inset equally top and bottom — the single most visible sign of care, and the
       thing that reads as "wonky" the instant it is not true. */
    const index = await boxOf(page, ".mapdest-sheet");
    const bottomGap = (bench.y + bench.h) - (index.y + index.h);
    expect(bottomGap, `index bottom gutter is ${bottomGap.toFixed(1)}px, top is ${gutter}px`).toBeGreaterThanOrEqual(gutter - SLACK);
  });

  test("the chip row stays on one line", async ({ page }) => {
    await openMap(page);
    /* Wrapping is what turns the chip bar into a wall that eats a third of the map. The board
       keeps one row and hides the rest behind "More". */
    const chips = await boxOf(page, ".mapdest .map-chips");
    const one = await boxOf(page, ".mapdest .map-chip");
    expect(chips.h, "the chip row has wrapped onto multiple lines").toBeLessThanOrEqual(one.h + SLACK);
  });
});
