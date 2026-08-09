// @protects-file Follow-up questions asked during intake are the ones the answers actually warrant.

import { describe, it, expect } from "vitest";
import {
  validateQuestion,
  hasBannedTerm,
  parseQuestionsFromIntake,
  formatQuestionBlock,
  BANNED_TERMS,
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
});

describe("mock seeds", () => {
  it("all mock questions pass validation", () => {
    for (const q of MOCK_QUESTIONS) {
      expect(validateQuestion(q), `${q.id} should be valid`).toEqual([]);
    }
  });
});
