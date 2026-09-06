/* ⌁ The regression: the Map's live "closes 18:00" line was formatted with the READER's clock.
   An 18:00 Asia/Seoul closing time rendered as "05:00 AM" on a US laptop — a confidently stated
   wrong fact about a place a traveler is deciding whether to walk to, which is worse than no
   fact at all. Caught in review, not by a test, because nothing was asserting whose clock a
   destination's opening hours are told in. */
// @protects-file Opening hours belong to the destination's timezone, never the reader's.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/* The code moved from map-dest.js to map-live.js when the first-paint budget pushed it into a
   lazy chunk, and this test failed loudly rather than passing on a file that no longer had it —
   which is the behaviour a source-contract test is for. */
const SRC = readFileSync(fileURLToPath(new URL("../ui/map-live.js", import.meta.url)), "utf8");

describe("the Map's live opening hours are told in the destination's clock", () => {
  it("⌁ formats with an explicit timeZone rather than the browser default", () => {
    /* toLocaleTimeString with no timeZone silently uses the reader's. The bug is invisible to
       anyone developing in the destination's own zone, which is exactly why it needs a test
       rather than a review. */
    const calls = SRC.match(/toLocaleTimeString\([^)]*\)/g) ?? [];
    expect(calls.length, "no time formatting found — did this move?").toBeGreaterThan(0);
    for (const call of calls) {
      expect(
        /timeZone/.test(call) || /opts/.test(call),
        `${call} formats a time without naming a timeZone`,
      ).toBe(true);
    }
    expect(SRC, "the timezone must come from the guide's own destTzIana").toMatch(/destTzIana/);
  });

  it("⌁ says nothing rather than falling back to the reader's clock", () => {
    /* An unknown IANA zone throws. Catching it and formatting anyway would reintroduce exactly
       the defect above, so the catch must return null, not a formatted string. */
    const clock = SRC.slice(SRC.indexOf("function clock("), SRC.indexOf("function paintLive("));
    expect(clock, "clock() should exist in map-live.js").toContain("toLocaleTimeString");
    const rescue = clock.slice(clock.indexOf("catch"));
    expect(rescue, "the catch must not format a time as a fallback").not.toMatch(/toLocaleTimeString/);
    expect(rescue, "the catch should give up rather than guess").toMatch(/return null/);
  });

  it("⌁ only a reviewed Google Place ID is ever sent to the paid API", () => {
    /* korea carries 63 ChIJ-prefixed Google ids and 5 of another kind. The adapter is explicit
       that it never guesses an id, so a non-Google one must not be handed to it. */
    expect(SRC, "place ids must be shape-checked before a lookup").toMatch(/indexOf\("ChIJ"\)/);
  });
});
