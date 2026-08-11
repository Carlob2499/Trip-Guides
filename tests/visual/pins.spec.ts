/* Regression pins — TESTS.md §9. Some are already enforced better elsewhere; duplicating an
   assertion is how two copies drift, so this file points at those and adds only what nothing
   else covers. (Named `tests/pins.test.ts` there; no vitest glob would run a file at that path.) */
// @protects-file Defects fixed in the R5 cycle stay fixed.

import { test, expect } from "@playwright/test";

const KOREA = "/Trip-Guides/guides/korea/";

// 9.1 — the pin is the DERIVATION: a hand-maintained list is what makes a count go stale, so
// the two sets are each other's proof. copy-honesty.spec's §5.1 is the general form.
test("⌁ 9.1 every station has its panel and every panel its station", async ({ page }) => {
  await page.goto(KOREA, { waitUntil: "networkidle" });
  const { stations, panels, orphanStations, orphanPanels } = await page.evaluate(() => {
    const stops = [...document.querySelectorAll(".grail-stop")];
    const blocks = [...document.querySelectorAll(".catblock")];
    const panelIds = new Set(blocks.map((b) => b.id));
    const controlled = new Set(stops.map((s) => s.getAttribute("aria-controls") || ""));
    return {
      stations: stops.length,
      panels: blocks.length,
      orphanStations: stops
        .map((s) => s.getAttribute("aria-controls") || "")
        .filter((id) => !panelIds.has(id)),
      orphanPanels: [...panelIds].filter((id) => !controlled.has(id)),
    };
  });
  expect(orphanStations, "a station names a panel that does not exist").toEqual([]);
  expect(orphanPanels, "a panel exists that no station can reach").toEqual([]);
  expect(stations).toBe(panels);
});

/* 9.3 — both, not one. translateY(100%) leaves ~90 links focusable; display:none kills the
   slide; `inert` does both. Kept here too: removing `inert` passes every other test. */
test("⌁ 9.3 the sheet both animates and leaves the tab order", async ({ page }) => {
  await page.setViewportSize({ width: 402, height: 874 });
  await page.goto(KOREA, { waitUntil: "networkidle" });
  const sheet = page.locator(".sheet");

  const closed = await sheet.evaluate((el) => ({
    inert: el.hasAttribute("inert"),
    // It must still be PAINTABLE — that is the half `display:none` would destroy.
    display: getComputedStyle(el).display,
    transitions: getComputedStyle(el).transitionProperty,
  }));
  expect(closed.inert, "closed sheet is not inert — its controls are still in the tab order").toBe(true);
  expect(closed.display, "closed sheet is display:none — it cannot animate").not.toBe("none");
  expect(closed.transitions, "closed sheet has no transition — the slide is gone").toContain("transform");
});

