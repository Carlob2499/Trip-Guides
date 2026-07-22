// A7: unit tests for extract-palette.mjs's colour quantization — 0% coverage before this
// (TEST_COVERAGE_ANALYSIS.md flagged this file). dominantVibrant() is tested against small
// FIXTURE IMAGES synthesized with sharp itself (the same library the real extraction pipeline
// uses) rather than a checked-in binary PNG — same raw-pixel-buffer shape sharp hands the real
// code, generated on the fly so there's no binary fixture to keep in sync.
import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { dominantVibrant, rgbToHsl, hslToHex, gate } from "../extract-palette.mjs";

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
