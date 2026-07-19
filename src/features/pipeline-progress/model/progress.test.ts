import { describe, it, expect } from "vitest";
import { deriveProgress, formatElapsed, predictSlug, STAGE_ORDER, STUCK_THRESHOLD_MS } from "./progress";
import { FRESH_SCAFFOLD, MID_RESEARCH, VERIFIED } from "../mocks/seeds";

describe("deriveProgress", () => {
  it("returns an all-not-done view with zero elapsed when no state exists yet", () => {
    const v = deriveProgress(null, { now: new Date("2026-07-19T10:00:00Z"), published: false });
    expect(v.stages.every((s) => !s.done)).toBe(true);
    expect(v.currentIndex).toBe(0);
    expect(v.percent).toBe(0);
    expect(v.elapsedMs).toBe(0);
    expect(v.isDone).toBe(false);
    expect(v.isStuck).toBe(false);
  });

  it("marks only scaffold done right after scaffolding, current index at passA", () => {
    const v = deriveProgress(FRESH_SCAFFOLD, { now: new Date("2026-07-19T10:05:00Z"), published: false });
    expect(v.stages[0]).toMatchObject({ key: "scaffold", done: true });
    expect(v.stages[1]).toMatchObject({ key: "passA", done: false });
    expect(v.currentIndex).toBe(1);
    expect(v.percent).toBe(Math.round((1 / 6) * 100));
    expect(v.elapsedMs).toBe(5 * 60 * 1000);
  });

  it("reflects mid-research progress (passA + passB done, reconcile next)", () => {
    const v = deriveProgress(MID_RESEARCH, { now: new Date("2026-07-19T10:40:00Z"), published: false });
    expect(v.stages.filter((s) => s.done).map((s) => s.key)).toEqual(["scaffold", "passA", "passB"]);
    expect(v.currentIndex).toBe(3); // reconcile
    expect(v.percent).toBe(Math.round((3 / 6) * 100));
  });

  it("is NOT done when verified but not yet published", () => {
    const v = deriveProgress(VERIFIED, { now: new Date("2026-07-19T11:15:00Z"), published: false });
    expect(v.stages.find((s) => s.key === "verified")?.done).toBe(true);
    expect(v.stages.find((s) => s.key === "published")?.done).toBe(false);
    expect(v.isDone).toBe(false);
    expect(v.currentIndex).toBe(5); // published
  });

  it("is fully done once verified AND published", () => {
    const v = deriveProgress(VERIFIED, { now: new Date("2026-07-19T11:15:00Z"), published: true });
    expect(v.isDone).toBe(true);
    expect(v.percent).toBe(100);
    expect(v.currentIndex).toBe(STAGE_ORDER.length);
  });

  it("flags isStuck when updatedAt is stale and the pipeline isn't done", () => {
    const staleNow = new Date(new Date(MID_RESEARCH.updatedAt).getTime() + STUCK_THRESHOLD_MS + 1000);
    const v = deriveProgress(MID_RESEARCH, { now: staleNow, published: false });
    expect(v.isStuck).toBe(true);
  });

  it("never flags isStuck once the pipeline is fully done, no matter how old", () => {
    const farFuture = new Date(new Date(VERIFIED.updatedAt).getTime() + STUCK_THRESHOLD_MS * 10);
    const v = deriveProgress(VERIFIED, { now: farFuture, published: true });
    expect(v.isStuck).toBe(false);
  });

  it("does not flag isStuck while genuinely still progressing (recent update)", () => {
    const recentNow = new Date(new Date(MID_RESEARCH.updatedAt).getTime() + 60 * 1000);
    const v = deriveProgress(MID_RESEARCH, { now: recentNow, published: false });
    expect(v.isStuck).toBe(false);
  });

  it("clamps elapsed to zero rather than going negative for a clock skew edge case", () => {
    const v = deriveProgress(FRESH_SCAFFOLD, { now: new Date("2026-07-19T09:00:00Z"), published: false });
    expect(v.elapsedMs).toBe(0);
  });
});

describe("formatElapsed", () => {
  it("renders seconds only under a minute", () => {
    expect(formatElapsed(45_000)).toBe("45s");
  });

  it("renders minutes + seconds under an hour", () => {
    expect(formatElapsed(3 * 60_000 + 12_000)).toBe("3m 12s");
  });

  it("pads single-digit seconds", () => {
    expect(formatElapsed(3 * 60_000 + 5_000)).toBe("3m 05s");
  });

  it("renders hours + padded minutes at/over an hour", () => {
    expect(formatElapsed(60 * 60_000 + 4 * 60_000)).toBe("1h 04m");
  });

  it("floors fractional seconds", () => {
    expect(formatElapsed(1999)).toBe("1s");
  });
});

describe("predictSlug", () => {
  it("lowercases and hyphenates", () => {
    expect(predictSlug("South Korea")).toBe("south-korea");
  });

  it("strips accents", () => {
    expect(predictSlug("Île-de-France")).toBe("ile-de-france");
  });

  it("collapses punctuation runs into one hyphen", () => {
    expect(predictSlug("Trinidad & Tobago!!")).toBe("trinidad-tobago");
  });

  it("falls back to \"guide\" for empty input", () => {
    expect(predictSlug("")).toBe("guide");
  });
});
