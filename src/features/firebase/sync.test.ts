// Tests for the pure/non-network-dependent helpers in sync.js: room-code generation
// (a security invariant — the code itself is the unguessable "lock"), code normalization,
// and the never-throw / rate-limited / no-op-without-config posture of the telemetry
// beacons. `./client.js` is mocked so these run with no real Firebase SDK and no network.
import { describe, it, expect, vi, beforeEach } from "vitest";

const readyMock = vi.fn();
const hasFirebaseMock = vi.fn();

vi.mock("./client.js", () => ({
  ready: (...args: unknown[]) => readyMock(...args),
  hasFirebase: (...args: unknown[]) => hasFirebaseMock(...args),
}));

const { generateTripCode, normalizeCode, reportError, bumpCounter } = await import("./sync.js");

// Top-level so it applies to EVERY test in the file, including the rate-limit block below —
// `readyMock` is shared across reportError/bumpCounter (both call the same imported `ready`),
// so a call-count assertion in one describe must not inherit calls left over from another.
beforeEach(() => {
  readyMock.mockReset();
  hasFirebaseMock.mockReset();
});

describe("generateTripCode", () => {
  it("returns a 10-character code", () => {
    expect(generateTripCode()).toHaveLength(10);
  });

  it("draws only from the unambiguous alphabet", () => {
    for (let i = 0; i < 25; i++) {
      expect(generateTripCode()).toMatch(/^[abcdefghjkmnpqrstuvwxyz23456789]{10}$/);
    }
  });

  it("never contains a visually-ambiguous character (0/o/1/l/i)", () => {
    // Codes are read aloud and typed on phones — this is the actual security/usability
    // property the alphabet exists to guarantee, not just "matches this regex".
    for (let i = 0; i < 25; i++) {
      expect(generateTripCode()).not.toMatch(/[0o1li]/);
    }
  });
});

describe("normalizeCode", () => {
  it("lowercases and strips anything that isn't a-z0-9", () => {
    expect(normalizeCode("AB-12 cd!")).toBe("ab12cd");
  });

  it("strips RTDB-unsafe characters specifically ( . $ # [ ] / )", () => {
    expect(normalizeCode("a.b$c#d[e]f/g")).toBe("abcdefg");
  });

  it("truncates to 40 characters", () => {
    const long = "a".repeat(50);
    expect(normalizeCode(long)).toBe("a".repeat(40));
  });

  it("returns an empty string for null, undefined, or empty input", () => {
    expect(normalizeCode(null as unknown as string)).toBe("");
    expect(normalizeCode(undefined as unknown as string)).toBe("");
    expect(normalizeCode("")).toBe("");
  });
});

describe("reportError / bumpCounter — no-op-without-config posture", () => {
  it("reportError never calls ready() when Firebase isn't configured", () => {
    hasFirebaseMock.mockReturnValue(false);
    reportError({ guide: "g", feature: "f", message: "m" });
    expect(readyMock).not.toHaveBeenCalled();
  });

  it("bumpCounter never calls ready() when Firebase isn't configured", () => {
    hasFirebaseMock.mockReturnValue(false);
    bumpCounter("telemetry/x", 1);
    expect(readyMock).not.toHaveBeenCalled();
  });

  it("bumpCounter never calls ready() when no path is given, even if configured", () => {
    hasFirebaseMock.mockReturnValue(true);
    bumpCounter("", 1);
    bumpCounter(null as unknown as string, 1);
    expect(readyMock).not.toHaveBeenCalled();
  });

  it("bumpCounter calls ready() once configured and given a path", async () => {
    hasFirebaseMock.mockReturnValue(true);
    readyMock.mockReturnValue(
      Promise.resolve({
        db: {},
        mod: { ref: vi.fn(), set: vi.fn(() => Promise.resolve()), increment: vi.fn() },
      }),
    );
    bumpCounter("telemetry/x", 1);
    expect(readyMock).toHaveBeenCalledTimes(1);
    await new Promise((r) => setImmediate(r)); // let the queued .then/.catch settle
  });
});

// A dedicated, ORDER-SENSITIVE block: reportError's `_errCount` is module-level state
// shared for the lifetime of this test file, so every configured call anywhere in the
// file counts toward the cap. This is the only block that calls reportError with
// hasFirebase() = true, and it runs last so the cap assertion reflects exactly its own calls.
describe("reportError — rate limit (must run with a clean call count)", () => {
  it("stops calling ready() after 5 configured calls in a session", async () => {
    hasFirebaseMock.mockReturnValue(true);
    readyMock.mockReturnValue(
      Promise.resolve({
        db: {},
        mod: {
          push: vi.fn(() => ({})),
          ref: vi.fn(),
          set: vi.fn(() => Promise.resolve()),
          serverTimestamp: vi.fn(),
        },
      }),
    );
    for (let i = 0; i < 7; i++) reportError({ guide: "g", feature: "f", message: `m${i}` });
    expect(readyMock).toHaveBeenCalledTimes(5);
    await new Promise((r) => setImmediate(r));
  });
});
