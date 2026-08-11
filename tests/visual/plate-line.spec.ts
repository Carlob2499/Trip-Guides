/* The plate line, on the page (R5 SCREENS §1 + SUPERSEDES §3). plate-line.ts's own tests pin
   the derivations; what they cannot see is whether the masthead renders them, whether the
   retired rows are gone from the built HTML, and whether the eyebrow has started echoing it. */
// @protects-file The masthead says where the trip goes and what is next, each exactly once.

import { test, expect, type Page } from "@playwright/test";

const KOREA = "/Trip-Guides/guides/korea/";

/* Freeze the page clock before any script runs, so `Date` is the trip's own week.
   install() is a once-per-page operation; the tests below move the clock three times in one
   test, so every call after the first sets the time instead. Calling install() repeatedly
   worked most of the time and lost a race under full-suite load, which is the worst way for a
   test helper to be wrong. */
const installed = new WeakSet<Page>();
async function atDate(page: Page, iso: string) {
  if (installed.has(page)) {
    await page.clock.setFixedTime(new Date(iso));
    return;
  }
  await page.clock.install({ time: new Date(iso) });
  installed.add(page);
}

test("the cities lead the plate line, at reading scale", async ({ page }) => {
  await page.goto(KOREA, { waitUntil: "networkidle" });
  const cities = page.locator(".mast-plateline .mast-cities");
  await expect(cities).toHaveText("Seoul · Daejeon · Busan");
  // Reading scale, not the display scale the coordinates used to run at.
  const px = await cities.evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
  expect(px).toBeLessThan(24);
  expect(px).toBeGreaterThan(14);
});

test("⌁ the coordinate pair and the plate number are gone from the guide", async ({ page }) => {
  // Asserted as absence in the BUILT page, not by reading the layout: a rule that still
  // matched would keep them alive invisibly.
  await page.goto(KOREA, { waitUntil: "networkidle" });
  await expect(page.locator(".mast-coord")).toHaveCount(0);
  await expect(page.locator(".mast-platenum")).toHaveCount(0);
  await expect(page.locator(".mast-plateline")).not.toContainText("PLATE");
  await expect(page.locator(".mast-plateline")).not.toContainText("°");
});

test("⌁ the eyebrow and the plate line never say the same thing", async ({ page }) => {
  // The kicker holds both halves; rendering it whole in both places would show the cities
  // twice as if they were two separate facts.
  await page.goto(KOREA, { waitUntil: "networkidle" });
  // innerText, so text-transform is applied — the eyebrow is uppercased by CSS. Compared
  // case-insensitively because the split is about WHICH words go where, not their casing.
  const eyebrow = (await page.locator(".mast-eyebrow").innerText()).trim().toLowerCase();
  const cities = (await page.locator(".mast-cities").innerText()).trim().toLowerCase();
  expect(eyebrow).toBe("jul 8–15, 2026");
  expect(eyebrow).not.toContain(cities);
});

test("the next leg appears mid-trip, naming a real stop from the day cards", async ({ page }) => {
  await atDate(page, "2026-07-09T06:00:00");
  await page.goto(KOREA, { waitUntil: "networkidle" });
  const leg = page.locator("#mastNextLeg");
  await expect(leg).toBeVisible();
  // textContent, not innerText: the row is uppercased by CSS and the assertion is about the
  // string the page composed, not the casing it paints.
  const text = (await leg.textContent())!.trim();
  expect(text).toMatch(/^Next · .+ → .+/);
  // The stop it names must be one the guide actually carries, not a formatted placeholder.
  const stop = text.split("→")[1].trim();
  expect(await page.locator(".catblock", { hasText: stop }).count()).toBeGreaterThan(0);
});

test("⌁ the next leg is absent before the trip and after it", async ({ page }) => {
  // FALLBACKS §1: a trip not started or already finished gets no present moment invented.
  for (const when of ["2026-05-01T09:00:00", "2026-09-01T09:00:00"]) {
    await atDate(page, when);
    await page.goto(KOREA, { waitUntil: "networkidle" });
    await expect(page.locator("#mastNextLeg"), when).toBeHidden();
  }
});

