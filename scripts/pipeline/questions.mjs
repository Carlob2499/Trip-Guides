// TRAVELER QUESTIONS — surface, never gate.
//
// Research must never block on a human, so an agent that hits a fork it cannot resolve records a
// question card in the ledger, states the assumption it proceeded on, and keeps going. Until this
// existed those questions died in a file nobody reads — which is how a shipped guide could rest
// on two silently-assumed forks. This turns the open cards into a comment on the intake issue, so
// the traveler at least SEES what was assumed for them.
//
// Not a gate (creator's ruling): no label swap, no pause, no failed step. The guide ships on the
// assumption; a correction arrives later as a change request. Deduped by question id against the
// issue's existing comments, so a resumed run never re-asks the same fork.

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gh } from "../lib/cli.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const INTAKE_DIR = path.join(ROOT, "guides-intake");

// Pure: the ledger's `## Questions for the traveler` cards, as records. `status` is whatever the
// card claims; callers filter.
export function parseQuestions(ledgerMd) {
  const after = String(ledgerMd || "").split(/^## Questions for the traveler/m)[1];
  if (!after) return [];
  return after
    .split(/^## /m)[0]
    .split(/^### /m)
    .slice(1)
    .map((block) => {
      const lines = block.split(/\r?\n/);
      const id = lines[0].trim();
      const value = (label) => {
        const marker = `**${label}:**`;
        const line = lines.find((l) => l.includes(marker));
        return line ? line.slice(line.indexOf(marker) + marker.length).trim() : "";
      };
      const status = (/Status:\W*\s*(\w+)/i.exec(block) || [])[1] || "";
      return { id, status: status.toLowerCase(), q: value("Q"), assumed: value("Assumed"), context: value("Context") };
    })
    .filter((c) => c.id);
}

// Pure: open cards this issue has not already been told about.
export function unaskedOpen(cards, alreadyAsked = "") {
  return cards.filter((c) => c.status === "open" && !String(alreadyAsked).includes(c.id));
}

// Pure: the comment body, or "" when there is nothing to say.
export function formatComment(open) {
  if (!open.length) return "";
  const lines = [
    open.length === 1
      ? "**One decision came up while building your guide.**"
      : `**${open.length} decisions came up while building your guide.**`,
    "",
    "Research never waits on an answer, so each was built on the assumption below — your guide is complete either way. If an assumption is wrong, use the **✎ Request a change** button on the guide (or reply here) and it gets fixed without rebuilding anything.",
    "",
  ];
  open.forEach((o, i) => {
    lines.push(`${i + 1}. **${o.q || o.id}**`);
    if (o.assumed) lines.push(`   - Built on: ${o.assumed}`);
    if (o.context) lines.push(`   - Affects: ${o.context}`);
    lines.push(`   - <sub>${o.id}</sub>`);
  });
  return lines.join("\n");
}

// ── answers, back into the run that asked (M6, Pipeline V2) ──────────────────

/** Pure routing decision for a traveler answer: while research is ACTIVE (stages incomplete,
    guide still a draft, a research branch exists) the answer belongs to that run's ledger —
    a change run would fork from main and edit the scaffold while the real work sits on the
    research branch. Published/complete guides keep the change-run behavior unchanged. */
export function routeAnswers({ hasAnswers, researchActive, researchBranch, published }) {
  if (!hasAnswers) return { target: "change", branch: null, reason: "no dispatched answers — ledger-driven change run" };
  if (published) return { target: "change", branch: null, reason: "guide is published — a change run absorbs the answers" };
  if (researchActive && researchBranch) {
    return { target: "research", branch: researchBranch, reason: "research is active — the answers go to that run's ledger, and the run absorbs them" };
  }
  return {
    target: "change",
    branch: null,
    reason: researchActive
      ? "research looks active but no research branch exists on origin — change run (it queues behind research in the guide-<slug> group)"
      : "no active research — a change run absorbs the answers",
  };
}

/** Pure: mark ledger question cards answered. For each {id, answer}: find the `### <id>` card,
    record `- **A:** <answer>` and flip `- **Status:** open` → `answered` (the exact shape
    plan.mjs's answeredQuestions() reads back). Idempotent: an already-answered card is left
    alone. Answers are flattened to one line — a card is a line-oriented record. */
export function applyAnswers(ledgerMd, answers) {
  let text = String(ledgerMd || "");
  const applied = [];
  const missing = [];
  for (const a of answers || []) {
    const heading = `### ${a.id}`;
    let start = text.startsWith(heading) ? 0 : text.indexOf(`\n${heading}`);
    if (start > 0) start += 1;
    if (start < 0) { missing.push(a.id); continue; }
    const afterHeading = start + heading.length;
    const nextH = text.slice(afterHeading).search(/\n##+ /);
    const end = nextH === -1 ? text.length : afterHeading + nextH + 1;
    let block = text.slice(start, end);
    if (/-\s+\*\*A:\*\*/.test(block)) { applied.push({ id: a.id, already: true }); continue; }
    const oneLine = String(a.answer).replace(/\s*\r?\n\s*/g, " ").trim();
    if (/-\s+\*\*Status:\*\*/.test(block)) {
      block = block.replace(/-\s+\*\*Status:\*\*\s*\S+/, `- **A:** ${oneLine}\n- **Status:** answered`);
    } else {
      block = block.replace(/\s*$/, `\n- **A:** ${oneLine}\n- **Status:** answered\n`);
    }
    text = text.slice(0, start) + block + text.slice(end);
    applied.push({ id: a.id, already: false });
  }
  return { text, applied, missing };
}

/** IO half: apply to the guide's ledger on disk (the caller has the research branch checked
    out). Returns what applyAnswers found. */
export async function applyAnswersToLedger(slug, answers, { intakeDir = INTAKE_DIR } = {}) {
  const ledgerFile = path.join(intakeDir, slug, "ledger.md");
  if (!existsSync(ledgerFile)) return { applied: [], missing: (answers || []).map((a) => a.id), noLedger: true };
  const { writeFile } = await import("node:fs/promises");
  const result = applyAnswers(await readFile(ledgerFile, "utf8"), answers);
  if (result.applied.some((a) => !a.already)) await writeFile(ledgerFile, result.text);
  return result;
}

/** CLI body: read the ledger, dedup against the issue's comments, post. Never throws upward. */
export async function surfaceQuestions({ slug, issue, intakeDir = INTAKE_DIR, json = false }) {
  const ledgerFile = path.join(intakeDir, slug, "ledger.md");
  if (!existsSync(ledgerFile)) {
    console.log("[questions] no ledger yet — nothing to surface.");
    return 0;
  }
  const cards = parseQuestions(await readFile(ledgerFile, "utf8"));

  let asked = "";
  if (issue) {
    try { asked = gh(["issue", "view", String(issue), "--json", "comments", "-q", "[.comments[].body] | join(\"\\n\")"]); }
    catch { asked = ""; }
  }

  const open = unaskedOpen(cards, asked);
  if (json) {
    console.log(JSON.stringify(open));
    return 0;
  }

  const body = formatComment(open);
  if (!body) {
    console.log("[questions] none open, or all already asked.");
    return 0;
  }
  if (!issue) {
    console.log(body);
    return 0;
  }
  try {
    gh(["issue", "comment", String(issue), "--body", body]);
    console.log(`[questions] surfaced ${open.length} on #${issue}`);
  } catch (err) {
    // Never fails the run: a notification hiccup must not turn a good research pass red.
    console.error(`[questions] could not comment on #${issue}: ${err.message}`);
  }
  return 0;
}
