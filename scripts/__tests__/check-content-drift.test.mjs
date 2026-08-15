// Tests for E2 (docs/archive/INDEX.md → PLAN_EVIDENCE_FIRST) — source drift. The point of the packet is the
// "200 ≠ verified" class: checkLinks proves a server answered, this proves the page still
// carries the claim. All fetches are mocked — repo doctrine is zero-network tests, which is
// why checkDrift takes an injectable fetchPage rather than calling fetch itself.

// @protects-file A live source URL cannot vouch for a fact its page no longer states.

import { describe, it, expect } from "vitest";
import { digitsOf, valuePattern, pageText, pageSupports, checkDrift } from "../audit/check-content-drift.mjs";

const page = (body) => ({ ok: true, text: body });
const fetcherFor = (map) => async (url) => map[url] ?? { ok: false, status: 404 };

describe("valuePattern / digitsOf — matching a figure as a page would really print it", () => {
  it("matches the same number written with different separators", () => {
    const rx = valuePattern("¥11,410");
    expect(rx.test("Fare: 11,410 yen")).toBe(true);
    expect(rx.test("Fare: 11410 yen")).toBe(true);
    expect(rx.test("Fare: 11 410 yen")).toBe(true);
  });

  it("does not match the digits embedded in a LARGER number", () => {
    // Without digit-boundary anchoring, "410" would match inside "3410" and a drifted page
    // would pass by coincidence.
    expect(valuePattern("410").test("price 3410")).toBe(false);
    expect(valuePattern("410").test("price 410")).toBe(true);
  });

  it("refuses to build a pattern from a single digit — it would match almost any page", () => {
    expect(valuePattern("$5")).toBeNull();
    expect(digitsOf("¥1,000")).toBe("1000");
  });
});

describe("pageText", () => {
  it("strips markup, scripts and styles so a figure in the copy is what gets matched", () => {
    const t = pageText("<style>.a{x:1}</style><script>var v=999</script><p>Adult <b>¥3,000</b></p>");
    expect(t).toContain("¥3,000");
    expect(t).not.toContain("999");
  });
});

describe("pageSupports", () => {
  it("passes on the value alone — the path that works on every existing row", () => {
    expect(pageSupports("<p>Adult ¥3,000</p>", { value: "¥3,000" })).toEqual({ supported: true, via: "value" });
  });

  it("prefers the evidence snippet when the research pass supplied one", () => {
    const r = pageSupports("<p>Closed for the season</p>", { value: "¥3,000", evidence: "Closed for the season" });
    expect(r).toEqual({ supported: true, via: "evidence" });
  });

  it("fails when neither the snippet nor the value is on the page", () => {
    expect(pageSupports("<p>Under maintenance</p>", { value: "¥3,000" }).supported).toBe(false);
  });

  it("fails on a 200 that returned an EMPTY page — the exact 200-≠-verified shape", () => {
    expect(pageSupports("", { value: "¥3,000" }).supported).toBe(false);
  });
});

