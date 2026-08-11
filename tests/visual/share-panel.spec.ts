/* Behavioral coverage for the share panel's DOM WIRING (features/share/ui/share-panel.js) —
   the pure URL/text building lives in ../model/share-links.ts and is unit-tested there; this
   pins the wiring the units can't reach: opening the modal actually sets the WhatsApp/email
   links' hrefs to the CORRECT encoded URL/title, the copy button carries the right URL, and
   the section-specific deep link (#grp-N) is picked up from the active tab. A7 /
   TEST_COVERAGE_ANALYSIS.md §P6. */
// @protects-file Sharing a guide sends the exact page you are looking at, not the front door.

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const KOREA = "/Trip-Guides/guides/korea/";

test("opening the share panel sets WhatsApp/email links to the correctly-encoded current URL + title", async ({ page }) => {
  await page.goto(KOREA, { waitUntil: "networkidle" });
  const pageTitle = await page.title();

  await page.locator("#btnShare").click();

  const modal = page.locator("#shareModal");
  await expect(modal).toBeVisible();

  const urlTxt = await page.locator("#shareUrlTxt").textContent();
  expect(urlTxt).toContain("/guides/korea/");

  const waHref = await page.locator("#shareWA").getAttribute("href");
  expect(waHref).toBe("https://wa.me/?text=" + encodeURIComponent(urlTxt!.trim()));

  const mailtoHref = await page.locator("#shareEmail").getAttribute("href");
  expect(mailtoHref).toBe(
    "mailto:?subject=" + encodeURIComponent(pageTitle) + "&body=" + encodeURIComponent(urlTxt!.trim()),
  );
});

test("the copy-link button carries the same URL shown in the panel", async ({ page }) => {
  await page.goto(KOREA, { waitUntil: "networkidle" });
  await page.locator("#btnShare").click();

  const urlTxt = (await page.locator("#shareUrlTxt").textContent())?.trim();
  const copyBtn = page.locator("#shareCopyBtn");
  await expect(copyBtn).toHaveAttribute("data-url", urlTxt!);
});

test("the share URL updates to a section-specific #grp-N deep link when a numbered tab is active", async ({ page }) => {
  await page.goto(KOREA, { waitUntil: "networkidle" });

  // Switch to a numbered content tab (not a special panel like Budget/Vote).
  const numberedTab = page.locator(".gtab[data-tab]").filter({ hasText: /.+/ }).nth(1);
  await numberedTab.click();
  const tabIndex = await numberedTab.getAttribute("data-tab");

  await page.locator("#btnShare").click();
  const urlTxt = await page.locator("#shareUrlTxt").textContent();
  if (tabIndex && /^\d+$/.test(tabIndex)) {
    expect(urlTxt).toContain(`#grp-${tabIndex}`);
  }
});

test("Escape closes the share modal and returns focus to the trigger", async ({ page }) => {
  await page.goto(KOREA, { waitUntil: "networkidle" });
  const trigger = page.locator("#btnShare");
  await trigger.click();

  const modal = page.locator("#shareModal");
  await expect(modal).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(modal).toHaveAttribute("hidden", "");
  await expect(trigger).toBeFocused();
});

/* The share panel is a gesture-revealed surface, and axe does not scan `hidden` nodes — so the
   whole-page gate in a11y.spec.ts has never once looked at it (the same blind spot that hid the
   SOS sheet's 2.16:1 emergency number). It is scanned HERE rather than folded into that gate for
   a concrete reason: the panel ships its own full-viewport `.share-backdrop` scrim, which would
   make every other element on the page an unresolvable background and turn one honest failure
   into a page-wide fog. Scoped to the modal, in both themes, with zero tolerance for
   `incomplete` — nothing in this panel sits over a photo or a gradient, so "couldn't tell"
   here would mean something changed that needs looking at. */
for (const scheme of ["light", "dark"] as const) {
  test(`the open share panel passes axe in ${scheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.goto(KOREA, { waitUntil: "networkidle" });
    await page.locator("#btnShare").click();
    await expect(page.locator("#shareModal")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#shareModal").analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);

    /* One allowed incomplete, and only this one: the ✕ on #shareClose. axe declines to rate any
       element whose content is a single non-BMP glyph (messageKey "nonBmp") because it cannot
       judge that font's ink coverage — the same class the whole-page gate already allowlists for
       .cold-open-x and .nav-hint-x. The button is aria-labelled "Close", so a screen reader is
       unaffected either way, and the colour pair is measured below rather than asserted from the
       token's reputation. Anything else appearing here is new and wants looking at. */
    expect(
      results.incomplete.map((v) => `${v.id}/${v.nodes[0]?.any[0]?.data?.messageKey}: ${v.nodes.length}`),
    ).toEqual(["color-contrast/nonBmp: 1"]);

    const ratio = await page.evaluate(() => {
      const rgb = (v: string) => (v.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
      const lum = ([r, g, b]: number[]) =>
        [r, g, b]
          .map((c) => c / 255)
          .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
          .reduce((a, c, i) => a + c * [0.2126, 0.7152, 0.0722][i], 0);
      const el = document.querySelector("#shareClose")!;
      const fg = lum(rgb(getComputedStyle(el).color));
      // The button is transparent; the modal behind it is what actually paints.
      const bg = lum(rgb(getComputedStyle(document.querySelector("#shareModal")!).backgroundColor));
      return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
    });
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
}

/* The QR held four hex literals chosen on data-theme. They were hand-copies of --ink/--card
   and one had drifted — the light paper was pure #ffffff, a colour this product does not use
   (--card is #f8faf3) — so every QR was a slightly-too-white block inside its own panel. A QR
   still scans that way, which is exactly why nothing noticed. Read live now, both themes. */
for (const scheme of ["light", "dark"] as const) {
  test(`the QR paints in the live theme tokens (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.goto(KOREA, { waitUntil: "networkidle" });
    await page.locator("#btnShare").click();
    const canvas = page.locator("#shareQr canvas");
    await expect(canvas).toBeVisible();
    /* The canvas element exists the moment the modal opens; the qrcode generator is a lazy
       import() and paints a frame or two later. Visible-but-unpainted reads as fully
       transparent, which getImageData reports as rgb(0,0,0) — a plausible-looking "the QR is
       black" failure that is really a race. Wait for real ink before sampling. */
    await expect
      .poll(() => canvas.evaluate((el: HTMLCanvasElement) =>
        el.getContext("2d")!.getImageData(1, 1, 1, 1).data[3]))
      .toBe(255);

    const paper = await canvas.evaluate((el: HTMLCanvasElement) => {
      // margin is 1 module wide, so the top-left pixel is always background ("light").
      const d = el.getContext("2d")!.getImageData(1, 1, 1, 1).data;
      return `rgb(${d[0]}, ${d[1]}, ${d[2]})`;
    });
    const card = await page.evaluate(() => {
      const el = document.createElement("div");
      el.style.color = getComputedStyle(document.documentElement).getPropertyValue("--card").trim();
      document.body.appendChild(el);
      const c = getComputedStyle(el).color;
      el.remove();
      return c;
    });
    expect(paper).toBe(card);
  });
}
