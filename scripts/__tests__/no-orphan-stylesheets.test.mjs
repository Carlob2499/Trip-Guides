/* The seam is the bundler's import graph — which no assertion about behaviour reaches. The
   argument for this gate sits in GuideLayout.astro, beside the import it exists to keep. */
// @protects-file A stylesheet nothing imports ships as a file nobody sees.

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";

/** Files that are deliberately not imported, each with the reason it is not a leak. */
const UNIMPORTED_BY_DESIGN = {};

function walk(dir, test, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === "node_modules") continue;
      walk(p, test, out);
    } else if (test(name)) out.push(p.replace(/\\/g, "/"));
  }
  return out;
}

const norm = (p) => relative(process.cwd(), p).replace(/\\/g, "/");

describe("no stylesheet is orphaned from the build", () => {
  const sheets = walk("src", (n) => n.endsWith(".css"));
  // CSS carries imports too — a sheet may arrive by @import rather than from code.
  const carriers = walk("src", (n) => /\.(astro|ts|js|mjs|css)$/.test(n));
  // Comments stripped first: a commented-out import satisfied the first version of this gate.
  const strip = (s) =>
    s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/<!--[\s\S]*?-->/g, "");

  /* Every .css specifier in the tree, RESOLVED against the file that wrote it.

     The first version compared basenames, and 11 of this repo's 52 sheets share one — nine
     `styles.css` in feature silos, two `preview-chrome.css`. Any single import of a
     `styles.css` therefore vouched for all nine, so the gate could not fail for roughly a
     fifth of the corpus: mutation-tested, deleting trip-kit's import still reported zero
     orphans. Resolving the specifier is what makes the answer about a FILE rather than a name. */
  const imported = new Set();
  for (const f of carriers) {
    const src = strip(readFileSync(f, "utf8"));
    for (const m of src.matchAll(/["'(]([^"'()\s]+\.css)["')]/g)) {
      const spec = m[1];
      if (spec.startsWith(".")) imported.add(norm(resolve(dirname(f), spec)));
      else if (spec.startsWith("/")) imported.add(spec.replace(/^\//, ""));
      // Bare specifiers are packages (@fontsource/...), never a file in this tree.
    }
  }

  it("found the stylesheets", () => {
    expect(sheets.length).toBeGreaterThan(20);
  });

  it("⌁ every .css file is imported by at least one other file", () => {
    // ⌁ A page deleted, and the stylesheet it was the last importer of left behind.
    const orphans = sheets.filter((s) => !UNIMPORTED_BY_DESIGN[s] && !imported.has(norm(s)));
    expect(
      orphans,
      "a stylesheet is not imported anywhere, so it is not in any bundle and none of its " +
        "rules reach the page. Either restore the import (usually into the layout that owns " +
        "the surface it styles) or delete the file. If it is genuinely reference-only, add " +
        "it to UNIMPORTED_BY_DESIGN with that reason.",
    ).toEqual([]);
  });

  it("⌁ the gate can actually fail — each sheet is vouched for by its OWN path", () => {
    /* ⌁ The bug above was invisible because a passing gate looks identical whether it is
       checking something or nothing. This asserts the property that broke: every sheet
       sharing a basename with another is resolved separately, so all 11 are individually
       accounted for rather than covered by one import of the name they share. */
    const byName = new Map();
    for (const s of sheets) {
      const n = s.slice(s.lastIndexOf("/") + 1);
      byName.set(n, (byName.get(n) ?? []).concat(s));
    }
    const shared = [...byName.values()].filter((g) => g.length > 1).flat();
    expect(shared.length, "no sheets share a basename — this check has nothing to prove")
      .toBeGreaterThan(1);
    const unaccounted = shared.filter((s) => !imported.has(norm(s)));
    expect(unaccounted, "a sheet sharing a basename is not individually imported").toEqual([]);
  });

  it("⌁ the destinations' own stylesheets are imported by the guide layout", () => {
    // The five destinations live inside the guide, so the layout is the only carrier.
    const layout = strip(readFileSync("src/layouts/GuideLayout.astro", "utf8"));
    for (const sheet of ["chrome", "trip", "itinerary", "guide-dest"]) {
      expect(layout).toMatch(new RegExp(`import\\s+["']\\.\\./styles/${sheet}\\.css["']`));
    }
  });

  it("⌁ every allowance still names a file that exists", () => {
    const stale = Object.keys(UNIMPORTED_BY_DESIGN).filter((f) => !sheets.includes(f));
    expect(stale, "an allowance names a stylesheet that is gone — delete the entry").toEqual([]);
  });
});
