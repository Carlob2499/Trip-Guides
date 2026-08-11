/* Behavioral coverage for Trip Split V2's DOM WIRING (features/trip-split/ui/trip-split.js).
   The arithmetic is unit-tested in the silo's model/; what those units cannot reach is
   everything here:
     · a PRE-V2 saved trip migrates in place, without changing what anyone owes
     · participants get snapshotted, so a late arrival does not inherit past expenses
     · an amount typed in the destination's currency captures the rate it was converted at
     · "Mark paid" discharges a debt and can be undone
     · the split rule belongs to one expense, not to the trip
   Seeded through localStorage because that is the on-device path a real returning traveller
   takes; the shared-room path shares the same normalizers by construction. */
// @protects-file The shared trip budget never quietly changes what anyone owes.

import { test, expect, type Page } from "@playwright/test";

const KOREA = "/Trip-Guides/guides/korea/";

/** Exactly the shape the calculator wrote before V2: float dollars, no currency, no
    snapshot, and one trip-wide custom-split flag. */
const PRE_V2 = {
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

async function openWith(page: Page, seed: unknown) {
  await page.goto(KOREA, { waitUntil: "networkidle" });
  await page.evaluate((s) => {
    const wrap = document.getElementById("tripSplit")!;
    localStorage.setItem("tg-split-" + (wrap.dataset.sk || "guide"), JSON.stringify(s));
  }, seed);
  await page.reload({ waitUntil: "networkidle" });
  await page.locator('.grail-stop[data-kind="tools"]').click();
}

function saved(page: Page) {
  return page.evaluate(() => {
    const wrap = document.getElementById("tripSplit")!;
    return JSON.parse(localStorage.getItem("tg-split-" + (wrap.dataset.sk || "guide")) || "{}");
  });
}

test("a pre-V2 trip migrates in place without changing what anyone owes", async ({ page }) => {
  await openWith(page, PRE_V2);

  // The visible answer is what must not move.
  await expect(page.locator("#sTotalUSD")).toHaveText("$201.40");

  const disk = await saved(page);
  const amounts = disk.expenses.map((e: { amountMinor: number }) => e.amountMinor);
  expect(amounts).toEqual([3300, 9640, 2700, 4500]);   // floats became exact minor units
  expect(disk.expenses.every((e: { currency: string }) => e.currency === "USD")).toBe(true);
  expect(disk.expenses.every((e: { method: string }) => e.method === "EQUAL")).toBe(true);
  expect(Array.isArray(disk.payments)).toBe(true);
  // The subset expense keeps its two sharers; the rest get a snapshot of the whole group.
  expect(disk.expenses.map((e: { participants: string[] }) => e.participants.length)).toEqual([3, 3, 2, 3]);
});

test("a person added later does not inherit expenses recorded before they arrived", async ({ page }) => {
  await openWith(page, PRE_V2);
  const before = await page.locator(".sb-row").allTextContents();

  await page.locator("#sAddPerson").click();
  await page.locator("#sMemberList .sm-row").last().locator(".sm-name").fill("Dana");

  // The original three owe exactly what they owed; the newcomer owes nothing yet.
  const after = await page.locator(".sb-row").allTextContents();
  expect(after.slice(0, 3)).toEqual(before);
  expect(await page.locator("#sTotalUSD").textContent()).toBe("$201.40");
});

test("an amount typed in won stores the rate it was converted at", async ({ page }) => {
  await openWith(page, PRE_V2);

  await expect(page.locator("#sNewCur")).toBeVisible();
  await page.locator("#sNewDesc").fill("Gwangjang street food");
  await page.locator("#sNewCur").selectOption("KRW");
  await page.locator("#sNewAmt").fill("45000");
  await page.locator("#sAddExpense").click();

  const disk = await saved(page);
  const last = disk.expenses[disk.expenses.length - 1];
  expect(last.currency).toBe("KRW");
  expect(last.amountMinor).toBe(45000);          // won has no minor unit
  expect(last.rate).toBeGreaterThan(0);          // a rate was captured, not assumed
  expect(last.rateDate).toBeTruthy();            // ...and dated
  expect(last.baseMinor).toBeGreaterThan(0);     // converted once, at entry
  // The row states the conversion rather than hiding it behind a dollar figure. It is the
  // FIRST row on screen because the list runs newest-first.
  await expect(page.locator(".se-row").first().locator(".se-meta")).toContainText("≈");
});

test("Mark paid settles a debt, and Undo puts it back", async ({ page }) => {
  await openWith(page, PRE_V2);
  const transfers = page.locator(".st-row");
  await expect(transfers).toHaveCount(2);

  await page.locator(".st-done").first().click();
  await expect(transfers).toHaveCount(1);
  await expect(page.locator("#sPaid")).toBeVisible();
  await expect(page.locator(".sp-row")).toHaveCount(1);
  // Someone is now square, and the trip still cost what it cost.
  await expect(page.locator(".sb-row.sb-even")).toHaveCount(1);
  await expect(page.locator("#sTotalUSD")).toHaveText("$201.40");

  await page.locator(".sp-undo").click();
  await expect(transfers).toHaveCount(2);
  await expect(page.locator("#sPaid")).toBeHidden();
});

test("the split rule belongs to one expense, not to the whole trip", async ({ page }) => {
  await openWith(page, PRE_V2);

  // The list runs newest-first, so the top row is the LAST expense on disk.
  const firstRow = page.locator(".se-row").first();
  await firstRow.locator(".se-toggle").click();
  await firstRow.locator(".se-method").selectOption("SHARES");

  const disk = await saved(page);
  const changed = disk.expenses[disk.expenses.length - 1];
  expect(changed.method).toBe("SHARES");
  // Every other expense is untouched — the old global flag could not do this.
  expect(disk.expenses.slice(0, -1).every((e: { method: string }) => e.method === "EQUAL")).toBe(true);
});

/* A trip long enough to need finding rather than scanning. */
const LONG_TRIP = {
  members: [{ id: "m1", name: "Carlo" }, { id: "m2", name: "Sam" }, { id: "m3", name: "Riley" }],
  expenses: Array.from({ length: 12 }, (_, i) => ({
    id: "e" + i,
    paidBy: ["m1", "m2", "m3"][i % 3],
    desc: ["Dinner", "Taxi", "Museum"][i % 3] + " #" + (i + 1),
    amountMinor: 1000 + i * 100,
    currency: "USD",
    baseMinor: 1000 + i * 100,
    method: "EQUAL",
    weights: null,
    participants: ["m1", "m2", "m3"],
    category: ["Food", "Transport", "Activities"][i % 3],
    order: i + 1,
  })),
  payments: [],
};

test("the newest expense sits at the top, next to the form that made it", async ({ page }) => {
  await openWith(page, LONG_TRIP);
  // The composer is above the list, so appending would push each new row off-screen.
  const first = page.locator(".se-row").first().locator(".se-desc");
  await expect(first).toHaveValue("Museum #12");

  await page.locator("#sNewDesc").fill("Nightcap");
  await page.locator("#sNewAmt").fill("12");
  await page.locator("#sAddExpense").click();

  await expect(page.locator(".se-row").first().locator(".se-desc")).toHaveValue("Nightcap");
});

test("search and filters narrow the list without touching the totals", async ({ page }) => {
  await openWith(page, LONG_TRIP);
  const rows = page.locator(".se-row");
  await expect(rows).toHaveCount(12);
  await expect(page.locator("#sFilter")).toBeVisible();
  const total = await page.locator("#sTotalUSD").textContent();

  await page.locator("#sFilterQ").fill("taxi");
  await expect(rows).toHaveCount(4);
  await expect(page.locator("#sFilterNote")).toContainText("Showing 4 of 12");
  // The honesty requirement: a filtered list beside an unfiltered total.
  await expect(page.locator("#sTotalUSD")).toHaveText(total!);

  await page.locator("#sFilterClear").click();
  await expect(rows).toHaveCount(12);

  await page.locator("#sFilterWho").selectOption({ label: "Sam" });
  await expect(rows).toHaveCount(4);

  await page.locator("#sFilterCat").selectOption("Food");
  await expect(rows).toHaveCount(0);          // Sam paid no Food expense in this seed
  await expect(page.locator("#sExpenseList")).toContainText("clear the filter");

  await page.locator("#sFilterClear").click();
  await expect(rows).toHaveCount(12);
  await expect(page.locator("#sTotalUSD")).toHaveText(total!);
});

test("the filter bar stays out of the way on a short trip", async ({ page }) => {
  await openWith(page, PRE_V2); // four expenses
  await expect(page.locator("#sFilter")).toBeHidden();
});

test("categories drive a spend breakdown, and stay hidden until one exists", async ({ page }) => {
  await openWith(page, PRE_V2);
  await expect(page.locator("#sCategories")).toBeHidden();

  const firstRow = page.locator(".se-row").first();
  await firstRow.locator(".se-toggle").click();
  await firstRow.locator(".se-cat").fill("Transport");

  await expect(page.locator("#sCategories")).toBeVisible();
  await expect(page.locator(".sc-cat").filter({ hasText: "Transport" })).toHaveCount(1);
});

/* UNDO. The assertions that matter are not "a row came back" but "the trip is byte-identical
   to what it was" — deleting a PERSON rewrites who paid, split weights and participant
   snapshots across other expenses, and a reversal that restores the row while leaving those
   rewritten would be the worse bug: quiet, and wrong in the numbers. */
test("deleting an expense is reversible, and the balances come back exactly", async ({ page }) => {
  await openWith(page, PRE_V2);
  await expect(page.locator("#sUndo")).toBeHidden();
  const before = await saved(page);
  const balances = await page.locator(".sb-row").allTextContents();

  const bbq = page.locator(".se-row").filter({ has: page.locator(".se-desc[value*='BBQ']") });
  await bbq.locator("[data-del-e]").click();

  await expect(page.locator(".se-row")).toHaveCount(3);
  await expect(page.locator("#sUndoText")).toHaveText(/Korean BBQ dinner night 1/);
  await expect(page.locator("#sTotalUSD")).toHaveText("$105.00");

  await page.locator("#sUndoBtn").click();
  await expect(page.locator(".se-row")).toHaveCount(4);
  await expect(page.locator("#sUndo")).toBeHidden();
  await expect(page.locator("#sTotalUSD")).toHaveText("$201.40");
  expect(await page.locator(".sb-row").allTextContents()).toEqual(balances);
  expect(await saved(page)).toEqual(before);
});

test("undoing a person's removal also un-does the rewrites it caused", async ({ page }) => {
  await openWith(page, PRE_V2);
  const before = await saved(page);

  // 김민준 paid the BBQ dinner AND is one of the two sharers of the jimjilbang, so removing
  // them touches a payer, a participant snapshot, and the balances all at once.
  const row = page.locator(".sm-row").filter({ has: page.locator(".sm-name[value='김민준']") });
  await row.locator("[data-del-m]").click();

  await expect(page.locator(".sm-row")).toHaveCount(2);
  await expect(page.locator("#sUndoText")).toHaveText(/김민준/);
  const stripped = await saved(page);
  expect(stripped.expenses[1].paidBy).toBe(before.members[0].id);        // reassigned to Carlo
  expect(stripped.expenses[2].participants).toEqual([before.members[0].id]);

  await page.locator("#sUndoBtn").click();
  await expect(page.locator(".sm-row")).toHaveCount(3);
  // Not just "the person is back" — every field their removal rewrote is back too.
  expect(await saved(page)).toEqual(before);
});

test("the undo bar can be dismissed, and a second deletion supersedes the first", async ({ page }) => {
  await openWith(page, PRE_V2);

  await page.locator(".se-row").first().locator("[data-del-e]").click();
  await expect(page.locator("#sUndo")).toBeVisible();
  await page.locator("#sUndoDismiss").click();
  await expect(page.locator("#sUndo")).toBeHidden();
  await expect(page.locator(".se-row")).toHaveCount(3);   // dismissing is not undoing

  // The list runs newest-first, so .first() takes the top of what remains each time:
  // Jimjilbang, then the BBQ dinner.
  await page.locator(".se-row").first().locator("[data-del-e]").click();
  await page.locator(".se-row").first().locator("[data-del-e]").click();
  await expect(page.locator(".se-row")).toHaveCount(1);
  // One slot: the bar names the LAST deletion, and undo returns exactly that one — the
  // two before it stay gone.
  await expect(page.locator("#sUndoText")).toHaveText(/Korean BBQ dinner night 1/);
  await page.locator("#sUndoBtn").click();
  await expect(page.locator(".se-row")).toHaveCount(2);
  await expect(page.locator(".se-row").first().locator(".se-desc")).toHaveValue("Korean BBQ dinner night 1");
});
