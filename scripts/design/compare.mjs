#!/usr/bin/env node
/* The board-vs-build sheet: the approved board on top, the build under it, one PNG for the PR.

   node scripts/design/compare.mjs <board.webp> <out.png> "<title>" <shot1> "<caption1>" [<shot2> "<caption2>" ...]

   Phone/320 captures (file name contains -m- or -s-) are laid out at 300px wide, everything
   else at 560px. Convert the result to WebP before committing it under docs/mockups/compare/:
     node -e "require('sharp')('out.png').webp({quality:82}).toFile('out.webp')" */
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const [board, out, label, ...rest] = process.argv.slice(2);
if (!board || !out || !label || rest.length < 2) {
  console.error("usage: compare.mjs <board.webp> <out.png> <title> <shot> <caption> [<shot> <caption> ...]");
  process.exit(2);
}
const b64 = (p) => `data:image/${p.endsWith(".webp") ? "webp" : "png"};base64,${readFileSync(p).toString("base64")}`;
const shots = [];
for (let i = 0; i < rest.length; i += 2) shots.push({ src: rest[i], cap: rest[i + 1] });
const narrow = (p) => /-m-|-s-/.test(p);
const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;background:#e3e7dc;font-family:system-ui,sans-serif;color:#0f141a;padding:28px;width:1500px;box-sizing:border-box}
h1{font:600 20px/1.2 system-ui;margin:0 0 6px} p{margin:0 0 18px;color:#3c4534;font-size:13px}
.k{font:700 11px system-ui;letter-spacing:.14em;text-transform:uppercase;color:#3c4534;margin:0 0 8px}
.board img{width:100%;display:block;border:1px solid #a9b39b;border-radius:12px}
.row{display:flex;gap:20px;align-items:flex-start;margin-top:24px;flex-wrap:wrap}
.row figure{margin:0;flex:0 0 auto} .row img{display:block;border:1px solid #a9b39b;border-radius:12px}
figcaption{font-size:12px;color:#3c4534;margin-top:6px}
</style>
<h1>${label}</h1><p>Top: the approved board. Below: the build. Photos may be sandbox stubs; production loads the guide's own covers.</p>
<div class="board"><p class="k">Board</p><img src="${b64(board)}"></div>
<div class="row">${shots.map((s) => `<figure><p class="k">${s.cap}</p><img src="${b64(s.src)}" style="width:${narrow(s.src) ? 300 : 560}px"></figure>`).join("")}</div>`;

const launch = { headless: true };
if (process.env.PW_CHROMIUM) launch.executablePath = process.env.PW_CHROMIUM;
const browser = await chromium.launch(launch);
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
await page.setContent(html, { waitUntil: "load" });
await page.screenshot({ path: out, fullPage: true });
await browser.close();
