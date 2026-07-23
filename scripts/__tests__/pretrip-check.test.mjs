// Tests for the W1 auto-dispatch decision logic in scripts/pretrip-check.ts. The dispatch
// side-effects (gh workflow run, the in-flight lookup) are impure and stay untested here; what
// matters is the PURE decision — dispatch only an in-window guide that has stale facts and no
// recert already in flight — which is exactly what gates whether agent tokens get spent.

import { describe, it, expect } from "vitest";
import { shouldDispatch, staleItemCount } from "../pretrip-check.ts";

const guide = (slug, daysUntilStart = 3) => ({ slug, daysUntilStart, startDate: "2026-09-01" });

describe("staleItemCount (pure)", () => {
  it("is 0 when the guide has no recert entry (nothing stale)", () => {
    expect(staleItemCount(undefined)).toBe(0);
  });
  it("counts stale sections plus the guide-level stamp", () => {
    expect(staleItemCount({ sections: [1, 2], guideStale: false })).toBe(2);
    expect(staleItemCount({ sections: [1, 2], guideStale: true })).toBe(3);
    expect(staleItemCount({ sections: [], guideStale: true })).toBe(1);
  });
});

describe("shouldDispatch (pure)", () => {
  it("dispatches an in-window guide with stale facts and no recert in flight", () => {
    const d = shouldDispatch(guide("korea", 3), 2, false);
    expect(d).toEqual({ slug: "korea", dispatch: true, reason: expect.stringContaining("2 stale item(s)") });
  });

  it("does NOT dispatch when nothing is stale", () => {
    const d = shouldDispatch(guide("denmark", 1), 0, false);
    expect(d.dispatch).toBe(false);
    expect(d.reason).toMatch(/current/i);
  });

  it("does NOT dispatch when a recert is already in flight (dedupe)", () => {
    const d = shouldDispatch(guide("korea", 2), 5, true);
    expect(d.dispatch).toBe(false);
    expect(d.reason).toMatch(/flight/i);
  });

  it("prefers the 'nothing stale' reason over the in-flight one when both apply", () => {
    // staleCount 0 short-circuits first — a current guide is never 'in flight'.
    expect(shouldDispatch(guide("korea"), 0, true).reason).toMatch(/current/i);
  });
});
