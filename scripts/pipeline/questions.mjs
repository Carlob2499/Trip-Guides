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
