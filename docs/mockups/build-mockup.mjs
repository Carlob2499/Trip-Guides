// Build the Living Atlas design-study page (docs/PLAN_VISUAL_REDESIGN.md's mock-ups).
// The rendered file embeds ~1.2 MB of fonts + photos as data URIs, so it is NOT committed
// (repo doctrine: nothing heavy enters the repo) — rebuild it on demand:
//
//   node docs/mockups/build-mockup.mjs   →  docs/mockups/living-atlas.html (gitignored)
//
// Fonts come from the repo's own @fontsource packages; photos are the guides' real
// Commons covers at width=900, fetched at build time (same hot-link source the site uses).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
// Shipped faces come from the repo's node_modules; the Field Edition proposal faces
// (Fraunces, Courier Prime) are not (yet) dependencies, so they resolve from the local
// cache and fall back to a jsdelivr fetch of the same fontsource files.
const FONTS = {
  "@@BG@@": fontDir("bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2"),
  // "standard" variant = wght + opsz — the optical axis is the Quiet Edition's display voice
  "@@LIT@@": fontDir("literata/files/literata-latin-standard-normal.woff2"),
  "@@LITI@@": fontDir("literata/files/literata-latin-standard-italic.woff2"),
  "@@SSM@@": fontDir("spline-sans-mono/files/spline-sans-mono-latin-wght-normal.woff2"),
};
const REMOTE_FONTS = {
  "@@SS3@@": "@fontsource-variable/source-sans-3/files/source-sans-3-latin-wght-normal.woff2",
  "@@FRA@@": "@fontsource-variable/fraunces/files/fraunces-latin-full-normal.woff2",
  "@@CP4@@": "@fontsource/courier-prime/files/courier-prime-latin-400-normal.woff2",
};

const commons = (file) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=900`;
const toDataUri = (buf, mime) => `data:${mime};base64,${Buffer.from(buf).toString("base64")}`;

let html = readFileSync(join(here, "living-atlas.template.html"), "utf8");
for (const [token, path] of Object.entries(FONTS)) {
  html = html.replaceAll(token, toDataUri(readFileSync(path), "font/woff2"));
}
const cacheDirEarly = join(here, ".cache");
mkdirSync(cacheDirEarly, { recursive: true });
for (const [token, pkgPath] of Object.entries(REMOTE_FONTS)) {
  const cached = join(cacheDirEarly, pkgPath.replace(/[^\w.-]+/g, "_"));
  let bytes;
  if (existsSync(cached)) {
    bytes = readFileSync(cached);
  } else {
    const res = await fetch(`https://cdn.jsdelivr.net/npm/${pkgPath}`);
    if (!res.ok) throw new Error(`font fetch failed (${res.status}): ${pkgPath}`);
    bytes = Buffer.from(await res.arrayBuffer());
    writeFileSync(cached, bytes);
  }
  html = html.replaceAll(token, toDataUri(bytes, "font/woff2"));
}
// Commons rate-limits repeat fetches (429), so fetched photos are cached locally
// (docs/mockups/.cache, gitignored) and reused on later builds.
const cacheDir = join(here, ".cache");
mkdirSync(cacheDir, { recursive: true });
for (const [token, file] of Object.entries(PHOTOS)) {
  const cached = join(cacheDir, file.replace(/[^\w.-]+/g, "_"));
  let bytes;
  if (existsSync(cached)) {
    bytes = readFileSync(cached);
  } else {
    const res = await fetch(commons(file));
    if (!res.ok) throw new Error(`Commons fetch failed (${res.status}): ${file}`);
    bytes = Buffer.from(await res.arrayBuffer());
    writeFileSync(cached, bytes);
  }
  html = html.replaceAll(token, toDataUri(bytes, "image/jpeg"));
}
const out = join(here, "living-atlas.html");
writeFileSync(out, html);
console.log(`built ${out} (${(html.length / 1024).toFixed(0)} KB)`);
