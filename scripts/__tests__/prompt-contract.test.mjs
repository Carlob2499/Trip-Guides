// CONTRACT test across the prompts/ ↔ .github/workflows/ seam.
//
// Prompts moved out of workflow YAML into files, which is only an improvement if the two stay
// joined. Nothing in the language connects them: a workflow names a prompt path in a shell
// string, and the prompt names its variables in double braces. Rename either side and the
// failure is a run that composes a prompt with a literal `{{slug}}` in it, or one that dies on a
// missing file after the checkout and npm ci have already been paid for.
//
// This is a boundary check, not a unit test — it reads both sides as text and asserts they
// agree. It is cheap because the seam is small (eight prompts, five workflows).

// @protects-file An automated run gets the instructions it was written to get.

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const PROMPTS = path.join(ROOT, "prompts");
const WORKFLOWS = path.join(ROOT, ".github", "workflows");

const promptFiles = readdirSync(PROMPTS).filter((f) => f.endsWith(".md") && f !== "README.md");
const workflowFiles = readdirSync(WORKFLOWS).filter((f) => f.endsWith(".yml"));
const read = (p) => readFileSync(p, "utf8");

const PLACEHOLDER = /\{\{\s*([a-z0-9_]+)\s*\}\}/gi;
const placeholdersOf = (text) => [...new Set([...text.matchAll(PLACEHOLDER)].map((m) => m[1].toLowerCase()))];

/** Every `pipeline.mjs prompt <path>` call in the workflows, with the WP_* vars its step sets.
    Steps are YAML blocks separated by `- name:` at the same indent, which is enough structure to
    pair an `env:` with the `run:` beneath it without a YAML round-trip. */
function promptCalls() {
  const calls = [];
  for (const wf of workflowFiles) {
    const text = read(path.join(WORKFLOWS, wf));
    for (const step of text.split(/^ {6}- (?:name|uses):/m)) {
      const m = step.match(/pipeline\.mjs prompt (\S+)/);
      if (!m) continue;
      const vars = [...step.matchAll(/^\s*WP_([A-Z0-9_]+):/gm)].map((v) => v[1].toLowerCase());
      calls.push({ workflow: wf, file: m[1], vars });
    }
  }
  return calls;
}

const calls = promptCalls();

describe("prompts/ ↔ workflows", () => {
  it("the workflows compose at least one prompt (the mechanism is actually wired)", () => {
    expect(calls.length).toBeGreaterThan(0);
  });

  it.each(calls)("$workflow composes $file, which exists", ({ file }) => {
    expect(promptFiles).toContain(path.basename(file));
    expect(file.startsWith("prompts/")).toBe(true);
  });

  it.each(calls)("$workflow supplies every variable $file asks for", ({ file, vars }) => {
    // The composer treats an unresolved placeholder as a hard error, so a mismatch here is a
    // run that fails after checkout — not a run that quietly researches the wrong guide. This
    // test moves that failure to the commit that causes it.
    const wanted = placeholdersOf(read(path.join(ROOT, file)));
    expect(wanted.filter((w) => !vars.includes(w))).toEqual([]);
  });

  it("every prompt file is composed by some workflow — no orphans", () => {
    const used = new Set(calls.map((c) => path.basename(c.file)));
    expect(promptFiles.filter((f) => !used.has(f))).toEqual([]);
  });
});

describe("prompt hygiene", () => {
  it.each(promptFiles)("%s carries no secret-shaped interpolation", (f) => {
    // A prompt is composed by code from WP_* variables. A `${{ }}` expression inside one means
    // someone pasted a workflow snippet in; GitHub never expands it here, so it would ship to
    // the agent as literal text — and if it ever were expanded, it would be a secret in a prompt.
    expect(read(path.join(PROMPTS, f))).not.toMatch(/\$\{\{/);
  });

  it.each(promptFiles)("%s does not contain the output delimiter", (f) => {
    // composePrompt writes the rendered text to $GITHUB_OUTPUT as a heredoc with this marker.
    expect(read(path.join(PROMPTS, f))).not.toContain("WAYPOINT_PROMPT_EOF");
  });

  it.each(promptFiles)("%s names no deleted workflow, script or reference", (f) => {
    const text = read(path.join(PROMPTS, f));
    // pipeline-roles.md was the second home for the per-stage role law; prompts/ owns that now,
    // and a prompt still pointing at it would send an agent to read a file that isn't there.
    for (const gone of ["graduate-guide", "modify-guide.yml", "revise-guide.yml", "parse-modify-issue", "parse-revise-issue", "validate-revision-plan", "append-run-report", "pipeline-roles"]) {
      expect(text).not.toContain(gone);
    }
  });
});
