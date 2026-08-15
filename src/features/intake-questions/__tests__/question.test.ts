// @protects-file Follow-up questions asked during intake are the ones the answers actually warrant.

import { describe, it, expect } from "vitest";
import {
  validateQuestion,
  hasBannedTerm,
  parseQuestionsFromIntake,
  formatQuestionBlock,
  buildAnswerPayload,
  BANNED_TERMS,
  DECISION_SECTIONS,
} from "../index";
import type { IntakeQuestion } from "../index";
import { MOCK_QUESTIONS } from "../mocks/seeds";

const validQ: IntakeQuestion = {
  id: "q-japan-1",
  text: "Do you prefer Oct 15 or Oct 22?",
  assumption: "Oct 15 — earlier gives a buffer.",
  context: "Trip dates",
  emittedAt: "2026-07-29T10:00:00Z",
  answer: null,
  answeredAt: null,
  status: "open",
};

describe("hasBannedTerm", () => {
  it("returns null for clean text", () => {
    expect(hasBannedTerm("Do you prefer Oct 15 or Oct 22?")).toBeNull();
  });

  it("catches pipeline vocabulary", () => {
    expect(hasBannedTerm("Should the agent run Pass A again?")).toBe("agent");
  });

  it("catches all declared banned terms", () => {
    for (const term of BANNED_TERMS) {
      expect(hasBannedTerm(`Something about ${term} here`), `should catch "${term}"`).toBeTruthy();
    }
  });
});

describe("validateQuestion", () => {
  it("passes a valid question", () => {
    expect(validateQuestion(validQ)).toEqual([]);
  });

  it("rejects missing id", () => {
    expect(validateQuestion({ ...validQ, id: "" })).toContain("missing id");
  });

  it("rejects missing text", () => {
    expect(validateQuestion({ ...validQ, text: "" })).toContain("missing text");
  });

  it("rejects banned terms in text", () => {
    const errs = validateQuestion({ ...validQ, text: "Should the pipeline continue?" });
    expect(errs.some((e) => e.includes("banned term"))).toBe(true);
  });

  it("rejects banned terms in assumption", () => {
    const errs = validateQuestion({ ...validQ, assumption: "The agent will proceed." });
    expect(errs.some((e) => e.includes("banned term"))).toBe(true);
  });
});

describe("formatQuestionBlock + parseQuestionsFromIntake round-trip", () => {
  it("formats and parses back", () => {
    const block = formatQuestionBlock(validQ);
    const md = `## Questions for the traveler\n${block}\n\n## Next section`;
    const parsed = parseQuestionsFromIntake(md);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe(validQ.id);
    expect(parsed[0].text).toBe(validQ.text);
    expect(parsed[0].assumption).toBe(validQ.assumption);
    expect(parsed[0].status).toBe("open");
  });

  it("returns empty for missing section", () => {
    expect(parseQuestionsFromIntake("# Some other doc\nno questions")).toEqual([]);
  });

  it("round-trips a fork's named options through the one-line format", () => {
    const fork: IntakeQuestion = {
      ...validQ,
      id: "fork-japan-1",
      options: ["Keep Kanazawa", "Swap for Hakone"],
    };
    const md = `## Blocking forks\n${formatQuestionBlock(fork)}\n`;
    const parsed = parseQuestionsFromIntake(md);
    expect(parsed[0].options).toEqual(["Keep Kanazawa", "Swap for Hakone"]);
  });

  it("marks items under 'Blocking forks' as blocking and plain questions as not", () => {
    const md =
      `## Questions for the traveler\n${formatQuestionBlock(validQ)}\n\n` +
      `## Blocking forks\n${formatQuestionBlock({ ...validQ, id: "fork-japan-1", options: ["A", "B"] })}\n`;
    const parsed = parseQuestionsFromIntake(md);
    expect(parsed.map((q) => q.id)).toEqual(["q-japan-1", "fork-japan-1"]);
    expect(parsed[0].blocking).toBeUndefined();
    expect(parsed[1].blocking).toBe(true);
  });

  it("leaves options absent — not an empty array — for a free-text question", () => {
    // The UI branches on `options?.length`, and an empty array must not render an empty chip row.
    const parsed = parseQuestionsFromIntake(`## Questions for the traveler\n${formatQuestionBlock(validQ)}\n`);
    expect(parsed[0].options).toBeUndefined();
  });

  it("keeps a block whose Options line it doesn't expect, rather than dropping the whole block", () => {
    // The failure this pins: a rigid one-regex parser silently dropped every block that gained a
    // field. Lines are read individually so an unknown one is ignored, not fatal.
    const md =
      "## Questions for the traveler\n### q-japan-9\n- **Q:** Which day?\n" +
      "- **Assumed:** Tuesday\n- **Context:** Day 3\n- **Something new:** ignore me\n- **Status:** open\n";
    const parsed = parseQuestionsFromIntake(md);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].text).toBe("Which day?");
  });

  it("names the two ledger headings it reads, so the writer and the reader can't drift", () => {
    expect(DECISION_SECTIONS.map((s) => s.heading)).toEqual(["Questions for the traveler", "Blocking forks"]);
    expect(DECISION_SECTIONS.map((s) => s.blocking)).toEqual([false, true]);
  });
});

describe("buildAnswerPayload", () => {
  it("carries the slug and the filled-in pairs", () => {
    expect(buildAnswerPayload("japan", [{ id: "q-japan-1", answer: "Oct 22" }])).toEqual({
      slug: "japan",
      answers: [{ id: "q-japan-1", answer: "Oct 22" }],
    });
  });

  it("drops blank and whitespace-only answers instead of sending them", () => {
    const p = buildAnswerPayload("japan", [
      { id: "q-japan-1", answer: "Oct 22" },
      { id: "q-japan-2", answer: "   " },
      { id: "q-japan-3", answer: "" },
    ]);
    expect(p.answers).toEqual([{ id: "q-japan-1", answer: "Oct 22" }]);
  });

  it("trims both sides — a trailing newline is not part of an answer", () => {
    expect(buildAnswerPayload("japan", [{ id: " q-japan-1 ", answer: " Oct 22\n" }]).answers).toEqual([
      { id: "q-japan-1", answer: "Oct 22" },
    ]);
  });

  it("drops an entry with no id — there would be nothing to attach the answer to", () => {
    expect(buildAnswerPayload("japan", [{ id: "", answer: "Oct 22" }]).answers).toEqual([]);
  });

  it("returns an empty answer list rather than throwing on nothing at all", () => {
    expect(buildAnswerPayload("japan", [])).toEqual({ slug: "japan", answers: [] });
    expect(buildAnswerPayload("japan", null as never)).toEqual({ slug: "japan", answers: [] });
  });
});

describe("mock seeds", () => {
  it("all mock questions pass validation", () => {
    for (const q of MOCK_QUESTIONS) {
      expect(validateQuestion(q), `${q.id} should be valid`).toEqual([]);
    }
  });
});
