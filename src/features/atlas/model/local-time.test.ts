// @protects-file The clock shown for a destination is that destination's real local time.

import { describe, it, expect } from "vitest";
import { localClockLabel } from "./local-time";

describe("localClockLabel", () => {
  it("formats HH:MM and the zone in the given tz, 24h", () => {
    const now = new Date(Date.UTC(2026, 6, 8, 12, 5)); // 2026-07-08T12:05Z
    expect(localClockLabel("Asia/Seoul", now)).toBe("21:05 GMT+9"); // UTC+9
  });

  it("⌁ the zone follows the reader's own DST, because it is derived and not a table", () => {
    /* ⌁ The design shows a letter abbreviation (KST/MST). Hand-writing those would be a table
       of invented data that goes wrong at every DST boundary — so the offset is printed, and
       here is a zone that actually moves: Copenhagen is +1 in January and +2 in July. */
    expect(localClockLabel("Europe/Copenhagen", new Date(Date.UTC(2026, 0, 8, 12, 0)))).toBe("13:00 GMT+1");
    expect(localClockLabel("Europe/Copenhagen", new Date(Date.UTC(2026, 6, 8, 12, 0)))).toBe("14:00 GMT+2");
  });

  it("null when tz is absent — never guessed", () => {
    expect(localClockLabel(null, new Date())).toBeNull();
    expect(localClockLabel(undefined, new Date())).toBeNull();
    expect(localClockLabel("", new Date())).toBeNull();
  });

  it("null for an unresolvable tz string, never throws", () => {
    expect(localClockLabel("Not/A_Real_Zone", new Date())).toBeNull();
  });
});
