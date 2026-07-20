// "Did it actually land?" — the post-deploy reality check.
//
// Every internal gate (build, tests, schema, perf budget) can go green while the
// change never reaches the page a traveler actually loads: work stuck on an
// unmerged branch, a guide graduated in the repo but not yet redeployed, a route
// that 404s in production. Those gates answer "is the code correct"; this script
// answers the only question that matters to a reader — "is it live right now."
//
// It discovers which guides SHOULD be public (every non-draft guide in the repo),
// then fetches the real production site and confirms each one is BOTH reachable at
// its own URL AND linked from the homepage (a guide that deploys but never appears
// in the index is invisible in practice — that is exactly how the Sedona guide went
// missing for a day). Runs by hand (`npm run verify-live`) and in CI after deploy.
//
// Two layers, deliberately: the pure core (discoverPublishedSlugs, diagnose) is
// unit-tested with fixtures and never touches the network; the shell (checkLive)
// does the fetching with retries for CDN propagation lag. Same split as the rest of
// scripts/ — the logic is tested, the I/O is thin.

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GUIDES_DIR = path.join(ROOT, "src", "content", "guides");
const DEFAULT_BASE = "https://carlob2499.github.io/Trip-Guides";

/** Problem kinds diagnose() can report, so callers/tests key off constants not strings. */
export const PROBLEM = {
  UNREACHABLE: "unreachable", // the guide's own URL did not return 200
  UNLISTED: "unlisted", // reachable, but the homepage never links to it — invisible in practice
  NO_HOMEPAGE: "no-homepage", // couldn't even load the homepage — can't judge listing
};

/** A guide is "published" (should be live) when its meta JSON has no `draft: true`.
 *  Handles both guide shapes (CLAUDE.md Operational Habits): a directory guide keeps
 *  every top-level field in `<slug>/_guide.json`; a flat guide is `<slug>.json`. `draft`
 *  only ever lives in the meta file, so that single file decides it either way. */
export function discoverPublishedSlugs(guidesDir = GUIDES_DIR) {
  if (!existsSync(guidesDir)) return [];
  const slugs = [];
  for (const entry of readdirSync(guidesDir)) {
    const full = path.join(guidesDir, entry);
    let metaPath, slug;
    if (statSync(full).isDirectory()) {
      metaPath = path.join(full, "_guide.json");
      slug = entry;
    } else if (entry.endsWith(".json")) {
      metaPath = full;
      slug = entry.slice(0, -".json".length);
    } else {
      continue;
    }
    if (!existsSync(metaPath)) continue;
    let meta;
    try {
      meta = JSON.parse(readFileSync(metaPath, "utf8"));
    } catch {
      continue; // a malformed guide is the build's problem to flag, not this gate's
    }
    if (meta && meta.draft === true) continue;
    slugs.push(slug);
  }
  return slugs.sort();
}

/** The homepage links a guide as `…/guides/<slug>/` (see src/pages/index.astro) — a
 *  slug-anchored substring match is title-independent and survives copy edits. */
export function homepageLists(homepageHtml, slug) {
  return typeof homepageHtml === "string" && homepageHtml.includes(`guides/${slug}/`);
}

/** Pure verdict: given what SHOULD be live and what the site actually returned, list the
 *  problems. `observed` is { homepageHtml: string|null, guideStatus: { [slug]: number|null } }.
 *  Returns { ok, problems: [{ slug, kind, detail }] } — empty problems ⇒ ok. */
export function diagnose(expectedSlugs, observed) {
  const { homepageHtml = null, guideStatus = {} } = observed || {};
  const problems = [];
  const homepageOk = typeof homepageHtml === "string" && homepageHtml.length > 0;
  for (const slug of expectedSlugs) {
    const status = guideStatus[slug] ?? null;
    if (status !== 200) {
      problems.push({ slug, kind: PROBLEM.UNREACHABLE, detail: `GET /guides/${slug}/ → ${status ?? "no response"}` });
      continue; // no point checking the listing for a page that itself 404s
    }
    if (!homepageOk) {
      problems.push({ slug, kind: PROBLEM.NO_HOMEPAGE, detail: "homepage did not load — cannot confirm the guide is linked" });
      continue;
    }
    if (!homepageLists(homepageHtml, slug)) {
      problems.push({ slug, kind: PROBLEM.UNLISTED, detail: `/guides/${slug}/ is live but the homepage does not link it` });
    }
  }
  return { ok: problems.length === 0, problems };
}

/** One fetch with a bounded timeout, returning { status, text } — status null on any
 *  network error/abort so retries and diagnose() treat "no response" uniformly. */
async function fetchOnce(url, fetchImpl, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, { cache: "no-store", redirect: "follow", signal: ctrl.signal });
    const text = await res.text().catch(() => "");
    return { status: res.status, text };
  } catch {
    return { status: null, text: "" };
  } finally {
    clearTimeout(timer);
  }
}

/** Impure shell: discover published guides, fetch the live site (retrying for CDN
 *  propagation lag after a fresh deploy), and diagnose. Retries only while something is
 *  still wrong — a green first attempt returns immediately. */
export async function checkLive(opts = {}) {
  const {
    base = DEFAULT_BASE,
    guidesDir = GUIDES_DIR,
    fetchImpl = globalThis.fetch,
    retries = 4, // 5 attempts total
    delayMs = 20000, // ~20s between tries: Pages' edge cache settles inside a couple of minutes
    timeoutMs = 15000,
    log = () => {},
    sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
  } = opts;

  const bust = () => `?t=${Date.now()}`;
  const expected = discoverPublishedSlugs(guidesDir);
  if (expected.length === 0) return { ok: true, problems: [], expected, base };

  let result = { ok: false, problems: [] };
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      log(`[verify-live] attempt ${attempt} of ${retries} found problems — waiting ${Math.round(delayMs / 1000)}s for propagation…`);
      await sleep(delayMs);
    }
    const home = await fetchOnce(`${base}/${bust()}`, fetchImpl, timeoutMs);
    const guideStatus = {};
    for (const slug of expected) {
      const g = await fetchOnce(`${base}/guides/${slug}/${bust()}`, fetchImpl, timeoutMs);
      guideStatus[slug] = g.status;
    }
    result = diagnose(expected, { homepageHtml: home.text || (home.status === 200 ? " " : null), guideStatus });
    if (result.ok) break;
  }
  return { ...result, expected, base };
}

function isMain(moduleUrl) {
  return process.argv[1] != null && moduleUrl === pathToFileURL(process.argv[1]).href;
}

if (isMain(import.meta.url)) {
  const baseFlag = process.argv.indexOf("--base");
  const base = baseFlag !== -1 ? process.argv[baseFlag + 1] : process.env.SITE_BASE_URL || DEFAULT_BASE;

  const { ok, problems, expected } = await checkLive({ base, log: (m) => console.log(m) });

  if (expected.length === 0) {
    console.log("[verify-live] no published guides to check — nothing to verify");
    process.exit(0);
  }
  console.log(`[verify-live] checked ${expected.length} published guide(s) against ${base}: ${expected.join(", ")}`);
  if (ok) {
    console.log("[verify-live] OK — every published guide is live and linked from the homepage");
    process.exit(0);
  }
  console.error("[verify-live] FAIL — the live site does not match what the repo says is published:");
  for (const p of problems) console.error(`  · ${p.slug}: ${p.detail}`);
  console.error("[verify-live] a guide is published in the repo but not actually reachable/visible on the live site.");
  process.exit(1);
}
