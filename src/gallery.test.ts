/* D4's coverage gate — the gallery page shows the WHOLE registry, or the build fails.

   The registry test (src/component-registry.test.ts) makes the approved list real; this one
   makes the gallery honest about it: every registered component and block must appear in
   src/pages/gallery.astro. Source-text assertions, deliberately — component usage is a
   literal `<Name` tag and block coverage is the literal TYPE_TO_BLOCK map, so both reads
   are unambiguous, and the gallery's own frontmatter already THROWS at build time when a
   mapped block type has no real guide section to render (this test doesn't duplicate that
   runtime half; `npx astro build`/check own it). */
// @protects-file The component gallery renders every registry entry.

import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = fileURLToPath(new URL(".", import.meta.url));
const gallery = readFileSync(join(SRC, "pages/gallery.astro"), "utf8");
const registry = JSON.parse(readFileSync(join(SRC, "../docs/reference/component-registry.json"), "utf8"));

describe("component gallery coverage", () => {
  test("every registered shared component appears in the gallery", () => {
    // Every component is either rendered as a literal tag or (Contours/PwaHead/Block, which
    // ARE rendered too) at least present; one regex serves both since usage is a tag.
    const missing = Object.keys(registry.components).filter((name) => !new RegExp(`<${name}[\\s/>]`).test(gallery));
    expect(
      missing,
      "gallery.astro does not render these registered components — a component added to the registry lands WITH its gallery specimen (design-system.md D4)",
    ).toEqual([]);
  });

  test("every registered block has a TYPE_TO_BLOCK specimen mapping", () => {
    const missing = Object.keys(registry.blocks).filter((name) => !gallery.includes(`"${name}"`));
    expect(
      missing,
      "gallery.astro's TYPE_TO_BLOCK map does not cover these registered blocks — add the section-type mapping so a real specimen renders",
    ).toEqual([]);
  });

  test("every registered pattern is presented", () => {
    // Patterns render from the registry object itself; assert the section exists so a
    // refactor can't silently drop the pattern contracts from the page.
    expect(gallery).toContain('id="patterns"');
    expect(gallery).toContain("registry.patterns");
  });
});
