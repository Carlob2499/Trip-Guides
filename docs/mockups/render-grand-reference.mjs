import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, "grand-reference.html");
const outDir = join(here, ".generated");
await mkdir(outDir, { recursive: true });

const captures = [
  ["atlas-desktop.png", "atlas", { width: 1440, height: 1000 }],
  ["trip-desktop.png", "trip", { width: 1440, height: 1000 }],
  ["itinerary-desktop.png", "itinerary", { width: 1440, height: 1000 }],
  ["guide-desktop.png", "guide", { width: 1440, height: 1000 }],
  ["search-desktop.png", "search", { width: 1440, height: 1000 }],
  ["builder-desktop.png", "builder", { width: 1440, height: 1000 }],
  ["itinerary-mobile.png", "itinerary-mobile", { width: 430, height: 920 }],
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
    await page.screenshot({
      path: join(outDir, file),
      fullPage: false,
      animations: "disabled",
    });
    await page.close();
    console.log(`rendered ${file}`);
  }
} finally {
  await browser.close();
}
