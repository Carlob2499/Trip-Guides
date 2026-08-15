// Tests for the E1 `tier` backfill (docs/archive/INDEX.md → PLAN_EVIDENCE_FIRST, defect D5 — a schema field
// nothing ever populated). The behaviors worth pinning are all about what the script REFUSES
// to assert: a hostname can prove "primary", and it cannot prove anything else, so every
// non-match must stay blank rather than becoming a false `secondary`.

// @protects-file Fact sources are only labelled primary when the destination's own domain list proves it.

import { describe, it, expect } from "vitest";
import { hostMatchesDomain, tierForUrl, proposeTiers } from "../backfill-tier.mjs";

describe("hostMatchesDomain", () => {
  it("matches the domain itself and any subdomain of it", () => {
    expect(hostMatchesDomain("visitkorea.or.kr", "visitkorea.or.kr")).toBe(true);
    expect(hostMatchesDomain("english.visitkorea.or.kr", "visitkorea.or.kr")).toBe(true);
    expect(hostMatchesDomain("mlit.go.jp", "go.jp")).toBe(true); // the JP government TLD, recorded deliberately in D1
  });

  it("does NOT match on a bare substring — the impersonation failure mode", () => {
    // "notjreast.co.jp" contains "jreast.co.jp"; a substring check would call it primary.
    expect(hostMatchesDomain("notjreast.co.jp", "jreast.co.jp")).toBe(false);
    expect(hostMatchesDomain("jreast.co.jp.evil.com", "jreast.co.jp")).toBe(false);
  });

  it("is case- and trailing-dot-insensitive, and never matches on empty input", () => {
    expect(hostMatchesDomain("WWW.TSA.GOV.", "tsa.gov")).toBe(true);
    expect(hostMatchesDomain("", "tsa.gov")).toBe(false);
    expect(hostMatchesDomain("tsa.gov", "")).toBe(false);
  });
});

describe("tierForUrl", () => {
  const t0 = ["go.kr", "visitkorea.or.kr"];

  it("returns 'primary' when the host is under a declared t0Domain", () => {
    expect(tierForUrl("https://english.visitkorea.or.kr/svc/x", t0)).toBe("primary");
  });

  it("returns null — never 'secondary' — for a host outside the list", () => {
    // The load-bearing case: KT's own eSIM page and an aquarium's own ticket page are T0 by
    // verification-rules.md §3 ("the venue's own site") but can never appear in a
    // destination-level domain list. Calling them `secondary` would fail E1(b)'s
    // `tier: primary` gate on facts that deserve to pass.
    expect(tierForUrl("https://roaming.kt.com/esim/eng/main.asp", t0)).toBeNull();
    expect(tierForUrl("https://www.federalreserve.gov/releases/h10/current/", t0)).toBeNull();
  });

  it("returns null for an absent or unparseable source_url", () => {
    expect(tierForUrl(undefined, t0)).toBeNull();
    expect(tierForUrl("", t0)).toBeNull();
    expect(tierForUrl("not a url", t0)).toBeNull();
  });

  it("returns null for every url when the destination declares no t0Domains", () => {
    expect(tierForUrl("https://visitkorea.or.kr/x", [])).toBeNull();
  });
});

describe("proposeTiers", () => {
  const t0 = ["tsa.gov"];

  it("assigns primary only to provable rows and explains every skip", () => {
    const facts = {
      "entry-45": { value: "$45", source_url: "https://www.tsa.gov/realid" },
      "hotel-173": { value: "$173", source_url: "https://www.budgetyourtrip.com/x" },
      "origin": { value: "PHX" },
    };
    const { assignments, skipped } = proposeTiers(facts, t0);
    expect(assignments).toEqual([{ id: "entry-45", tier: "primary", source_url: "https://www.tsa.gov/realid" }]);
    expect(skipped.map((s) => s.id)).toEqual(["hotel-173", "origin"]);
    expect(skipped[1].reason).toBe("no source_url");
  });

  it("NEVER overwrites an existing tier — a research call outranks a hostname sweep", () => {
    const facts = { a: { source_url: "https://www.tsa.gov/realid", tier: "corroborated" } };
    const { assignments, skipped } = proposeTiers(facts, t0);
    expect(assignments).toEqual([]);
    expect(skipped[0].reason).toBe("already tier: corroborated");
  });

  it("is idempotent — re-running over its own output proposes nothing", () => {
    const facts = { a: { source_url: "https://www.tsa.gov/realid" } };
    const first = proposeTiers(facts, t0);
    for (const x of first.assignments) facts[x.id].tier = x.tier;
    expect(proposeTiers(facts, t0).assignments).toEqual([]);
  });

  it("handles an empty/absent registry without throwing", () => {
    expect(proposeTiers({}, t0).assignments).toEqual([]);
    expect(proposeTiers(null, t0).assignments).toEqual([]);
  });
});
