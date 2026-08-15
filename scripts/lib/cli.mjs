/* Shared CLI plumbing for scripts/ — the helpers that were copy-pasted per script
   (audit finding, 2026-08-14). Node-only; never imported from src/. */
import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";

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

/**
 * One `key=value` line for $GITHUB_OUTPUT.
 *
 * A step output is LINE-DELIMITED, and the runner parses every line of the file. So a value
 * carrying a newline is not a long value — it is a second output the runner accepts as if this
 * step had written it, which is how an issue body's text becomes `slug=…` for a later step to
 * consume. Every value this repo emits (a slug, an issue number, a country, a branch name) is
 * single-line by definition, so a newline means something upstream is wrong: REJECT rather than
 * strip, because a silently trimmed value hides the bug that produced it.
 */
export function outputLine(key, value) {
  const v = value == null ? "" : String(value);
  if (/[\r\n]/.test(v)) throw new Error(`refusing to emit output "${key}" — the value contains a newline`);
  return `${key}=${v}\n`;
}

/** Append a step output when running under Actions; a no-op (but still validated) otherwise, so
    a local run fails on a bad value exactly the way CI would. */
export function emitOutput(key, value) {
  const line = outputLine(key, value);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, line);
}

/** Number of the open issue whose title matches exactly, or null. Search-based —
    no stored ID, self-heals if the issue is manually closed. */
export function findOpenIssueByTitle(title) {
  const out = gh(["issue", "list", "--search", `"${title}" in:title`, "--state", "open", "--json", "number,title"]);
  const found = JSON.parse(out).find((i) => i.title === title);
  return found ? found.number : null;
}
