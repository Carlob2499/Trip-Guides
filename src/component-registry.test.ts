/* The approved-component registry's enforcement (design-system.md §10 governance).

   The governance rule — agents compose only from approved components — is only real if a
   component that skips the registry fails the build. Three checks make it mechanical:

   1. BIDIRECTIONAL EXISTENCE. Every .astro under src/components (blocks included) and every
      feature directory has a registry entry, and every entry points at a file/dir that
      exists. A new component lands WITH its registry line or not at all; a deleted one takes
      its line along. This is deliberately shaped like var-defined.test.ts's two-sided
      declaration check, not a one-way lint.

   2. FEATURE IMPORT DISCIPLINE. CLAUDE.md's "feature public surfaces go through index.ts;
      avoid cross-feature deep imports" was prose until now; measured 2026-08-29 the codebase
      already complies, so this ratchets the achieved state. Outside a feature's own
      directory, imports of src/features/<name>/... must hit index(.js/.ts) — with ONE
      sanctioned exception: the feature's styles.css, because a CSS import is a side effect
      that cannot ride a JS index re-export without making index side-effectful.

   3. CLOSED ROOTS. src/components gains no subdirectory besides blocks/ without this test
      knowing — a second component root would silently split the registry's world in two. */
// @protects-file Every composable component and feature is registered, or the build fails.

import { describe, expect, test } from "vitest";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(SRC, "..");

const registry = JSON.parse(readFileSync(join(ROOT, "docs/reference/component-registry.json"), "utf8"));

const list = (dir: string, filter: (n: string) => boolean) =>
  readdirSync(dir).filter((n) => filter(n) && statSync(join(dir, n)).isFile());

describe("component registry", () => {
  test("the registry parsed and is non-trivial", () => {
    for (const key of ["components", "blocks", "features", "patterns"]) {
      expect(Object.keys(registry[key] ?? {}).length, `registry.${key} is empty`).toBeGreaterThan(2);
    }
  });

  test("every shared component on disk is registered, and vice versa", () => {
    const onDisk = new Set(list(join(SRC, "components"), (n) => n.endsWith(".astro")).map((n) => n.replace(/\.astro$/, "")));
    const registered = new Set(Object.keys(registry.components));
    expect(
      [...onDisk].filter((n) => !registered.has(n)),
      "src/components has .astro files with no registry entry — a new component lands WITH its line in docs/reference/component-registry.json (Carlo approves global additions; design-system.md §10)",
    ).toEqual([]);
    expect(
      [...registered].filter((n) => !onDisk.has(n)),
      "registry lists components that no longer exist — deleting a component takes its registry line along",
    ).toEqual([]);
    for (const [name, entry] of Object.entries<{ file: string }>(registry.components)) {
      expect(entry.file, `${name} has no file`).toBe(`src/components/${name}.astro`);
    }
  });

  test("every content block on disk is registered, and vice versa", () => {
    const onDisk = new Set(list(join(SRC, "components/blocks"), (n) => n.endsWith(".astro")).map((n) => n.replace(/\.astro$/, "")));
    const registered = new Set(Object.keys(registry.blocks));
    expect([...onDisk].filter((n) => !registered.has(n)), "unregistered block(s)").toEqual([]);
    expect([...registered].filter((n) => !onDisk.has(n)), "registry lists dead block(s)").toEqual([]);
  });

  test("every feature on disk is registered, and vice versa, each with a public index", () => {
    const onDisk = new Set(readdirSync(join(SRC, "features")).filter((n) => statSync(join(SRC, "features", n)).isDirectory()));
    const registered = new Set(Object.keys(registry.features));
    expect([...onDisk].filter((n) => !registered.has(n)), "unregistered feature dir(s)").toEqual([]);
    expect([...registered].filter((n) => !onDisk.has(n)), "registry lists dead feature(s)").toEqual([]);
    for (const name of onDisk) {
      const hasIndex = existsSync(join(SRC, "features", name, "index.ts")) || existsSync(join(SRC, "features", name, "index.js"));
      expect(hasIndex, `feature ${name} has no index.ts/js public surface`).toBe(true);
    }
  });

  test("src/components has no unknown subdirectory (a second component root)", () => {
    const dirs = readdirSync(join(SRC, "components")).filter((n) => statSync(join(SRC, "components", n)).isDirectory());
    expect(dirs).toEqual(["blocks"]);
  });

  test("outside a feature, feature imports go through index (styles.css excepted)", () => {
    /* Scans every source file OUTSIDE src/features for an import path containing
       features/<name>/<something>. Allowed shapes: .../features/<name>/index(.js|.ts)? and
       .../features/<name>/styles.css. Anything else is a deep import of a feature's
       internals — reach through its index instead, or move the code into the feature. */
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) {
          if (p === join(SRC, "features") || name === "node_modules") continue;
          walk(p);
        } else if (/\.(astro|ts|js|mjs)$/.test(name) && !name.includes(".test.")) {
          const rel = relative(ROOT, p).replace(/\\/g, "/");
          readFileSync(p, "utf8")
            .split(/\r?\n/)
            .forEach((line, i) => {
              const m = line.match(/(?:from\s+|import\s+|import\()["']([^"']*features\/[a-z0-9-]+\/[^"']+)["']/);
              if (!m) return;
              const path = m[1];
              if (/features\/[a-z0-9-]+\/index(\.js|\.ts)?$/.test(path)) return;
              if (/features\/[a-z0-9-]+\/styles\.css$/.test(path)) return;
              offenders.push(`${rel}:${i + 1}  ${path}`);
            });
        }
      }
    };
    walk(SRC);
    expect(
      offenders,
      "A file outside src/features deep-imports a feature's internals. Feature public " +
        "surfaces go through index.ts (CLAUDE.md); styles.css is the one sanctioned deep " +
        "path because a CSS side-effect import cannot ride a JS re-export",
    ).toEqual([]);
  });
});
