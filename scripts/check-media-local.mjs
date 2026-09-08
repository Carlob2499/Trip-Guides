/* No shipped page may fetch a photograph from someone else's server at read time.

   scripts/fetch-media.mjs pulls the guide images into the build and src/lib/media.ts swaps the
   URLs. Both are careful and both are quiet about failure on purpose — a photo that will not
   download falls back to the remote URL so a reader still sees something. That fallback is the
   right behaviour and it is also exactly how this whole defect stayed invisible for so long:
   the page still renders, the image still usually appears, and nothing anywhere says that the
   product went back to depending on Wikimedia's willingness to serve a hotlink.

   So the fallback stays and this gate watches it. It reads the BUILT html — the actual bytes a
   reader gets, not the source that produced them — and fails if any src/srcset still points at
   a remote host. The common cause will be a width added at a call site that is missing from
   fetch-media.mjs's ladder, which is unfixable by inspection and obvious from this message.

   Credit links are untouched: `href` to a Commons File: page is attribution, which is required
   and is not a fetch. Only src/srcset count. */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIST = fileURLToPath(new URL("../dist", import.meta.url));

if (!fs.existsSync(DIST)) {
  console.error("[media-local] no dist/ — run `npm run build` first.");
  process.exit(1);
}

function html(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) html(p, out);
    else if (name.endsWith(".html")) out.push(p);
  }
  return out;
}

/* Any absolute http(s) URL sitting in a src or srcset. Data URIs, root-relative paths and the
   site's own origin are all fine; a third-party host is not. */
const ATTR = /\s(?:src|srcset)\s*=\s*"([^"]*)"/gi;
const REMOTE = /https?:\/\/([^/\s,"]+)/g;

/* Hosts a page is allowed to pull media from at read time, each for a stated reason. */
const ALLOWED = new Set([
  // Cover video is hot-linked by curation and capped at ~4 MB (content.config.ts) — it is not
  // in the image pipeline and deliberately never enters the repo or the build.
  "assets.mixkit.co",
  // Map tiles and the Maps JS API are services, not photographs.
  "maps.googleapis.com",
  "maps.gstatic.com",
  "www.openstreetmap.org",
  /* The health page's CI badges. These MUST be fetched live: a cached badge is a picture of a
     build result that may no longer be true, which is worse than no badge at all. */
  "github.com",
]);

const findings = [];
for (const f of html(DIST)) {
  const src = fs.readFileSync(f, "utf8");
  for (const m of src.matchAll(ATTR)) {
    for (const u of m[1].matchAll(REMOTE)) {
      const host = u[1].toLowerCase();
      if (ALLOWED.has(host)) continue;
      findings.push({ file: path.relative(DIST, f), host, url: u[0].slice(0, 100) });
    }
  }
}

if (findings.length) {
  const byHost = {};
  for (const f of findings) (byHost[f.host] ??= []).push(f);
  console.error(`[media-local] FAIL — ${findings.length} image reference(s) still fetch from a remote host at read time:\n`);
  for (const [host, rows] of Object.entries(byHost)) {
    console.error(`  ${host}  (${rows.length})`);
    for (const r of rows.slice(0, 3)) console.error(`    ${r.file}  ${r.url}`);
    if (rows.length > 3) console.error(`    … and ${rows.length - 3} more`);
  }
  console.error(
    "\n  Almost always a width requested at a call site that is missing from WIDTHS in\n" +
    "  scripts/fetch-media.mjs. Add it there and rebuild. If a host genuinely belongs in a\n" +
    "  page at read time, add it to ALLOWED here with the reason — never widen it to make a\n" +
    "  photograph pass.",
  );
  process.exit(1);
}

/* The other direction, and the more dangerous one. A manifest entry claims "this photo is in
   the build" and media.ts rewrites the URL on that promise alone. If the file is not actually
   there — a stale committed manifest, an interrupted fetch, a public/ that was cleaned after
   the manifest was written — the page emits a local path to nothing, and the reader gets a
   blank space with no remote URL to fall back to. That is strictly worse than the hotlinking
   this pipeline replaced, so it is checked rather than assumed. */
const missing = [];
for (const f of html(DIST)) {
  const src = fs.readFileSync(f, "utf8");
  for (const m of src.matchAll(ATTR)) {
    for (const cand of m[1].split(",")) {
      const url = cand.trim().split(/\s+/)[0];
      if (!url.includes("/media/")) continue;
      const rel = url.slice(url.indexOf("/media/") + 1);
      if (!fs.existsSync(path.join(DIST, rel))) missing.push({ file: path.relative(DIST, f), rel });
    }
  }
}
if (missing.length) {
  console.error(`[media-local] FAIL — ${missing.length} page reference(s) point at a media file that is not in the build:
`);
  for (const r of missing.slice(0, 8)) console.error(`  ${r.file}  ->  ${r.rel}`);
  if (missing.length > 8) console.error(`  … and ${missing.length - 8} more`);
  console.error("");
  console.error("  src/lib/media-manifest.json is out of step with public/media/. Re-run");
  console.error("  `node scripts/fetch-media.mjs` and rebuild; the manifest is rewritten from");
  console.error("  what that script actually has on disk, so the two cannot disagree after a");
  console.error("  clean run.");
  process.exit(1);
}

console.log(
  `[media-local] OK — every image in ${html(DIST).length} built page(s) is served from this ` +
  `build, and every local reference resolves to a file that exists.`,
);
