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
const PHONE = { width: 390, height: 844 };
/* Sub-pixel layout is normal (fractional rems, borders); a pixel of slack is not a ragged edge. */
const SLACK = 1.5;

type Box = { x: number; y: number; w: number; h: number };

async function openMap(page: Page, vp = DESKTOP) {
  await page.setViewportSize(vp);
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

    expect(Math.abs(panel.x - (bench.x + gutter)), "left panel is off the gutter").toBeLessThanOrEqual(SLACK);
    expect(Math.abs((bench.x + bench.w) - (index.x + index.w) - gutter), "index panel is off the gutter").toBeLessThanOrEqual(SLACK);
    /* One top edge for both — this is the line a reader actually sees. The filter used to be a
       third floating object on this line; it is now the foot of the left panel, so there is
       nothing else here to align. */
    expect(Math.abs(panel.y - (bench.y + gutter)), "left panel top is off the gutter").toBeLessThanOrEqual(SLACK);
    expect(Math.abs(index.y - (bench.y + gutter)), "index panel top is off the gutter").toBeLessThanOrEqual(SLACK);
  });

  test("no floating panel sits on top of another", async ({ page }) => {
    await openMap(page);
    const named: [string, Box][] = [
      ["left panel", await boxOf(page, ".mapdest-panel")],
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
    for (const sel of [".mapdest-panel", ".mapdest-sheet", ".mapdest .map-legend"]) {
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

  test("the legend sits inside the left panel, not beside it", async ({ page }) => {
    await openMap(page);
    /* The filter used to be a capsule row floating over the top of the map. It is now the foot of
       the Map panel, which is the whole point of the change — so the assertion that used to say
       "one line, never wrapped" becomes "contained by its panel". A legend that escaped its panel
       would be back to being a thing lying on the map. */
    const panel = await boxOf(page, ".mapdest-panel");
    const legend = await boxOf(page, ".mapdest .map-legend");
    expect(legend.x, "legend escapes its panel on the left").toBeGreaterThanOrEqual(panel.x - SLACK);
    expect(legend.x + legend.w, "legend escapes its panel on the right").toBeLessThanOrEqual(panel.x + panel.w + SLACK);
    expect(legend.y + legend.h, "legend escapes its panel at the foot").toBeLessThanOrEqual(panel.y + panel.h + SLACK);
  });
});

/* The phone is the surface that matters most in the field, and it is the one that historically
   got the leftover attention. Same three failure modes, measured at 390px. */
test.describe("⌁ the Map surface holds together on a phone", () => {
  test("the map fills the viewport it is given, with no gap under the chrome or over the bar", async ({ page }) => {
    await openMap(page, PHONE);
    const map = await boxOf(page, ".mapdest-map");
    const chrome = await boxOf(page, ".chrome");
    const bar = await boxOf(page, ".botbar");

    expect(Math.abs(map.y - (chrome.y + chrome.h)), "a gap between the strip and the map").toBeLessThanOrEqual(SLACK);
    expect(map.x, "the map does not reach the left edge").toBeLessThanOrEqual(SLACK);
    expect(map.x + map.w, "the map does not reach the right edge").toBeGreaterThanOrEqual(PHONE.width - SLACK);
    /* The bottom bar is fixed over the map by design; what must not happen is dead ground
       BETWEEN them, which is what a mis-set height looks like. */
    expect(map.y + map.h, "dead ground between the map and the bottom bar").toBeGreaterThanOrEqual(bar.y - SLACK);
  });

  test("the filter strip is one line and stays clear of the edges", async ({ page }) => {
    await openMap(page, PHONE);
    const chips = await boxOf(page, ".mapdest .map-legend");
    const one = await boxOf(page, ".mapdest .map-legend-row");
    expect(chips.h, "the filter strip has wrapped on a phone — it would eat the map").toBeLessThanOrEqual(one.h + SLACK);
    expect(chips.x, "the filter strip is flush against the left edge").toBeGreaterThanOrEqual(4);
    expect(chips.x + chips.w, "the filter strip runs off the right edge").toBeLessThanOrEqual(PHONE.width - 4);
  });

  test("an overflowing filter strip says so, and stops saying so at its end", async ({ page }) => {
    await openMap(page, PHONE);
    const bar = page.locator(".mapdest .map-legend").first();
    const overflows = await bar.evaluate((el) => el.scrollWidth > el.clientWidth + 1);
    expect(overflows, "this guide's filters do not overflow at 390px — the fade has nothing to prove").toBe(true);
    await expect(bar, "an overflowing row should carry the fade").not.toHaveAttribute("data-scroll-end", "");
    await bar.evaluate((el) => { el.scrollLeft = el.scrollWidth; el.dispatchEvent(new Event("scroll")); });
    await expect(bar, "scrolled to the end, the fade should come off").toHaveAttribute("data-scroll-end", "");
  });

  test("the sheet does not cover the map's whole first screen at rest", async ({ page }) => {
    await openMap(page, PHONE);
    const sheet = await boxOf(page, ".mapdest-sheet");
    const map = await boxOf(page, ".mapdest-map");
    /* At rest the sheet is a peek handle. If it is taller than a third of the map, the phone
       has stopped being a map and become a list with a picture behind it. */
    expect(sheet.h, "the resting sheet is eating the map").toBeLessThanOrEqual(map.h / 3);
  });
});

/* The Itinerary's workbench map is the same promise on a different surface: one map filling its
   column, not a small one framed in dead ground. It shipped with .9rem of padding and its own
   border for months, which is exactly the kind of thing a screenshot review looks straight past. */
test.describe("⌁ the Itinerary's map fills its pane", () => {
  test("no dead ground around the workbench map", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(KOREA, { waitUntil: "domcontentloaded" });
    const nav = page.locator('[data-dest-nav][data-dest="itinerary"]');
    const n = await nav.count();
    for (let i = 0; i < n; i += 1) if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; }
    await expect(page.locator("#dest-itinerary")).toBeVisible();
    await page.waitForTimeout(600);

    const pane = await boxOf(page, ".itin-mappane");
    const map = await boxOf(page, ".itin-map--bench");
    for (const [edge, delta] of [
      ["left", map.x - pane.x],
      ["top", map.y - pane.y],
      ["right", (pane.x + pane.w) - (map.x + map.w)],
      ["bottom", (pane.y + pane.h) - (map.y + map.h)],
    ] as [string, number][]) {
      expect(Math.abs(delta), `${delta.toFixed(1)}px of dead ground on the ${edge}`).toBeLessThanOrEqual(SLACK);
    }
  });
});
