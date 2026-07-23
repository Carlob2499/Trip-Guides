// Test for the pure size guard in pdf-text.ts (W4). The extraction itself (extractPdfText) is
// browser-only pdf.js glue verified in the preview, not unit-tested here — but the byte cap that
// decides whether we even try is pure and cheap to lock down.
import { describe, it, expect } from "vitest";
import { isTooBig } from "./pdf-text";

describe("isTooBig", () => {
  it("accepts a normal booking confirmation (well under 10 MB)", () => {
    expect(isTooBig(200 * 1024)).toBe(false); // 200 KB
    expect(isTooBig(0)).toBe(false);
  });
  it("rejects a file over the 10 MB cap", () => {
    expect(isTooBig(11 * 1024 * 1024)).toBe(true);
  });
  it("treats exactly 10 MB as acceptable (boundary)", () => {
    expect(isTooBig(10 * 1024 * 1024)).toBe(false);
  });
});
