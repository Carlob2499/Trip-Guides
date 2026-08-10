/* SessionStart hook: inject the two warm-start documents so no session spends a Read on
   either — docs/HANDOFF.md (what just happened) and CONTEXT.md (what the words mean, and
   which forks are already settled). HANDOFF's ≤120-line budget is gated by
   docs-integrity.test.mjs, so this stays cheap. Each file is emitted independently and
   silently: a missing or unreadable document must never break session start. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

for (const rel of ["../docs/HANDOFF.md", "../CONTEXT.md"]) {
  try {
    process.stdout.write(readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8"));
    process.stdout.write("\n\n");
  } catch {
    /* absent document, no context — never an error */
  }
}
