// Recompresses the D5 gallery screenshot baselines after `--update-snapshots`. Playwright
// writes fast, fat PNGs (~5.4MB each; ~65MB for the 12-shot theme × mode matrix) — palette
// quantization at 256 colours cuts that to ~25MB. The quantization error is far below the
// suite's 1% maxDiffPixelRatio (verified: the suite passes against quantized baselines), so
// nothing the gate can catch is lost. Run via `npm run baselines:update`, never by hand-editing
// snapshots. Uses astro's own sharp — no new dependency.
import sharp from "sharp";
import { readdirSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";

const dir = "tests/visual/gallery-baselines.spec.ts-snapshots";
let before = 0;
let after = 0;
for (const f of readdirSync(dir).filter((f) => f.endsWith(".png"))) {
  const p = join(dir, f);
  before += statSync(p).size;
  const out = await sharp(p).png({ palette: true, colors: 256, compressionLevel: 9, effort: 10 }).toBuffer();
  writeFileSync(p, out);
  after += out.length;
}
console.log(`baselines: ${(before / 1e6).toFixed(1)}MB -> ${(after / 1e6).toFixed(1)}MB`);
