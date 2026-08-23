#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const passes = [];

function file(rel) {
  return path.join(root, rel);
}

function read(rel) {
  return fs.readFileSync(file(rel), "utf8");
}

function pass(label) {
  passes.push(label);
}

function fail(message) {
  failures.push(message);
}

function requirePath(rel, label = rel, type = "file") {
  if (!fs.existsSync(file(rel))) {
    fail(`${label}: missing ${rel}`);
    return false;
  }

  const stat = fs.statSync(file(rel));
  if (type === "file" && !stat.isFile()) {
    fail(`${label}: expected a file at ${rel}`);
    return false;
  }
  if (type === "directory" && !stat.isDirectory()) {
    fail(`${label}: expected a directory at ${rel}`);
    return false;
  }

  pass(label);
  return true;
}

function requireText(rel, needle, label) {
  if (!requirePath(rel, `${label} source`)) return;
  if (!read(rel).includes(needle)) fail(`${label}: expected contract text not found`);
  else pass(label);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function jobBlock(yaml, name) {
  const start = new RegExp(`^  ${escapeRegExp(name)}:\\s*$`, "m").exec(yaml);
  if (!start) return null;
  const bodyStart = start.index + start[0].length;
  const remainder = yaml.slice(bodyStart);
  const nextJob = /^  [A-Za-z0-9_-]+:\s*$/m.exec(remainder);
  return remainder.slice(0, nextJob ? nextJob.index : undefined);
}

function requireJobPermissions(yaml, jobName, expected, forbidden = []) {
  const block = jobBlock(yaml, jobName);
  if (!block) {
    fail(`Claude↔Codex watcher: missing ${jobName} job`);
    return;
  }

  for (const [scope, level] of Object.entries(expected)) {
    const line = new RegExp(`^    ${escapeRegExp(scope)}: ${escapeRegExp(level)}\\s*$`, "m");
    if (!line.test(block)) fail(`Claude↔Codex watcher: ${jobName} must set ${scope}: ${level}`);
  }

  for (const needle of forbidden) {
    if (block.includes(needle)) fail(`Claude↔Codex watcher: ${jobName} contains forbidden privilege ${needle}`);
  }

  if (!failures.some((item) => item.includes(`Claude↔Codex watcher: ${jobName}`))) {
    pass(`Claude↔Codex ${jobName} permission boundary`);
  }
}

// Runtime agent instructions must stay behaviorally in sync. Their short preambles are
// intentionally tool-specific; everything after the first horizontal rule is shared policy.
const agents = read("AGENTS.md");
const claude = read("CLAUDE.md");
const sharedBody = (text) => {
  const marker = "\n---\n";
  const at = text.indexOf(marker);
  return at === -1 ? text : text.slice(at + marker.length);
};
if (sharedBody(agents) !== sharedBody(claude)) fail("Agent policy parity: AGENTS.md and CLAUDE.md shared bodies differ");
else pass("Agent policy parity");

// Pipeline V1 and V2 coexist until an explicitly approved cutover.
requirePath(".github/workflows/research-pass.yml", "Pipeline V1 workflow");
requirePath(".github/workflows/research-pass-v2.yml", "Pipeline V2 workflow");
requirePath("scripts/pipeline.mjs", "Pipeline V1 orchestrator");
requirePath("scripts/pipeline-v2.mjs", "Pipeline V2 orchestrator");
requireText(".github/workflows/new-guide.yml", "if: vars.WAYPOINT_RESEARCH_ENGINE == 'v2'", "Explicit V2 selector gate");
requireText(".github/workflows/new-guide.yml", "gh workflow run research-pass.yml", "V1 fallback remains available");

// The reciprocal review worker must keep a real job-level privilege boundary. Inspect each
// top-level job separately so a later publish permission cannot accidentally satisfy validate.
const watcher = read(".github/workflows/claude-codex-watcher.yml");
requireJobPermissions(
  watcher,
  "validate",
  { contents: "read", "pull-requests": "read" },
  ["contents: write", "pull-requests: write", "issues: write", "actions: write"],
);
requireJobPermissions(watcher, "publish", { contents: "write", "pull-requests": "write" });
const publishBlock = jobBlock(watcher, "publish");
if (publishBlock && !/^    needs: validate\s*$/m.test(publishBlock)) fail("Claude↔Codex watcher: publish must depend on validate");
else if (publishBlock) pass("Claude↔Codex publish depends on validate");

// Protected traveler-facing architecture.
requirePath("src/features/trip-split/index.ts", "Trip Split feature");
requireText("src/features/trip-split/index.ts", "computeSplits", "Trip Split deterministic split engine");
requireText("src/features/trip-split/index.ts", "settle", "Trip Split settlement engine");
requirePath("src/features/itinerary", "Day-to-day itinerary feature", "directory");
requirePath("src/features/maps", "Maps feature", "directory");
requirePath("src/features/sos", "SOS feature", "directory");
requirePath("public/sw.js", "Offline service worker");

// Product doctrine that must not be lost during cleanup.
requireText("AGENTS.md", "Sights and Food are REPOSITORIES", "Sights/Food breadth doctrine");
requireText("AGENTS.md", "pipeline critic findings", "Traveler/process learnings separation");

// Future Atlas redesign authority is intentionally preserved during backend cleanup.
requirePath("docs/design-handoff/DESIGN.md", "Atlas written design authority");
requirePath("docs/design-handoff/enforcement/ACCEPTANCE.md", "Atlas acceptance contract");
requirePath("docs/design-handoff/enforcement/check-drift.mjs", "Atlas drift checker");

// Canary #4 was accepted only as draft content. Cleanup must not silently publish it.
const uruguayMetaPath = "src/content/guides/uruguay/_guide.json";
if (requirePath(uruguayMetaPath, "Uruguay Canary #4 guide")) {
  try {
    const meta = JSON.parse(read(uruguayMetaPath));
    if (meta.draft !== true) fail("Uruguay Canary #4: draft must remain true");
    else pass("Uruguay Canary #4 remains draft");
  } catch (error) {
    fail(`Uruguay Canary #4 metadata: invalid JSON (${error.message})`);
  }
}

if (failures.length) {
  console.error("\nWaypoint invariant check FAILED:\n");
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  console.error(`\n${failures.length} invariant(s) failed; cleanup must not ship.\n`);
  process.exit(1);
}

console.log(`Waypoint invariant check PASS — ${new Set(passes).size} protected contracts confirmed.`);
