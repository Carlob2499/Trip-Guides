// D2 regression test: the widened provenance advisory in check-research.mjs. Build-time
// content.config.ts strict gate only fires on `≈`-flagged text and only on section-level
// verified_on for panel/prose/list/routes — this covers the wider surface (precise-looking
// undated hours/prices, and days/sights/budget item-level provenance) as ADVISORY findings
// (severity "info"), never blocking, so shipped guides don't retroactively fail verify.
import { describe, it, expect } from "vitest";
import { checkResearchGuide } from "./check-research.mjs";

function infos(guide) {
  return checkResearchGuide(guide, "fixture").findings.filter((f) => f.severity === "info");
}
function warns(guide) {
  return checkResearchGuide(guide, "fixture").findings.filter((f) => f.severity === "warn");
}

describe("check-research — widened provenance advisory (D2)", () => {
  it("flags an undated precise-looking hour with no verified_on, as advisory only", () => {
    const guide = {
      verified: "⚠ draft",
      sections: [{ type: "prose", group: "Plan", title: "Opening hours", body: "Open 9am–5pm daily." }],
    };
    const found = infos(guide).some((f) => f.msg.includes("Opening hours") && f.msg.includes("D2 advisory"));
    expect(found).toBe(true);
    expect(warns(guide).length).toBe(0);
  });

  it("flags an undated price figure with no verified_on, as advisory only", () => {
    const guide = {
      verified: "⚠ draft",
      sections: [{ type: "panel", group: "Essentials", title: "Entry fee", body: "Tickets cost $20 at the door." }],
    };
    const found = infos(guide).some((f) => f.msg.includes("Entry fee"));
    expect(found).toBe(true);
  });

  it("does not flag a section that carries verified_on", () => {
    const guide = {
      verified: "⚠ draft",
      sections: [{ type: "prose", group: "Plan", title: "Opening hours", body: "Open 9am–5pm daily.", verified_on: "2026-01-01", source_url: "https://example.com" }],
    };
    const found = infos(guide).some((f) => f.msg.includes("Opening hours"));
    expect(found).toBe(false);
  });

  it("extends to item-level provenance on days/sights/budget (previously skipped entirely)", () => {
    const guide = {
      verified: "⚠ draft",
      sections: [
        {
          type: "sights", group: "Sights", title: "Sights",
          items: [{ name: "Old Castle", body: "Entry is €12 per adult." }],
        },
        {
          type: "days", group: "Days", title: "Days",
          items: [{ date: "Jan 1", title: "Day 1", body: "Museum opens at 10am." }],
        },
        {
          type: "budget", group: "Budget", title: "Budget",
          items: [{ label: "Hotel", amount: 0, note: "Rate is ₩120,000/night." }],
        },
      ],
    };
    const msgs = infos(guide).map((f) => f.msg);
    expect(msgs.some((m) => m.includes("Old Castle"))).toBe(true);
    expect(msgs.some((m) => m.includes("Day 1"))).toBe(true);
    expect(msgs.some((m) => m.includes("Hotel"))).toBe(true);
  });

  it("does not flag an item that already carries its own verified_on", () => {
    const guide = {
      verified: "⚠ draft",
      sections: [
        {
          type: "sights", group: "Sights", title: "Sights",
          items: [{ name: "Old Castle", body: "Entry is €12 per adult.", verified_on: "2026-01-01", source_url: "https://example.com" }],
        },
      ],
    };
    const msgs = infos(guide).map((f) => f.msg);
    expect(msgs.some((m) => m.includes("Old Castle"))).toBe(false);
  });

  it("does not flag durable prose with no hour/price-looking text", () => {
    const guide = {
      verified: "⚠ draft",
      sections: [{ type: "prose", group: "Etiquette", title: "Tipping", body: "Tipping isn't expected here." }],
    };
    const msgs = infos(guide).map((f) => f.msg);
    expect(msgs.some((m) => m.includes("Tipping"))).toBe(false);
  });
});
