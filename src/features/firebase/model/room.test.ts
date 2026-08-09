/* The failure path, finally executed.

   This is the test that was owed. The Trip Split bug survived because nothing ever ran the
   rejected-write path — the code that handled it was `.catch(function () {})`, and an empty
   handler cannot fail a test that never calls it. The cases below are the real incident,
   pinned: a guide with no roomId, a slug-shaped room code, and a permission_denied rejection. */
// @protects-file A shared trip room cannot be guessed into, and a settled trip stops accepting edits.

import { describe, expect, test } from "vitest";
import { isPermanentWriteError, isPostTripLocked, isValidRoomId, parseRoomHash, POST_TRIP_GRACE_DAYS, resolveRoomId, ROOM_ID_RE } from "./room";

describe("room id validity", () => {
  test("accepts the shape rules.json requires (16-40 lowercase alphanumerics)", () => {
    expect(isValidRoomId("0286df0ea411ae7e")).toBe(true); // korea, 16
    expect(isValidRoomId("9x2mfk7w4qrvbhpz")).toBe(true); // us, 16
    expect(isValidRoomId("a".repeat(40))).toBe(true);
  });

  test("rejects a guide SLUG, which is what actually shipped and broke", () => {
    // rules.json requires >=16 chars; "denmark" is 7 and "korea" is 5, so every write to
    // trips/denmark was permission_denied while the UI showed a live, editable panel.
    for (const slug of ["denmark", "korea", "us", "southkorea"]) {
      expect(isValidRoomId(slug), `${slug} must never be usable as a room code`).toBe(false);
    }
  });

  test("rejects the near-misses too — 15 chars, uppercase, punctuation, non-strings", () => {
    expect(isValidRoomId("a".repeat(15))).toBe(false);
    expect(isValidRoomId("a".repeat(41))).toBe(false);
    expect(isValidRoomId("ED34050226803EE7")).toBe(false);
    expect(isValidRoomId("ed34-0502-2680")).toBe(false);
    expect(isValidRoomId(undefined)).toBe(false);
    expect(isValidRoomId(null)).toBe(false);
    expect(isValidRoomId(16)).toBe(false);
  });

  test("the regex is anchored — a valid code buried in junk is not a valid code", () => {
    expect(ROOM_ID_RE.test("../trips/0286df0ea411ae7e")).toBe(false);
    expect(ROOM_ID_RE.test("0286df0ea411ae7e/members")).toBe(false);
  });
});

describe("resolveRoomId", () => {
  test("returns the roomId when the guide declares a valid one", () => {
    expect(resolveRoomId({ roomId: "0286df0ea411ae7e", storeKey: "korea" })).toBe("0286df0ea411ae7e");
  });

  /* THE regression. The old implementation was `cfg.roomId || cfg.storeKey || "guide"`, so a
     guide without a roomId silently joined a room it could never write to. Local-only is the
     honest answer, and it is what the feature already documents for unconfigured sync. */
  test("NEVER falls back to the storeKey — an absent roomId means local-only", () => {
    expect(resolveRoomId({ storeKey: "korea" })).toBe("");
    expect(resolveRoomId({ roomId: undefined, storeKey: "denmark" })).toBe("");
    expect(resolveRoomId({ roomId: "", storeKey: "denmark" })).toBe("");
  });

  test("an INVALID roomId is local-only too, not a best effort", () => {
    expect(resolveRoomId({ roomId: "TOO-SHORT", storeKey: "korea" })).toBe("");
  });

  test("survives a missing or malformed config without throwing", () => {
    expect(resolveRoomId(null)).toBe("");
    expect(resolveRoomId(undefined)).toBe("");
    expect(resolveRoomId({})).toBe("");
  });
});

describe("isPermanentWriteError", () => {
  test("classifies the rejection this incident actually produced", () => {
    // Verbatim from the browser console on the live site, both shapes the SDK surfaces.
    expect(isPermanentWriteError({ code: "PERMISSION_DENIED" })).toBe(true);
    expect(isPermanentWriteError(new Error("set at /trips/denmark/members/-Oy failed: permission_denied"))).toBe(true);
    expect(isPermanentWriteError({ message: "permission denied" })).toBe(true);
  });

  /* The other half matters just as much. Calling a transient failure permanent drops the
     outbox entry, so an edit made on a train is deleted rather than flushed on reconnect. */
  test("treats network and unknown failures as TRANSIENT, so the outbox keeps them", () => {
    expect(isPermanentWriteError(new Error("network error"))).toBe(false);
    expect(isPermanentWriteError({ code: "unavailable" })).toBe(false);
    expect(isPermanentWriteError({ code: "disconnected" })).toBe(false);
    expect(isPermanentWriteError(null)).toBe(false);
    expect(isPermanentWriteError(undefined)).toBe(false);
    expect(isPermanentWriteError({})).toBe(false);
  });
});

