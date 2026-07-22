// Per-guide palette extraction — the identity engine (docs/MOTION.md, V4).
//
// Each guide's accent is derived from ITS OWN cover photo (guide.cover.file, else its first
// sights photo): fetch a small Commons thumbnail, find the dominant *vibrant* hue with sharp
// (already a dependency — no node-vibrant), then clamp its lightness until it passes the SAME
// contrast floor the zod theme gate enforces (≥3.0:1 against BOTH page grounds — see
// src/content.config.ts). The result is written to src/data/palettes/<slug>.json and COMMITTED —
// the fetch-holidays pattern: network runs here, at generation time, so builds stay offline and
// deterministic. Re-run whenever a guide's cover changes: `npm run extract-palette [-- --slug X]`.
//
// Precedence at render (src/lib/palettes.ts): explicit guide `theme` → extracted palette →
// country accent. A guide with no usable photo simply gets no file → country accent, unchanged.
//
// Contrast + colour math is duplicated locally rather than imported from src/lib/contrast.ts —
// plain-node scripts can't import TS (the documented scripts/audit pattern; check-staleness does
// the same with SHELF_LIFE_DAYS). Keep in sync with content.config.ts if the floor/grounds change.

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { isMain } from "./audit/lib.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GUIDES_DIR = path.join(ROOT, "src", "content", "guides");
const OUT_DIR = path.join(ROOT, "src", "data", "palettes");

// Mirrors content.config.ts — the gate the extracted primary must pass.
const LIGHT_BG = "#e9ebe3";
const DARK_BG = "#14181c";
const MIN_ACCENT_CONTRAST = 3.0;

// ── colour math ──────────────────────────────────────────────────────────────
const hex = (n) => Math.round(n).toString(16).padStart(2, "0");
const rgbToHex = (r, g, b) => `#${hex(r)}${hex(g)}${hex(b)}`;
function hexToRgb(h) {
  const m = /^#?([0-9a-f]{6})$/i.exec(h);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function luminance(r, g, b) {
  const f = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(hexA, hexB) {
  const la = luminance(...hexToRgb(hexA)), lb = luminance(...hexToRgb(hexB));
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return [h, s, l];
}
function hslToHex(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h * 6) % 2) - 1)), m = l - c / 2;
  let [r, g, b] = h < 1 / 6 ? [c, x, 0] : h < 2 / 6 ? [x, c, 0] : h < 3 / 6 ? [0, c, x]
    : h < 4 / 6 ? [0, x, c] : h < 5 / 6 ? [x, 0, c] : [c, 0, x];
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

// Sweep lightness (hue/sat fixed) for a value passing the floor on BOTH grounds.
// Both-grounds passes live in a mid band: dark enough for the cream bg, light
// enough for the ink bg — exactly the "mid-value colour" the zod gate's comment
// prescribes. Prefer values near the extracted lightness.
function gate(h, s, l0) {
  const cand = [];
  for (let l = 0.2; l <= 0.68; l += 0.01) {
    const c = hslToHex(h, s, l);
    if (contrast(c, LIGHT_BG) >= MIN_ACCENT_CONTRAST && contrast(c, DARK_BG) >= MIN_ACCENT_CONTRAST) {
      cand.push({ c, d: Math.abs(l - l0) });
    }
  }
  if (!cand.length) return null;
  cand.sort((a, b) => a.d - b.d);
  return cand[0].c;
}

// ── extraction ───────────────────────────────────────────────────────────────
// Dominant VIBRANT hue — the subject's colour, not the sky's. Quantize into 24 hue
// buckets; a bucket's score is saturation^2.5 × midness × population^0.4 — the
// dampened population exponent (node-vibrant's insight) stops a large, mildly-
// saturated sky/water field from outvoting a small, vivid subject (Nyhavn's facades,
// a palace's dancheong — the things a cover is ABOUT). Skip near-gray + extreme-value
// pixels. Returns [h, s, l] of the winning bucket's saturation-weighted mean.
function dominantVibrant(pixels) {
  const BUCKETS = 24;
  const acc = Array.from({ length: BUCKETS }, () => ({ n: 0, sw: 0, h: 0, s: 0, l: 0 }));
  for (let i = 0; i < pixels.length; i += 3) {
    const [h, s, l] = rgbToHsl(pixels[i], pixels[i + 1], pixels[i + 2]);
    if (s < 0.18 || l < 0.12 || l > 0.92) continue; // gray / crushed / blown
    const b = Math.min(BUCKETS - 1, Math.floor(h * BUCKETS));
    const w = s * s;
    acc[b].n += 1; acc[b].sw += w; acc[b].h += h * w; acc[b].s += s * w; acc[b].l += l * w;
  }
  const ranked = acc
    .filter((a) => a.n > 0)
    .map((a) => {
      const h = a.h / a.sw, s = a.s / a.sw, l = a.l / a.sw;
      return { h, s, l, n: a.n, score: Math.pow(s, 2.5) * (1 - Math.abs(l - 0.5)) * Math.pow(a.n, 0.4) };
    })
    .sort((x, y) => y.score - x.score);
  if (!ranked.length) return null;
  // Sky/water suppression — a deliberate design rule, not a tuning knob: the cyan→blue band
  // (h ≈ 0.45–0.70) is generic to every destination (sky, sea, ponds); the SUBJECT's built
  // colour is what carries place (Nyhavn's brick, a palace's wood). Diagnosed on the real
  // covers: Korea's blue-hour sky is the most saturated thing in its photo (S 0.77, n 824),
  // so no honest vibrancy score can prefer the subject — this rule can. If the best bucket is
  // sky/water AND a sufficiently-present non-sky hue exists (n ≥ 50, s ≥ 0.25), take the best
  // such hue; a photo that genuinely offers nothing else (open ocean) keeps its blue.
  const skyish = (b) => b.h >= 0.45 && b.h <= 0.7;
  const best = ranked[0];
  if (skyish(best)) {
    const subject = ranked.find((b) => !skyish(b) && b.n >= 50 && b.s >= 0.25);
    if (subject) return [subject.h, subject.s, subject.l];
  }
  return [best.h, best.s, best.l];
}

