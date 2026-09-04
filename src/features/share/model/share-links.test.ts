// @protects-file A shared link points at the exact section being shared, correctly encoded.

import { describe, it, expect } from "vitest";
import { buildPageUrl, buildWhatsAppShareUrl, buildMailtoUrl, buildSummaryShareText } from "./share-links";

const BASE = "https://example.test/Trip-Guides/guides/korea/";

describe("buildPageUrl", () => {
  it("deep-links a non-default destination as its hash route", () => {
    expect(buildPageUrl(BASE, "map")).toBe(BASE + "#dest-map");
    expect(buildPageUrl(BASE, "split")).toBe(BASE + "#dest-split");
  });
  it("shares the bare guide URL for Trip (the launch default) and for nothing", () => {
    expect(buildPageUrl(BASE, "trip")).toBe(BASE);
    expect(buildPageUrl(BASE, null)).toBe(BASE);
    expect(buildPageUrl(BASE, undefined)).toBe(BASE);
    expect(buildPageUrl(BASE, "")).toBe(BASE);
  });
  it("never produces a nonsense route for an unknown key", () => {
    expect(buildPageUrl(BASE, "3")).toBe(BASE);
    expect(buildPageUrl(BASE, "learn")).toBe(BASE);
  });
});

describe("buildWhatsAppShareUrl", () => {
  it("URL-encodes the shared link", () => {
    const url = buildWhatsAppShareUrl("https://x.test/g/#grp-2");
    expect(url).toBe("https://wa.me/?text=" + encodeURIComponent("https://x.test/g/#grp-2"));
    expect(url).not.toContain("#grp-2"); // raw # would truncate the wa.me query string
  });
});

describe("buildMailtoUrl", () => {
  it("encodes both subject and body independently", () => {
    const url = buildMailtoUrl("South Korea & Japan", "https://x.test/?a=1&b=2");
    expect(url).toBe(
      "mailto:?subject=" + encodeURIComponent("South Korea & Japan") +
      "&body=" + encodeURIComponent("https://x.test/?a=1&b=2"),
    );
  });

  it("encodes an ampersand in the title so it can't be mistaken for a mailto param separator", () => {
    // An unencoded "&" in the subject would be parsed as starting a new mailto field.
    const url = buildMailtoUrl("Food & Shopping", "https://x.test/");
    expect(url).not.toMatch(/subject=Food & Shopping/);
    expect(url).toContain(encodeURIComponent("Food & Shopping"));
  });
});

describe("buildSummaryShareText", () => {
  it("joins the summary and the URL with a blank line", () => {
    expect(buildSummaryShareText("A great trip.", "https://x.test/")).toBe("A great trip.\n\nhttps://x.test/");
  });

  it("does not mutate or trim the summary text", () => {
    expect(buildSummaryShareText("  padded  ", "u")).toBe("  padded  \n\nu");
  });
});
