/* Type standing on a photograph must clear contrast — measured on the real composite.
   @protects-file A cover's title is unreadable exactly when nobody checked it at that width.

   WHY THIS EXISTS AS A GATE. The a11y sweep cannot do this job and never could: its env aborts
   off-origin images, so every guide renders `.mast-media-fail` and it has literally never seen
   type over a photograph. The cover scrim was therefore unmeasured for its whole life.

   When it was finally measured by hand, three separate states were failing while looking
   completely fine on screen:

     title 2.93:1 / dek 4.23:1   at 1440, after the overlay was re-anchored
     title 1.71:1 / dek 1.94:1   at 375, where the dek reflows to five full-width lines

   against floors of 3:1 (large text) and 4.5:1 (body). None of that is visible to a person
   looking at the page, and a script someone has to remember to run is how it stayed hidden.
   Hence a gate.

   HOW IT MEASURES. It loads the real cover, hides the plate, screenshots the frame, and reads
   the pixels the type actually sits on — the ground WITH the scrim composited over it. Sampling
   inside the text box instead would read the glyphs as their own background and report 1:1,
   which is the first thing this got wrong.

   The ground is the 10th-brightest percentile rather than the single brightest pixel: one blown
   highlight in a photograph is not what the eye resolves a word against, but a tenth of the text
   band being that bright is. */

import { test, expect, type Page } from "@playwright/test";
/* pngjs has no types; the ambient declaration lives in tests/pngjs.d.ts (it cannot live here —
   an untyped module cannot be augmented from a file that imports it). */
import { PNG } from "pngjs";

/* Every width the product is composed for, because this failed at 375 while passing at 1440 —
   a single-width check would have shipped the phone failure. */
const WIDTHS = [320, 375, 768, 1440] as const;
const GUIDES = [
  ["korea", "/Trip-Guides/guides/korea/"],
  ["denmark", "/Trip-Guides/guides/denmark/"],
] as const;

/* WCAG: large text 3:1, body 4.5:1. The title is clamped well above the large-text threshold at
   every width; the dek is body copy. */
const FLOOR = { title: 3, dek: 4.5 } as const;

const rel = (c: number[]) => {
  const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
};
const ratio = (a: number[], b: number[]) => {
  const [x, y] = [rel(a), rel(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

async function openGuide(page: Page, path: string, width: number) {
  await page.setViewportSize({ width, height: width < 700 ? 812 : 900 });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  await page.goto(path, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    const g = Array.from(document.querySelectorAll<HTMLElement>(".tab, .botslot, a, button"))
      .find((e) => e.textContent?.trim() === "Guide");
    g?.click();
  });
  await page.waitForTimeout(1200);
  /* A living cover is video: pause it so the sample is a fixed frame rather than whichever
     one the encoder happened to be on. */
  await page.evaluate(() => { document.querySelectorAll("video").forEach((v) => v.pause()); window.scrollTo(0, 0); });
  await page.waitForTimeout(400);
}

for (const [name, path] of GUIDES) {
  for (const width of WIDTHS) {
    test(`⌁ ${name} cover type clears contrast on its photograph at ${width}px`, async ({ page }) => {
      await openGuide(page, path, width);

      const info = await page.evaluate(() => {
        const frame = document.querySelector(".mast-frame");
        const title = document.querySelector(".mast-title");
        const dek = document.querySelector(".mast-dek");
        const plate = document.querySelector(".mast-plate-row");
        if (!frame || !title || !plate) return null;
        const box = (el: Element) => { const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; };
        const rgb = (el: Element) => getComputedStyle(el).color.match(/[\d.]+/g)!.slice(0, 3).map(Number);
        return {
          /* Band mode puts the type on cream BELOW the picture, where contrast is a known token
             pair and there is no photograph involved. Nothing to measure, and measuring it would
             report the paper as a failure. */
          overlay: getComputedStyle(plate).position === "absolute",
          mediaFail: frame.classList.contains("mast-media-fail"),
          frame: box(frame), title: box(title), dek: dek ? box(dek) : null,
          titleInk: rgb(title), dekInk: dek ? rgb(dek) : null,
        };
      });

      test.skip(!info, `${name}: no cover on this guide`);
      if (!info) return;
      test.skip(!info.overlay, `${name} @${width}px: cover is in band mode — type is on cream, not on the photo`);
      /* If the photo failed to load the scrim sits on the Painted Atlas fallback, which is a
         different measurement. Better to say so than to quietly pass a picture nobody saw. */
      expect(info.mediaFail, `${name} @${width}px: the cover photo did not load, so this gate measured the fallback`).toBe(false);

      await page.evaluate(() => {
        const el = document.querySelector<HTMLElement>(".mast-plate-row");
        if (el) el.style.visibility = "hidden";
      });
      await page.waitForTimeout(300);

      const clipY = Math.max(0, info.frame.y);
      const buf = await page.screenshot({
        clip: { x: 0, y: clipY, width, height: Math.min(info.frame.h, (width < 700 ? 812 : 900) - clipY) },
      });
      const png = PNG.sync.read(buf);

      const groundUnder = (b: { x: number; y: number; w: number; h: number }) => {
        const px: number[][] = [];
        const x0 = Math.max(0, Math.round(b.x)), x1 = Math.min(png.width, Math.round(b.x + b.w));
        const y0 = Math.max(0, Math.round(b.y - clipY)), y1 = Math.min(png.height, Math.round(b.y - clipY + b.h));
        for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) {
          const i = (png.width * y + x) << 2;
          px.push([png.data[i], png.data[i + 1], png.data[i + 2]]);
        }
        if (!px.length) return null;
        px.sort((a, c) => rel(c) - rel(a));
        return px[Math.floor(px.length * 0.1)];
      };

      const rows: string[] = [];
      for (const [kind, box, ink] of [
        ["title", info.title, info.titleInk],
        ["dek", info.dek, info.dekInk],
      ] as const) {
        if (!box || !ink) continue;
        const ground = groundUnder(box);
        if (!ground) continue;
        const r = ratio(ink, ground);
        if (r < FLOOR[kind]) {
          rows.push(`${kind} ${r.toFixed(2)}:1 against a floor of ${FLOOR[kind]}:1 (ground rgb(${ground.join(",")}))`);
        }
      }

      expect(
        rows,
        `${name} @${width}px: cover type does not clear its photograph — ${rows.join("; ")}. ` +
          `Re-measure with scripts/measure-hero.mjs after any change that moves this type, ` +
          `including a change of width: this exact failure passed at 1440 and failed at 375.`,
      ).toEqual([]);
    });
  }
}
