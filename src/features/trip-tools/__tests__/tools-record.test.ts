// @protects-file Every tool runs on the selected trip's own record.

import { describe, it, expect } from "vitest";
import { deriveToolsRecord } from "../model/tools-record";
import { KOREA_LIKE } from "../mocks/guide";

describe("deriveToolsRecord", () => {
  const rec = deriveToolsRecord(KOREA_LIKE);

  it("carries the trip's identity through unchanged", () => {
    expect(rec.slug).toBe("koreaish");
    expect(rec.tz).toBe("Asia/Seoul");
    expect(rec.storeKey).toBe("tg-koreaish");
    expect(rec.firstDayDate).toBe("Wed Jul 8");
  });

  it("counts the book-ahead reminders the panel's kicker prints", () => {
    expect(rec.bookAheadCount).toBe(1);
    expect(rec.reminders[0].book).toBe(true);
  });

  it("counts distinct closed places, not closure rows", () => {
    expect(rec.closurePlaceCount).toBe(1);
    expect(rec.closures.map((d) => d.day)).toEqual(["tue"]);
  });

  it("admits the days it could not order rather than hiding them", () => {
    // Two days carry stops; only the three-point one can be ordered.
    expect(rec.route).toHaveLength(1);
    expect(rec.routeSkippedDays).toBe(1);
  });

  it("copies no budget row into any tool — the split ledger is real spend only", () => {
    // The creator's 2026-08-08 ruling, asserted structurally: no field of the record may
    // carry a figure that came out of the guide's budget section.
    const json = JSON.stringify(rec);
    expect(json).not.toContain("Accommodation");
    expect(json).not.toContain("180");
  });

  it("returns an empty-but-valid record for a guide with no tool-shaped content", () => {
    const bare = deriveToolsRecord({ ...KOREA_LIKE, sections: [] });
    expect(bare.reminders).toEqual([]);
    expect(bare.closures).toEqual([]);
    expect(bare.route).toEqual([]);
    expect(bare.routeSkippedDays).toBe(0);
  });
});
