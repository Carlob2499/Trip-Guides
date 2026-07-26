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

      /* ON as of M6 — a RATCHET, not a blanket. It was "off" as a recorded debt (154 sites,
         all one shape: functions walking the guide JSON, plus .astro props Astro hands over
         untyped). M6 named the real type once — src/lib/guide-types.ts derives GuideData /
         Section / SectionOf<T> from the Zod schema — and converted the core walkers
         (map-pins, buckets, exports, the hub's own derivation). 154 -> 32 files still carry
         one; every OTHER file in the repo is now gated, so a NEW `any` in converted code is a
         lint error rather than an invisible addition to a pile nobody was counting.
         The list below is a shrinking TODO that lives in the config where it can be seen,
         instead of a rule switched off where it cannot. Delete a path when its file is
         converted — that is the whole ceremony. astro check stays the type gate at 0 errors. */
      "@typescript-eslint/no-explicit-any": "error",
    },
  },

  /* M6 ratchet (see the no-explicit-any note above): the files that still carry an `any`.
     Shrink this list; never add to it. Astro component props are the stubborn tail — Astro
     types Astro.props as any, so typing them means a Props interface per block component.
     NOTE: a path containing [slug] must be written with a * — square brackets are a glob
     CHARACTER CLASS, so the literal path never matches and the entry silently does nothing.
     That bit here first: the four [slug] endpoints stayed red until they were rewritten. */
  {
    files: [
      "scripts/pretrip-check.ts",
      "src/components/Learnings.astro",
      "src/components/TripKit.astro",
      "src/components/blocks/DaysBlock.astro",
      "src/components/blocks/HabitatsBlock.astro",
      "src/components/blocks/HolidaysBlock.astro",
      "src/components/blocks/InfoGridBlock.astro",
      "src/components/blocks/MapBlock.astro",
      "src/components/blocks/PanelBlock.astro",
      "src/components/blocks/RaidBlock.astro",
      "src/components/blocks/SightsBlock.astro",
      "src/components/blocks/TierListBlock.astro",
      "src/content.config.test.ts",
      "src/content.config.ts",
      "src/features/exports/model/exports.test.ts",
      "src/features/exports/model/exports.ts",
      "src/features/firebase/model/room.test.ts",
      "src/features/firebase/model/room.ts",
      "src/features/live-data/model/rate.ts",
      "src/features/live-data/model/weather.test.ts",
      "src/features/live-data/model/weather.ts",
      "src/features/reminders/model/reminders.test.ts",
      "src/features/route-opt/model/optimize.test.ts",
      "src/features/trip-kit/model/arrival.ts",
      "src/features/trip-kit/model/book-by.ts",
      "src/features/trip-split/model/records.ts",
      "src/layouts/GuideLayout.astro",
      "src/lib/holidays.test.ts",
      "src/pages/guides/*.gpx.ts",
      "src/pages/guides/*.ics.ts",
      "src/pages/index.astro",
      "src/pages/og/*.png.ts",
      "src/pages/recap/*.png.ts",
    ],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
);
