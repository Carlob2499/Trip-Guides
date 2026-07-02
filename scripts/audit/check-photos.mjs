// Wikimedia Commons photo validator — confirms every sights[].img.file across every
// guide still resolves to a real Commons File: page. Uses the MediaWiki API (not a
// thumbnail HEAD request) because it gives an authoritative "missing" flag instead
// of relying on redirect/cache behavior of the Special:FilePath thumbnailer that
// SightsBlock.astro uses for rendering.

import { readGuides, extractPhotos, isMain } from "./lib.mjs";

const API = "https://commons.wikimedia.org/w/api.php";

// The MediaWiki API accepts up to 50 titles per query batch.
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function queryMissing(files) {
  const titles = files.map((f) => `File:${f}`).join("|");
  const url = `${API}?action=query&titles=${encodeURIComponent(titles)}&format=json&formatversion=2`;
  const res = await fetch(url, { headers: { "user-agent": "waypoint-content-audit/1.0 (+https://github.com/Carlob2499/Trip-Guides)" } });
  if (!res.ok) throw new Error(`Commons API HTTP ${res.status}`);
  const data = await res.json();
  const pages = data?.query?.pages ?? [];
  const missing = new Set();
  for (const p of pages) {
    if (p.missing) missing.add(p.title.replace(/^File:/, ""));
  }
  return missing;
}

export async function checkPhotos() {
  const guides = await readGuides();

  const byFile = new Map();
  for (const { slug, guide } of guides) {
    for (const file of extractPhotos(guide)) {
      if (!byFile.has(file)) byFile.set(file, new Set());
      byFile.get(file).add(slug);
    }
  }

  const files = [...byFile.keys()];
  const missing = [];
  for (const batch of chunk(files, 50)) {
    let missingInBatch;
    try {
      missingInBatch = await queryMissing(batch);
    } catch (err) {
      // API-level failure (not a missing-file finding) — surface distinctly so it
      // doesn't get silently swallowed as "everything's fine".
      return { checked: files.length, missing: [], apiError: String(err.message || err) };
    }
    for (const file of missingInBatch) {
      missing.push({ file, guides: [...byFile.get(file)] });
    }
  }

  return { checked: files.length, missing, apiError: null };
}

if (isMain(import.meta.url)) {
  const { checked, missing, apiError } = await checkPhotos();
  if (apiError) {
    console.log(`[photos] Commons API error — could not check: ${apiError}`);
  } else {
    console.log(`[photos] checked ${checked} unique files, ${missing.length} missing`);
    for (const m of missing) console.log(`  ✗ ${m.file} (cited by: ${m.guides.join(", ")})`);
  }
}
