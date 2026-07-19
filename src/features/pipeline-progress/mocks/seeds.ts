import type { PipelineState } from "../model/progress";

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

export const STALLED = MID_RESEARCH;
