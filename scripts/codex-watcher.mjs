// CLAUDE'S HALF of the reciprocal Claude ↔ Codex PR review loop (Waypoint next-work-order
// spec, 2026-08-23). Codex runs its own EXTERNAL watcher against this repo's PRs — nothing
// here configures or triggers Codex's side. This module is the deterministic control-plane
// logic for CLAUDE's reaction: read a PR's bounded `codex-review-next` section, decide
// whether it is safe and new to act on, and (only then) hand a work order to an isolated
// agent and write the result back into Claude's own bounded `claude-ready-for-codex` section.
//
// Every function here is pure and independently testable — the workflow YAML (
// .github/workflows/claude-codex-watcher.yml) is a thin trigger → check → agent → collect →
// handoff shell around this module, same discipline as scripts/pipeline-v2.mjs.
//
// Protocol (both sides own exactly one bounded section; neither ever rewrites the other's, or
// anything outside its own markers):
//   <!-- claude-ready-for-codex:start --> ... <!-- claude-ready-for-codex:end -->
//   <!-- codex-review-next:start -->      ... <!-- codex-review-next:end -->

import { readFileSync, writeFileSync } from "node:fs";
import { gh, parseArgs, emitOutput } from "./lib/cli.mjs";
import { isMain } from "./audit/lib.mjs";

export const CLAUDE_BEGIN = "<!-- claude-ready-for-codex:start -->";
export const CLAUDE_END = "<!-- claude-ready-for-codex:end -->";
export const CODEX_BEGIN = "<!-- codex-review-next:start -->";
export const CODEX_END = "<!-- codex-review-next:end -->";

const WORK_ORDER_LABEL = "NEXT CLAUDE WORK ORDER:";

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** The one bounded-section primitive every parser/writer below is built from. Fails CLOSED:
 * a missing marker, a duplicated marker (two starts, two ends — which side "wins" is
 * ambiguous), or an end before its start all return null rather than guessing. Mirrors the
 * established repo idiom (scripts/handoff-head.mjs's WARM_START markers, gen-sw-precache.mjs's
 * CORE markers) — indexOf/slice, never a markdown/YAML parser for a plain-text sentinel. */
export function extractBounded(text, beginMarker, endMarker) {
  const t = String(text || "");
  const starts = [...t.matchAll(new RegExp(escapeRe(beginMarker), "g"))];
  const ends = [...t.matchAll(new RegExp(escapeRe(endMarker), "g"))];
  if (starts.length !== 1 || ends.length !== 1) return null;
  const start = starts[0].index;
  const end = ends[0].index;
  if (end <= start) return null;
  return t.slice(start + beginMarker.length, end).trim();
}

/** Replace ONLY the bounded region (markers included) with a freshly built one; everything
 * outside it — Codex's section, the PR description a human wrote, anything else — is
 * preserved byte-for-byte. A body with no existing (well-formed) section of this kind gets one
 * APPENDED, so the very first Claude-ready write on a brand-new PR still works. */
export function replaceBoundedSection(body, beginMarker, endMarker, newInner) {
  const text = String(body || "");
  const block = `${beginMarker}\n${String(newInner).trim()}\n${endMarker}`;
  const starts = [...text.matchAll(new RegExp(escapeRe(beginMarker), "g"))];
  const ends = [...text.matchAll(new RegExp(escapeRe(endMarker), "g"))];
  if (starts.length === 1 && ends.length === 1 && ends[0].index > starts[0].index) {
    const before = text.slice(0, starts[0].index);
    const after = text.slice(ends[0].index + endMarker.length);
    return `${before}${block}${after}`;
  }
  const sep = text.trim() ? "\n\n" : "";
  return `${text}${sep}${block}\n`;
}

function fieldLine(inner, key) {
  const m = inner.match(new RegExp(`^${key}:[ \\t]*(.*)$`, "m"));
  return m ? m[1].trim() : null;
}

function tailSection(inner, label) {
  const idx = inner.indexOf(label);
  if (idx < 0) return "";
  return inner.slice(idx + label.length).trim();
}

