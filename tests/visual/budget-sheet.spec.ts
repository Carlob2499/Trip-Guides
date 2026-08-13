/* Behavioral coverage for the budget summary sheet's DOM WIRING
   (features/trip-split/ui/budget-sheet.js). The arithmetic is unit-tested in
   ../../src/features/trip-split/model/summary.test.ts; what those units cannot reach is
   everything this file pins:
     · the button only appears once there is spending to summarise
     · clicking it opens an on-screen PREVIEW first (issue #47) — a two-page sheet appended
       to <body> (NOT inside .split-wrap, which print.css hides outright), visible and
       inspectable, with window.print() NOT yet called
     · only the preview's own Print button calls window.print(), synchronously within its
       own click
     · Cancel, the backdrop, and Escape all close the preview without printing
     · the printed figures equal the ones on screen
     · payment handles stay OUT of the file, which gets forwarded
     · non-Latin names survive as text — the whole reason this prints rather than
       generating a PDF with a WinAnsi-only library
     · the preview is removed again on close or after printing
     · @media print unwraps the preview chrome so ONLY the sheet reaches paper
   window.print is stubbed where it's invoked: a real dialog would hang the run. */
// @protects-file The printed budget sheet says exactly what the calculator on screen says,
// and the reader always sees it before it prints.

import { test, expect, type Page } from "@playwright/test";

declare global {
  interface Window {
    __printCount?: number;
    __realPrint?: typeof window.print;
  }
}

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
  await page.locator('.grail-stop[data-kind="tools"]').click();
}

/** Click the trigger and wait for the preview to open. window.print must NOT fire yet. */
async function openPreview(page: Page) {
  await page.getByRole("button", { name: /save summary as pdf/i }).click();
  await expect(page.locator("#bspModal")).toBeVisible();
  await expect(page.locator("#budgetSheet")).toBeVisible();
}

/** Stub window.print, click the preview's own Print button, report how many times it fired. */
async function clickPrintInPreview(page: Page) {
  return page.evaluate(() => {
    let printed = 0;
    const real = window.print;
    window.print = () => { printed++; };
    document.getElementById("bspPrint")!.click();
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
  await page.locator('.grail-stop[data-kind="tools"]').click();
  await expect(page.locator("#sSavePdf")).toBeHidden();

  await openBudgetWithData(page);
  await expect(page.locator("#sSavePdf")).toBeVisible();
});

test("clicking it opens a visible two-page preview and does NOT print yet", async ({ page }) => {
  await openBudgetWithData(page);

  await page.evaluate(() => {
    window.__printCount = 0;
    window.__realPrint = window.print;
    window.print = () => { window.__printCount!++; };
  });
  await openPreview(page);

  const state = await page.evaluate(() => {
    const s = document.getElementById("budgetSheet")!;
    return {
      onBody: s.parentElement?.id === "bspScroll",
      insideSplitWrap: !!s.closest(".split-wrap"),
      pages: s.querySelectorAll(".bs-page").length,
      screenDisplay: getComputedStyle(s).display,
      bodyAttr: document.body.hasAttribute("data-bsheet-open"),
      printedSoFar: window.__printCount,
    };
  });
  expect(state.onBody).toBe(true);
  expect(state.insideSplitWrap).toBe(false);
  expect(state.pages).toBe(2);
  expect(state.screenDisplay).toBe("block"); // now visibly previewed, not hidden
  expect(state.bodyAttr).toBe(true);
  expect(state.printedSoFar).toBe(0); // opening the preview must never print

  await page.evaluate(() => { window.print = window.__realPrint!; });
});

test("the preview's Print button calls window.print() once, synchronously", async ({ page }) => {
  await openBudgetWithData(page);
  await openPreview(page);
  expect(await clickPrintInPreview(page)).toBe(1);
});

test("afterprint closes the preview and cleans up", async ({ page }) => {
  await openBudgetWithData(page);
  await openPreview(page);
  await clickPrintInPreview(page);

  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  await expect(page.locator("#budgetSheet")).toHaveCount(0);
  await expect(page.locator("#bspModal")).toHaveCount(0);
  expect(await page.evaluate(() => document.body.hasAttribute("data-bsheet-open"))).toBe(false);
});

test("Cancel closes the preview without ever printing, and returns focus to the trigger", async ({ page }) => {
  await openBudgetWithData(page);
  await openPreview(page);

  await page.locator("#bspCancel").click();
  await expect(page.locator("#budgetSheet")).toHaveCount(0);
  await expect(page.locator("#bspModal")).toHaveCount(0);
  expect(await page.evaluate(() => document.body.hasAttribute("data-bsheet-open"))).toBe(false);
  await expect(page.locator("#sSavePdf")).toBeFocused();
});

test("the backdrop and Escape also close the preview", async ({ page }) => {
  await openBudgetWithData(page);
  await openPreview(page);
  await page.locator("#bspBackdrop").click({ position: { x: 2, y: 2 } });
  await expect(page.locator("#bspModal")).toHaveCount(0);

  await openBudgetWithData(page);
  await openPreview(page);
  await page.keyboard.press("Escape");
  await expect(page.locator("#bspModal")).toHaveCount(0);
});

test("@media print unwraps the preview to just the sheet, hiding the rest of the page", async ({ page }) => {
  await openBudgetWithData(page);
  await openPreview(page);
  await page.emulateMedia({ media: "print" });

  const state = await page.evaluate(() => {
    const bar = document.querySelector(".bsp-bar") as HTMLElement;
    const backdrop = document.querySelector(".bsp-backdrop") as HTMLElement;
    const modal = document.querySelector(".bsp-modal") as HTMLElement;
    const chrome = document.querySelector(".split-wrap") as HTMLElement | null;
    return {
      barHidden: getComputedStyle(bar).display === "none",
      backdropHidden: getComputedStyle(backdrop).display === "none",
      modalPosition: getComputedStyle(modal).position,
      chromeHidden: chrome ? getComputedStyle(chrome).display === "none" : true,
      sheetVisible: getComputedStyle(document.getElementById("budgetSheet")!).display !== "none",
    };
  });
  expect(state.barHidden).toBe(true);
  expect(state.backdropHidden).toBe(true);
  expect(state.modalPosition).toBe("static"); // unwrapped back to normal document flow
  expect(state.chromeHidden).toBe(true); // the rest of the page is suppressed
  expect(state.sheetVisible).toBe(true);

  await page.emulateMedia({ media: "screen" });
});

test("the printed figures are the ones the calculator shows", async ({ page }) => {
  await openBudgetWithData(page);
  await openPreview(page);

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
  await openPreview(page);

  const text = await page.evaluate(() => document.getElementById("budgetSheet")!.textContent || "");
  expect(text).toContain("김민준");            // the case a WinAnsi PDF library would garble
  expect(text).not.toContain("Kakao Pay");     // handles are group-internal, not for a forwarded file
  expect(text).not.toContain("Venmo");
  // The subset expense is labelled as such rather than silently reading as a 3-way split.
  expect(text).toContain("2 of 3");
});
