/* Command palette — Ctrl/Cmd+K, "/", or the topbar Search button
   (src/features/palette/ui/palette.js).

   Untested before Stage F feature 4, and the same shape as the two surfaces before it in this
   stage: built by script at first open, invisible until a key is pressed, and therefore never
   once scanned by the whole-page a11y gate.

   The last test is a regression pin, not a style preference. The footer line and every result
   row's secondary line were BOTH class .pal-hint, so the footer's rule — border-top, data face,
   label size — won the cascade over every row in the list. Nothing about the markup says that;
   only the rendered result does. */
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const KOREA = "/Trip-Guides/guides/korea/";

async function openPalette(page: Page, how: "key" | "slash" | "button") {
  await page.goto(KOREA, { waitUntil: "networkidle" });
  if (how === "key") await page.keyboard.press("Control+k");
  else if (how === "slash") await page.keyboard.press("/");
  else await page.locator(".topbar-search").click();
  const pal = page.locator(".pal-backdrop");
  await expect(pal).toHaveClass(/pal-open/);
  return pal;
}

for (const how of ["key", "slash", "button"] as const) {
  test(`the palette opens via ${how}`, async ({ page }) => {
    await openPalette(page, how);
    await expect(page.locator(".pal-input")).toBeFocused();
    await expect(page.locator(".pal-item").first()).toBeVisible();
  });
}

test("typing filters the list, and Escape closes and returns focus", async ({ page }) => {
  await openPalette(page, "button");
  const before = await page.locator(".pal-item").count();

  await page.locator(".pal-input").fill("zzzzznotathing");
  await expect(page.locator(".pal-empty")).toBeVisible();

  /* render() caps results at 12, so comparing counts proves nothing — before and after are
     both 12, and `after <= before + 12` reads 12 <= 24, which no revert could ever break.
     Assert what filtering actually means instead: every row shown matches the query, in its
     label or in the body text the row was matched on. */
  await page.locator(".pal-input").fill("day");
  const rows = await page.locator(".pal-item").allTextContents();
  expect(rows.length).toBeGreaterThan(0);
  expect(rows.every((r) => r.toLowerCase().includes("day"))).toBe(true);
  expect(before).toBeGreaterThan(0);

  await page.keyboard.press("Escape");
  await expect(page.locator(".pal-backdrop")).not.toHaveClass(/pal-open/);
  await expect(page.locator(".topbar-search")).toBeFocused();
});

test("Enter on the selected row jumps to it and closes the palette", async ({ page }) => {
  await openPalette(page, "button");
  await page.locator(".pal-input").fill("day 2");
  await expect(page.locator(".pal-item").first()).toHaveClass(/pal-sel/);

  await page.keyboard.press("Enter");
  await expect(page.locator(".pal-backdrop")).not.toHaveClass(/pal-open/);
  // The jump flashes its target; that class is the only observable proof it landed somewhere.
  await expect(page.locator(".pin-flash")).toHaveCount(1);
});

test("a result row's hint is a plain secondary line, not the footer's rule", async ({ page }) => {
  await openPalette(page, "button");
  // "In text" results are the ones that carry a hint (the preview of the matched card).
  await page.locator(".pal-input").fill("KTX");
  // :not(:empty) — the hint span is only filled when the query does NOT appear in the label
  // (palette.js), so `.first()` alone would break the day a Korea heading contains "KTX".
  const hint = page.locator(".pal-item .pal-hint:not(:empty)").first();
  await expect(hint).toBeVisible();

  const style = await hint.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { borderTop: cs.borderTopWidth, family: cs.fontFamily, padding: cs.paddingTop };
  });
  expect(style.borderTop).toBe("0px");
  expect(style.padding).toBe("0px");
  // The row hint is prose, not notation — it must not be wearing the data face.
  expect(style.family.toLowerCase()).not.toContain("source sans");
});

for (const scheme of ["light", "dark"] as const) {
  test(`the open palette passes axe in ${scheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await openPalette(page, "button");
    await page.locator(".pal-input").fill("day");
    await expect(page.locator(".pal-item").first()).toBeVisible();

    const results = await new AxeBuilder({ page }).include(".pal-backdrop").analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
}
