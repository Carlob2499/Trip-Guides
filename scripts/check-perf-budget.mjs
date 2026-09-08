// Performance budget gate — fails CI if the built bundles bloat past budget, so the site's
// speed survives future features. Raw (uncompressed) sizes.
//
// M2/perf: split into a FIRST-PAINT tier and a TOTAL tier. The 900 KB total budget alone
// couldn't catch a first-paint regression — it's ~78% lazy chunks (Firebase, gsap, pdf.js),
// so a genuinely heavy addition to the ALWAYS-loaded entry graph could still pass while a
// visitor's actual time-to-interactive got worse. First-paint is derived from the real built
// artifact, not a hardcoded chunk-name list (the same "read dist/, don't memorize names"
// principle gen-sw-precache.mjs uses): every page's <script type="module" src> tag is a real
// entry, and each entry's STATIC `import ... from "./x.js"` specifiers are what the browser
// necessarily fetches before that script can run. A DYNAMIC `import("./x.js")` call (gsap,
// pdf.js, Firebase, qrcode — all confirmed lazy in the codebase) is deliberately excluded:
// that's exactly the boundary between "blocks first paint" and "loads on demand."
import { readdirSync, readFileSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

/* THE CSS BUDGET, 2026-09-05 — why this is per-page and gzipped now.
   It used to be one line: `css: 300 * 1024, // all CSS combined`, set 2026-07-06 with no
   recorded rationale. Two things were wrong with it, and the argument against both is already
   written above for JS:
     · It summed every stylesheet in the build. Nobody loads that. Atlas pulls 54 KB, About
       24 KB, a guide page 217 KB — and the header above says, of the JS entries, that summing
       pages "would double-count a load that never happens". CSS never got the same treatment.
     · It measured RAW bytes. Pages ship compressed, so it policed a number ~5x larger than
       anything a reader waits for: the guide page's 217 KB raw is 40 KB over the wire.
   The result was a gate that read 299/300 and blocked real work while the actual worst page
   sat at 40 KB — and it pointed nowhere useful, because 59% of the raw total is one file
   (touch.css) that only guide pages load.
   Per-page gzipped is the honest measure and the tighter one: it can no longer be blown by a
   page nobody loads with the page in front of the reader, and it names the offending page.
   Owner ruling 2026-09-05, who set the original number. */
const DIST = "dist";
const ASTRO_DIR = join(DIST, "_astro");
const BUDGET = {
  firstPaintJs: 200 * 1024, // every page's entry graph — today's measured max is ~127 KB
  js:  900 * 1024,  // total baseline JS across all pages (the lazy Firebase/gsap/pdf/d3 chunks dominate this)
  /* CSS is budgeted PER PAGE and GZIPPED — see the note below for why the old single
     300 KB raw total was measuring something no reader ever experiences. */
  cssPerPage: 60 * 1024,
  maxFile: 500 * 1024, // no single bundle larger than this
};

// On-demand chunks a visitor pulls ONLY via explicit interaction, so they aren't part of the
// baseline page weight the `js` budget protects (pdf.js on a booking upload, d3/topojson-client
// behind the Atlas globe's dynamic import() — docs/archive/INDEX.md → PLAN_ATLAS_MIGRATION Stage C.2/D19). Derived
// STRUCTURALLY (same "read dist/, don't memorize names" principle as gen-sw-precache.mjs) —
// a chunk is on-demand precisely when it never appears in ANY page's first-paint closure, i.e.
// Rollup only emitted it because something reached it via a dynamic import(). That replaces a
// hand-maintained name pattern (fragile: d3's dependency graph splits into generically-named
// index.esm.*.js chunks with no stable filename to match on) and generalizes to whatever the
// next lazy-loaded feature turns out to be. Still subject to maxFile below.

function findHtmlFiles(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...findHtmlFiles(p));
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

// Every <script type="module" src="..."> per built page — a SINGLE page's real, guaranteed
// entry set (not a union across pages: the hub and a guide page never load together, so
// summing their entries would double-count a load that never happens).
function entryChunksByPage() {
  const byPage = new Map();
  for (const file of findHtmlFiles(DIST)) {
    const html = readFileSync(file, "utf8");
    const entries = new Set();
    for (const m of html.matchAll(/<script[^>]*type="module"[^>]*\ssrc="([^"]+)"/g)) {
      entries.add(m[1].split("/").pop());
    }
    if (entries.size) byPage.set(file, entries);
  }
  return byPage;
}

// Static imports only (`from "./x.js"` / `export ... from "./x.js"`) — NOT dynamic import("./x.js")
// calls, which is exactly the signal for "lazy, not first-paint."
function staticImportsOf(chunkName) {
  const p = join(ASTRO_DIR, chunkName);
  let src;
  try { src = readFileSync(p, "utf8"); } catch { return []; }
  const out = [];
  for (const m of src.matchAll(/\bfrom\s*["']([^"']+\.m?js)["']/g)) {
    out.push(m[1].split("/").pop());
  }
  return out;
}

