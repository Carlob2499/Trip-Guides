/* Drop the photograph renditions no built page asks for.

   fetch-media.mjs downloads every image at every width in its ladder, because it runs BEFORE
   the build and cannot know which combinations the pages will actually emit — a cover is asked
   for at four widths, a sight thumbnail at three, and the hub's up-next card at four different
   ones again. Fetching the cross-product is the only way to be sure nothing is missing when
   the pages render.

   The cross-product is also mostly waste: measured on the two shipped guides, 490 renditions
   were produced and 67 were referenced. Shipping the other 423 would put ~27 MB of images into
   dist/ that no reader will ever request, on a site whose whole point is being usable on a
   phone somewhere with bad signal.

   So this runs AFTER the build, when the answer is knowable by reading the html, and deletes
   what nothing points at. The .media-cache/ copies are untouched, so a later build that does
   reference one of them still costs no network.

   Order matters: this must run before check-media-local.mjs, so that gate verifies what is
   actually being shipped rather than what was downloaded. */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIST = fileURLToPath(new URL("../dist", import.meta.url));
const MEDIA = path.join(DIST, "media");

if (!fs.existsSync(MEDIA)) {
  console.log("[prune-media] no dist/media — nothing to prune.");
  process.exit(0);
}

function html(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) html(p, out);
    else if (name.endsWith(".html")) out.push(p);
  }
  return out;
}

/* Referenced anywhere in the shipped output, not just in src/srcset: the service worker's
   precache list and the search index are JSON that can name a photograph too, and deleting a
   file the SW promised to cache would break the offline story this product sells. */
const referenced = new Set();
const scan = (text) => {
  for (const m of text.matchAll(/media\/([A-Za-z0-9_-]+\.(?:webp|jpg|png|svg|avif))/g)) referenced.add(m[1]);
};
for (const f of html(DIST)) scan(fs.readFileSync(f, "utf8"));
for (const extra of ["sw.js", path.join("data", "search-index.json")]) {
  const p = path.join(DIST, extra);
  if (fs.existsSync(p)) scan(fs.readFileSync(p, "utf8"));
}

let removed = 0, freed = 0, kept = 0;
for (const name of fs.readdirSync(MEDIA)) {
  const p = path.join(MEDIA, name);
  if (referenced.has(name)) { kept++; continue; }
  freed += fs.statSync(p).size;
  fs.unlinkSync(p);
  removed++;
}

console.log(
  `[prune-media] kept ${kept} rendition(s), removed ${removed} unreferenced ` +
  `(${(freed / 1048576).toFixed(1)} MB freed from dist).`,
);
