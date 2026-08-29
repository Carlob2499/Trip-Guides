// @protects-file A shared link points at the exact section being shared, correctly encoded.

import { describe, it, expect } from "vitest";
import { buildPageUrl, buildWhatsAppShareUrl, buildMailtoUrl, buildSummaryShareText } from "./share-links";

describe("buildPageUrl", () => {
  const BASE = "https://carlob2499.github.io/Trip-Guides/guides/korea/";

  it("adds a stable named destination for every public guide route", () => {
    for (const route of ["days", "food", "explore", "essentials", "sources", "recap", "tools"])
      expect(buildPageUrl(BASE, route)).toBe(BASE + "#dest-" + route);
  });

  it("returns the bare base URL when no tab is active", () => {
    expect(buildPageUrl(BASE, null)).toBe(BASE);
    expect(buildPageUrl(BASE, undefined)).toBe(BASE);
  });

  it("returns the bare base URL for retired special panels", () => {
    expect(buildPageUrl(BASE, "split")).toBe(BASE);
    expect(buildPageUrl(BASE, "learn")).toBe(BASE);
  });

  it("returns the bare base URL for an empty string tab id", () => {
    expect(buildPageUrl(BASE, "")).toBe(BASE);
  });

  it("does not publish positional or malformed route ids", () => {
    expect(buildPageUrl(BASE, "0")).toBe(BASE);
    expect(buildPageUrl(BASE, "3")).toBe(BASE);
    expect(buildPageUrl(BASE, "3abc")).toBe(BASE);
    expect(buildPageUrl(BASE, "-1")).toBe(BASE);
  });
});

describe("buildWhatsAppShareUrl", () => {
  it("URL-encodes the shared link", () => {
    const url = buildWhatsAppShareUrl("https://x.test/g/#dest-explore");
    expect(url).toBe("https://wa.me/?text=" + encodeURIComponent("https://x.test/g/#dest-explore"));
    expect(url).not.toContain("#dest-explore"); // raw # would truncate the wa.me query string
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