test("the live-state column stamps the trip's state, and the stamp follows the clock", async ({ page }) => {
  // Three states, one page, three different days. The stamp is the R5 red-ink rule's second
  // moment, so "now" is also the only one of the three that takes the accent.
  await atDate(page, "2026-07-09T06:00:00");
  await page.goto(KOREA, { waitUntil: "networkidle" });
  await expect(page.locator("#mastState")).toHaveText(/on this trip now/i);
  await expect(page.locator("#mastState")).toHaveAttribute("data-state", "now");
  await expect(page.locator("#mastWhen")).toHaveText(/Day \d+ of \d+/);

  await atDate(page, "2026-05-01T09:00:00");
  await page.goto(KOREA, { waitUntil: "networkidle" });
  await expect(page.locator("#mastState")).toHaveText(/upcoming/i);
  // ⌁ Off the trip, the day-and-clock row is two true facts that mean nothing here.
  await expect(page.locator("#mastWhen")).toBeHidden();

  await atDate(page, "2026-09-01T09:00:00");
  await page.goto(KOREA, { waitUntil: "networkidle" });
  await expect(page.locator("#mastState")).toHaveText(/complete/i);
  await expect(page.locator("#mastWhen")).toBeHidden();
});

test("⌁ the counted progress row agrees with the checklist it counts", async ({ page }) => {
  /* The masthead says "42 to book"; the Tools station's own checklist shows the booking rows
     above its disclosure. Two surfaces rendering one datum — if they ever disagree, one of
     them is doing its own counting, which is how a number starts drifting from what it means. */
  await page.goto(KOREA, { waitUntil: "networkidle" });
  const prog = (await page.locator(".mast-live-prog").textContent())!;
  const claimed = Number(prog.match(/(\d+) to book/)![1]);
  await page.locator('.grail-stop[data-kind="tools"]').click();
  const actual = await page.locator("[data-panel^='tools-reminders-'] .tools-rem-box")
    .evaluateAll((els) => els.filter((e) => !e.closest("details.tools-more")).length);
  expect(actual).toBe(claimed);
});

test("⌁ a guide with nothing to count renders no progress row", async ({ page }) => {
  // Japan carries no day waypoints, so its row is the booking half alone — never "0 stops",
  // which would read as a researched answer of zero.
  await page.goto("/Trip-Guides/guides/japan/", { waitUntil: "networkidle" });
  const prog = page.locator(".mast-live-prog");
  if (await prog.count()) {
    await expect(prog).not.toContainText("0 stops");
    await expect(prog).not.toContainText("0 to book");
  }
});

test("⌁ a plate line with nothing to say is shorter, never padded", async ({ page }) => {
  // Every row is independently conditional. Walked across all four guides: whatever each
  // renders, no row is ever an empty box or a placeholder dash.
  for (const slug of ["korea", "us", "denmark", "japan"]) {
    await page.goto(`/Trip-Guides/guides/${slug}/`, { waitUntil: "networkidle" });
    const rows = page.locator(".mast-plateline > *:not([hidden])");
    const n = await rows.count();
    expect(n, `${slug} has no plate line at all`).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) {
      const t = (await rows.nth(i).innerText()).trim();
      expect(t, `${slug} row ${i} is an empty or placeholder cell`).not.toMatch(/^(|—|-|N\/A|TBD)$/);
    }
  }
});

test("⌁ the resume line is absent from the DOM until there IS one", async ({ page }) => {
  /* ACCEPTANCE asks for no resume line in the DOM *at all* when nothing is remembered. The
     first build shipped an empty <p class="grail-resume" hidden> that nothing ever filled:
     a fabricated "start here" is the loud version of that failure and an empty element
     reserving space for one is the quiet version. Created and removed, never blanked. */
  const US = "/Trip-Guides/guides/us/";
  await page.goto(US, { waitUntil: "networkidle" });
  await expect(page.locator(".grail-resume")).toHaveCount(0);

  // Seed the section memory the way a reader's own scrolling would, then reload.
  const active = await page.locator('.grail-stop[aria-current="true"]').getAttribute("data-full");
  await page.evaluate((group) => {
    const sk = JSON.parse(document.getElementById("tgConfig")!.textContent!).storeKey;
    localStorage.setItem("tg-lastsec-" + sk, JSON.stringify({ [group!]: "Late-night eats" }));
  }, active);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".grail-resume")).toHaveText("you were at Late-night eats");

  // Move to a station with nothing remembered — the element goes away rather than emptying.
  const other = page.locator(".grail-stop").filter({ hasNotText: active! }).first();
  await other.click();
  await expect(page.locator(".grail-resume")).toHaveCount(0);
});
