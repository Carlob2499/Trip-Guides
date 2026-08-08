import { describe, it, expect } from "vitest";
import { localClockLabel } from "./local-time";

describe("localClockLabel", () => {
  it("formats HH:MM THERE in the given tz, 24h", () => {
    const now = new Date(Date.UTC(2026, 6, 8, 12, 5)); // 2026-07-08T12:05Z
    expect(localClockLabel("Asia/Seoul", now)).toBe("21:05 THERE"); // UTC+9
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
