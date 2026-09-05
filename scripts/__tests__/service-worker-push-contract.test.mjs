import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("service worker push contract", () => {
  it("admits only actionable trip events and same-app click targets", async () => {
    const source = await readFile(new URL("../../public/sw.js", import.meta.url), "utf8");
    expect(source).toContain('new Set(["leave-soon", "route-disruption", "severe-weather"])');
    expect(source).toContain('value.url.startsWith(BASE + "/")');
    expect(source).toContain('self.addEventListener("push"');
    expect(source).toContain('self.addEventListener("notificationclick"');
    expect(source).not.toMatch(/"come-back"|"promotion"/i);
  });
});
