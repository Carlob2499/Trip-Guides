// Cross-guide search index (D20, docs/archive/PLAN_ATLAS_MIGRATION.md Stage B.6) — generated at build time
// into dist/data/search-index.json, the static asset the Atlas hub's search box lazily fetches
// on first focus/keystroke (Stage C). A .ts script (run via `tsx`, matching pretrip-check.ts's
// precedent) rather than .mjs specifically so it can import the atlas silo's builder — through
// its index.ts public surface, the sealed-silo contract's one door — instead of keeping a
// second hand-kept copy of that logic.
//
// Writes into dist/, not public/: fully derived from guide content, so — like
// scripts/gen-sw-precache.mjs's CORE list — there is nothing to commit; every build produces
// it fresh. Runs AFTER `astro build` (see package.json), so it can read the same
// already-fact-interpolated guide data check-closed-days.mjs does, and so it never masks a
// real schema error by running first.
//
// Usage: tsx scripts/build-search-index.ts

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { readGuides, flatten, isMain } from "./audit/lib.mjs";
import { buildGuideSearchIndex } from "../src/features/atlas/index";

const DIST_DATA = path.resolve("dist", "data");
const OUT_FILE = path.join(DIST_DATA, "search-index.json");

async function buildIndex(guides: Awaited<ReturnType<typeof readGuides>>) {
  const records = guides.flatMap(({ guide, slug }) =>
    buildGuideSearchIndex(slug, guide.title ?? slug, flatten(guide.sections)),
  );
  return records;
}

if (isMain(import.meta.url)) {
  const guides = await readGuides();
  const records = await buildIndex(guides);
  await mkdir(DIST_DATA, { recursive: true });
  await writeFile(OUT_FILE, JSON.stringify(records), "utf8");
  console.log(`[search-index] ${records.length} record(s) across ${guides.length} guide(s) -> ${path.relative(process.cwd(), OUT_FILE)}`);
}
