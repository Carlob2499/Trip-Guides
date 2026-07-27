// Build the Living Atlas design-study page (docs/PLAN_VISUAL_REDESIGN.md's mock-ups).
// The rendered file embeds ~1.2 MB of fonts + photos as data URIs, so it is NOT committed
// (repo doctrine: nothing heavy enters the repo) — rebuild it on demand:
//
//   node docs/mockups/build-mockup.mjs   →  docs/mockups/living-atlas.html (gitignored)
//
// Fonts come from the repo's own @fontsource packages; photos are the guides' real
// Commons covers at width=900, fetched at build time (same hot-link source the site uses).
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const fontDir = (p) => join(root, "node_modules", "@fontsource-variable", p);

const PHOTOS = {
  "@@KOREA@@": "Gyeonghoeru (Royal Banquet Hall) at Gyeongbokgung Palace, Seoul.jpg",
  "@@DENMARK@@": "Nyhavn-Copenhagen.JPG",
  "@@SEDONA@@": "Cathedral Rock - Sedona AZ-1.jpg",
};
const FONTS = {
  "@@BG@@": fontDir("bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2"),
  "@@LIT@@": fontDir("literata/files/literata-latin-wght-normal.woff2"),
  "@@LITI@@": fontDir("literata/files/literata-latin-wght-italic.woff2"),
  "@@SSM@@": fontDir("spline-sans-mono/files/spline-sans-mono-latin-wght-normal.woff2"),
};

const commons = (file) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=900`;
const toDataUri = (buf, mime) => `data:${mime};base64,${Buffer.from(buf).toString("base64")}`;

let html = readFileSync(join(here, "living-atlas.template.html"), "utf8");
for (const [token, path] of Object.entries(FONTS)) {
  html = html.replaceAll(token, toDataUri(readFileSync(path), "font/woff2"));
}
for (const [token, file] of Object.entries(PHOTOS)) {
  const res = await fetch(commons(file));
  if (!res.ok) throw new Error(`Commons fetch failed (${res.status}): ${file}`);
  html = html.replaceAll(token, toDataUri(await res.arrayBuffer(), "image/jpeg"));
}
const out = join(here, "living-atlas.html");
writeFileSync(out, html);
console.log(`built ${out} (${(html.length / 1024).toFixed(0)} KB)`);
