/* Lint scope must be a subset of the Required gate's full-code scope.

   `npm run lint` is `eslint .`. Any lintable file that the required-gate classifier treats as a
   cheap docs/data-only change could therefore land a lint failure that the merge gate never ran.
   Walk the actual repository and prove every lintable file excluded from the full gate is also
   ignored by ESLint. The classifier is the single CI-scope owner; no YAML glob copy can drift.
*/

// @protects-file Code checks run over every lintable repository file that is not ESLint-ignored.

import { describe, it, expect } from "vitest";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import { classifyChangedPaths } from "../classify-required-gate.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const LINTABLE = /\.(js|mjs|cjs|ts|mts|cts|tsx|astro)$/;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git" || name === "dist" || name === "coverage") continue;
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) walk(abs, out);
    else if (LINTABLE.test(name)) out.push(abs);
  }
  return out;
}

describe("lint scope ⊆ Required gate full scope", () => {
  it("every lintable file skipped by the full gate is also ESLint-ignored", async () => {
    const eslint = new ESLint({ cwd: ROOT });
    const offenders = [];
    for (const file of walk(ROOT)) {
      const rel = relative(ROOT, file).replaceAll("\\", "/");
      if (!classifyChangedPaths([rel]).full && !(await eslint.isPathIgnored(file))) offenders.push(rel);
    }
    expect(
      offenders,
      "These files are linted by `eslint .` but the Required gate classifies them as cheap-only. " +
        "Either make the classifier run the full gate for the path or explicitly ESLint-ignore it.",
    ).toEqual([]);
  });
});
