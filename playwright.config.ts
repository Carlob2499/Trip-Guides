/* Playwright harness for the site's behavioral + accessibility E2E specs (tests/visual/).
   The screenshot-diff suite that used to live here was removed — it failed on every intentional
   visual change, which is exactly the wrong signal. What remains is real-behavior coverage: the
   axe accessibility gate (a11y.spec.ts, CI-gated via .github/workflows/a11y.yml) plus behavioral
   specs (sos, offline, share-panel, itinerary, route-opt, overture, field-tools) run locally with
   `npm run test:e2e`. Deterministic by construction: fixed clock, external requests blocked (see
   each spec). Runs against `astro preview` on :4322 — the ONLY trusted preview per CLAUDE.md
   (OneDrive HMR serves stale CSS on `astro dev`). CI builds first; locally run `npm run build`
   before `npm run test:e2e`. */
import { defineConfig, chromium } from "@playwright/test";
import { existsSync } from "node:fs";

/* Browser resolution — why this exists.
   Playwright pins an exact browser REVISION per release (1.61.1 wants chromium r1228) and
   refuses to launch anything else it manages. Sandboxes and CI images commonly pre-bake a
   DIFFERENT revision at PLAYWRIGHT_BROWSERS_PATH and block the download that would fix it, so
   `npx playwright test` dies with "Executable doesn't exist … run npx playwright install" even
   though a perfectly good Chromium is sitting right there. That is exactly what happened here:
   the image ships r1194 (Chromium 141), the toolchain wanted r1228, and the a11y gate could not
   be run at all without hand-building a throwaway config — so a whole class of visual
   verification silently stopped being possible.

   Downgrading @playwright/test to match one image's pre-baked browser would hold the test
   framework back everywhere to suit one environment. Instead: use the managed browser whenever
   it is actually installed (CI always, any dev who ran `playwright install`), and fall back to a
   pre-installed binary ONLY when the managed one is genuinely absent.

   Explicit over ambient (CLAUDE.md Boundary Check #4): PW_CHROMIUM_PATH overrides everything, so
   a new environment is one env var away rather than a config edit. */
function resolveChromium(): string | undefined {
  const explicit = process.env.PW_CHROMIUM_PATH;
  if (explicit) return existsSync(explicit) ? explicit : undefined;
  try {
    // Throws (or points at a missing file) when this Playwright's own browser isn't installed.
    if (existsSync(chromium.executablePath())) return undefined; // managed browser wins
  } catch { /* not installed — fall through to the pre-installed candidates */ }
  return [
    "/opt/pw-browsers/chromium",                 // this image: symlink → chrome-linux/chrome
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
  ].find((p) => existsSync(p));
}
const chromiumPath = resolveChromium();

export default defineConfig({
  testDir: "tests/visual",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:4322",
    ...(chromiumPath ? { launchOptions: { executablePath: chromiumPath } } : {}),
  },
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
