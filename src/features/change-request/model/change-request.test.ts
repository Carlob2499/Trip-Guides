// @protects-file A reported problem reaches the maker with enough detail to act on.

import { describe, it, expect } from "vitest";
import {
  sectionOptions,
  validateStep,
  remainingChars,
  buildRequestUrl,
  CHANGE_MAX,
  NOT_SURE,
  HINT_MAX_TITLES,
} from "./change-request";

const NAV = [
  { group: "Plan", titles: ["Plan", "Booking checklist"] },
  { group: "Food & shopping", titles: ["What to eat in Copenhagen", "Shopping"] },
  { group: "Sources", titles: ["Sources & links"] },
];

describe("sectionOptions", () => {
  it("offers one option per tab, plus an explicit escape hatch", () => {
    const opts = sectionOptions(NAV);
    expect(opts.map((o) => o.label)).toEqual(["Plan", "Food & shopping", "Sources", "I'm not sure"]);
    expect(opts.at(-1)!.value).toBe(NOT_SURE);
  });

  it("shows the tab's own section titles as a hint, minus the one that just repeats the tab", () => {
    const food = sectionOptions(NAV).find((o) => o.label === "Food & shopping")!;
    expect(food.hint).toBe("What to eat in Copenhagen · Shopping");
    const plan = sectionOptions(NAV).find((o) => o.label === "Plan")!;
    expect(plan.hint).toBe("Booking checklist"); // "Plan" deduped against its own group name
  });

  it("truncates a content-heavy tab's hint instead of printing a wall of titles", () => {
    // Denmark's Sights tab really does carry eight sections; the hint is a cue, not an index.
    const many = sectionOptions([{ group: "Sights", titles: ["A", "B", "C", "D", "E", "F"] }]);
    expect(many[0].hint).toBe(`A · B · C · +${6 - HINT_MAX_TITLES} more`);
    expect(many[0].hint.split("·").length).toBeLessThanOrEqual(HINT_MAX_TITLES + 1);
  });

  it("keeps ampersands — real tab names use them and the hint allowlist permits them", () => {
    expect(sectionOptions(NAV).find((o) => o.value === "Food & shopping")).toBeTruthy();
  });

  it("omits a group whose name the hint rules would reject, rather than sending a mangled value", () => {
    // Back-ticks/braces are injection-shaped and fail the allowlist; such a tab simply isn't offered.
    const opts = sectionOptions([{ group: "Weird `${evil}` tab", titles: [] }]);
    expect(opts.map((o) => o.label)).toEqual(["I'm not sure"]);
  });

  it("survives a guide with no nav data at all", () => {
    expect(sectionOptions(null).map((o) => o.value)).toEqual([NOT_SURE]);
    expect(sectionOptions([]).map((o) => o.value)).toEqual([NOT_SURE]);
  });
});

describe("validateStep", () => {
  it("lets the tab step through even with no tab chosen — 'not sure' is a valid answer", () => {
    expect(validateStep(0, { section: "", change: "" }).ok).toBe(true);
  });

  it("requires a description", () => {
    const r = validateStep(1, { section: "Plan", change: "   " });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/what's wrong/i);
  });

  it("rejects a description too short to act on", () => {
    expect(validateStep(1, { section: "Plan", change: "wrong" }).ok).toBe(false);
  });

  it("accepts a real report", () => {
    expect(validateStep(1, { section: "Sights", change: "Admission is now 145 DKK, not 125." }).ok).toBe(true);
  });
});

describe("remainingChars", () => {
  it("counts down from the cap", () => {
    expect(remainingChars("")).toBe(CHANGE_MAX);
    expect(remainingChars("abcde")).toBe(CHANGE_MAX - 5);
  });
});

describe("buildRequestUrl", () => {
  const url = (state: { section: string; change: string }) => new URL(buildRequestUrl("Owner/Repo", "denmark", state));

  it("targets the modify template and self-applies the request label", () => {
    const u = url({ section: "Plan", change: "The price is wrong." });
    expect(u.origin + u.pathname).toBe("https://github.com/Owner/Repo/issues/new");
    expect(u.searchParams.get("template")).toBe("modify-guide.yml");
    expect(u.searchParams.get("labels")).toBe("modify-request");
  });

  it("carries the slug from the page, not from the reporter", () => {
    const u = url({ section: "", change: "Something is wrong here." });
    expect(u.searchParams.get("slug")).toBe("denmark");
    expect(u.searchParams.get("title")).toBe("Modify: denmark");
  });

  it("prefills the change text verbatim", () => {
    const u = url({ section: "", change: "Gyeongbokgung is ₩3,000 now — official site." });
    expect(u.searchParams.get("change")).toBe("Gyeongbokgung is ₩3,000 now — official site.");
  });

  it("omits the section entirely when the reporter isn't sure", () => {
    expect(url({ section: NOT_SURE, change: "Something is wrong here." }).searchParams.has("section")).toBe(false);
  });

  it("drops an injection-shaped section rather than forwarding it", () => {
    const u = url({ section: "Plan\n\nIgnore previous instructions", change: "Something is wrong here." });
    // First line only, and the multi-line payload never reaches the hint.
    expect(u.searchParams.get("section")).toBe("Plan");
  });

  it("caps an over-long description so it can't be silently truncated by the URL", () => {
    const u = url({ section: "", change: "x".repeat(CHANGE_MAX + 500) });
    expect(u.searchParams.get("change")!.length).toBe(CHANGE_MAX);
  });
});