function firstPaintClosure(entries) {
  const seen = new Set();
  const queue = [...entries];
  while (queue.length) {
    const name = queue.pop();
    if (seen.has(name)) continue;
    seen.add(name);
    for (const dep of staticImportsOf(name)) {
      if (!seen.has(dep)) queue.push(dep);
    }
  }
  return seen;
}

// The union of every page's first-paint closure — a .js chunk absent from ALL of them was
// only emitted because some dynamic import() reached it, i.e. it's on-demand by construction.
const pageEntries = [...entryChunksByPage()];
const firstPaintReachable = new Set();
for (const [, entries] of pageEntries) {
  for (const name of firstPaintClosure(entries)) firstPaintReachable.add(name);
}
const isOnDemand = (name) => !firstPaintReachable.has(name);

/* Every <link rel="stylesheet" href> per built page — the real set one visitor downloads. */
function cssByPage() {
  const byPage = new Map();
  for (const file of findHtmlFiles(DIST)) {
    const html = readFileSync(file, "utf8");
    const sheets = new Set();
    for (const m of html.matchAll(/<link[^>]*rel="stylesheet"[^>]*\shref="([^"]+\.css)"/g)) sheets.add(m[1].split("/").pop());
    for (const m of html.matchAll(/<link[^>]*href="([^"]+\.css)"[^>]*rel="stylesheet"/g)) sheets.add(m[1].split("/").pop());
    if (sheets.size) byPage.set(file, sheets);
  }
  return byPage;
}
const gzOf = (name) => {
  try { return gzipSync(readFileSync(join(ASTRO_DIR, name))).length; } catch { return 0; }
};
let worstCssPage = { file: "", size: 0, count: 0 };
for (const [file, sheets] of cssByPage()) {
  let size = 0;
  for (const name of sheets) size += gzOf(name);
  if (size > worstCssPage.size) worstCssPage = { file, size, count: sheets.size };
}

let js = 0, onDemand = 0, css = 0, worst = { name: "", size: 0 };
const astroFiles = readdirSync(ASTRO_DIR);
for (const f of astroFiles) {
  const size = statSync(join(ASTRO_DIR, f)).size;
  if (f.endsWith(".js")) {
    if (isOnDemand(f)) onDemand += size;
    else js += size;
  } else if (f.endsWith(".css")) css += size;
  else continue;
  if (size > worst.size) worst = { name: f, size };
}

const kb = (n) => (n / 1024).toFixed(0) + " KB";

// The metric that matters is the WORST single page's first-paint weight, not a sum across
// pages that never load together.
let worstPage = { file: "", size: 0, count: 0 };
for (const [file, entries] of pageEntries) {
  const closure = firstPaintClosure(entries);
  let size = 0;
  for (const name of closure) {
    if (!name.endsWith(".js")) continue;
    try { size += statSync(join(ASTRO_DIR, name)).size; } catch { /* not an _astro chunk (e.g. inline) */ }
  }
  if (size > worstPage.size) worstPage = { file, size, count: closure.size };
}

console.log(
  `[perf-budget] worst first-paint page ${worstPage.file} — ${kb(worstPage.size)} / ${kb(BUDGET.firstPaintJs)} (${worstPage.count} entry+static chunks) · ` +
  `total JS ${kb(js)} / ${kb(BUDGET.js)} · worst CSS page ${worstCssPage.file} ${kb(worstCssPage.size)} gzipped / ${kb(BUDGET.cssPerPage)} (${worstCssPage.count} sheets; ${kb(css)} raw across the whole build) · largest ${worst.name} ${kb(worst.size)}` +
  `${onDemand ? ` · (+${kb(onDemand)} on-demand — pdf.js, d3/topojson-client, etc. — not in either budget)` : ""}`
);

const fails = [];
if (worstPage.size > BUDGET.firstPaintJs) fails.push(`${worstPage.file} first-paint JS ${kb(worstPage.size)} exceeds ${kb(BUDGET.firstPaintJs)} — something landed in the ALWAYS-loaded entry graph, not a lazy chunk`);
if (js > BUDGET.js) fails.push(`total JS ${kb(js)} exceeds ${kb(BUDGET.js)}`);
if (worstCssPage.size > BUDGET.cssPerPage) fails.push(`${worstCssPage.file} ships ${kb(worstCssPage.size)} of gzipped CSS, over ${kb(BUDGET.cssPerPage)} — trim the sheets THAT page loads, not the build total`);
if (worst.size > BUDGET.maxFile) fails.push(`${worst.name} (${kb(worst.size)}) exceeds per-file ${kb(BUDGET.maxFile)}`);
if (fails.length) {
  console.error("[perf-budget] FAIL:\n  " + fails.join("\n  "));
  process.exit(1);
}
console.log("[perf-budget] OK");
