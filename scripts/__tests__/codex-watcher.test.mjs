/* Behavioral coverage for Claude's half of the reciprocal Claude<->Codex PR review loop.
   Every case named in the work order (2026-08-23) is tested against the real exported
   functions — never against source text — so a refactor that keeps the BEHAVIOR intact
   never has to touch this file, and a refactor that breaks it always does. */

// @protects-file A Codex work order only ever executes once, only at the exact head Codex
// reviewed, only on a same-repo PR, and never asks the agent to merge/publish/change secrets.

import { describe, it, expect } from "vitest";
import {
  CLAUDE_BEGIN,
  CLAUDE_END,
  CODEX_BEGIN,
  CODEX_END,
  extractBounded,
  replaceBoundedSection,
  parseCodexSection,
  parseClaudeSection,
  isEligible,
  exceedsAuthority,
  buildClaudeSection,
} from "../codex-watcher.mjs";

const HEAD_A = "a".repeat(40);
const HEAD_B = "b".repeat(40);

function codexBody({ reviewedHead = HEAD_A, actionRequired = "yes", workOrderId = "wo-1", workOrder = "Fix the typo in README.md." } = {}) {
  return [
    CODEX_BEGIN,
    `CODEX_REVIEWED_HEAD: ${reviewedHead}`,
    `CLAUDE_ACTION_REQUIRED: ${actionRequired}`,
    `CLAUDE_WORK_ORDER_ID: ${workOrderId}`,
    ``,
    `Verdict:`,
    `NEEDS_WORK`,
    ``,
    `Blocking findings:`,
    `- one nit`,
    ``,
    `Accepted claims:`,
    `- none`,
    ``,
    `Unresolved/live-only:`,
    `- none`,
    ``,
    `NEXT CLAUDE WORK ORDER:`,
    workOrder,
    CODEX_END,
  ].join("\n");
}

function claudeBody({ head = HEAD_A, processedWorkOrder = "none", ready = "yes" } = {}) {
  return [
    CLAUDE_BEGIN,
    `CLAUDE_HEAD: ${head}`,
    `CLAUDE_PROCESSED_WORK_ORDER: ${processedWorkOrder}`,
    `READY_FOR_CODEX_REVIEW: ${ready}`,
    ``,
    `Summary:`,
    `did stuff`,
    ``,
    `Validation:`,
    `gates green`,
    ``,
    `Known uncertainty:`,
    `none`,
    CLAUDE_END,
  ].join("\n");
}

function fullBody(opts = {}) {
  return `${claudeBody(opts.claude)}\n\n${codexBody(opts.codex)}\n`;
}

describe("extractBounded", () => {
  it("returns the trimmed inner content between well-formed markers", () => {
    expect(extractBounded("pre\n<!--a-->\nINNER\n<!--b-->\npost", "<!--a-->", "<!--b-->")).toBe("INNER");
  });
  it("returns null when a marker is missing", () => {
    expect(extractBounded("no markers here", "<!--a-->", "<!--b-->")).toBeNull();
  });
  it("returns null when the end precedes the start", () => {
    expect(extractBounded("<!--b-->x<!--a-->", "<!--a-->", "<!--b-->")).toBeNull();
  });
  it("returns null when a marker is duplicated (ambiguous)", () => {
    expect(extractBounded("<!--a-->1<!--b-->junk<!--a-->2<!--b-->", "<!--a-->", "<!--b-->")).toBeNull();
  });
});

