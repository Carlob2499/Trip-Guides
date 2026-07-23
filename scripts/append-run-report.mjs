// Appends a run report to the pipeline run ledger (W3 IMPROVE loop). Called by a post-agent
// `if: always()` step in research-pass.yml and recert.yml. Every generation/recert run deposits a
// comment on ONE pinned tracking issue (find-or-create, content-audit.yml pattern) — so the
// skill-retro proposer (skill-retro.yml) has evidence to reason over: how many attempts a guide
// took, what the agent reported about searches / what the critic caught / where the skill created
// friction. A ledger of comments, NOT a committed file, because recert's matrix would race pushes
// to main and issue comments are already keyless-readable for aggregation.
//
//   WORKFLOW=research-pass SLUG=<slug> MODEL=<model> RUN_URL=<url> [NOTE_FILE=run-report.md] \
//     node scripts/append-run-report.mjs

import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isMain } from "./audit/lib.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LEDGER_TITLE = "📒 Pipeline run ledger";
const LEDGER_LABEL = "run-ledger";

// Pure: build the ledger comment from what the run knows. `note` is the agent's own short
// run-report (searches used, what the critic caught, skill friction) if it wrote one.
export function buildComment({ workflow, slug, model, attempts, runUrl, note, date }) {
  const head = `### ${workflow || "run"} · \`${slug || "?"}\` — ${date || "?"}`;
  const facts = [
    `- **model:** ${model || "—"}`,
    attempts != null ? `- **attempts:** ${attempts}` : null,
    runUrl ? `- **run:** ${runUrl}` : null,
  ].filter(Boolean);
  const body = note && note.trim() ? ["", note.trim()] : [];
  return [head, "", ...facts, ...body].join("\n");
}

function gh(args) {
  return execFileSync("gh", args, { encoding: "utf8" });
}

// The pipeline checkpoint records an attempt counter (scripts/pipeline.mjs). Read it if present so
// the ledger shows how many tries a guide took to reach verified. recert runs have no state file.
function readAttempts(slug) {
  if (!slug) return null;
  const p = path.join(ROOT, "guides-intake", `${slug}.state.json`);
  if (!existsSync(p)) return null;
  try {
    const state = JSON.parse(readFileSync(p, "utf8"));
    return state.attempts ?? state.attempt ?? null;
  } catch {
    return null;
  }
}

function readNote() {
  const f = process.env.NOTE_FILE;
  if (!f) return null;
  const p = path.isAbsolute(f) ? f : path.join(ROOT, f);
  if (!existsSync(p)) return null;
  try {
    return readFileSync(p, "utf8");
  } catch {
    return null;
  }
}

function findLedgerIssue() {
  const out = gh(["issue", "list", "--search", `"${LEDGER_TITLE}" in:title`, "--state", "open", "--json", "number,title"]);
  const found = JSON.parse(out).find((i) => i.title === LEDGER_TITLE);
  return found ? found.number : null;
}

if (isMain(import.meta.url)) {
  const slug = process.env.SLUG || "";
  const comment = buildComment({
    workflow: process.env.WORKFLOW,
    slug,
    model: process.env.MODEL,
    attempts: readAttempts(slug),
    runUrl: process.env.RUN_URL,
    note: readNote(),
    date: new Date().toISOString().slice(0, 10),
  });

  let num = findLedgerIssue();
  if (!num) {
    const created = gh([
      "issue", "create", "--title", LEDGER_TITLE, "--label", LEDGER_LABEL,
      "--body", "_Automated ledger of pipeline runs (research-pass, recert). Each run appends a comment; the skill-retro proposer reads these for evidence. Not a source of truth — just a trail._",
    ]);
    const m = created.match(/\/issues\/(\d+)/);
    num = m ? m[1] : null;
  }
  if (num) {
    gh(["issue", "comment", String(num), "--body", comment]);
    console.log(`[run-ledger] appended to issue #${num}`);
  } else {
    console.error("[run-ledger] could not find or create the ledger issue");
  }
}
