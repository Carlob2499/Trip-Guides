// Tests for the zero-click intake proxy's pure core (W5). The critical property: a body the Worker
// RENDERS from raw form values must parse back through the SAME issue-to-scaffold path a
// human-submitted issue takes — otherwise a Worker-filed guide would scaffold differently from a
// hand-filed one. Plus the rate thresholds that protect the maker's Claude quota.

import { describe, it, expect } from "vitest";
import { renderIssueBody, intakeRateDecision, guessSlug } from "../intake-proxy.mjs";
import { parseIssueBody, answersFromForm } from "../intake-schema.mjs";

describe("renderIssueBody ↔ parseIssueBody round-trip", () => {
  it("a rendered body parses back to the same answers a human submission would", () => {
    const raw = {
      country: "Brazil",
      cities: "Rio de Janeiro",
      dates: "2026-03-01 to 2026-03-08",
      anchor: "Carnival",
      travelers: "2",
      priority1: "Food & dining",
      priority2: "Culture / history",
      comments: "one vegetarian",
    };
    const body = renderIssueBody(raw);
    const answers = answersFromForm(parseIssueBody(body));
    expect(answers.country).toBe("Brazil");
    expect(answers.cities).toBe("Rio de Janeiro");
    expect(answers.start).toBe("2026-03-01");
    expect(answers.end).toBe("2026-03-08");
    expect(answers.anchor).toBe("Carnival");
    expect(answers.priorities).toEqual(["Food & dining", "Culture / history"]);
    expect(answers.comments).toBe("one vegetarian");
  });

  it("renders '_No response_' for empty fields (so they parse back as unset)", () => {
    const body = renderIssueBody({ country: "Japan" });
    expect(body).toContain("### Country\n\nJapan");
    expect(body).toContain("_No response_");
    // An empty dropdown/text parses back to no key, not an empty-string key.
    expect(answersFromForm(parseIssueBody(body))).toEqual({ country: "Japan" });
  });
});

describe("intakeRateDecision", () => {
  it("labels (auto-research) under the cap", () => {
    expect(intakeRateDecision(0)).toEqual({ accept: true, withLabel: true, reason: "ok" });
    expect(intakeRateDecision(2).withLabel).toBe(true); // cap default 3 → 0,1,2 labeled
  });
  it("accepts but withHOLDS the label at/over the cap (queued for owner approval)", () => {
    const d = intakeRateDecision(3);
    expect(d.accept).toBe(true);
    expect(d.withLabel).toBe(false);
  });
  it("rejects outright over the hard max", () => {
    expect(intakeRateDecision(10).accept).toBe(false);
    expect(intakeRateDecision(50).accept).toBe(false);
  });
  it("honors custom thresholds", () => {
    expect(intakeRateDecision(1, { cap: 1, hardMax: 2 }).withLabel).toBe(false);
    expect(intakeRateDecision(2, { cap: 1, hardMax: 2 }).accept).toBe(false);
  });
});

describe("guessSlug", () => {
  it("mirrors the scaffolder's slugify", () => {
    expect(guessSlug("South Korea")).toBe("south-korea");
    expect(guessSlug("México")).toBe("mexico");
    expect(guessSlug("")).toBe("guide");
  });
});
