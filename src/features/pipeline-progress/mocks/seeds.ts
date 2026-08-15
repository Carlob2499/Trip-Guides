import type { PipelineState } from "../model/progress";
import type { RawIssue } from "../model/proposals";

const T0 = "2026-07-19T10:00:00.000Z";

export const FRESH_SCAFFOLD: PipelineState = {
  slug: "testland",
  createdAt: T0,
  updatedAt: T0,
  stages: { scaffold: T0, passA: null, passB: null, reconcile: null, verified: null },
  attempts: 1,
  notes: [],
};

export const MID_RESEARCH: PipelineState = {
  slug: "testland",
  createdAt: T0,
  updatedAt: "2026-07-19T10:35:00.000Z",
  stages: {
    scaffold: T0,
    passA: "2026-07-19T10:20:00.000Z",
    passB: "2026-07-19T10:35:00.000Z",
    reconcile: null,
    verified: null,
  },
  attempts: 1,
  notes: [{ stage: "passA", note: "anchor verified vs official site", at: "2026-07-19T10:20:00.000Z" }],
};

export const VERIFIED: PipelineState = {
  slug: "testland",
  createdAt: T0,
  updatedAt: "2026-07-19T11:10:00.000Z",
  stages: {
    scaffold: T0,
    passA: "2026-07-19T10:20:00.000Z",
    passB: "2026-07-19T10:35:00.000Z",
    reconcile: "2026-07-19T10:50:00.000Z",
    verified: "2026-07-19T11:10:00.000Z",
  },
  attempts: 1,
  notes: [],
};

/* Revision proposals, in the shape api.github.com actually returns them (a body rendered by the
   revise-guide Issue Form, plus the two records the parser has to survive: a proposal for a
   DIFFERENT guide, and a pull request sharing the same endpoint). */
const reviseBody = (slug: string, why: string) =>
  `### Guide slug\n\n${slug}\n\n### What changed and why this needs re-research\n\n${why}\n\n### Sections\n\n_No response_`;

export const PROPOSAL_ISSUES: RawIssue[] = [
  {
    number: 41,
    title: "Revise: testland (feedback-driven)",
    body: reviseBody("testland", "Two travellers reported the ferry no longer runs on Sundays."),
    created_at: "2026-08-01T09:00:00.000Z",
  },
  {
    number: 44,
    title: "Revise: testland (feedback-driven)",
    body: reviseBody("testland", "Museum pricing looks stale across three separate days."),
    created_at: "2026-08-06T09:00:00.000Z",
  },
  {
    number: 45,
    title: "Revise: otherland (feedback-driven)",
    body: reviseBody("otherland", "Not this guide."),
    created_at: "2026-08-07T09:00:00.000Z",
  },
  {
    number: 46,
    title: "Revise: testland — a PR, not a proposal",
    body: reviseBody("testland", "Should never be offered for approval."),
    created_at: "2026-08-08T09:00:00.000Z",
    pull_request: { url: "https://api.github.com/repos/o/r/pulls/46" },
  },
];
