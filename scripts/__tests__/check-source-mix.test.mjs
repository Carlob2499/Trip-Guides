// Tests for the source-mix measurement (standard S5). The behaviors worth pinning: domain
// grouping (incl. two-label suffixes like co.jp — naver.com and blog.naver.com are ONE
// domain, kyoto.travel and japan.travel are TWO), the monoculture ceiling as a ratchet
// (60%, above the measured worst of 25%), and the ccTLD heuristic staying honest — n/a for
// the US rather than a fake miss.

import { describe, it, expect } from "vitest";
import { sourceMix, domainOf, MAX_SHARE_BLOCK } from "../audit/check-source-mix.mjs";

const raw = (...urls) => urls.map((u) => `"source_url": "${u}"`).join("\n");

describe("domainOf", () => {
  it("groups subdomains into their registrable domain", () => {
    expect(domainOf("https://blog.naver.com/x")).toBe("naver.com");
    expect(domainOf("https://english.visitseoul.net/a")).toBe("visitseoul.net");
  });
  it("keeps two-label public suffixes whole — visitor.co.jp is not co.jp", () => {
    expect(domainOf("https://www.city.osaka.co.jp/x")).toBe("osaka.co.jp");
    expect(domainOf("https://english.visitkorea.or.kr/x")).toBe("visitkorea.or.kr");
  });
  it("returns null for garbage rather than throwing", () => {
    expect(domainOf("not a url")).toBeNull();
  });
});

describe("sourceMix", () => {
  it("counts distinct domains and the top share", () => {
    const m = sourceMix(raw(
      "https://a.example.org/1", "https://b.example.org/2", // one domain, two citations
      "https://official.dk/x", "https://other.com/y",
    ), "Denmark");
    expect(m.domains).toBe(3);
    expect(m.citations).toBe(4);
    expect(m.top.domain).toBe("example.org");
    expect(m.top.share).toBeCloseTo(0.5);
  });

  it("passes a healthy mix and fails a monoculture past the ceiling", () => {
    const healthy = sourceMix(raw("https://a.dk/1", "https://b.dk/2", "https://c.com/3"), "Denmark");
    expect(healthy.status).toBe("pass");
    const mono = sourceMix(raw(...Array.from({ length: 7 }, (_, i) => `https://onesite.com/${i}`), "https://other.dk/x"), "Denmark");
    expect(mono.top.share).toBeGreaterThan(MAX_SHARE_BLOCK);
    expect(mono.status).toBe("fail");
  });

  it("the ceiling is a ratchet: set above the measured worst real guide (us, 25%)", () => {
    expect(MAX_SHARE_BLOCK).toBe(0.6);
  });

  it("detects destination-ccTLD presence", () => {
    const with_ = sourceMix(raw("https://visitcopenhagen.dk/x", "https://a.com/y"), "Denmark");
    expect(with_.ccTld).toBe(".dk");
    expect(with_.hasDestinationTld).toBe(true);
    const without = sourceMix(raw("https://a.com/x", "https://b.org/y"), "Denmark");
    expect(without.hasDestinationTld).toBe(false);
  });

  it("reports ccTLD as n/a for the US — .us is unused by real US institutions", () => {
    const m = sourceMix(raw("https://nps.gov/x", "https://usda.gov/y"), "United States");
    expect(m.ccTld).toBeNull();
    expect(m.hasDestinationTld).toBeNull();
  });

  it("handles a guide with zero citations without dividing by zero", () => {
    const m = sourceMix("no links at all", "Japan");
    expect(m.domains).toBe(0);
    expect(m.top).toBeNull();
    expect(m.status).toBe("pass");
  });
});
