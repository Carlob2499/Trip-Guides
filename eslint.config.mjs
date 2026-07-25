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
    files: ["scripts/**/*.{mjs,ts}", "**/*.test.{ts,mjs}", "*.config.{ts,mjs}"],
    languageOptions: { globals: { ...globals.node } },
  },

  {
    /* Service-worker scope — public/sw.js (the offline shell) and the Cloudflare Worker. Neither
       runs in the window nor in Node: self, caches, clients, skipWaiting and the Fetch API are
       REAL here. Linting them as Node reported 24 no-undef errors for globals that genuinely
       exist, and there is no source-side fix for a correct global being called undefined — the
       config was simply naming the wrong runtime. */
    files: ["public/sw.js", "worker/**/*.{js,mjs,ts}"],
    languageOptions: { globals: { ...globals.serviceworker } },
  },

  {
    rules: {
      /* Unused-vars is the rule earning ESLint its place here, so it stays ON — but an argument
         kept for signature shape is intentional, and the underscore prefix is how you say so.
         caughtErrors is OFF because this codebase's dominant idiom is progressive enhancement:
         `try { localStorage… } catch { }` where the binding exists only because older syntax
         required it. Reporting 40-odd of those buries the handful of real unused bindings, which
         is the exact failure mode of a noisy linter — it trains you to skim past it. */
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" },
      ],

      /* Same idiom, seen from the other side. An empty catch here is a DECISION — the feature
         degrades and the page carries on — not an oversight. Every other empty block still
         reports, because an empty `if` or `for` really is one. */
      "no-empty": ["error", { allowEmptyCatch: true }],

      /* OFF, and this is a debt, not an opinion. 154 sites, and they are one shape: functions
         that WALK the guide JSON — flattenSections, collectWaypoints, derivePlannerData — plus
         the .astro getStaticPaths props Astro itself hands over untyped. The real type already
         exists (CollectionEntry<"guides">["data"], inferred from the Zod schema in
         content.config.ts); threading it through the section discriminated union is a project,
         not a lint fix.
         Leaving the rule ON would have left `npm run lint` printing 154 errors forever, and a
         command that always fails is a command nobody runs — which is how the real finding in
         this same first pass (graduate-guide.mjs calling an isValidSlug it never imported, a
         ReferenceError the whole green test suite could not see) would have stayed buried.
         astro check remains the type gate and is at 0 errors. */
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
