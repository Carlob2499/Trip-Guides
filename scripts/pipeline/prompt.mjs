// PROMPT COMPOSITION — the mechanism that lets every agent prompt live in prompts/ as a file
// instead of inline in workflow YAML.
//
// A workflow step runs `node scripts/pipeline.mjs prompt prompts/<name>.md`, which substitutes
// `{{placeholder}}` from `WP_*` environment variables (WP_SLUG → {{slug}}, WP_SECTION →
// {{section}}) and writes the result to $GITHUB_OUTPUT as `text`; the agent step then takes
// `prompt: ${{ steps.<id>.outputs.text }}`. GitHub evaluates `${{ }}` after the YAML parses, so a
// multi-line prompt travelling that way is safe where `prompt: | $(cat file)` is not — that form
// is not YAML at all, it is a string the action never expands.
//
// Two rules make this trustworthy:
//   · an unresolved placeholder is a HARD ERROR. A prompt that quietly renders "Guide slug: {{slug}}"
//     sends an agent to research a guide that does not exist, and every downstream check passes.
//   · values are substituted, never concatenated as instructions. Untrusted text (an issue body,
//     a traveler's words) does NOT come through here at all — it rides the DATA channel as a file
//     the prompt names. WP_* variables carry validated, workflow-controlled values only.

import { readFile } from "node:fs/promises";
import { appendFileSync } from "node:fs";

const PLACEHOLDER = /\{\{\s*([a-z0-9_]+)\s*\}\}/gi;

/** WP_SLUG → slug, WP_SECTION_FOCUS → section_focus. */
export function varsFromEnv(env = process.env) {
  const out = {};
  for (const [k, v] of Object.entries(env)) {
    if (k.startsWith("WP_")) out[k.slice(3).toLowerCase()] = v;
  }
  return out;
}

/** Pure: substitute, and report every placeholder the vars did not supply. */
export function render(template, vars) {
  const missing = new Set();
  const text = String(template).replace(PLACEHOLDER, (_, name) => {
    const key = name.toLowerCase();
    const value = vars[key];
    if (value === undefined || value === null || value === "") { missing.add(key); return `{{${name}}}`; }
    return String(value);
  });
  return { text, missing: [...missing] };
}

export async function composePrompt(file, { env = process.env, out = process.stdout } = {}) {
  const template = await readFile(file, "utf8");
  const { text, missing } = render(template, varsFromEnv(env));
  if (missing.length) {
    console.error(
      `[prompt] ${file} has unresolved placeholder(s): ${missing.map((m) => `{{${m}}}`).join(", ")}. ` +
        `Set ${missing.map((m) => `WP_${m.toUpperCase()}`).join(", ")} in the step's env:.`,
    );
    return 1;
  }
  if (env.GITHUB_OUTPUT) {
    // Heredoc delimiter: GitHub's own multiline-output form. The marker is fixed and the prompt
    // files are ours, so a collision would be a self-inflicted syntax error, not an injection —
    // but check anyway rather than emit a broken output file.
    const marker = "WAYPOINT_PROMPT_EOF";
    if (text.includes(marker)) {
      console.error(`[prompt] ${file} contains the output delimiter ${marker} — rename it in the prompt.`);
      return 1;
    }
    appendFileSync(env.GITHUB_OUTPUT, `text<<${marker}\n${text}\n${marker}\n`);
  }
  out.write(text.endsWith("\n") ? text : text + "\n");
  return 0;
}
