// Vitest scope: src unit tests (.test.ts) + pipeline-script contract tests
// (scripts .test.mjs — e.g. the intake-schema vs issue-form drift guard).
// tests/visual/ is Playwright's — the include globs deliberately exclude it so
// vitest doesn't swallow the .spec.ts there and fail on @playwright/test.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.mjs"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["src/**/*.{ts,js}", "scripts/**/*.{mjs,ts}"],
      exclude: ["**/*.test.*", "**/mocks/**", "**/*.d.ts"],
      // Deliberately NOT a single repo-wide number: src/scripts/**, src/features/*/ui/**,
      // and the DOM-glue half of the sealed-silo pattern (CLAUDE.md) are untested by
      // design (they're plain-DOM IIFEs read via the browser, not unit-testable as-is;
      // Playwright covers some of their behavior instead — see tests/visual/). A blanket
      // threshold would either sit near-zero (useless) or force fake tests on that glue.
      // Instead, gate only the pure-logic core the project actually invests in: every
      // feature's model/ silo and src/lib/. Numbers sit a few points under what's
      // currently measured (see docs/TEST_COVERAGE_ANALYSIS.md) — real regression gates,
      // not aspirational targets that break the build on day one.
      thresholds: {
        "src/lib/**": { statements: 90, branches: 80, functions: 95, lines: 95 },
        "src/features/*/model/**": { statements: 90, branches: 80, functions: 90, lines: 95 },
        "scripts/audit/lib.mjs": { statements: 65, branches: 65, functions: 60, lines: 65 },
      },
    },
  },
});
