// Flips a draft guide's `draft: true` off, deleting the key entirely — matching the
// convention every non-draft guide already follows (denmark/_guide.json and korea/_guide.json
// have no `draft` key at all, not `draft: false`). Run by .github/workflows/graduate-guide.yml,
// which only fires when the repo owner (write access required) applies the
// `graduate-approved` label to a `graduate-request` issue — filing the nomination
// itself never touches anything. Deliberately does NOT touch `verified` — replacing a
// draft-scaffold warning with an accurate verification date is a content judgment call
// for a human, not something to script.
//
// Handles BOTH guide shapes (CLAUDE.md's Operational Habits): a fresh/small guide is a flat
// `src/content/guides/<slug>.json` file; a mature, split guide is a directory
// `src/content/guides/<slug>/` whose `_guide.json` carries every top-level field (including
// `draft`) with the section groups in sibling `NN-<group>.json` files. `draft` only ever lives
// in the meta file either way, so graduating a split guide is the same single-file edit to
// `_guide.json` instead of `<slug>.json` — no section files are touched.

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isMain } from "./audit/lib.mjs";
import { resolveGuidePath as resolveGuidePathShared } from "./lib/guide-shape.mjs";
// A4: imported from intake-schema.mjs (the single source of this regex now) instead of
// keeping a byte-identical duplicate here. Extracts a GitHub issue-form field's value
// from the rendered issue body: "### <label>\n\n<value>" blocks, GitHub's own
// "_No response_" placeholder normalized to empty. Re-exported as `field` (its name
// here) since parse-modify-issue.mjs and graduate-guide.test.mjs both import it from
// this module by that name.
import { matchField as field } from "./intake-schema.mjs";
export { field };

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GUIDES_DIR = path.join(ROOT, "src", "content", "guides");

export function parseIssueBody(body) {
  return { rawSlug: field(body, "Guide slug") };
}

// Slug must match what slugify() in scaffold-guide.mjs can produce — lowercase, digits, single
// hyphens — never trust it as a path segment otherwise. Re-exported from the shared
// scripts/lib/slug.mjs so every pipeline entry point (this file, pipeline.mjs, the
// workflows) validates identically instead of drifting.
export { isValidSlug } from "./lib/slug.mjs";

// E8·2: the flat-vs-directory resolution order now lives once in scripts/lib/guide-shape.mjs
// (shared with graduate-guide.yml's own copy, via the `node -e` call below, and with
// audit/lib.mjs's readGuides) — re-exported here under this module's original name and
// default-guidesDir signature so every existing importer keeps working unchanged.
export function resolveGuidePath(slug, guidesDir = GUIDES_DIR) {
  return resolveGuidePathShared(slug, guidesDir);
}

export const GRADUATE_ERRORS = {
  NOT_FOUND: "not_found",
  NOT_DRAFT: "not_draft",
};

// Core action: read whichever shape's meta file exists, clear `draft`, write it back.
// Returns { ok: true, slug, country, isDirectory } or { ok: false, error, slug }.
export async function graduateGuide(slug, { guidesDir = GUIDES_DIR } = {}) {
  const located = resolveGuidePath(slug, guidesDir);
  if (!located) return { ok: false, error: GRADUATE_ERRORS.NOT_FOUND, slug };

  const guide = JSON.parse(await readFile(located.metaPath, "utf8"));
  if (!guide.draft) return { ok: false, error: GRADUATE_ERRORS.NOT_DRAFT, slug };

  delete guide.draft;
  await writeFile(located.metaPath, JSON.stringify(guide, null, 2) + "\n");
  return { ok: true, slug, country: guide.country || "", isDirectory: located.isDirectory, metaPath: located.metaPath };
}

// ── CLI ──────────────────────────────────────────────────────────────────────
// Two entry modes:
//   ISSUE_BODY (set by graduate-guide.yml)  — the human-approved-label path: parses the
//     "### Guide slug" field from a graduate-request issue, writes slug/country to
//     GITHUB_OUTPUT on success.
//   --slug <slug>                            — the auto-graduate path: research-pass.yml
//     calls this directly once its OWN verify+build gate just passed (the pipeline's
//     self-correction loop IS the evidence check; no issue, no human label, no
//     GITHUB_OUTPUT — the caller already knows the slug and stays in the same job).
// Exit codes preserved from before the refactor: 1 = no/invalid slug, 2 = guide not
// found (either shape), 3 = not a draft.

if (isMain(import.meta.url)) {
  const slugFlag = process.argv.indexOf("--slug");
  const direct = slugFlag !== -1;
  const rawSlug = direct ? process.argv[slugFlag + 1] : parseIssueBody(process.env.ISSUE_BODY || "").rawSlug;
  if (!rawSlug) {
    console.error(direct ? "[graduate-guide] --slug needs a value" : "[graduate-guide] no Guide slug field — aborting");
    process.exit(1);
  }

  const slug = rawSlug.trim().toLowerCase();
  if (!isValidSlug(slug)) {
    console.error(`[graduate-guide] "${rawSlug}" isn't a valid slug — aborting`);
    process.exit(1);
  }

  const result = await graduateGuide(slug);
  if (!result.ok) {
    if (result.error === GRADUATE_ERRORS.NOT_FOUND) {
      console.error(`[graduate-guide] no guide at src/content/guides/${slug}.json or src/content/guides/${slug}/_guide.json — aborting`);
      process.exit(2);
    }
    console.error(`[graduate-guide] ${slug} isn't a draft (no draft:true) — nothing to do`);
    process.exit(3);
  }

  console.log(`[graduate-guide] ${slug} graduated — draft key removed from ${path.relative(ROOT, result.metaPath)}`);

  if (process.env.GITHUB_OUTPUT) {
    const { appendFileSync } = await import("node:fs");
    appendFileSync(process.env.GITHUB_OUTPUT, `slug=${slug}\ncountry=${result.country}\n`);
  }
}
