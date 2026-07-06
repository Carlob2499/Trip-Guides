import { describe, it, expect } from "vitest";
import { splitLead } from "./lead-split";

describe("splitLead", () => {
  it("keeps short bodies whole", () => {
    const r = splitLead("<p>One line.</p><p>Short tail.</p>");
    expect(r.more).toBeNull();
    expect(r.lead).toContain("Short tail");
  });
  it("splits at the first paragraph when the remainder is substantial", () => {
    const tail = "<p>" + "Long verified detail. ".repeat(20) + "</p>";
    const r = splitLead("<p>The lead sentence.</p>" + tail);
    expect(r.lead).toBe("<p>The lead sentence.</p>");
    expect(r.more).toContain("Long verified detail");
  });
  it("never drops content — lead + more re-compose the body", () => {
    const tail = "<ul>" + "<li>Item with plenty of text to cross the threshold easily.</li>".repeat(8) + "</ul>";
    const body = "<p>Lead.</p>" + tail;
    const r = splitLead(body);
    expect((r.lead + (r.more || "")).replace(/\s+/g, "")).toBe(body.replace(/\s+/g, ""));
  });
  it("handles empty/undefined", () => {
    expect(splitLead(undefined).more).toBeNull();
    expect(splitLead("").lead).toBe("");
  });
});
