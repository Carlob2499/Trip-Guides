/* Pull every guide photograph into the build instead of hotlinking it at read time.

   THE DEFECT THIS FIXES. Every image a guide shows — covers, chapter cards, sight and venue
   thumbnails — was fetched from commons.wikimedia.org by the reader's browser, at the moment
   they opened the page. Measured on a shipped Korea guide: 12 of 12 image requests went to
   Commons and 8 came back with nothing. Wikimedia throttles and 403s hotlinking, which is its
   right, so the failure is intermittent by design: fine on one load, three blank chapter cards
   on the next, and reliably blank in CI, where the screenshot gates have been photographing an
   imageless site for their whole existence. For a product whose premise is working in the field
   on a phone, depending on someone else's CDN at read time is the wrong dependency to have.

   WHY THE ORIGINAL CHOICE WAS REASONABLE. SightsBlock.astro says it plainly: this avoids
   "build-time HTTP fetches (and Wikimedia 429 rate-limits)". That concern is real and this
   script is built around it rather than through it:

     · a persistent cache (.media-cache/, gitignored) means a repeat build does ZERO network,
       so the rate limit is met once per new photo rather than once per build;
     · requests are sequential with a delay and carry a descriptive User-Agent, which is what
       Wikimedia's own policy asks of automated clients;
     · every failure is non-fatal. A photo that will not download is simply absent from the
       manifest, and src/lib/media.ts then serves the remote URL exactly as before.

   So the worst case of this script is the behaviour we had before it, and the normal case is a
   self-hosted image. It moves a failure the READER sees and cannot fix to one the BUILD sees
   and can retry.

   RE-ENCODING. The originals come back as full-quality JPEG/PNG: 44 MB across the ladder on
   the two shipped guides, which is the wrong payload for a product meant to work on a phone in
   a foreign country. Everything raster is re-encoded to WebP at q78, which is visually
   indistinguishable at these sizes and roughly a fifth of the bytes. SVG passes through
   untouched — it is already small and rasterising it would be a downgrade.

   WHAT IT DOES NOT DO. It does not commit images. public/media/ is gitignored: the repo stays
   light, which is the same principle content.config.ts states for cover video ("nothing heavy
   enters the repo"). The files are produced at build time and land in dist/. */

import { createHash } from "node:crypto";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const GUIDES = path.join(ROOT, "src", "content", "guides");
const OUT_DIR = path.join(ROOT, "public", "media");
const CACHE = path.join(ROOT, ".media-cache");
const MANIFEST = path.join(ROOT, "src", "lib", "media-manifest.json");

/* Every width the call sites actually ask for, and nothing else — inventing a rendition no
   page requests would download bytes nobody shows. This list was read off the code, not
   guessed: index.astro's two srcsetWidths ladders, SightsBlock's 480/800/1200, the masthead's
   480/800/1200/1600, and the 320 thumbnails.

   It is a hardcoded list mirroring code elsewhere, which is exactly the kind of thing that
   drifts silently — so it is not trusted. scripts/check-media-local.mjs greps the BUILT html
   for any image still pointing at Commons and fails the build, which turns a missed width into
   a red gate instead of a photograph that quietly goes back to being someone else's problem. */
const WIDTHS = [44, 56, 88, 112, 224, 320, 448, 480, 640, 800, 896, 960, 1200, 1600];

/* Wikimedia asks automated clients to identify themselves and give a contact route. An
   anonymous scraper UA is exactly what its throttling is aimed at. */
const UA = "WaypointTripGuides/1.0 (build-time image fetch; https://github.com/Carlob2499/Trip-Guides)";
const DELAY_MS = 250;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function walkJson(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) out.push(...walkJson(p));
    else if (name.endsWith(".json")) out.push(p);
  }
  return out;
}

/* Every shape that carries a photo, found structurally rather than by key name: anything with
   a `file` (Commons) or a `src` (a CDN URL) is an image reference wherever it appears. That
   way a new block type with an image slot is covered the day it is added, with no edit here. */