describe("replaceBoundedSection", () => {
  it("replaces only the bounded region, preserving everything outside it byte-for-byte", () => {
    const body = `before\n${CLAUDE_BEGIN}\nOLD\n${CLAUDE_END}\nafter\n\n${codexBody()}`;
    const out = replaceBoundedSection(body, CLAUDE_BEGIN, CLAUDE_END, "NEW CONTENT");
    expect(out).toContain("before\n");
    expect(out).toContain("after\n");
    expect(out).toContain(codexBody()); // Codex's own section is untouched
    expect(out).not.toContain("OLD");
    expect(out).toContain("NEW CONTENT");
  });

  it("APPENDS a fresh bounded block when none exists yet (first Claude-ready write)", () => {
    const body = "A human wrote this PR description.";
    const out = replaceBoundedSection(body, CLAUDE_BEGIN, CLAUDE_END, "CLAUDE_HEAD: x");
    expect(out).toContain("A human wrote this PR description.");
    expect(out).toContain(CLAUDE_BEGIN);
    expect(out).toContain("CLAUDE_HEAD: x");
    expect(out).toContain(CLAUDE_END);
  });

  it("never touches Codex's section when appending Claude's for the first time", () => {
    const body = `some intro\n\n${codexBody()}`;
    const out = replaceBoundedSection(body, CLAUDE_BEGIN, CLAUDE_END, "CLAUDE_HEAD: x");
    expect(out).toContain(codexBody());
  });
});

describe("parseCodexSection", () => {
  it("parses a well-formed section", () => {
    const r = parseCodexSection(codexBody());
    expect(r.ok).toBe(true);
    expect(r.reviewedHead).toBe(HEAD_A);
    expect(r.actionRequired).toBe(true);
    expect(r.workOrderId).toBe("wo-1");
    expect(r.workOrderText).toContain("Fix the typo");
  });

  it("case 5 — malformed markers refuse (missing end marker)", () => {
    const broken = codexBody().replace(CODEX_END, "");
    expect(parseCodexSection(broken).ok).toBe(false);
  });

  it("case 5 — malformed markers refuse (duplicated begin marker)", () => {
    const broken = `${CODEX_BEGIN}\n${codexBody()}`;
    expect(parseCodexSection(broken).ok).toBe(false);
  });

  it("case 6 — missing work-order id parses ok but eligibility must still refuse", () => {
    const body = codexBody({ workOrderId: "" });
    const r = parseCodexSection(body);
    expect(r.ok).toBe(true);
    expect(r.workOrderId).toBe("");
  });

  it("rejects a malformed CLAUDE_ACTION_REQUIRED value instead of guessing", () => {
    const body = codexBody({ actionRequired: "maybe" });
    expect(parseCodexSection(body).ok).toBe(false);
  });
});

describe("parseClaudeSection", () => {
  it("parses a well-formed section, treating literal 'none' as unprocessed", () => {
    const r = parseClaudeSection(claudeBody({ processedWorkOrder: "none" }));
    expect(r.ok).toBe(true);
    expect(r.processedWorkOrder).toBeNull();
    expect(r.ready).toBe(true);
  });

  it("parses a recorded processed work-order id", () => {
    const r = parseClaudeSection(claudeBody({ processedWorkOrder: "wo-1" }));
    expect(r.processedWorkOrder).toBe("wo-1");
  });
});

describe("exceedsAuthority", () => {
  it("flags a work order that asks the watcher to merge", () => {
    expect(exceedsAuthority("Please merge this once green.").exceeds).toBe(true);
  });
  it("flags enabling the research-engine selector", () => {
    expect(exceedsAuthority("Set WAYPOINT_RESEARCH_ENGINE=v2 in repo vars.").exceeds).toBe(true);
  });
  it("flags publishing a guide", () => {
    expect(exceedsAuthority("Go ahead and publish the Uruguay guide.").exceeds).toBe(true);
  });
  it("flags weakening validation", () => {
    expect(exceedsAuthority("Just weaken the verification gate so it passes.").exceeds).toBe(true);
  });
  it("does not flag an ordinary code fix", () => {
    expect(exceedsAuthority("Rename the unused `foo` variable to `bar` in src/lib/x.ts.").exceeds).toBe(false);
  });
});

