// Tests for the pure core of scripts/export-feedback.mjs (W2 LEARN loop). The network read and
// the file writes are impure and untested here; the value is in the attribution + incremental-sync
// logic (which feedback is NEW) and the summary shaping — the parts that decide what reaches the
// agent and whether the same feedback gets re-processed forever.

import { describe, it, expect } from "vitest";
import {
  buildRoomIndex, flattenFeedback, filterNew, nextMarker, summarize,
} from "../export-feedback.mjs";

const guides = [
  { slug: "korea", guide: { roomId: "room-korea-000000000000" } },
  { slug: "denmark", guide: { roomId: "room-denmark-00000000000" } },
  { slug: "sedona", guide: { /* no roomId */ } },
];

const trips = {
  "room-korea-000000000000": {
    feedback: {
      f1: { ratings: { overall: 3, pacing: 2 }, skips: [{ stop: "Bukchon", reason: "too crowded" }], freeform: "loved the food", createdAt: 1000 },
      f2: { ratings: { overall: 5, food: 5 }, freeform: "", createdAt: 2000 },
    },
    members: { m1: { name: "A" } },
  },
  "room-denmark-00000000000": {
    feedback: { f3: { ratings: { overall: 4 }, createdAt: 1500 } },
  },
  "room-orphan-000000000000": {
    feedback: { f9: { ratings: { overall: 1 }, createdAt: 9999 } }, // no matching guide
  },
};

describe("buildRoomIndex", () => {
  it("maps roomId → slug and skips guides without a roomId", () => {
    const idx = buildRoomIndex(guides);
    expect(idx["room-korea-000000000000"]).toBe("korea");
    expect(idx["room-denmark-00000000000"]).toBe("denmark");
    expect(Object.values(idx)).not.toContain("sedona");
  });
});

describe("flattenFeedback", () => {
  it("attributes submissions to slugs and drops rooms with no matching guide", () => {
    const recs = flattenFeedback(trips, buildRoomIndex(guides));
    expect(recs).toHaveLength(3); // f1, f2, f3 — f9 (orphan room) dropped
    expect(recs.map((r) => r.slug).sort()).toEqual(["denmark", "korea", "korea"]);
    expect(recs.find((r) => r.fid === "f1").createdAt).toBe(1000);
  });
});

describe("filterNew", () => {
  it("keeps only submissions newer than the per-slug marker", () => {
    const recs = flattenFeedback(trips, buildRoomIndex(guides));
    // korea already synced through 1000 → only f2 (2000) is new; denmark unsynced → f3 new.
    const fresh = filterNew(recs, { korea: 1000 });
    expect(fresh.map((r) => r.fid).sort()).toEqual(["f2", "f3"]);
  });
  it("treats everything as new when the marker is empty", () => {
    const recs = flattenFeedback(trips, buildRoomIndex(guides));
    expect(filterNew(recs, {})).toHaveLength(3);
  });
});

describe("nextMarker", () => {
  it("advances to the max createdAt per slug, carrying prior values forward", () => {
    const recs = flattenFeedback(trips, buildRoomIndex(guides));
    const m = nextMarker(recs, { korea: 500, mexico: 42 });
    expect(m).toEqual({ korea: 2000, denmark: 1500, mexico: 42 });
  });
});

describe("summarize", () => {
  it("averages ratings, lists skips, and keeps freeform + a count (agent-only)", () => {
    const recs = flattenFeedback(trips, buildRoomIndex(guides));
    const korea = summarize(recs).find((s) => s.slug === "korea");
    expect(korea.count).toBe(2);
    expect(korea.ratings.overall).toBe(4); // (3 + 5) / 2
    expect(korea.ratings.food).toBe(5); // only f2 answered food
    expect(korea.skips).toEqual([{ stop: "Bukchon", reason: "too crowded" }]);
    // freeform carried for the agent to summarize, with an accurate count; empty strings excluded.
    expect(korea.freeformCount).toBe(1);
    expect(korea.freeform).toEqual(["loved the food"]);
  });
});
