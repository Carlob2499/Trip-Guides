import { defineConfig } from "@playwright/test";
import rootConfig from "../../playwright.config";

/* Focused local loop for the sync proof. The installed Astro preview command is managed by the
   desktop runtime and returns after starting its background server, while Playwright's webServer
   contract expects a foreground process. Keep the production-preview origin and the repository's
   Chromium resolution, but let the caller start that managed preview before this focused run. */
export default defineConfig({
  testDir: ".",
  testMatch: "offline-sync.spec.ts",
  timeout: rootConfig.timeout,
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: rootConfig.use,
});
