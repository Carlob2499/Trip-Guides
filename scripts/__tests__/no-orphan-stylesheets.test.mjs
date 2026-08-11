/* The seam is the bundler's import graph — which no assertion about behaviour reaches. The
   argument for this gate sits in GuideLayout.astro, beside the import it exists to keep. */
// @protects-file A stylesheet nothing imports ships as a file nobody sees.

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, basename } from "node:path";

/** Files that are deliberately not imported, each with the reason it is not a leak. */
const UNIMPORTED_BY_DESIGN = {
  // Design-handoff exports and prototypes are reference material, not shipped code.
};

function walk(dir, test, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === "node_modules" || name === "prototypes") continue;
      walk(p, test, out);
    } else if (test(name)) out.push(p.replace(/\\/g, "/"));
  }
  return out;
}

describe("no stylesheet is orphaned from the build", () => {
  const sheets = walk("src", (n) => n.endsWith(".css"));
  // CSS carries imports too — a sheet may arrive by @import rather than from code.
  const carriers = walk("src", (n) => /\.(astro|ts|js|mjs|css)$/.test(n));
  // Comments stripped first: a commented-out import satisfied the first version of this gate.
  const strip = (s) =>
    s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/<!--[\s\S]*?-->/g, "");
  const text = new Map(carriers.map((f) => [f, strip(readFileSync(f, "utf8"))]));

  it("found the stylesheets", () => {
    expect(sheets.length).toBeGreaterThan(20);
  });

  it("⌁ every .css file is imported by at least one other file", () => {
    // ⌁ A page deleted, and the stylesheet it was the last importer of left behind.
    const orphans = sheets.filter((sheet) => {
      if (UNIMPORTED_BY_DESIGN[sheet]) return false;
      // Path or quote boundary required: field-tools.css would otherwise vouch for tools.css.
      const file = basename(sheet).replace(/\./g, "\\.");
      const ref = new RegExp(`["'/]${file}["']`);
      for (const [f, src] of text) {
        if (f === sheet) continue;
        if (ref.test(src)) return false;
      }
      return true;
    });
    expect(
      orphans,
      "a stylesheet is not imported anywhere, so it is not in any bundle and none of its " +
        "rules reach the page. Either restore the import (usually into the layout that owns " +
        "the surface it styles) or delete the file. If it is genuinely reference-only, add " +
        "it to UNIMPORTED_BY_DESIGN with that reason.",
    ).toEqual([]);
  });

  it("⌁ the Tools station's own stylesheet is imported by the guide layout", () => {
    // The station lives inside the guide, so the layout is the only carrier it can have.
    const layout = strip(readFileSync("src/layouts/GuideLayout.astro", "utf8"));
    expect(layout).toMatch(/import\s+["']\.\.\/styles\/tools\.css["']/);
  });

  it("⌁ every allowance still names a file that exists", () => {
    const stale = Object.keys(UNIMPORTED_BY_DESIGN).filter((f) => !sheets.includes(f));
    expect(stale, "an allowance names a stylesheet that is gone — delete the entry").toEqual([]);
  });
});
