import { appendFileSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const AUTHORITY_MARKDOWN = new Set([
  "AGENTS.md",
  "CLAUDE.md",
  "PRODUCT.md",
  "docs/handoff.md",
  "docs/reference/pipeline.md",
  "docs/pipeline v2/CODEX_HANDOFF.md",
  "docs/pipeline v2/DECISIONS.md",
  "docs/pipeline v2/IMPLEMENTATION_STATE.md",
  "docs/pipeline v2/SEPTEMBER_TRACKER.md",
]);

function normalize(path) {
  return String(path || "").trim().replaceAll("\\", "/");
}

function isMarkdown(path) {
  return path.toLowerCase().endsWith(".md");
}

export function classifyChangedPaths(paths) {
  const changed = paths.map(normalize).filter(Boolean);
  const full = changed.some((path) =>
    AUTHORITY_MARKDOWN.has(path) || (
      !path.startsWith("learnings/") &&
      !path.startsWith("guides-intake/") &&
      !isMarkdown(path)
    )
  );
  const a11y = changed.some((path) =>
    !path.startsWith("docs/") &&
    !path.startsWith("learnings/") &&
    !path.startsWith("guides-intake/") &&
    !isMarkdown(path)
  );
  return { full, a11y };
}

function main() {
  const inputPath = process.argv[2];
  const input = inputPath ? readFileSync(inputPath, "utf8") : readFileSync(0, "utf8");
  const result = classifyChangedPaths(input.split(/\r?\n/));
  const lines = [`full=${result.full}`, `a11y=${result.a11y}`];
  console.log(lines.join("\n"));
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${lines.join("\n")}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
