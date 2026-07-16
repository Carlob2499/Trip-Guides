// Split a monolithic guide JSON into the directory-per-guide shape the content
// loader assembles at build (convergence Phase 4):
//
//   src/content/guides/<slug>/
//     _guide.json     — every top-level field EXCEPT sections
//     NN-<group>.json — one file per tab group (array of its sections), NN =
//                       2-digit first-appearance order so plain filename sort
//                       reproduces the original section order exactly
//
// Usage: node scripts/split-guide.mjs <slug>
//
// SAFETY: refuses to split a guide whose groups are non-contiguous in the
// sections array (concatenating group files would silently reorder sections —
// the byte-identical dist gate would catch it, but fail loudly here instead).
// The original <slug>.json is deleted only after all files are written.

import { readFile, writeFile, mkdir, rm, access } from "node:fs/promises";
import path from "node:path";

const slug = process.argv[2];
if (!slug) { console.error("usage: node scripts/split-guide.mjs <slug>"); process.exit(1); }

const GUIDES = path.join("src", "content", "guides");
const srcFile = path.join(GUIDES, `${slug}.json`);
const outDir = path.join(GUIDES, slug);

try { await access(srcFile); } catch { console.error(`[split] ${srcFile} not found`); process.exit(1); }

const guide = JSON.parse(await readFile(srcFile, "utf8"));
const { sections, ...meta } = guide;
if (!Array.isArray(sections) || !sections.length) { console.error("[split] no sections"); process.exit(1); }

// Group sections preserving first-appearance order; assert contiguity.
const order = [];
const byGroup = new Map();
let prev = null;
for (const s of sections) {
  const g = s.group || "(none)";
  if (!byGroup.has(g)) {
    if (order.includes(g)) { /* unreachable: byGroup and order stay in sync */ }
    order.push(g);
    byGroup.set(g, []);
  } else if (prev !== g) {
    console.error(`[split] group "${g}" is non-contiguous (reappears after "${prev}") — refusing to split; fix the section order first`);
    process.exit(1);
  }
  byGroup.get(g).push(s);
  prev = g;
}

const fileSlug = (g) => g.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, "_guide.json"), JSON.stringify(meta, null, 2) + "\n", "utf8");
let n = 0;
for (const g of order) {
  n++;
  const name = `${String(n).padStart(2, "0")}-${fileSlug(g)}.json`;
  await writeFile(path.join(outDir, name), JSON.stringify(byGroup.get(g), null, 2) + "\n", "utf8");
  console.log(`[split] ${name} — ${byGroup.get(g).length} section(s)`);
}
await rm(srcFile);
console.log(`[split] ${slug}: ${order.length} group files + _guide.json written; ${slug}.json removed`);