/** Parse Codex's bounded section. `ok: false` on ANY malformed/missing marker or required
 * field — the caller must never guess a field that failed to parse. */
export function parseCodexSection(body) {
  const inner = extractBounded(body, CODEX_BEGIN, CODEX_END);
  if (inner == null) return { ok: false, reason: "missing-or-malformed-codex-markers" };

  const reviewedHead = fieldLine(inner, "CODEX_REVIEWED_HEAD");
  const actionRequiredRaw = fieldLine(inner, "CLAUDE_ACTION_REQUIRED");
  const workOrderId = fieldLine(inner, "CLAUDE_WORK_ORDER_ID");
  if (!reviewedHead || actionRequiredRaw == null) {
    return { ok: false, reason: "missing-required-codex-fields" };
  }
  const norm = actionRequiredRaw.toLowerCase();
  if (norm !== "yes" && norm !== "no") {
    return { ok: false, reason: "malformed-claude-action-required-value" };
  }

  return {
    ok: true,
    reviewedHead,
    actionRequired: norm === "yes",
    workOrderId: workOrderId || "",
    workOrderText: tailSection(inner, WORK_ORDER_LABEL),
    raw: inner,
  };
}

/** Parse Claude's OWN previous bounded section (to learn what it last recorded as processed). */
export function parseClaudeSection(body) {
  const inner = extractBounded(body, CLAUDE_BEGIN, CLAUDE_END);
  if (inner == null) return { ok: false, reason: "missing-or-malformed-claude-markers" };

  const head = fieldLine(inner, "CLAUDE_HEAD");
  const processedRaw = fieldLine(inner, "CLAUDE_PROCESSED_WORK_ORDER");
  const readyRaw = fieldLine(inner, "READY_FOR_CODEX_REVIEW");
  const processedWorkOrder = processedRaw && processedRaw.toLowerCase() !== "none" ? processedRaw : null;

  return {
    ok: true,
    head: head || "",
    processedWorkOrder,
    ready: readyRaw ? readyRaw.toLowerCase() === "yes" : false,
    raw: inner,
  };
}

// A work order asking for something outside the watcher's authority is refused, not attempted.
// This is a defense-in-depth SIGNAL — the real enforcement is structural (the agent workspace
// never holds a GitHub write credential and the control plane never merges/publishes/flips a
// selector no matter what it's asked), but a work order that asks for one of these should never
// even reach the agent.
const FORBIDDEN_PATTERNS = [
  { re: /\bauto-?merge\b/i, name: "auto-merge" },
  { re: /\bmerge\b/i, name: "merge" },
  { re: /WAYPOINT_RESEARCH_ENGINE/i, name: "selector-change" },
  { re: /\bpublish(?:ed|ing)?\b/i, name: "publish" },
  { re: /\bdelete\b[^.\n]{0,40}\bbranch(?:es)?\b/i, name: "delete-branch" },
  { re: /\bresume\b[^.\n]{0,20}\bportugal\b/i, name: "resume-portugal" },
  { re: /\b(?:start|begin)\b[^.\n]{0,20}\b(?:a\s+)?(?:new\s+)?canary\b/i, name: "new-canary" },
  { re: /\brepository\s+secrets?\b/i, name: "secrets-change" },
  { re: /\bbypass\b[^.\n]{0,20}\breview\b/i, name: "bypass-review" },
  { re: /\bweaken\b[^.\n]{0,30}\b(?:validation|verification|tests?)\b/i, name: "weaken-validation" },
  { re: /\bcutover\b/i, name: "cutover-decision" },
];

