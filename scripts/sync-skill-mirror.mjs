#!/usr/bin/env node
// Regenerate the Codex skill mirror from the canonical Claude copy.
//
// `.claude/skills/waypoint-guide-author/` is canonical; `.agents/skills/waypoint-guide-author/`
// is generated from it: references copy byte-identical, SKILL.md copies with the auto-loading
// instructions file renamed CLAUDE.md → AGENTS.md. That rename is the ONLY sanctioned
// platform difference. Edit the canonical copy, run this, commit both; the parity test
// (scripts/__tests__/pipeline-v2-skill-parity.test.mjs) stays the gate that catches a
// hand-edited mirror or a forgotten sync.
//
//   node scripts/sync-skill-mirror.mjs           # rewrite the mirror
//   node scripts/sync-skill-mirror.mjs --check   # exit 1 if the mirror is out of date

import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const CANON = path.join(ROOT, ".claude", "skills", "waypoint-guide-author");
const MIRROR = path.join(ROOT, ".agents", "skills", "waypoint-guide-author");
const check = process.argv.includes("--check");

/** canonical relative path → expected mirror content */
function expected() {
  const out = new Map();
  out.set("SKILL.md", readFileSync(path.join(CANON, "SKILL.md"), "utf8").replaceAll("CLAUDE.md", "AGENTS.md"));
  for (const f of readdirSync(path.join(CANON, "references"))) {
    out.set(path.join("references", f), readFileSync(path.join(CANON, "references", f), "utf8"));
  }
  return out;
}

const want = expected();
let stale = [];
for (const [rel, content] of want) {
  const dest = path.join(MIRROR, rel);
  if (!existsSync(dest) || readFileSync(dest, "utf8") !== content) stale.push(rel);
}
// files present in the mirror that the canonical tree no longer carries
const extra = existsSync(path.join(MIRROR, "references"))
  ? readdirSync(path.join(MIRROR, "references"))
      .map((f) => path.join("references", f))
      .filter((rel) => !want.has(rel))
  : [];

if (check) {
  if (stale.length || extra.length) {
    for (const rel of stale) console.error(`stale: .agents/skills/waypoint-guide-author/${rel}`);
    for (const rel of extra) console.error(`extra: .agents/skills/waypoint-guide-author/${rel}`);
    console.error("Mirror out of date — run: node scripts/sync-skill-mirror.mjs");
    process.exit(1);
  }
  console.log("Skill mirror in sync.");
  process.exit(0);
}

mkdirSync(path.join(MIRROR, "references"), { recursive: true });
for (const [rel, content] of want) writeFileSync(path.join(MIRROR, rel), content);
for (const rel of extra) rmSync(path.join(MIRROR, rel));
console.log(`Mirror regenerated (${want.size} files${extra.length ? `, ${extra.length} removed` : ""}).`);
