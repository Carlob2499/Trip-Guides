/* Docs are load-bearing in this repo — CLAUDE.md routes agents by path, workflows tell agents
   which docs to read, and HANDOFF.md is injected into every session. Session #26's audit found
   the failure classes gated here: a workflow pointing at a doc that never existed, HANDOFF
   growing 10× past its own stated budget, and environment facts (OneDrive) outliving the
   environment. Each check is deterministic; judgment stays doctrine in CLAUDE.md. */
import { describe, expect, test } from "vitest";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const SELF = fileURLToPath(import.meta.url);

function walk(dir, exts, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "node_modules" || entry === "dist" || entry === ".git") continue;
      walk(full, exts, out);
    } else if (exts.some((ext) => entry.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
}

describe("HANDOFF stays a handoff, not a chronicle", () => {
  test("docs/HANDOFF.md is within its line budget (move old snapshots to docs/archive/)", () => {
    const lines = readFileSync(join(ROOT, "docs/HANDOFF.md"), "utf8").split("\n").length;
    expect(
      lines,
      "HANDOFF.md is over budget. Its header sets ~80 lines; the gate allows 120. " +
        "Move superseded snapshots and re-prompts to docs/archive/HANDOFF_ARCHIVE.md."
    ).toBeLessThanOrEqual(120);
  });
});

describe("every cited docs/*.md exists (the E2_FIELD_REPORT failure class)", () => {
  const sources = [
    ...walk(join(ROOT, ".github/workflows"), [".yml"]),
    ...walk(join(ROOT, "scripts"), [".mjs"]),
    join(ROOT, "CLAUDE.md"),
    // top-level docs only — the archive is a historical record and may cite old paths
    ...readdirSync(join(ROOT, "docs"))
      .filter((f) => f.endsWith(".md"))
      .map((f) => join(ROOT, "docs", f)),
  ];

  test("no reference points at a doc that does not exist", () => {
    const missing = [];
    for (const file of sources) {
      const text = readFileSync(file, "utf8");
      for (const match of text.matchAll(/\bdocs\/[A-Za-z0-9_./-]+?\.md\b/g)) {
        if (!existsSync(join(ROOT, match[0]))) {
          missing.push(`${relative(ROOT, file)} → ${match[0]}`);
        }
      }
    }
    expect(
      missing,
      "A workflow, script, or doc cites a docs/*.md path that does not exist. Fix the " +
        "reference or restore the file — an agent told to read it will search for it instead."
    ).toEqual([]);
  });
});

describe("no OneDrive reference outside the archive", () => {
  // The repo no longer lives under OneDrive (creator, 2026-08-03); the stale-CSS caveat that
  // referenced it is obsolete. The archive keeps history; everything else must not mention it.
  const FORBIDDEN = new RegExp("One" + "Drive", "i");

  test("src, scripts, docs (minus archive), workflows, and root files are clean", () => {
    const files = [
      ...walk(join(ROOT, "src"), [".ts", ".mjs", ".js", ".astro", ".css"]),
      ...walk(join(ROOT, "scripts"), [".mjs", ".ts"]),
      ...walk(join(ROOT, ".github"), [".yml", ".md"]),
      ...readdirSync(join(ROOT, "docs"))
        .filter((f) => f.endsWith(".md"))
        .map((f) => join(ROOT, "docs", f)),
      ...readdirSync(ROOT)
        .filter((f) => f.endsWith(".md") || f.endsWith(".ts") || f.endsWith(".mjs"))
        .map((f) => join(ROOT, f)),
    ].filter((f) => f !== SELF);
    const hits = files.filter((f) => FORBIDDEN.test(readFileSync(f, "utf8")));
    expect(
      hits.map((f) => relative(ROOT, f)),
      "OneDrive is referenced outside docs/archive/. The repo does not live on OneDrive; " +
        "remove the reference (history belongs in the archive)."
    ).toEqual([]);
  });
});

describe("internal hrefs carry the base path", () => {
  // CLAUDE.md guardrail: every internal /-href needs import.meta.env.BASE_URL, or the link
  // 404s the moment the site serves under a base path. Greppable, so gated.
  test("no .astro template hardcodes a root-absolute href", () => {
    const offenders = [];
    for (const file of walk(join(ROOT, "src"), [".astro"])) {
      const lines = readFileSync(file, "utf8").split("\n");
      lines.forEach((line, i) => {
        if (/href="\/[a-z]/.test(line) && !line.includes("BASE_URL")) {
          offenders.push(`${relative(ROOT, file)}:${i + 1}`);
        }
      });
    }
    expect(
      offenders,
      'An internal href="/..." lacks import.meta.env.BASE_URL — it breaks under a base path.'
    ).toEqual([]);
  });
});
