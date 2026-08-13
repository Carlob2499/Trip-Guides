// Tests for the case-11 leg-duration check. The behaviour that matters most is what it
// REFUSES to do: escalate. Routes is config-gated and default OFF by creator ruling, and the
// fixture MANIFEST fixes this case as "advisory... never fails", so a check that cannot run
// must degrade rather than break a run.

// @protects-file Transit durations are measured against a routing authority, or the gap is counted.

import { describe, it, expect } from "vitest";
import { extractLegDurations, routesConfigured, checkRoutes } from "../audit/check-routes.mjs";

const leg = (over) => ({ title: "Getting around", body: "JR Senzan Line to Yamagata (≈70–90 min).", ...over });

describe("extractLegDurations", () => {
  it("finds a duration stated in transit context", () => {
    expect(extractLegDurations([leg()])).toHaveLength(1);
  });

  it("ignores a duration with no transit context — a dwell time is not a leg", () => {
    expect(extractLegDurations([{ title: "Sight", body: "Allow 45 min inside the museum." }])).toEqual([]);
  });

  it("counts a unit as sourced when its SECTION carries the source_url", () => {
    // An item under a sourced section is attested by that source; counting it unverified
    // would overstate the gap.
    const [a] = extractLegDurations([{ ...leg(), source_url: "https://jr.test/x" }]);
    expect(a.sourced).toBe(true);
    const [b] = extractLegDurations([{ title: "S", items: [{ name: "Leg", body: "bus ~35 min" }] }]);
    expect(b.sourced).toBe(false);
  });
});

describe("routesConfigured", () => {
  it("is false without a key and true with one — inert until configured", () => {
    expect(routesConfigured({ apiKey: undefined })).toBe(false);
    expect(routesConfigured({ apiKey: "k" })).toBe(true);
  });
});

describe("checkRoutes", () => {
  it("is ADVISORY, never fail, when legs are unattested and no key is set", () => {
    const r = checkRoutes([leg()], { apiKey: undefined });
    expect(r.status).toBe("advisory");
    expect(r.configured).toBe(false);
    expect(r.findings.map((f) => f.code)).toEqual(["leg-duration-unverified", "routes-not-configured"]);
  });

  it("counts attested vs total rather than flagging each leg individually", () => {
    const r = checkRoutes([leg({ source_url: "https://jr.test/x" }), leg({ title: "B" })], { apiKey: undefined });
    expect(r.legs).toBe(2);
    expect(r.unverified).toBe(1);
  });

  it("with a key set, says the remaining blocker is structural, not credential-shaped", () => {
    // Honest reporting beats a silent no-op: the durations live in prose with no
    // origin→destination pair to query, so a key alone cannot verify anything yet.
    const r = checkRoutes([leg()], { apiKey: "k" });
    expect(r.configured).toBe(true);
    expect(r.findings.map((f) => f.code)).toContain("routes-legs-unresolvable");
    expect(r.status).toBe("advisory");
  });

  it("is n/a for a guide that asserts no leg durations at all", () => {
    expect(checkRoutes([{ title: "Money", body: "Cash is common." }]).status).toBe("n/a");
  });

  it("never returns 'fail' under any input — the ruling this check exists under", () => {
    for (const input of [[], [leg()], [leg({ source_url: "https://x.test" })]]) {
      expect(checkRoutes(input, { apiKey: undefined }).status).not.toBe("fail");
    }
  });
});
