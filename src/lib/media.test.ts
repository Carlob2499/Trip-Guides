// @protects-file A guide's photographs are served from this build, and a missing one still shows.

import { describe, it, expect, vi, beforeEach } from "vitest";

/* A fixed two-entry manifest rather than the real one: this file is about the RESOLUTION rule,
   and keying assertions to real content hashes would make it fail whenever a guide swaps a
   photograph — a failure that would say nothing about whether the rule still holds. */
vi.mock("./media-manifest.json", () => ({
  default: {
    "https://commons.wikimedia.org/wiki/Special:FilePath/Nyhavn.JPG?width=480": "media/aaaa1111.webp",
    "https://commons.wikimedia.org/wiki/Special:FilePath/Nyhavn.JPG?width=800": "media/bbbb2222.webp",
  },
}));

const HIT_480 = "https://commons.wikimedia.org/wiki/Special:FilePath/Nyhavn.JPG?width=480";
const HIT_800 = "https://commons.wikimedia.org/wiki/Special:FilePath/Nyhavn.JPG?width=800";
const MISS = "https://commons.wikimedia.org/wiki/Special:FilePath/Nyhavn.JPG?width=99999";

let local: typeof import("./media").local;
let localSrcset: typeof import("./media").localSrcset;

beforeEach(async () => {
  const m = await import("./media");
  local = m.local;
  localSrcset = m.localSrcset;
});

describe("local", () => {
  it("serves a downloaded rendition from this build", () => {
    expect(local(HIT_480)).toBe("/media/aaaa1111.webp");
  });

  /* ⌁ The whole safety argument for the media pipeline. fetch-media.mjs is deliberately
     non-fatal: a photo Wikimedia refuses is simply absent from the manifest. If a miss threw,
     or returned null, or returned a path to a file that was never written, then one throttled
     download would turn into a blank space on a shipped guide — the exact defect this pipeline
     exists to remove, reintroduced by its own error path. A miss must hand back the original
     URL untouched, which is precisely the behaviour that shipped before any of this existed. */
  it("⌁ hands back the original URL when the photo was never downloaded", () => {
    expect(local(MISS)).toBe(MISS);
  });

  it("passes null, undefined and empty through unchanged", () => {
    expect(local(null)).toBeNull();
    expect(local(undefined)).toBeUndefined();
    expect(local("")).toBe("");
  });

  it("does not touch a URL from a host the pipeline never fetches", () => {
    const video = "https://assets.mixkit.co/videos/20095/20095-720.mp4";
    expect(local(video)).toBe(video);
  });
});

describe("localSrcset", () => {
  it("resolves every candidate and keeps each width descriptor with its own URL", () => {
    expect(localSrcset(`${HIT_480} 480w, ${HIT_800} 800w`)).toBe(
      "/media/aaaa1111.webp 480w, /media/bbbb2222.webp 800w",
    );
  });

  it("resolves the hits in a mixed list and leaves the misses alone", () => {
    expect(localSrcset(`${HIT_480} 480w, ${MISS} 99999w`)).toBe(
      `/media/aaaa1111.webp 480w, ${MISS} 99999w`,
    );
  });

  it("handles a candidate with no descriptor", () => {
    expect(localSrcset(HIT_480)).toBe("/media/aaaa1111.webp");
  });
});
