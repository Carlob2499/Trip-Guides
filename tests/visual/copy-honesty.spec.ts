/* Copy honesty — TESTS.md §5: a figure contradicting the thing it sits beside. The number
   reads as researched, the reader cannot check it, and the thing it counts is on the same screen
   disagreeing. TESTS.md names this `tests/copy-honesty.test.ts`; neither runner's include glob
   would execute a file there, and most of this needs a rendered page. */
// @protects-file No number on a guide contradicts the thing it is counting.

import { test, expect, type Page } from "@playwright/test";

const GUIDES = ["korea", "us", "denmark", "japan"] as const;

/** Reveal every station so copy in a closed one is audited too. */
async function openEverything(page: Page, slug: string) {
  await page.goto(`/Trip-Guides/guides/${slug}/`, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: `[role=region]{display:block !important}` });
}

// 5.1 + 5.2 — same failure, different noun: any "N stations"/"N groups"/"N sections" the page
// renders is compared against what it actually renders.
for (const slug of GUIDES) {
  test(`⌁ no stated station or group count disagrees with the rail — ${slug}`, async ({ page }) => {
    await openEverything(page, slug);
    const { stated, stations, groups } = await page.evaluate(() => {
      const text = document.body.innerText;
      const grab = (word: string) =>
        [...text.matchAll(new RegExp(`(\\d+)\\s+${word}`, "gi"))].map((m) => Number(m[1]));
      return {
        stated: { stations: grab("stations?"), groups: grab("groups?"), sections: grab("sections?") },
        stations: document.querySelectorAll(".grail-stop").length,
        groups: document.querySelectorAll(".catblock").length,
      };
    });
    for (const n of stated.stations) expect(n, `"${n} stations" vs ${stations} rendered`).toBe(stations);
    for (const n of stated.groups) expect(n, `"${n} groups" vs ${groups} rendered`).toBe(groups);
    for (const n of stated.sections) expect(n, `"${n} sections" vs ${groups} rendered`).toBe(groups);
  });
}

/* 5.3 + 5.4 — the ledger. An empty Trip Split is the honest case and the one that ships, so
   this seeds real expenses first: a count that agrees at zero agrees for the wrong reason. */
test("⌁ any stated expense or transfer count equals the rows beneath it", async ({ page }) => {
  await page.goto("/Trip-Guides/guides/korea/", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    const wrap = document.getElementById("tripSplit")!;
    localStorage.setItem("tg-split-" + (wrap.dataset.sk || "guide"), JSON.stringify({
      members: [{ id: "m1", name: "A" }, { id: "m2", name: "B" }],
      expenses: [
        { id: "e1", paidBy: "m1", desc: "Bus", amountMinor: 3300, currency: "USD", baseMinor: 3300 },
        { id: "e2", paidBy: "m2", desc: "Dinner", amountMinor: 9640, currency: "USD", baseMinor: 9640 },
        { id: "e3", paidBy: "m1", desc: "Entry", amountMinor: 2700, currency: "USD", baseMinor: 2700 },
      ],
    }));
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.locator('.grail-stop[data-kind="tools"]').click();

  const split = page.locator("#tripSplit");
  await expect(split).toBeVisible();
  const claims = await split.evaluate((el) => {
    const t = (el as HTMLElement).innerText;
    const n = (word: string) => {
      const m = t.match(new RegExp(`(\\d+)\\s+${word}`, "i"));
      return m ? Number(m[1]) : null;
    };
    return { expenses: n("expenses?"), transfers: n("transfers?") };
  });
  if (claims.expenses !== null) {
    const rows = await split.locator("[data-expense-id], .sc-expense, .split-row").count();
    expect(claims.expenses, `copy says ${claims.expenses} expenses, ${rows} rows rendered`).toBe(rows);
  }
  if (claims.transfers !== null) {
    const rows = await split.locator(".sc-settle-row, .settle-row, [data-transfer]").count();
    expect(claims.transfers, `copy says ${claims.transfers} transfers, ${rows} rows rendered`).toBe(rows);
  }
});

/* 5.6 — the placeholder sweep. One regex over four guides, and the only test in the suite that
   would catch a mockup string surviving into a shipped page. `TODO`/`FIXME` in a code comment
   is fine and normal; on a rendered guide surface it is the product admitting it is unfinished
   to the one person who cannot act on it. */
for (const slug of GUIDES) {
  test(`⌁ no placeholder copy survives onto the page — ${slug}`, async ({ page }) => {
    await openEverything(page, slug);
    const found = await page.evaluate(() => {
      /* innerText of <main> plus the masthead — chrome and script tags are excluded on
         purpose: a `data-placeholder` attribute is machinery, not something a reader reads. */
      const zones = [...document.querySelectorAll("main, .masthead, .grail")]
        .map((el) => (el as HTMLElement).innerText).join("\n");
      const words = ["lorem ipsum", "placeholder", "TODO", "FIXME", "sample data", "demo only", "XXX"];
      return words.filter((w) => new RegExp(`\\b${w}\\b`, "i").test(zones));
    });
    expect(found, `${slug} renders placeholder copy — a reader cannot tell it from a fact`).toEqual([]);
  });
}

// 5.5 — the shape rather than an enumeration: nothing in the built page hardcodes a count a
// template could have derived.
test("⌁ no guide hardcodes a count its own data could produce", async ({ page }) => {
  await openEverything(page, "korea");
  const suspects = await page.evaluate(() => {
    const text = [...document.querySelectorAll(".grail-ctx, .mast-plateline, .mast-live, .botbar")]
      .map((el) => (el as HTMLElement).innerText).join(" ");
    // Chrome should state counts only where it derived them. Any bare "N of M" in the rail or
    // masthead must match something rendered; the day counter is the one legitimate case.
    return [...text.matchAll(/(\d+)\s+of\s+(\d+)/g)].map((m) => `${m[1]} of ${m[2]}`);
  });
  for (const claim of suspects) {
    const [, , total] = claim.match(/(\d+) of (\d+)/)!;
    const days = await page.locator(".dchip").count();
    expect(
      Number(total),
      `"${claim}" in page chrome — the denominator must be the rendered day count (${days})`,
    ).toBe(days);
  }
});
