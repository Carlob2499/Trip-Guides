import type { PipelineState } from "../model/progress";
import type { RawIssue } from "../model/proposals";
import type { RunEvents } from "../model/run-events";

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

/** A run that stopped mid-research: passA cleared, then nothing for over an hour. Feeds the
 *  stalled-state tests without any test having to hand-build a state object. */
export const STALLED: PipelineState = {
  slug: "testland",
  createdAt: T0,
  updatedAt: "2026-07-19T10:22:00.000Z",
  stages: { scaffold: T0, passA: "2026-07-19T10:20:00.000Z", passB: null, reconcile: null, verified: null },
  attempts: 2,
  notes: [],
};

/* Live run telemetry in the shape the V2 emitter (scripts/pipeline/v2/events.mjs) writes to
   guides-intake/<slug>/events.json — runId-stamped, because telemetry belongs to exactly one
   run. This seed exists so the parser and the panels are tested against a real shape rather
   than against an empty object, NOT so the UI can show it. The page never renders a seed: an
   invented feed over a real run is the page lying. */
export const RUN_EVENTS: RunEvents = {
  runId: "testland-20260719-abc123",
  available: true,
  fetches: [
    { at: "2026-07-19T10:21:03.000Z", url: "https://www.visitdenmark.com/denmark/plan-your-trip", status: 200 },
    { at: "2026-07-19T10:21:06.000Z", url: "https://www.dsb.dk/en/tickets/", status: 304 },
    { at: "2026-07-19T10:21:11.000Z", url: "https://example.museum/opening-hours", status: 404 },
    { at: "2026-07-19T10:21:14.000Z", url: "https://api.example.org/prices", status: 503 },
  ],
  decisions: [
    { at: "2026-07-19T10:21:04.000Z", kind: "check", text: "Opening hours cross-checked against the operator's own page." },
    { at: "2026-07-19T10:21:09.000Z", kind: "reject", text: "Dropped a blog's ticket price — no primary source behind it." },
    { at: "2026-07-19T10:21:12.000Z", kind: "decision", text: "Kept the ferry, flagged ⚠ until the winter timetable publishes." },
  ],
  nuggets: [
    {
      at: "2026-07-19T10:21:15.000Z",
      text: "The harbour bus counts as normal city transit, so a day pass already covers it.",
      source: "Operator fare page",
    },
  ],
  counters: { pages: 148, facts: 62, kept: 51, dropped: 11 },
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