/* M5 — the #room= override. The zero-setup default is settled and unchanged; this is the
   opt-in private alternative, so what matters is "a valid override wins" and "nothing weaker
   than a real room code ever gets through the URL either". */
describe("parseRoomHash", () => {
  const CODE = "a1b2c3d4e5f60718";
  test("accepts a valid code from the fragment, with or without a leading #", () => {
    expect(parseRoomHash("#room=" + CODE)).toBe(CODE);
    expect(parseRoomHash("room=" + CODE)).toBe(CODE);
  });
  test("ignores an absent, empty or unrelated fragment", () => {
    expect(parseRoomHash("")).toBe("");
    expect(parseRoomHash("#")).toBe("");
    expect(parseRoomHash("#section-3")).toBe("");
    expect(parseRoomHash(undefined)).toBe("");
    expect(parseRoomHash(null)).toBe("");
  });
  test("applies the SAME 16-40 char rule as any other room code", () => {
    expect(parseRoomHash("#room=denmark")).toBe("");
    expect(parseRoomHash("#room=" + "a".repeat(15))).toBe("");
    expect(parseRoomHash("#room=" + "a".repeat(16))).toBe("a".repeat(16));
    expect(parseRoomHash("#room=" + "a".repeat(41))).toBe("");
    expect(parseRoomHash("#room=ABCDEF0123456789")).toBe("");
  });
  test("survives a malformed percent-escape instead of throwing", () => {
    expect(parseRoomHash("#room=%E0%A4%A")).toBe("");
  });
});

describe("resolveRoomId with a #room= override", () => {
  const committed = "0123456789abcdef";
  const priv = "fedcba9876543210";
  test("a valid override beats the guide's committed roomId", () => {
    expect(resolveRoomId({ roomId: committed }, "#room=" + priv)).toBe(priv);
  });
  test("an invalid override never overrides the committed room", () => {
    expect(resolveRoomId({ roomId: committed }, "#room=nope")).toBe(committed);
    expect(resolveRoomId({ roomId: committed }, "#section-2")).toBe(committed);
  });
  test("called with one argument it behaves exactly as before (no regression)", () => {
    expect(resolveRoomId({ roomId: committed })).toBe(committed);
    expect(resolveRoomId({ roomId: "denmark", storeKey: "denmark" })).toBe("");
  });
  test("an override still works when the guide declares no room at all", () => {
    expect(resolveRoomId({}, "#room=" + priv)).toBe(priv);
  });
});

/* M5 — the post-trip lock. A settled trip's room is its financial record; this stops it
   drifting, and stops a publicly-committed code being a standing write invitation. */
describe("isPostTripLocked", () => {
  const end = new Date(2026, 6, 15); // 15 Jul 2026, local
  test("unlocked during the trip and through the whole grace window", () => {
    expect(isPostTripLocked(end, new Date(2026, 6, 10))).toBe(false);
    expect(isPostTripLocked(end, new Date(2026, 6, 15))).toBe(false);
    expect(isPostTripLocked(end, new Date(2026, 6, 29, 23, 0))).toBe(false);
  });
  test("locks once the grace window is fully past", () => {
    expect(isPostTripLocked(end, new Date(2026, 6, 30, 0, 1))).toBe(true);
    expect(isPostTripLocked(end, new Date(2027, 0, 1))).toBe(true);
  });
  test("an UNDATED trip is never locked — guessing about a live trip is the worse failure", () => {
    expect(isPostTripLocked(null, new Date(2027, 0, 1))).toBe(false);
    expect(isPostTripLocked(undefined, new Date(2027, 0, 1))).toBe(false);
    expect(isPostTripLocked(new Date("nonsense"), new Date(2027, 0, 1))).toBe(false);
  });
  test("the grace window is honoured exactly, and is configurable", () => {
    expect(POST_TRIP_GRACE_DAYS).toBe(14);
    expect(isPostTripLocked(end, new Date(2026, 6, 17), 1)).toBe(true);
    expect(isPostTripLocked(end, new Date(2026, 6, 16, 12), 1)).toBe(false);
  });
});
