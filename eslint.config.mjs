/* ESLint flat config. The config keys here were read off the INSTALLED packages' own exports
   (eslint-plugin-astro exposes configs["flat/recommended"]; typescript-eslint exposes .config /
   .configs), not recalled — a remembered API is a hypothesis, not evidence.

   Scope is deliberate. This repo already had `astro check` for types, Vitest for logic and
   Playwright for behaviour; ESLint is here for the class none of those catch — unused bindings,
   unreachable code, accidental globals, shadowed declarations. It is NOT here to impose a style
   opinion on a mature codebase, so formatting rules stay off and the recommended sets are taken
   as-is rather than curated into something that fails on day one. That follows the standing
   precedent in vitest.config.ts: gates are "real regression gates, not aspirational targets that
   break the build on day one." */
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";
import globals from "globals";

export default tseslint.config(
  {
    /* Build output, caches and vendored assets are not source. .astro/ in particular is a
       generated content cache — linting it reports on code nobody wrote. */
    ignores: ["dist/**", ".astro/**", "node_modules/**", "coverage/**", "worker/dist/**", "**/*.min.js"],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs["flat/recommended"],

  {
    /* Browser-shipped code: the plain-DOM IIFEs in src/scripts and each feature's ui/ layer.
       Without the browser globals, no-undef fires on document/window/localStorage and drowns
       every real finding. */
    files: ["src/**/*.{js,ts}"],
    languageOptions: { globals: { ...globals.browser } },
  },

  {
    /* Node-side: build scripts, the pipeline spine, and everything running under Vitest. */
    files: ["scripts/**/*.{mjs,ts}", "**/*.test.{ts,mjs}", "*.config.{ts,mjs}", "worker/**/*.{js,ts}"],
    languageOptions: { globals: { ...globals.node } },
  },

  {
    /* Unused-vars is the rule earning ESLint its place here, so it stays ON — but an argument
       kept for signature shape, and a caught error deliberately ignored, are both intentional.
       The underscore prefix is how you say so out loud. */
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
);
