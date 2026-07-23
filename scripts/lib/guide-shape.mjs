// Shared flat-vs-directory guide-shape resolver (E8·2). Previously duplicated between
// graduate-guide.mjs (as its own local function) and graduate-guide.yml (an inline bash
// re-implementation of the same "flat file wins" order) — this is the one place that
// decision lives now; both call sites use it instead of keeping their own copy in sync by hand.
import { existsSync } from "node:fs";
import path from "node:path";

// Which shape a guide is in, or null if neither exists. The flat file wins if (somehow)
// both existed, since that would mean an incomplete split — but that's not a case the
// build itself tolerates (the content loader picks one shape per slug), so it's here
// only as a defensive tie-break, not an expected path.
export function resolveGuidePath(slug, guidesDir) {
  const flatPath = path.join(guidesDir, `${slug}.json`);
  if (existsSync(flatPath)) return { metaPath: flatPath, isDirectory: false };
  const dirMetaPath = path.join(guidesDir, slug, "_guide.json");
  if (existsSync(dirMetaPath)) return { metaPath: dirMetaPath, isDirectory: true };
  return null;
}
