/* Behavioral coverage for the budget summary sheet's DOM WIRING
   (features/trip-split/ui/budget-sheet.js). The arithmetic is unit-tested in
   ../../src/features/trip-split/model/summary.test.ts; what those units cannot reach is
   everything this file pins:
     · the button only appears once there is spending to summarise
     · clicking it builds a two-page sheet appended to <body> (NOT inside .split-wrap,
       which print.css hides outright — the sheet would print blank from there)
     · the printed figures equal the ones on screen
     · payment handles stay OUT of the file, which gets forwarded
     · non-Latin names survive as text — the whole reason this prints rather than
       generating a PDF with a WinAnsi-only library
     · the sheet is removed again, so it never paints on screen
   window.print is stubbed: a real dialog would hang the run. */
import { test, expect, type Page } from "@playwright/test";

const KOREA = "/Trip-Guides/guides/korea/";

// A Hangul name and a subset expense (only two of three shared the jimjilbang) — the two
// cases most likely to break silently.
const SEED = {
  members: [
    { id: "m1", name: "Carlo", payment: "Venmo @carlo" },
    { id: "m2", name: "김민준", payment: "Kakao Pay" },
    { id: "m3", name: "Riley", payment: "" },
  ],
  expenses: [
    { id: "e1", paidBy: "m1", desc: "Airport AREX tickets", amount: 33 },
    { id: "e2", paidBy: "m2", desc: "Korean BBQ dinner night 1", amount: 96.4 },
    { id: "e3", paidBy: "m1", desc: "Jimjilbang entry", amount: 27, participants: ["m1", "m2"] },
    { id: "e4", paidBy: "m3", desc: "T-money top-ups", amount: 45 },
  ],
  customSplit: false,
};

async function openBudgetWithData(page: Page) {
  await page.goto(KOREA, { waitUntil: "networkidle" });
  await page.evaluate((seed: typeof SEED) => {
    const wrap = document.getElementById("tripSplit")!;
    localStorage.setItem("tg-split-" + (wrap.dataset.sk || "guide"), JSON.stringify(seed));
  }, SEED);
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("#gtab-split").click();
}

/** Click the button with print stubbed, and report how many times it fired. */
async function clickPrint(page: Page) {
  return page.evaluate(() => {
    let printed = 0;
    const real = window.print;
    window.print = () => { printed++; };
    document.getElementById("sSavePdf")!.click();
    window.print = real;
    return printed;
  });
}

test("the PDF button stays hidden until there is spending, then appears", async ({ page }) => {
  await page.goto(KOREA, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    const wrap = document.getElementById("tripSplit")!;
    localStorage.removeItem("tg-split-" + (wrap.dataset.sk || "guide"));
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("#gtab-split").click();
  await expect(page.locator("#sSavePdf")).toBeHidden();

  await openBudgetWithData(page);
  await expect(page.locator("#sSavePdf")).toBeVisible();
});

test("clicking it prints a two-page sheet on <body> and then removes it", async ({ page }) => {
  await openBudgetWithData(page);
  expect(await clickPrint(page)).toBe(1);

  const state = await page.evaluate(() => {
    const s = document.getElementById("budgetSheet")!;
    return {
      onBody: s.parentElement === document.body,
      insideSplitWrap: !!s.closest(".split-wrap"),
      pages: s.querySelectorAll(".bs-page").length,
      screenDisplay: getComputedStyle(s).display,
      bodyAttr: document.body.hasAttribute("data-print-budget"),
    };
  });
  expect(state.onBody).toBe(true);
  expect(state.insideSplitWrap).toBe(false);
  expect(state.pages).toBe(2);
  expect(state.screenDisplay).toBe("none"); // never paints on screen
  expect(state.bodyAttr).toBe(true);

  // afterprint is what cleans up in a real dialog; fire it and the sheet must go.
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  await expect(page.locator("#budgetSheet")).toHaveCount(0);
  expect(await page.evaluate(() => document.body.hasAttribute("data-print-budget"))).toBe(false);
});

test("the printed figures are the ones the calculator shows", async ({ page }) => {
  await openBudgetWithData(page);
  await clickPrint(page);

  const { panelTotal, sheet } = await page.evaluate(() => {
    const s = document.getElementById("budgetSheet")!;
    return {
      panelTotal: document.getElementById("sTotalUSD")!.textContent,
      sheet: {
        total: s.querySelector(".bs-total")!.textContent,
        nets: [...s.querySelectorAll(".bs-table tbody tr")].slice(0, 3).map((r) => r.textContent),
        settle: [...s.querySelectorAll(".bs-settle-row")].map((r) => r.textContent),
        itemTotal: s.querySelector(".bs-total-row .bs-num")!.textContent,
      },
    };
  });

  expect(sheet.total).toBe(panelTotal);
  expect(sheet.itemTotal).toBe(panelTotal);
  expect(sheet.settle).toHaveLength(2);
  expect(sheet.nets.join(" ")).toContain("is owed $24.77");
  expect(sheet.nets.join(" ")).toContain("owes $13.13");
});

test("non-Latin names survive, and payment handles never reach the file", async ({ page }) => {
  await openBudgetWithData(page);
  await clickPrint(page);

  const text = await page.evaluate(() => document.getElementById("budgetSheet")!.textContent || "");
  expect(text).toContain("김민준");            // the case a WinAnsi PDF library would garble
  expect(text).not.toContain("Kakao Pay");     // handles are group-internal, not for a forwarded file
  expect(text).not.toContain("Venmo");
  // The subset expense is labelled as such rather than silently reading as a 3-way split.
  expect(text).toContain("2 of 3");
});
