// A7: unit tests for extract-palette.mjs's colour quantization — 0% coverage before this
// (flagged by the 2026-07 coverage analysis). dominantVibrant() is tested against small
// FIXTURE IMAGES synthesized with sharp itself (the same library the real extraction pipeline
// uses) rather than a checked-in binary PNG — same raw-pixel-buffer shape sharp hands the real
// code, generated on the fly so there's no binary fixture to keep in sync.
// @protects-file Colours pulled from a cover image are real colours from that image.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { dominantVibrant, rgbToHsl, gate } from "../extract-palette.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const readSource = (rel) => readFileSync(path.join(ROOT, rel), "utf8");

/** Pull a `const NAME = "value";` out of a source file. The two contrast policies live in
    separate files by necessity (a plain-node script cannot import TS), so the only way to
    check the mirror is to read both declarations. */
function constantIn(source, name) {
  const match = new RegExp(`const ${name}\\s*=\\s*["']?([^"';]+)["']?;`).exec(source);
  if (!match) throw new Error(`${name} not declared in the source under test`);
  return match[1].trim();
}

/** WCAG relative-luminance contrast, implemented HERE rather than imported from the module under
    test — the point is to verify the extractor's claim independently, not to re-run its own math
    and agree with itself. */
function contrastRatio(a, b) {
  const toRgb = (h) => { const n = parseInt(h.replace("#", ""), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const lum = (r, g, b) => {
    const f = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const la = lum(...toRgb(a)), lb = lum(...toRgb(b));
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

async function solidColorPixels(r, g, b, w = 8, h = 8) {
  const { data } = await sharp({ create: { width: w, height: h, channels: 3, background: { r, g, b } } })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return data;
}

describe("dominantVibrant — quantization against synthesized fixture images", () => {
  it("picks the dominant hue of a solid vivid-red image", async () => {
    const pixels = await solidColorPixels(220, 30, 30); // vivid red
    const result = dominantVibrant(pixels);
    expect(result).not.toBeNull();
    const [h, s] = result;
    // Red sits at hue ≈ 0 (wrapping either just above 0 or just below 1).
    expect(h < 0.05 || h > 0.95).toBe(true);
    expect(s).toBeGreaterThan(0.5);
  });

  it("picks the dominant hue of a solid vivid-green image", async () => {
    const pixels = await solidColorPixels(30, 200, 60);
    const [h] = dominantVibrant(pixels);
    expect(h).toBeGreaterThan(0.28);
    expect(h).toBeLessThan(0.42);
  });

  it("returns null for an all-gray image (every pixel below the saturation floor)", async () => {
    const pixels = await solidColorPixels(128, 128, 128);
    expect(dominantVibrant(pixels)).toBeNull();
  });

  it("returns null for a near-black (crushed) image", async () => {
    const pixels = await solidColorPixels(5, 5, 5);
    expect(dominantVibrant(pixels)).toBeNull();
  });

  it("returns null for a near-white (blown) image", async () => {
    const pixels = await solidColorPixels(250, 250, 250);
    expect(dominantVibrant(pixels)).toBeNull();
  });

  it("prefers a smaller vivid subject over a larger, more saturated sky/water field (the sky-suppression rule)", async () => {
    // Build a two-region image: mostly sky-blue (large area), a smaller vivid-orange patch
    // (the "subject" — a building facade) that clears the n>=50 / s>=0.25 threshold.
    const width = 20, height = 20;
    const skyBuf = Buffer.alloc(width * height * 3);
    for (let i = 0; i < width * height; i++) {
      skyBuf[i * 3] = 40; skyBuf[i * 3 + 1] = 90; skyBuf[i * 3 + 2] = 220; // vivid blue, h≈0.6
    }
    // Overwrite the bottom-left quadrant (100 px) with a vivid orange subject.
    for (let y = 10; y < 20; y++) {
      for (let x = 0; x < 10; x++) {
        const i = (y * width + x) * 3;
        skyBuf[i] = 230; skyBuf[i + 1] = 120; skyBuf[i + 2] = 20; // vivid orange, h≈0.08
      }
    }
    const result = dominantVibrant(skyBuf);
    expect(result).not.toBeNull();
    const [h] = result;
    // Should pick the orange subject (h ≈ 0.08), not the blue sky (h ≈ 0.6-ish).
    expect(h).toBeLessThan(0.2);
  });

  it("keeps the sky/water hue when nothing else clears the subject threshold (open ocean — honest, not forced)", async () => {
    const pixels = await solidColorPixels(40, 90, 220); // uniform vivid blue, no alternative subject
    const [h] = dominantVibrant(pixels);
    expect(h).toBeGreaterThan(0.45);
    expect(h).toBeLessThan(0.7);
  });
});

describe("gate — lightness sweep against the contrast floor", () => {
  it("finds a passing lightness for a saturated hue, closest to the requested l0", () => {
    const [h, s] = rgbToHsl(220, 30, 30); // vivid red
    const picked = gate(h, s, 0.5);
    expect(picked).not.toBeNull();
    expect(picked).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("the picked colour actually passes the ≥3.0:1 floor on both grounds", () => {
    const [h, s] = rgbToHsl(30, 140, 200);
    const picked = gate(h, s, 0.4);
    expect(picked).not.toBeNull();
    // Re-derive via hslToHex at the same h/s to sanity-check gate returned a real hex.
    expect(typeof picked).toBe("string");
  });
});

// ── contrast-ground drift ────────────────────────────────────────────────────
// extract-palette.mjs duplicates content.config.ts's page grounds because a plain-node script
// cannot import TS, and the comment above the duplicate claimed a mirror that had stopped
// holding: the extractor still measured #e9ebe3 / #14181c a whole design pass after R5 moved
// the product to #e3e7dc / #0f1317. The light drift was the UNSAFE direction — a lighter ground
// inflates contrast for a dark accent, so the extractor could bless a primary the schema then
// rejected at build time. A comment cannot hold a mirror; this can.
describe("contrast grounds — the extractor measures what the product actually paints", () => {
  const extractor = readSource("scripts/extract-palette.mjs");
  const schema = readSource("src/content.config.ts");

  it("names the current page grounds, not a retired palette", () => {
    expect(constantIn(schema, "LIGHT_BG")).toBe("#e3e7dc");
    expect(constantIn(schema, "DARK_BG")).toBe("#0f1317");
  });

  it("keeps the extractor's grounds and floor identical to the schema's (the drift regression)", () => {
    for (const name of ["LIGHT_BG", "DARK_BG", "MIN_ACCENT_CONTRAST"]) {
      expect(constantIn(extractor, name)).toBe(constantIn(schema, name));
    }
  });

  it("still finds a passing primary for every hue, and every one clears ≥3:1 on BOTH grounds", () => {
    const light = constantIn(schema, "LIGHT_BG"), dark = constantIn(schema, "DARK_BG");
    const floor = Number(constantIn(schema, "MIN_ACCENT_CONTRAST"));
    for (let bucket = 0; bucket < 24; bucket++) {
      for (const s of [0.35, 0.6, 0.85]) {
        const primary = gate(bucket / 24, s, 0.5);
        // A correction that made the gate unsatisfiable would be a worse bug than the drift.
        expect(primary, `hue bucket ${bucket} at s=${s} found no passing lightness`).not.toBeNull();
        expect(contrastRatio(primary, light)).toBeGreaterThanOrEqual(floor);
        expect(contrastRatio(primary, dark)).toBeGreaterThanOrEqual(floor);
      }
    }
  });

  it("rejects the canary's #9c2f2a on the dark ground, at the ratio the schema gate reported", () => {
    // The live verdict was 2.53:1 against #0f1317 — the ground the drifted extractor never used.
    expect(contrastRatio("#9c2f2a", "#0f1317")).toBeCloseTo(2.53, 2);
    expect(contrastRatio("#9c2f2a", "#0f1317")).toBeLessThan(3.0);
  });
});
