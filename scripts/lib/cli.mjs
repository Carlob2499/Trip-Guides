/* Shared CLI plumbing for scripts/ — the helpers that were copy-pasted per script
   (audit finding, 2026-08-14). Node-only; never imported from src/. */
import { execFileSync } from "node:child_process";

/** `--flag value` pairs plus positionals into `{ flag: value, _: [...] }`. */
export function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) { a[argv[i].slice(2)] = argv[i + 1]; i++; }
    else a._.push(argv[i]);
  }
  return a;
}

/** Run the GitHub CLI, return stdout. */
export function gh(args, opts = {}) {
  return execFileSync("gh", args, { encoding: "utf8", ...opts });
}

/** Number of the open issue whose title matches exactly, or null. Search-based —
    no stored ID, self-heals if the issue is manually closed. */
export function findOpenIssueByTitle(title) {
  const out = gh(["issue", "list", "--search", `"${title}" in:title`, "--state", "open", "--json", "number,title"]);
  const found = JSON.parse(out).find((i) => i.title === title);
  return found ? found.number : null;
}
