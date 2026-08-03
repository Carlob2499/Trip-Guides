/* SessionStart hook: inject docs/HANDOFF.md as warm-start context so no session spends a
   Read on it. The file's ≤120-line budget is gated by docs-integrity.test.mjs, so this stays
   cheap. Silent on any failure — a missing HANDOFF must never break session start. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

try {
  const path = fileURLToPath(new URL("../docs/HANDOFF.md", import.meta.url));
  process.stdout.write(readFileSync(path, "utf8"));
} catch {
  /* no HANDOFF, no context — never an error */
}
