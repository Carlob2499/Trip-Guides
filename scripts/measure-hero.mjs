/* Measure REAL composited contrast of the cover title against the photograph behind it.
   The repo's a11y suite aborts off-origin images, so it renders .mast-media-fail and never
   sees a photo at all — this loads the real cover, screenshots the composite, and reads the
   pixels the reader would actually see. */
import { chromium } from "@playwright/test";
import { PNG } from "pngjs";
import fs from "node:fs";

/* The bodies passed to page.evaluate() run in the PAGE, not in node, so `document` and
   `getComputedStyle` are real there and undefined here. This is the same declaration
   check-design-drift.mjs uses for its own dual-context file. */
/* global document, getComputedStyle */

const rel = (c) => {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
};
const ratio = (a, b) => { const [x, y] = [rel(a), rel(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const URL_ = process.argv[2];
const OUT = process.argv[3];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(URL_, { waitUntil: "networkidle" }).catch(() => {});
// enter the Guide destination
await p.evaluate(() => {
  const g = [...document.querySelectorAll(".tab,.botslot,a,button")].find((e) => e.textContent.trim() === "Guide");
  if (g) g.click();
});
await p.waitForTimeout(3000);
await p.evaluate(() => { document.querySelectorAll("video").forEach((v) => v.pause()); });
await p.waitForTimeout(500);

const info = await p.evaluate(() => {
  const f = document.querySelector(".mast-frame");
  const t = document.querySelector(".mast-title");
  const d = document.querySelector(".mast-dek");
  if (!f || !t) return null;
  const r = (el) => { const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; };
  const ink = (el) => getComputedStyle(el).color;
  return { zone: f.getAttribute("data-zone"), frame: r(f), title: r(t), dek: d ? r(d) : null,
           titleInk: ink(t), dekInk: d ? ink(d) : null,
           mediaFail: f.classList.contains("mast-media-fail") };
});
if (!info) { console.log("NO HERO"); await b.close(); process.exit(1); }

/* Hide the plate and re-shoot: sampling inside a text box otherwise reads the GLYPHS as the
   ground and reports 1:1. What matters is the picture under the words, with the scrim on it. */
await p.evaluate(() => { const el = document.querySelector(".mast-plate-row"); if (el) el.style.visibility = "hidden"; });
await p.waitForTimeout(400);
const buf = await p.screenshot({ clip: { x: 0, y: Math.max(0, info.frame.y), width: 1440, height: Math.min(info.frame.h, 900 - Math.max(0, info.frame.y)) } });
fs.writeFileSync(OUT, buf);
const png = PNG.sync.read(buf);
const yOff = Math.max(0, info.frame.y);

const parseRGB = (s) => s.match(/[\d.]+/g).slice(0, 3).map(Number);

function worstUnder(box) {
  // sample the BACKGROUND around the glyphs: take the lightest pixels in the text band,
  // which is the worst case for light ink.
  const x0 = Math.max(0, Math.round(box.x)), x1 = Math.min(png.width, Math.round(box.x + box.w));
  const y0 = Math.max(0, Math.round(box.y - yOff)), y1 = Math.min(png.height, Math.round(box.y - yOff + box.h));
  const px = [];
  for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) {
    const i = (png.width * y + x) << 2;
    px.push([png.data[i], png.data[i + 1], png.data[i + 2]]);
  }
  if (!px.length) return null;
  // the 90th-percentile-brightest pixel approximates the worst ground the ink sits on
  px.sort((a, c) => rel(c) - rel(a));
  /* The 10th-brightest-percentile pixel, not the single brightest: one blown highlight in a
     photograph is not what the reader's eye resolves the word against, but a tenth of the
     text band being that bright is. */
  return { lightest: px[Math.floor(px.length * 0.1)], n: px.length };
}

const out = { zone: info.zone, mediaFail: info.mediaFail, results: [] };
for (const [name, box, inkS] of [["title", info.title, info.titleInk], ["dek", info.dek, info.dekInk]]) {
  if (!box) continue;
  const s = worstUnder(box);
  if (!s) continue;
  const ink = parseRGB(inkS);
  out.results.push({ name, ink, worstGround: s.lightest, ratio: +ratio(ink, s.lightest).toFixed(2), samples: s.n });
}
console.log(JSON.stringify(out, null, 1));
await b.close();