// The same cover pick the hub + masthead make: guide.cover.file, else first sights img.
function coverFileFor(guide) {
  if (guide.cover?.file) return guide.cover.file;
  const flat = [];
  (function walk(secs) { for (const s of secs || []) { if (s?.sections) walk(s.sections); else if (s) flat.push(s); } })(guide.sections);
  for (const s of flat) if (s.type === "sights") for (const it of s.items || []) if (it?.img?.file) return it.img.file;
  return null;
}

async function readGuide(entryName) {
  const p = path.join(GUIDES_DIR, entryName);
  if (entryName.endsWith(".json")) {
    return { slug: entryName.replace(/\.json$/, ""), guide: JSON.parse(await readFile(p, "utf8")) };
  }
  const files = (await readdir(p)).filter((f) => f.endsWith(".json"));
  if (!files.includes("_guide.json")) return null;
  const meta = JSON.parse(await readFile(path.join(p, "_guide.json"), "utf8"));
  const sections = [];
  for (const f of files.filter((f) => f !== "_guide.json").sort()) {
    sections.push(...JSON.parse(await readFile(path.join(p, f), "utf8")));
  }
  return { slug: entryName, guide: { ...meta, sections } };
}

export async function extractFor(slug, guide) {
  const file = coverFileFor(guide);
  if (!file) return { slug, skip: "no cover/sight photo" };
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=320`;
  const res = await fetch(url, { headers: { "user-agent": "waypoint-palette/1.0 (+https://github.com/Carlob2499/Trip-Guides)" } });
  if (!res.ok) return { slug, skip: `thumb fetch ${res.status}` };
  const buf = Buffer.from(await res.arrayBuffer());
  const { data } = await sharp(buf).resize(64, 64, { fit: "inside" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const hsl = dominantVibrant(data);
  if (!hsl) return { slug, skip: "no vibrant hue found (gray image)" };
  const [h, s, l] = hsl;
  const primary = gate(h, Math.min(0.85, Math.max(0.35, s)), l);
  if (!primary) return { slug, skip: "no lightness passes both grounds" };
  const [ph, ps, pl] = rgbToHsl(...hexToRgb(primary));
  const palette = {
    primary,                                   // gated — becomes --accent everywhere
    secondary: hslToHex(ph, ps, Math.max(0.14, pl - 0.14)), // deeper companion (hover/rules)
    accent: hslToHex(h, Math.min(0.9, s), Math.min(0.8, Math.max(0.3, l))), // raw vibrant, decorative only
    source_file: file,
    extracted_on: new Date().toISOString().slice(0, 10),
  };
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, `${slug}.json`), JSON.stringify(palette, null, 2) + "\n");
  return { slug, palette,
    lightRatio: contrast(primary, LIGHT_BG).toFixed(2),
    darkRatio: contrast(primary, DARK_BG).toFixed(2) };
}

if (isMain(import.meta.url)) {
  const argv = process.argv.slice(2);
  const only = argv.includes("--slug") ? argv[argv.indexOf("--slug") + 1] : null;
  const entries = (await readdir(GUIDES_DIR, { withFileTypes: true }))
    .filter((e) => (e.isFile() && e.name.endsWith(".json")) || e.isDirectory())
    .map((e) => e.name);
  for (const name of entries) {
    const g = await readGuide(name);
    if (!g || (only && g.slug !== only)) continue;
    try {
      const r = await extractFor(g.slug, g.guide);
      if (r.skip) console.log(`[palette] ${r.slug} — skipped: ${r.skip}`);
      else console.log(`[palette] ${r.slug} — primary ${r.palette.primary} (light ${r.lightRatio}:1, dark ${r.darkRatio}:1) from ${r.palette.source_file}`);
    } catch (err) {
      console.error(`[palette] ${g.slug} — error: ${err.message} (guide keeps its country accent)`);
    }
  }
}
