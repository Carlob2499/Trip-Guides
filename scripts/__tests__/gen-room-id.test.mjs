// Tests for genRoomId (scripts/gen-room-id.mjs) — the salted room-id generator stamped
// once onto a guide's _guide.json. Its two invariants matter for real reasons: the id
// must satisfy the RTDB rules' write gate (length >= 16), and it must draw only from a
// stable, lowercase-alphanumeric alphabet (so it round-trips through the roomId regex in
// content.config.ts unchanged).
import { describe, it, expect } from "vitest";
import { genRoomId } from "../gen-room-id.mjs";

describe("genRoomId", () => {
  it("defaults to 16 characters — the RTDB rules' write-gate minimum", () => {
    expect(genRoomId()).toHaveLength(16);
  });

  it("honors an explicit length", () => {
    expect(genRoomId(24)).toHaveLength(24);
    expect(genRoomId(40)).toHaveLength(40);
  });

  it("draws only from lowercase letters and digits", () => {
    for (let i = 0; i < 25; i++) {
      expect(genRoomId()).toMatch(/^[a-z0-9]{16}$/);
    }
  });

  it("matches the roomId schema regex in content.config.ts", () => {
    expect(genRoomId()).toMatch(/^[a-z0-9]{16,40}$/);
  });

  it("produces different ids across calls", () => {
    const ids = new Set(Array.from({ length: 20 }, () => genRoomId()));
    expect(ids.size).toBe(20);
  });
});
