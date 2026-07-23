import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { findGuidesInWindow, buildReport } from "./pretrip-check.ts";

const NOW = new Date(2026, 6, 23); // Thu Jul 23 2026 (local) — matches this session's date

let dir;

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "pretrip-fixture-"));

  await writeFile(
    path.join(dir, "soon-trip.json"),
    JSON.stringify({
      title: "Soon Trip",
      country: "Testland",
      sections: [{ type: "days", group: "Plan", items: [{ date: "Mon Jul 27", title: "Day 1" }, { date: "Thu Jul 30", title: "Day 4" }] }],
    }),
  );
  await writeFile(
    path.join(dir, "far-trip.json"),
    JSON.stringify({
      title: "Far Trip",
      country: "Testland",
      sections: [{ type: "days", group: "Plan", items: [{ date: "Wed Sep 2", title: "Day 1" }] }],
    }),
  );
  await writeFile(
    path.join(dir, "past-trip.json"),
    JSON.stringify({
      title: "Past Trip",
      country: "Testland",
      sections: [{ type: "days", group: "Plan", items: [{ date: "Mon Jan 5", title: "Day 1" }] }],
    }),
  );
  await writeFile(
    path.join(dir, "draft-trip.json"),
    JSON.stringify({
      title: "Draft Trip",
      draft: true,
      country: "Testland",
      sections: [{ type: "days", group: "Plan", items: [{ date: "Sun Jul 26", title: "Day 1" }] }],
    }),
  );
  await writeFile(
    path.join(dir, "archived-soon.json"),
    JSON.stringify({
      title: "Archived Soon",
      archived: true,
      country: "Testland",
      sections: [{ type: "days", group: "Plan", items: [{ date: "Mon Jul 27", title: "Day 1" }] }],
    }),
  );
  await writeFile(path.join(dir, "no-days.json"), JSON.stringify({ title: "No Days", country: "Testland", sections: [] }));
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("findGuidesInWindow", () => {
  it("finds a guide whose trip starts within 7 days, sorted soonest-first", async () => {
    const result = await findGuidesInWindow(NOW, dir);
    expect(result.map((g) => g.slug)).toEqual(["soon-trip"]);
    expect(result[0].daysUntilStart).toBe(4); // Jul 23 → Jul 27
    expect(result[0].startDate).toBe("Mon Jul 27");
  });

  it("excludes a trip more than 7 days out", async () => {
    const result = await findGuidesInWindow(NOW, dir);
    expect(result.some((g) => g.slug === "far-trip")).toBe(false);
  });

  it("excludes a trip already in the past", async () => {
    const result = await findGuidesInWindow(NOW, dir);
    expect(result.some((g) => g.slug === "past-trip")).toBe(false);
  });

  it("excludes a draft guide even if its dates would otherwise qualify", async () => {
    const result = await findGuidesInWindow(NOW, dir);
    expect(result.some((g) => g.slug === "draft-trip")).toBe(false);
  });

  it("excludes an archived guide even if its dates would otherwise qualify", async () => {
    const result = await findGuidesInWindow(NOW, dir);
    expect(result.some((g) => g.slug === "archived-soon")).toBe(false);
  });

  it("skips a guide with no days[] section at all, rather than throwing", async () => {
    const result = await findGuidesInWindow(NOW, dir);
    expect(result.some((g) => g.slug === "no-days")).toBe(false);
  });

  it("includes a trip starting exactly today (0 days out)", async () => {
    const todayDir = await mkdtemp(path.join(tmpdir(), "pretrip-today-"));
    await writeFile(
      path.join(todayDir, "today-trip.json"),
      JSON.stringify({ title: "Today", country: "T", sections: [{ type: "days", group: "Plan", items: [{ date: "Thu Jul 23", title: "Day 1" }] }] }),
    );
    const result = await findGuidesInWindow(NOW, todayDir);
    expect(result.map((g) => g.slug)).toEqual(["today-trip"]);
    expect(result[0].daysUntilStart).toBe(0);
    await rm(todayDir, { recursive: true, force: true });
  });
});

describe("buildReport", () => {
  it("reports an honest 'nothing in window' when the list is empty", () => {
    const body = buildReport([], {}, NOW);
    expect(body).toContain("No guide is within 7 days");
  });

  it("reports a guide with no stale facts as current", () => {
    const body = buildReport([{ slug: "soon-trip", daysUntilStart: 4, startDate: "Jul 27" }], {}, NOW);
    expect(body).toContain("soon-trip");
    expect(body).toContain("departs in 4d");
    expect(body).toContain("Current — nothing past its shelf life");
  });

  it("reports a guide WITH stale facts and points at the recert commands", () => {
    const byGuide = { "soon-trip": { guideStale: { date: "Jan 2026", ageDays: 200 }, sections: [{ title: "Food" }] } };
    const body = buildReport([{ slug: "soon-trip", daysUntilStart: 4, startDate: "Jul 27" }], byGuide, NOW);
    expect(body).toContain("2 item(s) past shelf life");
    expect(body).toContain("npm run recert -- --slug soon-trip");
    expect(body).toContain("recert.yml");
  });
});
