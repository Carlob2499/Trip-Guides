/* Playwright harness for the site's behavioral + accessibility E2E specs (tests/visual/).
   The screenshot-diff suite that used to live here was removed — it failed on every intentional
   visual change, which is exactly the wrong signal. What remains is real-behavior coverage: the
   axe accessibility gate (a11y.spec.ts, CI-gated via .github/workflows/a11y.yml) plus behavioral
   specs (sos, offline, share-panel, itinerary, route-opt, overture, field-tools) run locally with
   `npm run test:e2e`. Deterministic by construction: fixed clock, external requests blocked (see
   each spec). Runs against `astro preview` on :4322 — the ONLY trusted preview per CLAUDE.md
   (OneDrive HMR serves stale CSS on `astro dev`). CI builds first; locally run `npm run build`
   before `npm run test:e2e`. */
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/visual",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: "http://localhost:4322" },
  webServer: {
    // The port MUST be passed: `astro preview` defaults to 4321, so a bare `npm run preview`
    // serves 4321 while Playwright waits on 4322 and times out. The bug hid because
    // reuseExistingServer:true silently reused whatever preview a dev already had open on
    // 4322 — green locally, dead in CI, which is exactly backwards.
    command: "npm run preview -- --port 4322",
    port: 4322,
    // Locally: reuse a dev's running :4322 preview. In CI: always start a clean one, so a run
    // can never pass because of a foreign server (or fail because of a stale one).
    reuseExistingServer: !process.env.CI,
    // A cold CI box has to boot astro preview from scratch; 30s was tight enough to flake.
    timeout: 120_000,
  },
});
