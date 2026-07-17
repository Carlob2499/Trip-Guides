import { describe, it, expect } from "vitest";
import { buildPageUrl, buildWhatsAppShareUrl, buildMailtoUrl, buildSummaryShareText } from "./share-links";

describe("buildPageUrl", () => {
  const BASE = "https://carlob2499.github.io/Trip-Guides/guides/korea/";

  it("adds a #grp-N deep link for a numbered active tab", () => {
    expect(buildPageUrl(BASE, "3")).toBe(BASE + "#grp-3");
  });

  it("returns the bare base URL when no tab is active", () => {
    expect(buildPageUrl(BASE, null)).toBe(BASE);
    expect(buildPageUrl(BASE, undefined)).toBe(BASE);
  });

  it("returns the bare base URL for a SPECIAL panel (budget/vote/remind/learn) — not numeric", () => {
    // Special panels use string ids like "split"/"vote"/"learn"/"remind" for data-tab,
    // not a digit — those must not produce a nonsense "#grp-split" link.
    expect(buildPageUrl(BASE, "split")).toBe(BASE);
    expect(buildPageUrl(BASE, "learn")).toBe(BASE);
  });

  it("returns the bare base URL for an empty string tab id", () => {
    expect(buildPageUrl(BASE, "")).toBe(BASE);
  });

  it("accepts tab index 0 — falsy but a real, valid tab", () => {
    // A naive `if (t)` check would drop tab 0 (the first tab) silently; this must not.
    expect(buildPageUrl(BASE, "0")).toBe(BASE + "#grp-0");
  });

  it("rejects a non-purely-numeric tab id (defensive against unexpected markup)", () => {
    expect(buildPageUrl(BASE, "3abc")).toBe(BASE);
    expect(buildPageUrl(BASE, "-1")).toBe(BASE); // no leading sign allowed
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
