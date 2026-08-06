/* Lint scope must be a subset of CI scope — the divergence gate for issue #39.

   `npm run lint` is `eslint .` (the whole repo), but .github/workflows/test.yml skips
   pushes that only touch its `paths-ignore` list (docs/**, learnings/**, …). Any
   lintable file living under a CI-ignored path is therefore a red `main` that CI
   structurally cannot see: the failure lands on the NEXT unrelated commit that touches
   src/. That is exactly how docs/design-handoff/prototype/ turned lint red for a day
   with every CI signal green.

   This test fails on the commit that CREATES the divergence: it walks every lintable
   file under the CI-ignored directories and asserts eslint ignores it too (via
   eslint's own resolved config, not a re-parse of the ignore globs). The fix for a
   failure is a decision, not a mechanical edit: either add the path to
   eslint.config.mjs's ignores (lint follows CI), or remove the path from test.yml's
   paths-ignore (CI follows lint) — pick one, never let the two lists disagree
   silently. The eslint config is hook-protected; its edits are the creator's. */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const WORKFLOW = join(ROOT, ".github", "workflows", "test.yml");

/* Extensions eslint.config.mjs actually lints (js + ts + astro recommended sets). */
const LINTABLE = /\.(js|mjs|cjs|ts|mts|cts|tsx|astro)$/;

/** The workflow's paths-ignore entries, read from the file so the gate follows CI's
    real config instead of a copy that can rot. Both `push` and `pull_request` carry
    the same list; any entry from either counts as "CI may skip this path". */
function ciIgnoredDirs() {
  const yml = readFileSync(WORKFLOW, "utf8");
  const lists = [...yml.matchAll(/paths-ignore:\s*\[([^\]]*)\]/g)].map((m) => m[1]);
  expect(lists.length, "test.yml no longer declares paths-ignore — update this gate").toBeGreaterThan(0);
  const entries = new Set(
    lists
      .flatMap((l) => l.split(","))
      .map((e) => e.trim().replace(/^"|"$/g, ""))
      .filter(Boolean),
  );
  // "**.md" is extension-shaped, not a directory — eslint does not lint .md, so it
  // cannot create the divergence this gate exists for.
  return [...entries]
    .filter((e) => !e.startsWith("**"))
    .map((e) => e.replace(/\/\*\*$/, ""));
}

function walk(dir, out = []) {
  let names;
  try {
    names = readdirSync(dir);
  } catch {
    return out; // an ignored path that doesn't exist can't diverge
  }
  for (const name of names) {
    if (name === "node_modules" || name === ".git") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (LINTABLE.test(name)) out.push(p);
  }
  return out;
}

describe("lint scope ⊆ CI scope", () => {
  it("every lintable file under a CI-ignored path is also eslint-ignored", async () => {
    const eslint = new ESLint({ cwd: ROOT });
    const offenders = [];
    for (const dir of ciIgnoredDirs()) {
      for (const file of walk(join(ROOT, dir))) {
        if (!(await eslint.isPathIgnored(file))) {
          offenders.push(relative(ROOT, file).replaceAll("\\", "/"));
        }
      }
    }
    expect(
      offenders,
      "These files WILL be linted by `eslint .` but live under paths the Tests " +
        "workflow ignores — a lint failure there is invisible to CI until an " +
        "unrelated commit inherits it. Either eslint-ignore the path (creator edits " +
        "eslint.config.mjs) or drop it from test.yml's paths-ignore.",
    ).toEqual([]);
  });
});