// 9.4 — one shared tuple shape across ledger/travellers/settle-up. A mismatch renders a TONE
// NAME where a figure belongs, because the renderer reached for the wrong slot.
test("⌁ 9.4 no money surface renders a tone name where a figure belongs", async ({ page }) => {
  await page.goto(KOREA, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    const wrap = document.getElementById("tripSplit")!;
    localStorage.setItem("tg-split-" + (wrap.dataset.sk || "guide"), JSON.stringify({
      members: [{ id: "m1", name: "A" }, { id: "m2", name: "B" }, { id: "m3", name: "C" }],
      expenses: [
        { id: "e1", paidBy: "m1", desc: "Bus", amountMinor: 3300, currency: "USD", baseMinor: 3300 },
        { id: "e2", paidBy: "m2", desc: "Dinner", amountMinor: 9640, currency: "USD", baseMinor: 9640 },
      ],
    }));
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.locator('.grail-stop[data-kind="tools"]').click();
  const leaked = await page.locator("#tripSplit").evaluate((el) => {
    const t = (el as HTMLElement).innerText;
    // The tone vocabulary this system actually uses. Any of them standing alone in the ledger
    // is a tuple slot that reached the page.
    return ["warn", "ok", "crit", "muted", "accent", "green", "ochre"]
      .filter((tone) => new RegExp(`(^|[\\s>$])${tone}([\\s<]|$)`, "i").test(t));
  });
  expect(leaked, "a tone name is rendered where a figure belongs — the tuple shape drifted").toEqual([]);
});

// 9.5 — data belongs to the guide, not to a viewport. Read at both ends of the matrix: two
// code paths feeding the two models would disagree here.
test("⌁ 9.5 the same trip data renders at phone and desktop width", async ({ page }) => {
  const read = async () => {
    await page.goto(KOREA, { waitUntil: "networkidle" });
    return page.evaluate(() => ({
      stations: [...document.querySelectorAll(".grail-stop")].map((s) => (s as HTMLElement).dataset.full),
      days: document.querySelectorAll(".dchip").length,
      cities: document.querySelector(".mast-cities")?.textContent?.trim() ?? null,
      progress: document.querySelector(".mast-live-prog")?.textContent?.trim() ?? null,
      storeKey: JSON.parse(document.getElementById("tgConfig")!.textContent!).storeKey,
    }));
  };
  await page.setViewportSize({ width: 375, height: 812 });
  const phone = await read();
  await page.setViewportSize({ width: 1280, height: 800 });
  const desktop = await read();
  expect(desktop, "phone and desktop disagree about this trip — two data paths, not one").toEqual(phone);
  expect(phone.stations.length).toBeGreaterThan(1);   // not vacuous
});

// 9.6 — R5 made this structural rather than defensive: no call site can forget a slug,
// because the tools are a station of the guide whose data they run on.
test("⌁ 9.6 the tools run on the guide they are in, with no slug to forget", async ({ page }) => {
  for (const slug of ["korea", "denmark"]) {
    await page.goto(`/Trip-Guides/guides/${slug}/`, { waitUntil: "networkidle" });
    await page.locator('.grail-stop[data-kind="tools"]').click();
    const wired = await page.evaluate(() => ({
      toolsKey: document.querySelector(".tools")?.getAttribute("data-storekey"),
      splitKey: document.getElementById("tripSplit")?.getAttribute("data-sk"),
      pageKey: JSON.parse(document.getElementById("tgConfig")!.textContent!).storeKey,
    }));
    expect(wired.toolsKey, `${slug}: the tools screen carries no store key`).toBeTruthy();
    expect(wired.toolsKey, `${slug}: tools are on a different trip than the page`).toBe(wired.pageKey);
    expect(wired.splitKey, `${slug}: the ledger is on a different trip than the page`).toBe(wired.pageKey);
  }
});

/* Pinned elsewhere, deliberately not duplicated — a second copy is a copy to drift from:
     9.2 → mobile-nav/model/rank.test.ts (a property of the ranking model, and the model is
         where a change that breaks it would be made)
     9.7 → trip-split/__tests__/empty.test.ts (asserts the ABSENCE of the code path — stronger
         than a page can show, since an uncalled seeder passes any behaviour test)
     9.8 → plate-line.spec.ts */
test("the pins delegated above still have somewhere to live", async () => {
  // ⌁ A pointer to a deleted test reads as coverage. Cheapest possible guard.
  const { readFileSync, existsSync } = await import("node:fs");
  const delegated: Array<[string, string]> = [
    ["src/features/mobile-nav/model/rank.test.ts", "13-station guide"],
    ["src/features/trip-split/__tests__/empty.test.ts", "never seeds itself"],
    ["tests/visual/plate-line.spec.ts", "plate number are gone"],
  ];
  for (const [file, phrase] of delegated) {
    expect(existsSync(file), `${file} is gone — pin 9.2/9.7/9.8 lost its home`).toBe(true);
    expect(
      readFileSync(file, "utf8"),
      `${file} no longer contains "${phrase}" — the pin it holds may have been removed`,
    ).toContain(phrase);
  }
});
