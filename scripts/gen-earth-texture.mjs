// Earth texture generator — rasterizes the VENDORED countries-110m.json into the equirectangular
// maps the WebGL globe samples (src/features/atlas/ui/globe-gl.js).
//
// Why generate instead of shipping a photo: the offline rule (D18) forbids the globe reaching a
// CDN, and a real NASA Blue Marble tile is both a licence question and ~8 MB. The topology is
// ALREADY vendored for the d3 fallback globe, so the same 110m land geometry that draws the
// canvas globe also bakes these textures — one source of truth for the coastline, and nothing
// new enters the repo that a reader has to download.
//
// Why SVG -> sharp instead of a canvas library: sharp is already a dependency (image pipeline)
// and renders SVG through librsvg. Adding node-canvas for two build-time PNGs would be a new
// native dependency for something the existing one already does.
//
// Emits, into public/textures/:
//   earth-map.webp   colour — ocean gradient + land, in the frame register's dark palette
//   earth-mask.webp  land mask, R = land — the shader uses it for specular (ocean reflects,
//                    land does not) and for the night-side glow falloff
//
// Run: node scripts/gen-earth-texture.mjs   (wired into prebuild; skips when both are current)

import { readFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { geoPath, geoEquirectangular } from "d3-geo";
import * as topojson from "topojson-client";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "public/data/countries-110m.json");
const OUT = join(ROOT, "public/textures");

/* 2:1 equirectangular. 4096 wide is the point where the 110m coastline stops being the limiting
   factor — the geometry is simplified to ~50 km, so more pixels only sharpen the simplification's
   own corners. Both maps ship as WebP: ~180 KB for the pair against ~1.4 MB of PNG, and every
   browser that can run WebGL2 can decode WebP. */
const W = 4096;
const H = 2048;

/* Colours below are the frame register (base.css --frame-*), which is what the globe actually
   sits in. The globe lives inside .spatial and is therefore ALWAYS dark in BOTH site themes, so
   they are literal here rather than themed. Keep them in step if that register moves. */
function build() {
  const topo = JSON.parse(readFileSync(SRC, "utf8"));
  const land = topojson.feature(topo, topo.objects.land);

  const projection = geoEquirectangular()
    .scale(W / (2 * Math.PI))
    .translate([W / 2, H / 2]);
  const path = geoPath(projection);

  const landPath = path(land);
  if (!landPath) throw new Error("gen-earth-texture: land geometry produced an empty path");

  /* COLOUR MAP. The ocean is a vertical gradient (deep at the poles, slightly lifted at the
     equator) so the sphere does not read as one flat fill under the shader's diffuse term. Land
     gets a single token colour plus a hairline lighter coast stroke, which is what keeps the
     continents legible once the sphere curves them away from the camera. */
  const colour = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#060b14"/>
      <stop offset="0.5" stop-color="#0f1f36"/>
      <stop offset="1" stop-color="#060b14"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sea)"/>
  <path d="${landPath}" fill="#31496b" stroke="#48648c" stroke-width="1.2"/>
</svg>`;

  /* MASK. Pure white land on black ocean: the shader reads R as "is land", and uses it to kill
     the specular highlight over continents and to shape the night-side falloff. */
  const mask = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#000"/>
  <path d="${landPath}" fill="#fff"/>
</svg>`;

  mkdirSync(OUT, { recursive: true });
  return Promise.all([
    sharp(Buffer.from(colour)).webp({ quality: 90 }).toFile(join(OUT, "earth-map.webp")),
    sharp(Buffer.from(mask)).webp({ quality: 85 }).toFile(join(OUT, "earth-mask.webp")),
  ]);
}

const outputs = ["earth-map.webp", "earth-mask.webp"].map((f) => join(OUT, f));
const current =
  outputs.every((f) => existsSync(f)) &&
  outputs.every((f) => statSync(f).mtimeMs > statSync(SRC).mtimeMs);

if (current) {
  console.log("[earth-texture] up to date — skipping");
} else {
  await build();
  for (const f of outputs) console.log(`[earth-texture] ${f.replace(ROOT, ".")} — ${(statSync(f).size / 1024).toFixed(0)} KB`);
}
