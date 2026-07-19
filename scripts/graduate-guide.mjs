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
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GUIDES_DIR = path.join(ROOT, "src", "content", "guides");

// Extract a GitHub issue-form field's value from the rendered issue body — same convention
// `issue-to-scaffold.mjs` and this file have always used: "### <label>\n\n<value>" blocks,
// GitHub's own "_No response_" placeholder normalized to empty.
export function field(body, label) {
  const esc = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = String(body || "").match(new RegExp("###\\s+" + esc + "\\s*\\n+([\\s\\S]*?)(?=\\n###\\s|$)"));
  let v = m ? m[1].trim() : "";
  if (v === "_No response_" || v === "_No response_.") v = "";
  return v;
}

export function parseIssueBody(body) {
  return { rawSlug: field(body, "Guide slug") };
}

// Slug must match what slugify() in scaffold-guide.mjs can produce — lowercase, digits, single
// hyphens — never trust it as a path segment otherwise.
export function isValidSlug(slug) {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}

// Which shape this guide is in, or null if neither exists. The flat file wins if (somehow)
// both existed, since that would mean an incomplete split — but that's not a case the build
// itself tolerates (the content loader picks one shape per slug), so it's here only as a
// defensive tie-break, not an expected path.
export function resolveGuidePath(slug, guidesDir = GUIDES_DIR) {
  const flatPath = path.join(guidesDir, `${slug}.json`);
  if (existsSync(flatPath)) return { metaPath: flatPath, isDirectory: false };
  const dirMetaPath = path.join(guidesDir, slug, "_guide.json");
  if (existsSync(dirMetaPath)) return { metaPath: dirMetaPath, isDirectory: true };
  return null;
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
// Reads the issue body from ISSUE_BODY (set by the workflow), writes slug/country to
// GITHUB_OUTPUT on success. Exit codes preserved from before the refactor: 1 = no/invalid
// slug field, 2 = guide not found (either shape), 3 = not a draft.
function isMain(moduleUrl) {
  return process.argv[1] != null && moduleUrl === pathToFileURL(process.argv[1]).href;
}

if (isMain(import.meta.url)) {
  const body = process.env.ISSUE_BODY || "";
  const { rawSlug } = parseIssueBody(body);
  if (!rawSlug) { console.error("[graduate-guide] no Guide slug field — aborting"); process.exit(1); }

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