describe("isEligible — the 8 conditions, one function, one source of truth", () => {
  const base = () => ({
    prOpen: true,
    isSameRepoHead: true,
    currentHeadSha: HEAD_A,
    codex: parseCodexSection(codexBody()),
    claude: parseClaudeSection(claudeBody({ processedWorkOrder: "none" })),
  });

  it("case 1 — a valid, exact-head work order is eligible", () => {
    expect(isEligible(base())).toMatchObject({ eligible: true });
  });

  it("case 2 — a stale reviewed HEAD refuses", () => {
    const ctx = base();
    ctx.currentHeadSha = HEAD_B; // head moved after Codex reviewed HEAD_A
    expect(isEligible(ctx)).toMatchObject({ eligible: false, reason: "stale-reviewed-head" });
  });

  it("case 3 — a duplicate (already-processed) work-order id refuses", () => {
    const ctx = base();
    ctx.claude = parseClaudeSection(claudeBody({ processedWorkOrder: "wo-1" }));
    expect(isEligible(ctx)).toMatchObject({ eligible: false, reason: "work-order-already-processed" });
  });

  it("case 4 — a fork PR refuses", () => {
    const ctx = base();
    ctx.isSameRepoHead = false;
    expect(isEligible(ctx)).toMatchObject({ eligible: false, reason: "fork-pr-rejected" });
  });

  it("case 5 — malformed Codex markers refuse", () => {
    const ctx = base();
    ctx.codex = parseCodexSection(codexBody().replace(CODEX_END, ""));
    const r = isEligible(ctx);
    expect(r.eligible).toBe(false);
  });

  it("case 6 — a missing work-order id refuses", () => {
    const ctx = base();
    ctx.codex = parseCodexSection(codexBody({ workOrderId: "" }));
    expect(isEligible(ctx)).toMatchObject({ eligible: false, reason: "missing-work-order-id" });
  });

  it("case 7 — CLAUDE_ACTION_REQUIRED: no does nothing", () => {
    const ctx = base();
    ctx.codex = parseCodexSection(codexBody({ actionRequired: "no" }));
    expect(isEligible(ctx)).toMatchObject({ eligible: false, reason: "no-action-required" });
  });

  it("a closed PR refuses even with an otherwise-valid work order", () => {
    const ctx = base();
    ctx.prOpen = false;
    expect(isEligible(ctx)).toMatchObject({ eligible: false, reason: "pr-not-open" });
  });

  it("case 15 — a work order that exceeds watcher authority refuses", () => {
    const ctx = base();
    ctx.codex = parseCodexSection(codexBody({ workOrder: "Please merge this PR and enable auto-merge." }));
    const r = isEligible(ctx);
    expect(r.eligible).toBe(false);
    expect(r.reason).toMatch(/^exceeds-watcher-authority:/);
  });

  it("case 8 — a PR-body edit that does not change the codex identity fields yields the SAME decision both times (no reaction to body noise)", () => {
    // Simulate: PR description prose changes (a human edits a typo) but Codex's own section
    // (and therefore its identity: reviewedHead + workOrderId) is untouched.
    const bodyBefore = `Some description.\n\n${codexBody()}`;
    const bodyAfter = `Some description, fixed a typo.\n\n${codexBody()}`;
    const decide = (body) => isEligible({
      prOpen: true,
      isSameRepoHead: true,
      currentHeadSha: HEAD_A,
      codex: parseCodexSection(body),
      claude: parseClaudeSection(claudeBody({ processedWorkOrder: "wo-1" })), // already processed
    });
    expect(decide(bodyBefore)).toEqual(decide(bodyAfter));
    expect(decide(bodyAfter).eligible).toBe(false);
  });

  it("case 9 / 16 — isEligible is a pure function of state: repeated calls (event-triggered or scheduled-fallback) never diverge, so a missed event and a duplicate delivery both resolve to the identical decision", () => {
    const ctx = base();
    const first = isEligible(ctx);
    const second = isEligible(ctx);
    const third = isEligible({ ...ctx }); // fresh object, same values — as if computed by a different job
    expect(first).toEqual(second);
    expect(second).toEqual(third);
  });
});

