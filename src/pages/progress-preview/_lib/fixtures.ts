/* PREVIEW-ONLY fixtures for the /progress/ design study (src/pages/progress-preview/).
   Nothing here ships to the real /progress/ route — this whole directory is a scratch
   design surface and is deletable in one `rm -rf`.

   Same shape as src/features/pipeline-progress/mocks/seeds.ts (PipelineState), but timed
   RELATIVE TO PAGE LOAD instead of pinned to a fixed T0 — the silo's seeds are frozen at
   2026-07-19 for unit tests, which would render as "10 days elapsed" in a visual preview
   and hide exactly the thing being reviewed (a live, plausible elapsed clock). Ratios and
   stage spacing are taken from a real run's cadence: scaffold lands within a minute of the
   issue, each research pass runs ~8-20 min, reconcile ~10 min, verify ~15 min. */
import type { PipelineState, PipelineStage } from "../../../features/pipeline-progress";

const MIN = 60_000;
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

export interface Fixture {
  /** Query value (?state=...). */
  key: string;
  /** Human label for the preview switcher. */
  label: string;
  /** One line saying what the traveler is actually looking at. */
  note: string;
  state: PipelineState | null;
  published: boolean;
}

type Stages = Record<PipelineStage, string | null>;
const nulls: Stages = { scaffold: null, passA: null, passB: null, reconcile: null, verified: null };

function make(slug: string, createdAgo: number, updatedAgo: number, stages: Partial<Stages>, extra: Partial<PipelineState> = {}): PipelineState {
  return {
    slug,
    createdAt: ago(createdAgo),
    updatedAt: ago(updatedAgo),
    stages: { ...nulls, ...stages },
    attempts: 1,
    notes: [],
    ...extra,
  };
}

/** The eight states a traveler can actually land in, in the order they occur. */
export const FIXTURES: Fixture[] = [
  {
    key: "unknown",
    label: "Nothing found yet",
    note: "The issue was filed seconds ago; no state file exists yet, or the guessed slug is wrong. deriveProgress(null) — every stage shown, none claimed. NOTE: the slug-correction form is shown here immediately so the treatment is reviewable; the shipping page only offers it after GUESS_GRACE_MS (90 s) and only when the slug was a guess.",
    state: null,
    published: false,
  },
  {
    key: "scaffold",
    label: "Scaffolded",
    note: "new-guide.yml has committed the scaffold. One stage of six. Research hasn't started.",
    state: make("testland", 1.4 * MIN, 0.6 * MIN, { scaffold: ago(0.6 * MIN) }),
    published: false,
  },
  {
    key: "passA",
    label: "Pass A cleared",
    note: "The canonical/verified pass is done; the local/crowd-aware pass is running now.",
    state: make("testland", 14 * MIN, 2 * MIN, {
      scaffold: ago(13.5 * MIN),
      passA: ago(2 * MIN),
    }),
    published: false,
  },
  {
    key: "mid",
    label: "Reconciling",
    note: "Both research passes cleared; the agent is merging A and B into one guide.",
    state: make("testland", 31 * MIN, 4 * MIN, {
      scaffold: ago(30.5 * MIN),
      passA: ago(18 * MIN),
      passB: ago(4 * MIN),
    }),
    published: false,
  },
  {
    key: "retry",
    label: "Third attempt",
    note: "A run was cut off and resumed from its last checkpoint. attempts: 3 — real, and currently invisible on the live page.",
    state: make("testland", 96 * MIN, 6 * MIN, {
      scaffold: ago(95 * MIN),
      passA: ago(70 * MIN),
      passB: ago(6 * MIN),
    }, { attempts: 3 }),
    published: false,
  },
  {
    key: "stuck",
    label: "Stalled",
    note: "No checkpoint in 44 minutes, past the 20-minute STUCK_THRESHOLD_MS. Not failed — surfaced honestly, never hidden.",
    state: make("testland", 62 * MIN, 44 * MIN, {
      scaffold: ago(61 * MIN),
      passA: ago(44 * MIN),
    }),
    published: false,
  },
  {
    key: "verified",
    label: "Verified, not live",
    note: "Five of six. The build passed and the guide graduated; the Pages deploy hasn't landed yet, so `published` is still false. The real gap the live page has no words for.",
    state: make("testland", 74 * MIN, 3 * MIN, {
      scaffold: ago(73 * MIN),
      passA: ago(55 * MIN),
      passB: ago(38 * MIN),
      reconcile: ago(22 * MIN),
      verified: ago(3 * MIN),
    }),
    published: false,
  },
  {
    key: "done",
    label: "Live",
    note: "All six. The guide resolves on the site — the only state that may say so.",
    state: make("testland", 81 * MIN, 4 * MIN, {
      scaffold: ago(80 * MIN),
      passA: ago(62 * MIN),
      passB: ago(45 * MIN),
      reconcile: ago(29 * MIN),
      verified: ago(4 * MIN),
    }),
    published: true,
  },
];

export function fixtureFor(key: string | null): Fixture {
  return FIXTURES.find((f) => f.key === key) ?? FIXTURES[3];
}
