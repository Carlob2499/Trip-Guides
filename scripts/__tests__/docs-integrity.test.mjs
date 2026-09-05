/* Docs are load-bearing in this repo — agent manuals route by path, workflows tell agents
   which docs to read, and SessionStart injects the bounded handoff capsule. Session #26's audit
   found the failure classes gated here: a workflow pointing at a doc that never existed, HANDOFF
   growing 10× past its own stated budget, and environment facts (OneDrive) outliving the
   environment. Each check is deterministic; judgment stays doctrine in the agent manuals. */
// @protects-file Project docs stay within budget and every live file/lookup they reference resolves.

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
      /* `.claude` holds nested WORKTREES — whole extra checkouts of this same repository. A
         copy of this very file lives in each one, so walking them makes the repo fail its own
         docs gate for the sole reason that a second checkout exists on the machine. They are
         gitignored and never present on CI; nothing the gate is about lives in them. */
      if (entry === "node_modules" || entry === "dist" || entry === ".git" || entry === ".claude") continue;
      walk(full, exts, out);
    } else if (exts.some((ext) => entry.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
}

/* Every .md under docs/ that someone still maintains — all folders, minus the two that are
   deliberately frozen. Returns absolute paths. */
function liveDocs() {
  const FROZEN = new Set(["archive", "design-handoff"]);
  const docs = join(ROOT, "docs");
  return readdirSync(docs)
    .filter((entry) => !FROZEN.has(entry))
    .flatMap((entry) => {
      const full = join(docs, entry);
      if (statSync(full).isDirectory()) return walk(full, [".md"]);
      return entry.endsWith(".md") ? [full] : [];
    });
}

describe("HANDOFF stays a handoff, not a chronicle", () => {
  test("docs/handoff.md stays within the bounded operational budget", () => {
    const lines = readFileSync(join(ROOT, "docs/handoff.md"), "utf8").split("\n").length;
    expect(
      lines,
      "docs/handoff.md is over budget. Its header sets ~80 lines; the gate allows 120. " +
        "Keep current operational truth here and leave superseded snapshots in Git history."
    ).toBeLessThanOrEqual(120);
  });
});

describe("every cited docs/*.md exists (the E2_FIELD_REPORT failure class)", () => {
  const sources = [
    ...walk(join(ROOT, ".github/workflows"), [".yml"]),
    ...walk(join(ROOT, "scripts"), [".mjs"]),
    join(ROOT, "CLAUDE.md"),
    join(ROOT, "CONTEXT.md"),
    // Live docs, whatever folder they sit in. Deliberately NOT a plain readdir of docs/:
    // the 2026-08-10 rename moved 13 of the 14 into reference/, standards/, evidence/ and
    // generated/, and a top-level-only readdir would have kept passing while checking one
    // file. Excluded on purpose: archive/ is a historical lookup area and may cite paths that no
    // longer resolve, and design-handoff/ is a design-tool export nobody here maintains.
    ...liveDocs(),
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

describe("archive lookup anchors remain resolvable", () => {
  test("every live docs/archive/INDEX.md → NAME pointer has a matching index heading", () => {
    const index = readFileSync(join(ROOT, "docs/archive/INDEX.md"), "utf8");
    const headings = new Set(
      [...index.matchAll(/^###\s+([A-Za-z0-9_.-]+)\s+—/gm)]
        .map((match) => match[1].replace(/\.md$/, ""))
    );
    const sourceExts = [".md", ".yml", ".yaml", ".ts", ".mjs", ".js", ".astro", ".css"];
    const sources = walk(ROOT, sourceExts).filter((file) => {
      const rel = relative(ROOT, file).replaceAll("\\", "/");
      return file !== SELF && !rel.startsWith("docs/archive/");
    });
    const missing = [];

    for (const file of sources) {
      const text = readFileSync(file, "utf8");
      for (const match of text.matchAll(/docs\/archive\/INDEX\.md\s*→\s*([A-Za-z0-9_.-]+)/g)) {
        const anchor = match[1].replace(/\.md$/, "");
        if (!headings.has(anchor)) missing.push(`${relative(ROOT, file)} → ${match[1]}`);
      }
    }

    expect(
      missing,
      "A live historical lookup points at an archive index heading that no longer exists. " +
        "Restore the heading or update the live pointer; Git history is useful only if the index still resolves."
    ).toEqual([]);
  });
});

describe("no OneDrive reference outside the archive", () => {
  // The repo no longer lives under OneDrive (creator, 2026-08-03); the stale-CSS caveat that
  // referenced it is obsolete. Historical lookup material may preserve the old environment fact.
  const FORBIDDEN = new RegExp("One" + "Drive", "i");

  test("src, scripts, docs (minus archive), workflows, and root files are clean", () => {
    const files = [
      ...walk(join(ROOT, "src"), [".ts", ".mjs", ".js", ".astro", ".css"]),
      ...walk(join(ROOT, "scripts"), [".mjs", ".ts"]),
      ...walk(join(ROOT, ".github"), [".yml", ".md"]),
      ...liveDocs(),
      ...readdirSync(ROOT)
        .filter((f) => f.endsWith(".md") || f.endsWith(".ts") || f.endsWith(".mjs"))
        .map((f) => join(ROOT, f)),
    ].filter((f) => f !== SELF);
    const hits = files.filter((f) => FORBIDDEN.test(readFileSync(f, "utf8")));
    expect(
      hits.map((f) => relative(ROOT, f)),
      "OneDrive is referenced outside docs/archive/. The repo does not live on OneDrive; " +
        "remove the live reference and keep history in Git/archive lookup material only."
    ).toEqual([]);
  });
});

describe("internal hrefs carry the base path", () => {
  // Every internal /-href needs import.meta.env.BASE_URL, or the link 404s the moment the site
  // serves under a base path. Greppable, so gated.
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