// A negation ("do not merge", "never publish", "won't touch secrets") directly governing a
// forbidden verb means the work order is PROHIBITING that action, not requesting it — Codex's
// own work orders routinely include "do not merge" as a standing disclaimer, so a bare
// substring/word match here would refuse every legitimate work order it ever writes. Only the
// text immediately before the match is checked (not the whole clause), so an EARLIER negated
// aside can't accidentally shield a LATER real imperative in the same sentence.
const NEGATION_RE = /\b(?:do\s+not|does\s+not|did\s+not|don't|doesn't|didn't|never|without|avoid|no)\b/i;
const NEGATION_LOOKBACK_CHARS = 30;
// A hyphenated qualifier ("pre-merge review", "post-merge cleanup") uses the forbidden word as
// an adjective describing a state, not as an imperative asking for the action — must end
// exactly where the match begins, not just appear somewhere nearby.
const QUALIFIER_PREFIX_RE = /(?:pre|post)-$/i;

export function exceedsAuthority(workOrderText) {
  const t = String(workOrderText || "");
  // Split on sentence-ish boundaries first — a clause is the right scope for "is this specific
  // mention negated," rather than the whole (possibly multi-sentence) work order text.
  const clauses = t.split(/(?<=[.\n;])/);
  for (const clause of clauses) {
    for (const p of FORBIDDEN_PATTERNS) {
      const m = p.re.exec(clause);
      if (!m) continue;
      const near = clause.slice(Math.max(0, m.index - NEGATION_LOOKBACK_CHARS), m.index);
      if (NEGATION_RE.test(near)) continue;
      if (QUALIFIER_PREFIX_RE.test(near)) continue;
      return { exceeds: true, name: p.name };
    }
  }
  return { exceeds: false, name: null };
}

/**
 * THE eligibility gate — every one of the work order's 8 conditions in one place, so the
 * workflow (and every test) has a single source of truth instead of scattered `if`s.
 * `codex`/`claude` are the parse results above (or null). Fails closed on anything malformed.
 */
export function isEligible({ prOpen, isSameRepoHead, currentHeadSha, codex, claude }) {
  if (!prOpen) return { eligible: false, reason: "pr-not-open" };
  if (!isSameRepoHead) return { eligible: false, reason: "fork-pr-rejected" };
  if (!codex || codex.ok !== true) {
    return { eligible: false, reason: codex && codex.reason ? codex.reason : "missing-or-malformed-codex-section" };
  }
  if (codex.reviewedHead !== currentHeadSha) return { eligible: false, reason: "stale-reviewed-head" };
  if (codex.actionRequired !== true) return { eligible: false, reason: "no-action-required" };
  if (!codex.workOrderId) return { eligible: false, reason: "missing-work-order-id" };

  const claudeOk = claude && claude.ok === true;
  if (claudeOk && claude.processedWorkOrder === codex.workOrderId) {
    return { eligible: false, reason: "work-order-already-processed" };
  }

  const scope = exceedsAuthority(codex.workOrderText);
  if (scope.exceeds) return { eligible: false, reason: `exceeds-watcher-authority:${scope.name}` };

  return { eligible: true, reason: "eligible" };
}

/** Build the fresh inner content of Claude's bounded section (markers added by the caller via
 * replaceBoundedSection). All three prose fields are CONTROL-PLANE-composed, deterministic
 * strings — never the agent's own free text pasted verbatim — so nothing the agent wrote
 * inside its sandbox can forge a marker or otherwise corrupt the handoff protocol. */
export function buildClaudeSection({ head, processedWorkOrder, summary, validation, uncertainty }) {
  if (!head) throw new Error("buildClaudeSection: head is required");
  const wo = processedWorkOrder && String(processedWorkOrder).trim() ? String(processedWorkOrder).trim() : "none";
  return [
    `CLAUDE_HEAD: ${head}`,
    `CLAUDE_PROCESSED_WORK_ORDER: ${wo}`,
    `READY_FOR_CODEX_REVIEW: yes`,
    ``,
    `Summary:`,
    String(summary || "").trim() || "(none)",
    ``,
    `Validation:`,
    String(validation || "").trim() || "(none)",
    ``,
    `Known uncertainty:`,
    String(uncertainty || "").trim() || "(none)",
  ].join("\n");
}

// ── CLI ──────────────────────────────────────────────────────────────────────
// node scripts/codex-watcher.mjs check --pr <n>
// node scripts/codex-watcher.mjs list-candidates
// node scripts/codex-watcher.mjs build-section --head <sha> --work-order <id> --summary <s> --validation <s> --uncertainty <s>
// node scripts/codex-watcher.mjs update-pr --pr <n> --section-file <f>

function prJson(pr) {
  const raw = gh(["pr", "view", String(pr), "--json", "number,state,body,headRefOid,headRefName,isCrossRepository"]);
  return JSON.parse(raw);
}

function checkOne(data) {
  const codex = parseCodexSection(data.body);
  const claude = parseClaudeSection(data.body);
  const result = isEligible({
    prOpen: data.state === "OPEN",
    isSameRepoHead: data.isCrossRepository === false,
    currentHeadSha: data.headRefOid,
    codex,
    claude,
  });
  return { ...result, codex, claude, head: data.headRefOid, headRefName: data.headRefName };
}

async function cliMain() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  const args = parseArgs(argv.slice(1));

  if (cmd === "check") {
    if (!args.pr) { console.error("[codex-watcher] check --pr <n> required"); return 1; }
    const data = prJson(args.pr);
    const result = checkOne(data);
    emitOutput("eligible", result.eligible ? "true" : "false");
    emitOutput("reason", result.reason);
    emitOutput("work_order_id", result.codex.ok ? result.codex.workOrderId : "");
    emitOutput("head", result.head || "");
    emitOutput("head_ref", result.headRefName || "");
    console.log(JSON.stringify({
      eligible: result.eligible,
      reason: result.reason,
      workOrderId: result.codex.ok ? result.codex.workOrderId : null,
      workOrderText: result.codex.ok ? result.codex.workOrderText : null,
      head: result.head,
      headRefName: result.headRefName,
    }, null, 2));
    return 0;
  }

  if (cmd === "list-candidates") {
    const raw = gh(["pr", "list", "--state", "open", "--json", "number,body,headRefOid,isCrossRepository"]);
    const prs = JSON.parse(raw);
    const candidates = [];
    for (const pr of prs) {
      const result = isEligible({
        prOpen: true,
        isSameRepoHead: pr.isCrossRepository === false,
        currentHeadSha: pr.headRefOid,
        codex: parseCodexSection(pr.body),
        claude: parseClaudeSection(pr.body),
      });
      if (result.eligible) candidates.push(pr.number);
    }
    emitOutput("candidates", JSON.stringify(candidates));
    console.log(JSON.stringify(candidates));
    return 0;
  }

  if (cmd === "build-section") {
    if (!args.head) { console.error("[codex-watcher] build-section --head <sha> [--work-order <id>] --summary <s> --validation <s> --uncertainty <s>"); return 1; }
    const section = buildClaudeSection({
      head: args.head,
      processedWorkOrder: args["work-order"] || "none",
      summary: args.summary || "",
      validation: args.validation || "",
      uncertainty: args.uncertainty || "",
    });
    process.stdout.write(section + "\n");
    return 0;
  }

  if (cmd === "update-pr") {
    if (!args.pr || !args["section-file"]) {
      console.error("[codex-watcher] update-pr --pr <n> --section-file <f>");
      return 1;
    }
    const { body } = JSON.parse(gh(["pr", "view", String(args.pr), "--json", "body"]));
    const newInner = readFileSync(args["section-file"], "utf8");
    const newBody = replaceBoundedSection(body || "", CLAUDE_BEGIN, CLAUDE_END, newInner);
    const tmp = `${args["section-file"]}.body.tmp`;
    writeFileSync(tmp, newBody);
    gh(["pr", "edit", String(args.pr), "--body-file", tmp]);
    console.log(`[codex-watcher] PR #${args.pr} — Claude section updated.`);
    return 0;
  }

  console.error(`[codex-watcher] unknown subcommand "${cmd}" — one of: check, list-candidates, build-section, update-pr`);
  return 1;
}

if (isMain(import.meta.url)) {
  cliMain().then((code) => process.exit(code)).catch((err) => {
    console.error(`[codex-watcher] ${err?.message || err}`);
    process.exit(1);
  });
}
