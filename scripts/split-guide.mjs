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
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GUIDES_DIR = path.join(ROOT, "src", "content", "guides");

export const fileSlug = (g) => g.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Group sections preserving first-appearance order. Throws when a group's sections are
// non-contiguous (concatenating group files would silently reorder them — the
// byte-identical dist gate would eventually catch it, but this fails loudly at split time).
export function groupSections(sections) {
  const order = [];
  const byGroup = new Map();
  let prev = null;
  for (const s of sections) {
    const g = s.group || "(none)";
    if (!byGroup.has(g)) {
      order.push(g);
      byGroup.set(g, []);
    } else if (prev !== g) {
      throw new Error(`group "${g}" is non-contiguous (reappears after "${prev}") — refusing to split; fix the section order first`);
    }
    byGroup.get(g).push(s);
    prev = g;
  }
  return { order, byGroup };
}

export const SPLIT_ERRORS = {
  NOT_FOUND: "not_found",
  NO_SECTIONS: "no_sections",
  NON_CONTIGUOUS: "non_contiguous",
};

// Core action: read <slug>.json, group its sections, write the directory shape, remove the
// monolith. Returns { ok: true, slug, groupFiles, groups } or { ok: false, error, slug, message }.
export async function splitGuide(slug, { guidesDir = GUIDES_DIR } = {}) {
  const srcFile = path.join(guidesDir, `${slug}.json`);
  const outDir = path.join(guidesDir, slug);

  try { await access(srcFile); }
  catch { return { ok: false, error: SPLIT_ERRORS.NOT_FOUND, slug, message: `${srcFile} not found` }; }

  const guide = JSON.parse(await readFile(srcFile, "utf8"));
  const { sections, ...meta } = guide;
  if (!Array.isArray(sections) || !sections.length) {
    return { ok: false, error: SPLIT_ERRORS.NO_SECTIONS, slug, message: "no sections" };
  }

  let grouped;
  try { grouped = groupSections(sections); }
  catch (err) { return { ok: false, error: SPLIT_ERRORS.NON_CONTIGUOUS, slug, message: err.message }; }
  const { order, byGroup } = grouped;

  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, "_guide.json"), JSON.stringify(meta, null, 2) + "\n", "utf8");
  const groupFiles = [];
  let n = 0;
  for (const g of order) {
    n++;
    const name = `${String(n).padStart(2, "0")}-${fileSlug(g)}.json`;
    const groupSectionsList = byGroup.get(g);
    await writeFile(path.join(outDir, name), JSON.stringify(groupSectionsList, null, 2) + "\n", "utf8");
    groupFiles.push({ name, count: groupSectionsList.length });
  }
  await rm(srcFile);
  return { ok: true, slug, groupFiles, groups: order.length };
}

// ── CLI ──────────────────────────────────────────────────────────────────────
function isMain(moduleUrl) {
  return process.argv[1] != null && moduleUrl === pathToFileURL(process.argv[1]).href;
}

if (isMain(import.meta.url)) {
  const slug = process.argv[2];
  if (!slug) { console.error("usage: node scripts/split-guide.mjs <slug>"); process.exit(1); }

  const result = await splitGuide(slug);
  if (!result.ok) {
    console.error(`[split] ${result.message}`);
    process.exit(1);
  }
  for (const { name, count } of result.groupFiles) {
    console.log(`[split] ${name} — ${count} section(s)`);
  }
  console.log(`[split] ${slug}: ${result.groups} group files + _guide.json written; ${slug}.json removed`);
}
