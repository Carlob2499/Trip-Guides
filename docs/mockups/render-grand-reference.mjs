import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, "grand-reference.html");
const outDir = join(here, ".generated");
await mkdir(outDir, { recursive: true });

// These are D7 EVOLUTION captures, not replacements for the named approved mockup lineage.
// See CANONICAL_MOCKUP_LINEAGE.md before evaluating or implementing any surface.
const captures = [
  ["atlas-desktop.png", "atlas-desktop", { width: 1440, height: 900 }],
  ["trip-desktop.png", "trip-desktop", { width: 1440, height: 900 }],
  ["itinerary-desktop.png", "itinerary-desktop", { width: 1440, height: 900 }],
  ["guide-desktop.png", "guide-desktop", { width: 1440, height: 900 }],
  ["search-desktop.png", "search-desktop", { width: 1440, height: 900 }],
  ["builder-desktop.png", "builder-desktop", { width: 1440, height: 900 }],
  ["split-desktop.png", "split-desktop", { width: 1440, height: 900 }],
  ["itinerary-mobile.png", "itinerary-mobile", { width: 430, height: 900 }],
  ["sos-mobile.png", "sos-mobile", { width: 430, height: 900 }],
];

const browser = await chromium.launch({ headless: true });
try {
  for (const [file, scene, viewport] of captures) {
    const page = await browser.newPage({
      viewport,
      deviceScaleFactor: 1,
      colorScheme: "light",
      reducedMotion: "no-preference",
    });
    const url = new URL(pathToFileURL(source));
    url.searchParams.set("scene", scene);
    await page.goto(url.href, { waitUntil: "load" });
    await page.screenshot({ path: join(outDir, file), fullPage: false, animations: "disabled" });
    await page.close();
    console.log(`rendered ${file}`);
  }
} finally {
  await browser.close();
}
