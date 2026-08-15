// THE guide directory shape — where a guide's meta file is, and how a guide directory is written.
//
// Every guide is a DIRECTORY (`src/content/guides/<slug>/`: `_guide.json` meta + one
// `NN-<group>.json` per tab group + `facts.json`), with no exceptions, drafts included —
// CLAUDE.md's rule, mechanically gated by `scripts/__tests__/guide-shape-uniform.test.mjs`.
// The flat `<slug>.json` shape and the splitter that converted it are gone: two shapes meant every
// consumer (the content loader, the publication path, the audit suite) carried a branch, and the
// flat file WON the tie-break, so a stray one silently shadowed the directory beside it.
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// The guide's meta file, or null when there is no guide at this slug.
export function resolveGuidePath(slug, guidesDir) {
  const metaPath = path.join(guidesDir, slug, "_guide.json");
  return existsSync(metaPath) ? { metaPath } : null;
}

// Group-file name from a group label: "Money & Budget" → "money-and-budget".
export const fileSlug = (g) => g.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Group sections preserving first-appearance order. Throws when a group's sections are
// non-contiguous (concatenating group files back would silently reorder them — the
// byte-identical dist gate would eventually catch it, but this fails loudly at write time).
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
      throw new Error(`group "${g}" is non-contiguous (reappears after "${prev}") — refusing to write; fix the section order first`);
    }
    byGroup.get(g).push(s);
    prev = g;
  }
  return { order, byGroup };
}

// Write a whole guide object out as the directory shape: `_guide.json` (every top-level field
// EXCEPT sections) + one `NN-<group>.json` per tab group, NN = 2-digit first-appearance order so
// plain filename sort reproduces the original section order exactly. Both writers of guide content
// (the scaffolder and the Composer) go through here, so the naming and ordering decisions live in
// exactly one place. Returns { slug, groupFiles, groups }; throws on empty or non-contiguous input.
export async function writeGuideDir(slug, guide, { guidesDir } = {}) {
  const { sections, ...meta } = guide;
  if (!Array.isArray(sections) || !sections.length) {
    throw new Error(`${slug}: a guide directory needs at least one section`);
  }
  const { order, byGroup } = groupSections(sections);

  const outDir = path.join(guidesDir, slug);
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
  return { slug, groupFiles, groups: order.length };
}
