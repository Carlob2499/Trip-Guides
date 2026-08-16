// @protects-file A one-click "approve" never starts a research run against the wrong guide.

import { describe, it, expect } from "vitest";
import { toProposals, proposalMatchesSlug, REVISION_LABEL } from "./proposals";
import { PROPOSAL_ISSUES } from "../mocks/seeds";

describe("REVISION_LABEL", () => {
  it("is the label feedback-export.yml auto-files inert proposals under, not the one change.yml runs on", () => {
    // change.yml triggers on "revision-request" (the owner adds it by hand to approve) — reading
    // proposals under that label would only ever find issues already running, never ones waiting
    // on a decision. See ensure-labels.yml / feedback-export.yml / prompts/feedback-synthesis.md.
    expect(REVISION_LABEL).toBe("revision-auto-filed");
  });
});

describe("proposalMatchesSlug", () => {
  it("matches on the body's own slug field", () => {
    expect(proposalMatchesSlug({ title: "anything", body: "### Guide slug\n\ntestland\n" }, "testland")).toBe(true);
  });

  it("trusts the body field OVER the title when they disagree", () => {
    // The body field is what the pipeline's own parser reads, so it is the authority. A title
    // that happens to name another guide must not pull the proposal onto that guide's page.
    const issue = { title: "Revise: otherland", body: "### Guide slug\n\ntestland\n" };
    expect(proposalMatchesSlug(issue, "testland")).toBe(true);
    expect(proposalMatchesSlug(issue, "otherland")).toBe(false);
  });

  it("falls back to the title when the body carries no slug field", () => {
    expect(proposalMatchesSlug({ title: "Revise: testland (feedback-driven)", body: "" }, "testland")).toBe(true);
  });

  it("does not match a slug that is only a SUBSTRING of the title's slug", () => {
    // "test" inside "testland" would otherwise attach every testland proposal to a guide called
    // "test" — one click away from re-researching the wrong guide.
    expect(proposalMatchesSlug({ title: "Revise: testland", body: "" }, "test")).toBe(false);
    expect(proposalMatchesSlug({ title: "Revise: south-korea", body: "" }, "korea")).toBe(false);
  });

  it("matches a hyphenated slug at a word boundary", () => {
    expect(proposalMatchesSlug({ title: "Revise: south-korea (feedback-driven)", body: "" }, "south-korea")).toBe(true);
  });

  it("is case-insensitive on both sides", () => {
    expect(proposalMatchesSlug({ title: "", body: "### Guide slug\n\nTestland\n" }, "TESTLAND")).toBe(true);
  });

  it("matches nothing when the slug is empty", () => {
    expect(proposalMatchesSlug({ title: "Revise: testland", body: "" }, "")).toBe(false);
    expect(proposalMatchesSlug({ title: "Revise: testland", body: "" }, "   ")).toBe(false);
  });
});

describe("toProposals", () => {
  it("keeps only this guide's issues, drops pull requests, and sorts newest first", () => {
    const out = toProposals(PROPOSAL_ISSUES, "testland");
    expect(out.map((p) => p.issue)).toEqual([44, 41]);
  });

  it("strips the 'Revise: ' prefix from the title and lifts the reason out of the body", () => {
    const out = toProposals(PROPOSAL_ISSUES, "testland");
    expect(out[1].title).toBe("testland (feedback-driven)");
    expect(out[1].reason).toBe("Two travellers reported the ferry no longer runs on Sundays.");
  });

  it("renders an empty reason rather than the literal _No response_", () => {
    const out = toProposals(
      [{ number: 7, title: "Revise: testland", body: "### Guide slug\n\ntestland\n\n### What changed and why this needs re-research\n\n_No response_", created_at: "2026-08-01T00:00:00.000Z" }],
      "testland",
    );
    expect(out[0].reason).toBe("");
  });

  it("never returns a proposal with no issue number to approve", () => {
    const out = toProposals(
      [{ title: "Revise: testland", body: "", created_at: "2026-08-01T00:00:00.000Z" }],
      "testland",
    );
    expect(out).toEqual([]);
  });

  it("survives null, undefined, and a non-issue payload", () => {
    expect(toProposals(null, "testland")).toEqual([]);
    expect(toProposals(undefined, "testland")).toEqual([]);
    expect(toProposals([null as never, undefined as never], "testland")).toEqual([]);
  });

  it("falls back to a generic title rather than rendering a blank card", () => {
    const out = toProposals(
      [{ number: 9, title: "Revise: ", body: "### Guide slug\n\ntestland\n", created_at: "2026-08-01T00:00:00.000Z" }],
      "testland",
    );
    expect(out[0].title).toBe("Revision proposal");
  });
});
