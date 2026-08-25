/* SessionStart hook: emit only the bounded operational capsule from docs/handoff.md.
   Deep history stays on demand. Missing/malformed/oversized handoff data must never break
   session start or flood a freshly compacted context. */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const WARM_START_BEGIN = "<!-- WARM_START_BEGIN -->";
export const WARM_START_END = "<!-- WARM_START_END -->";
export const WARM_START_MAX_BYTES = 1800;

export function extractWarmStart(text, { maxBytes = WARM_START_MAX_BYTES } = {}) {
  const start = text.indexOf(WARM_START_BEGIN);
  const end = text.indexOf(WARM_START_END);
  if (start < 0 || end < 0 || end <= start) return "";

  const body = text.slice(start + WARM_START_BEGIN.length, end).trim();
  if (!body) return "";
  const output = `${body}\n`;
  if (Buffer.byteLength(output, "utf8") > maxBytes) return "";
  return output;
}

export function readWarmStart(file) {
  try {
    return extractWarmStart(readFileSync(file, "utf8"));
  } catch {
    return "";
  }
}

function main() {
  const handoff = fileURLToPath(new URL("../docs/handoff.md", import.meta.url));
  process.stdout.write(readWarmStart(handoff));
}

const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invoked === fileURLToPath(import.meta.url)) main();