describe("buildClaudeSection", () => {
  it("case 10/11/12 — records the processed work-order id, the new head, and marks ready", () => {
    const section = buildClaudeSection({
      head: HEAD_B,
      processedWorkOrder: "wo-1",
      summary: "Fixed the typo.",
      validation: "lint/typecheck/test/build all green.",
      uncertainty: "none",
    });
    expect(section).toContain(`CLAUDE_HEAD: ${HEAD_B}`);
    expect(section).toContain("CLAUDE_PROCESSED_WORK_ORDER: wo-1");
    expect(section).toContain("READY_FOR_CODEX_REVIEW: yes");
    // Round-trips through the real parser, not just a substring check.
    const wrapped = `${CLAUDE_BEGIN}\n${section}\n${CLAUDE_END}`;
    const parsed = parseClaudeSection(wrapped);
    expect(parsed).toMatchObject({ ok: true, head: HEAD_B, processedWorkOrder: "wo-1", ready: true });
  });

  it("throws rather than emitting a section with no head", () => {
    expect(() => buildClaudeSection({ head: "", processedWorkOrder: "wo-1" })).toThrow();
  });

  it("case 13 — building and writing back a new section preserves Codex's own section and any other PR-body content untouched", () => {
    const originalBody = fullBody({ claude: { processedWorkOrder: "none" } });
    const newSection = buildClaudeSection({ head: HEAD_B, processedWorkOrder: "wo-1", summary: "x", validation: "y", uncertainty: "z" });
    const updated = replaceBoundedSection(originalBody, CLAUDE_BEGIN, CLAUDE_END, newSection);
    expect(updated).toContain(codexBody()); // Codex's section, byte-for-byte
    expect(updated).not.toContain("CLAUDE_PROCESSED_WORK_ORDER: none"); // the OLD Claude section is gone
    expect(updated).toContain("CLAUDE_PROCESSED_WORK_ORDER: wo-1");
  });
});

describe("end-to-end protocol shape", () => {
  it("a full round trip — Codex reviews head A, Claude processes it, the resulting new section is eligible-blocking for the SAME work order at the NEW head", () => {
    // 1. Codex reviews head A, issues work-order wo-1.
    const afterCodexReview = fullBody({ claude: { processedWorkOrder: "none" }, codex: { reviewedHead: HEAD_A, workOrderId: "wo-1" } });
    const decision1 = isEligible({
      prOpen: true, isSameRepoHead: true, currentHeadSha: HEAD_A,
      codex: parseCodexSection(afterCodexReview), claude: parseClaudeSection(afterCodexReview),
    });
    expect(decision1.eligible).toBe(true);

    // 2. Claude processes wo-1, pushes head B, and records it.
    const newClaudeSection = buildClaudeSection({ head: HEAD_B, processedWorkOrder: "wo-1", summary: "s", validation: "v", uncertainty: "u" });
    const afterClaudeFix = replaceBoundedSection(afterCodexReview, CLAUDE_BEGIN, CLAUDE_END, newClaudeSection);

    // 3. Codex's section still says reviewedHead=A / workOrderId=wo-1 (Codex hasn't reviewed
    //    yet) — re-running the SAME decision at the NEW head must refuse (stale head), and
    //    at the OLD head must refuse too (already processed). Neither can re-fire wo-1.
    const staleAtNewHead = isEligible({
      prOpen: true, isSameRepoHead: true, currentHeadSha: HEAD_B,
      codex: parseCodexSection(afterClaudeFix), claude: parseClaudeSection(afterClaudeFix),
    });
    expect(staleAtNewHead).toMatchObject({ eligible: false, reason: "stale-reviewed-head" });

    const dupeAtOldHead = isEligible({
      prOpen: true, isSameRepoHead: true, currentHeadSha: HEAD_A,
      codex: parseCodexSection(afterClaudeFix), claude: parseClaudeSection(afterClaudeFix),
    });
    expect(dupeAtOldHead).toMatchObject({ eligible: false, reason: "work-order-already-processed" });

    // 4. Codex independently reviews the NEW head B and issues a FRESH work-order id — now,
    //    and only now, does eligibility open up again.
    const afterSecondCodexReview = replaceBoundedSection(
      afterClaudeFix, CODEX_BEGIN, CODEX_END,
      codexBody({ reviewedHead: HEAD_B, workOrderId: "wo-2" }).slice(CODEX_BEGIN.length, -CODEX_END.length).trim(),
    );
    const decision2 = isEligible({
      prOpen: true, isSameRepoHead: true, currentHeadSha: HEAD_B,
      codex: parseCodexSection(afterSecondCodexReview), claude: parseClaudeSection(afterSecondCodexReview),
    });
    expect(decision2.eligible).toBe(true);
  });
});
