/* Visual-regression harness (convergence Phase 2). Screenshots of the built site
   diffed against committed baselines — catches the class of bug unit tests
   structurally can't (layout collapse, colour collisions, motion regressions;
   WayPoint-V2's retrospective counted five). Deterministic by construction:
   fixed clock, external requests blocked, animations disabled (see the spec).
   Runs against `astro preview` on :4322 — the ONLY trusted preview per CLAUDE.md
   (OneDrive HMR serves stale CSS on `astro dev`). CI builds first; locally run
   `npm run build` before `npm run test:visual`. */
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/visual",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  expect: {
    toHaveScreenshot: {
      // Tolerate antialiasing/font-raster drift across machines, not layout drift.
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    },
  },
  use: { baseURL: "http://localhost:4322" },
  webServer: {
    command: "npm run preview",
    port: 4322,
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
