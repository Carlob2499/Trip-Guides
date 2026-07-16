/* Vitest scope: unit tests only (src/**). tests/visual/ is Playwright's —
   vitest's default glob would otherwise swallow the *.spec.ts there and fail
   on the @playwright/test import. */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
});