describe("checkDrift", () => {
  it("passes a registry whose pages still carry their values", async () => {
    const facts = { a: { value: "¥3,000", source_url: "https://zao.test/x" } };
    const r = await checkDrift(facts, { fetchPage: fetcherFor({ "https://zao.test/x": page("Adult ¥3,000") }) });
    expect(r.status).toBe("pass");
    expect(r.checked).toBe(1);
  });

  it("fetches each URL ONCE even when many rows cite it", async () => {
    let calls = 0;
    const facts = {
      a: { value: "₩4,800", source_url: "https://vk.test/p" },
      b: { value: "₩11,000", source_url: "https://vk.test/p" },
    };
    await checkDrift(facts, {
      fetchPage: async () => { calls++; return page("₩4,800 and ₩11,000"); },
    });
    expect(calls).toBe(1);
  });

  it("reports an unreachable source WITHOUT calling it drift — liveness is checkLinks' verdict", async () => {
    const facts = { a: { value: "¥3,000", source_url: "https://dead.test/x" } };
    const r = await checkDrift(facts, { fetchPage: fetcherFor({}) });
    expect(r.findings.map((f) => f.code)).toEqual(["source-unreachable"]);
    expect(r.findings.some((f) => f.code === "drifted")).toBe(false);
  });

  it("says 'uncheckable' rather than 'drifted', and distinguishes WHY", async () => {
    // Conflating these two misleads: a non-numeric value and a 1-digit value are both
    // unsearchable, but for different reasons. The live run on `us` surfaced the second
    // ("$5" for the Red Rock Pass) reported as if it had no numeric value at all.
    const noDigits = await checkDrift({ a: { value: "free", source_url: "https://x.test/a" } },
      { fetchPage: fetcherFor({ "https://x.test/a": page("nothing here") }) });
    expect(noDigits.findings[0].code).toBe("drift-uncheckable");
    expect(noDigits.findings[0].msg).toMatch(/no numeric value/);

    const oneDigit = await checkDrift({ b: { value: "$5", source_url: "https://x.test/b" } },
      { fetchPage: fetcherFor({ "https://x.test/b": page("nothing here") }) });
    expect(oneDigit.findings[0].code).toBe("drift-uncheckable");
    expect(oneDigit.findings[0].msg).toMatch(/single digit/);
  });

  it("stays ADVISORY, but names the R3+ rows that will block once enforced", async () => {
    const facts = {
      cheap: { value: "¥500", risk: 1, source_url: "https://a.test/1" },
      anchor: { value: "¥9,800", risk: 3, source_url: "https://a.test/2" },
    };
    const r = await checkDrift(facts, {
      fetchPage: fetcherFor({ "https://a.test/1": page("gone"), "https://a.test/2": page("gone") }),
    });
    expect(r.status).toBe("advisory");
    expect(r.blockers).toEqual(["anchor"]);
  });

  it("is n/a with no sourced rows or no fetcher", async () => {
    expect((await checkDrift({}, { fetchPage: async () => page("") })).status).toBe("n/a");
    expect((await checkDrift({ a: { value: "1", source_url: "u" } }, {})).status).toBe("n/a");
  });
});

// ── ACCEPTANCE ───────────────────────────────────────────────────────────────────────────
// "regression case 12-class drift (a closure notice replacing a price page) is caught by the
// value-absence path." Built from the fixture's real row so the specimen is not invented.
describe("E2 ACCEPTANCE — case 12, the closure notice that replaces a price page", async () => {
  const { readFile } = await import("node:fs/promises");
  const facts = JSON.parse(
    await readFile(new URL("../../tests/fixtures/japan-regression/guide/facts.json", import.meta.url), "utf8"),
  );
  const zaoId = Object.keys(facts).find((k) => /zao/i.test(k));
  const zao = facts[zaoId];

  it("the fixture really does carry the Zao crater price row this case is about", () => {
    expect(zaoId).toBeTruthy();
    expect(digitsOf(zao.value)).toBe("3000");
  });

  it("PASSES while the source still prices it — a live, honest page must not drift-flag", async () => {
    const r = await checkDrift({ [zaoId]: zao }, {
      fetchPage: async () => page("<p>Okama crater — adult ¥3,000, ropeway operating.</p>"),
    });
    expect(r.status).toBe("pass");
  });

  it("DRIFTS the moment the price page becomes a seasonal-closure notice", async () => {
    // The 200-≠-verified specimen: the server answers, checkLinks is green, and the page no
    // longer supports the fact the guide is standing on for a Nov 5 visit.
    const r = await checkDrift({ [zaoId]: zao }, {
      fetchPage: async () => page("<p>蔵王ロープウェイ — closed for the winter season. Reopens in spring.</p>"),
    });
    const drifted = r.findings.filter((f) => f.code === "drifted");
    expect(drifted).toHaveLength(1);
    expect(drifted[0].ids).toEqual([zaoId]);
    expect(drifted[0].msg).toMatch(/no longer appears/);
  });
});
