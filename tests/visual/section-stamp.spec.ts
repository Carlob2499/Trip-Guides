/* The per-section verification mark (staleness-ui.js + .checked-stamp / .stale-pill).
   src/lib/staleness.test.ts pins the date arithmetic; what it cannot see is whether a section
   that HAS been verified says so on the page. It did not: until the healthy branch existed the
   module drew on the stale path only, so a verified section and a never-checked one rendered
   identically. The clock is frozen because the judgment is made on the CLIENT clock by design. */
// @protects-file Every checked section shows the date it was checked, and every aged-out one says so instead.

import { test, expect, type Page } from "@playwright/test";

const GUIDES = ["korea", "us", "denmark", "japan"] as const;

/* One day after the newest verified_on in the content, so every section is inside even the
   7-day fx shelf life and the healthy branch is the one under test. */
const FRESH = "2026-08-04T09:00:00Z";

const installed = new WeakSet<Page>();
async function atDate(page: Page, iso: string) {
  if (installed.has(page)) return page.clock.setFixedTime(new Date(iso));
  await page.clock.install({ time: new Date(iso) });
  installed.add(page);
}

for (const slug of GUIDES) {
  test(`every verified section carries exactly one verification mark — ${slug}`, async ({ page }) => {
    await atDate(page, FRESH);
    await page.goto(`/Trip-Guides/guides/${slug}/`, { waitUntil: "domcontentloaded" });
    // Wait for the module to have run at all before counting absences.
    await expect(page.locator(".checked-stamp").first()).toBeAttached();

    const rows = await page.evaluate(() =>
      [...document.querySelectorAll(".block[data-verified-on]")].map((el) => ({
        id: el.id,
        on: el.getAttribute("data-verified-on"),
        stamps: el.querySelectorAll(".checked-stamp").length,
        pills: el.querySelectorAll(".stale-pill").length,
        text: el.querySelector(".checked-stamp")?.textContent ?? "",
      })),
    );

    expect(rows.length, "this guide has no verified sections to judge").toBeGreaterThan(0);
    for (const r of rows) {
      // ⌁ Never zero (the bug this spec exists for) and never both — a section is checked or it
      // is aged out, and rendering both marks would be one datum shown as two things.
      expect(r.stamps + r.pills, `${r.id} (verified ${r.on}) shows ${r.stamps} stamps + ${r.pills} pills`).toBe(1);
      // The stamp states the section's OWN date, not the guide-level one from the masthead.
      if (r.stamps) expect(r.text).toBe(`✓ CHECKED ${r.on}`);
    }
  });
}

test("⌁ past its shelf life the stamp gives way to the downgrade pill", async ({ page }) => {
  // The same sections judged twice. If the healthy branch ever swallowed the stale one, the
  // first half of this passes and the second half is what catches it.
  await atDate(page, FRESH);
  await page.goto("/Trip-Guides/guides/korea/", { waitUntil: "domcontentloaded" });
  const verified = await page.locator(".block[data-verified-on]").count();
  expect(verified).toBeGreaterThan(0);
  await expect(page.locator(".block[data-verified-on] .checked-stamp")).toHaveCount(verified);
  await expect(page.locator(".block[data-verified-on] .stale-pill")).toHaveCount(0);

  await atDate(page, "2027-08-04T09:00:00Z");
  await page.reload({ waitUntil: "domcontentloaded" });
  // A year on, every one is past the longest (180-day venue) life — the marks swap wholesale,
  // and nothing quietly stops rendering a mark on the way through.
  await expect(page.locator(".block[data-verified-on] .stale-pill")).toHaveCount(verified);
  await expect(page.locator(".block[data-verified-on] .checked-stamp")).toHaveCount(0);
});

test("the stamp is a mark, not a control", async ({ page }) => {
  // SPEC-COMPONENTS §2 pairs the stamp with a separate source link rather than making the stamp
  // itself tappable; a11y.spec's 44px floor applies to controls, so this must not become one.
  await atDate(page, FRESH);
  await page.goto("/Trip-Guides/guides/korea/", { waitUntil: "domcontentloaded" });
  const stamp = page.locator(".checked-stamp").first();
  await expect(stamp).toBeAttached();
  expect(await stamp.evaluate((e) => e.tagName)).toBe("SPAN");
  await expect(page.locator("a.checked-stamp, button.checked-stamp")).toHaveCount(0);

  // Stamp typography, SPEC-COMPONENTS §2: .82rem, 640, square, 1px of its OWN ink.
  const css = await stamp.evaluate((e) => {
    const c = getComputedStyle(e);
    return { size: parseFloat(c.fontSize), weight: c.fontWeight, radius: c.borderRadius, border: c.borderTopColor, ink: c.color };
  });
  expect(css.size).toBeCloseTo(13.12, 1);
  expect(css.weight).toBe("640");
  expect(css.radius).toBe("0px");
  expect(css.border).toBe(css.ink);
});