function collectRefs(node, into) {
  if (Array.isArray(node)) { for (const v of node) collectRefs(v, into); return; }
  if (!node || typeof node !== "object") return;
  const file = typeof node.file === "string" ? node.file : null;
  const src = typeof node.src === "string" && node.src.startsWith("https://") ? node.src : null;
  if (file) into.add(JSON.stringify({ kind: "commons", ref: file }));
  else if (src && !/\.(mp4|webm|mov)(\?|$)/i.test(src)) into.add(JSON.stringify({ kind: "direct", ref: src }));
  for (const v of Object.values(node)) collectRefs(v, into);
}

const remoteUrl = ({ kind, ref }, w) =>
  kind === "commons"
    ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(ref)}?width=${w}`
    : ref.includes("{w}") ? ref.replace(/\{w\}/g, String(w)) : ref;

const extFor = (ct, url) => {
  if (/jpeg|jpg/i.test(ct)) return ".jpg";
  if (/png/i.test(ct)) return ".png";
  if (/webp/i.test(ct)) return ".webp";
  if (/avif/i.test(ct)) return ".avif";
  if (/svg/i.test(ct)) return ".svg";
  const m = url.match(/\.(jpe?g|png|webp|avif|svg)(?:\?|$)/i);
  return m ? `.${m[1].toLowerCase().replace("jpeg", "jpg")}` : ".jpg";
};

async function main() {
  const refs = new Set();
  for (const f of walkJson(GUIDES)) {
    try { collectRefs(JSON.parse(fs.readFileSync(f, "utf8")), refs); }
    catch { /* a malformed guide is the content gate's problem, not this script's */ }
  }
  const list = [...refs].map((s) => JSON.parse(s));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(CACHE, { recursive: true });

  const manifest = {};
  let fetched = 0, cached = 0, failed = 0, bytes = 0;

  for (const ref of list) {
    for (const w of WIDTHS) {
      const url = remoteUrl(ref, w);
      // A single-size direct URL is the same file at every width — fetch it once.
      if (ref.kind === "direct" && !ref.ref.includes("{w}") && w !== WIDTHS[0]) continue;
      const key = createHash("sha1").update(url).digest("hex").slice(0, 16);
      const cachedMeta = path.join(CACHE, `${key}.json`);

      let ext, buf;
      if (fs.existsSync(cachedMeta)) {
        const meta = JSON.parse(fs.readFileSync(cachedMeta, "utf8"));
        const blob = path.join(CACHE, `${key}${meta.ext}`);
        if (fs.existsSync(blob)) { ext = meta.ext; buf = fs.readFileSync(blob); cached++; }
      }

      if (!buf) {
        try {
          await sleep(DELAY_MS);
          const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "image/*" }, redirect: "follow" });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const ct = res.headers.get("content-type") || "";
          if (!/^image\//i.test(ct)) throw new Error(`not an image: ${ct}`);
          const raw = Buffer.from(await res.arrayBuffer());
          const srcExt = extFor(ct, url);
          if (srcExt === ".svg") {
            buf = raw; ext = ".svg";
          } else {
            /* `withoutEnlargement` matters: Commons returns the ORIGINAL when the file is
               narrower than the requested width, and upscaling it here would spend bytes
               inventing detail the photograph does not have. */
            buf = await sharp(raw).resize({ width: w, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
            ext = ".webp";
          }
          fs.writeFileSync(path.join(CACHE, `${key}${ext}`), buf);
          fs.writeFileSync(cachedMeta, JSON.stringify({ ext, url }));
          fetched++;
        } catch (err) {
          /* Non-fatal, always. The manifest simply will not carry this URL and media.ts serves
             the remote one — the exact behaviour that shipped before this script existed. */
          failed++;
          console.warn(`[fetch-media] skip ${url.slice(0, 88)} — ${err.message}`);
          continue;
        }
      }

      const outName = `${key}${ext}`;
      fs.writeFileSync(path.join(OUT_DIR, outName), buf);
      manifest[url] = `media/${outName}`;
      bytes += buf.length;
    }
  }

  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  const mb = (bytes / 1048576).toFixed(1);
  console.log(
    `[fetch-media] ${Object.keys(manifest).length} rendition(s) local (${mb} MB) · ` +
    `${fetched} fetched, ${cached} from cache, ${failed} left remote`,
  );
}

await main();
