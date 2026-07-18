// Vitest scope: src unit tests (.test.ts) + pipeline-script contract tests
// (scripts .test.mjs — e.g. the intake-schema vs issue-form drift guard).
// tests/visual/ is Playwright's — the include globs deliberately exclude it so
// vitest doesn't swallow the .spec.ts there and fail on @playwright/test.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.mjs"],
  },
});
