/* Screenshot rig for the /progress/ design study (src/pages/progress-preview/).
 * PREVIEW-ONLY tooling — deletes with the study.
 *
 *   node docs/mockups/shoot-progress-study.mjs [--port 4399] [--only first-light] [--matrix]
 *
 * Default run: every option in its representative state, mobile + desktop, light + dark.
 * --matrix adds the full state machine per option plus a forced reduced-motion pass.
 * Output: docs/mockups/shots/<option>/<name>.png (gitignored — regenerate on demand).
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outRoot = join(here, "shots");

const argv = process.argv.slice(2);
const arg = (k, d) => {
  const i = argv.indexOf(k);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const PORT = arg("--port", "4399");
const ONLY = arg("--only", null);
const MATRIX = argv.includes("--matrix");
const ORIGIN = `http://localhost:${PORT}/Trip-Guides/progress-preview`;

const OPTIONS = ["first-light", "departures", "neatline", "two-passes"];
const HERO_STATES = ["mid", "stuck", "done"];
const ALL_STATES = ["unknown", "scaffold", "passA", "mid", "retry", "stuck", "verified", "done"];
const VIEWPORTS = [
  { id: "mobile", width: 375, height: 812 },
  { id: "desktop", width: 1280, height: 900 },
];
const THEMES = ["light", "dark"];

// A real destination so the accent, the time zone and the terrain seed are all genuine.
const IDENT = "country=South+Korea&slug=south-korea";

const shots = [];
for (const option of ONLY ? [ONLY] : OPTIONS) {
  for (const vp of VIEWPORTS) {
    for (const theme of THEMES) {
      for (const state of MATRIX ? ALL_STATES : HERO_STATES) {
        shots.push({ option, vp, theme, state, motion: "no-preference" });
      }
    }
  }
  if (MATRIX) {
    // Reduced motion is not a variant, it is a contract: every finished frame, no entrance.
    for (const vp of VIEWPORTS) {
      for (const theme of THEMES) {
        shots.push({ option, vp, theme, state: "mid", motion: "reduce" });
      }
    }
  }
}

const browser = await chromium.launch();
let n = 0;
const errors = [];

for (const s of shots) {
  const ctx = await browser.newContext({
    viewport: { width: s.vp.width, height: s.vp.height },
    colorScheme: s.theme,
    reducedMotion: s.motion,
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`${s.option}/${s.state}/${s.theme}/${s.vp.id}: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`${s.option}/${s.state}/${s.theme}/${s.vp.id}: console ${m.text()}`);
  });

  const url = `${ORIGIN}/${s.option}/?bare=1&${IDENT}&state=${s.state}`;
  const res = await page.goto(url, { waitUntil: "networkidle" });
  if (!res || !res.ok()) {
    errors.push(`${s.option}: HTTP ${res ? res.status() : "no response"} at ${url}`);
    await ctx.close();
    continue;
  }
  // Let the once-per-arrival overture finish so the shot shows the settled frame.
  await page.waitForTimeout(s.motion === "reduce" ? 300 : 1500);

  const dir = join(outRoot, s.option);
  mkdirSync(dir, { recursive: true });
  const motionTag = s.motion === "reduce" ? "-reduced" : "";
  const file = join(dir, `${s.state}-${s.vp.id}-${s.theme}${motionTag}.png`);
  await page.screenshot({ path: file, fullPage: s.vp.id === "mobile" ? false : false });
  n++;
  await ctx.close();
}

await browser.close();

// Contact sheet — open docs/mockups/shots/index.html to review everything in one scroll.
const byOption = {};
for (const s of shots) {
  const tag = s.motion === "reduce" ? "-reduced" : "";
  (byOption[s.option] ??= []).push(`${s.state}-${s.vp.id}-${s.theme}${tag}.png`);
}
const sheet = `<!doctype html><meta charset="utf-8"><title>Progress design study — contact sheet</title>
<style>body{background:#111;color:#ddd;font:14px/1.5 system-ui,sans-serif;margin:0;padding:24px}
h2{font-size:20px;margin:32px 0 8px;border-bottom:1px solid #333;padding-bottom:6px}
.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px}
figure{margin:0}figcaption{font-size:12px;color:#8a8a8a;padding:6px 0}
img{width:100%;border:1px solid #333;background:#000}</style>
<h1>Progress page — design study contact sheet</h1>
${Object.entries(byOption).map(([opt, files]) => `<h2>${opt}</h2><div class="g">${[...new Set(files)]
  .map((f) => `<figure><img loading="lazy" src="${opt}/${f}"><figcaption>${f.replace(".png", "")}</figcaption></figure>`)
  .join("")}</div>`).join("")}`;
mkdirSync(outRoot, { recursive: true });
writeFileSync(join(outRoot, "index.html"), sheet);

console.log(`\n${n} shots -> docs/mockups/shots/  (contact sheet: docs/mockups/shots/index.html)`);
if (errors.length) {
  console.log(`\n${errors.length} PAGE ERROR(S):`);
  for (const e of errors) console.log("  " + e);
  process.exitCode = 1;
} else {
  console.log("Console clean on every shot.");
}
