import { describe, expect, it } from "vitest";
import { mayOfferPush, validActionablePush } from "./push";

describe("web push policy", () => {
  it.each(["leave-soon", "route-disruption", "severe-weather"] as const)("allows actionable %s events", (kind) => {
    expect(validActionablePush({ kind, title: "Act now", body: "A material trip condition changed.", url: "/Trip-Guides/guides/korea/", eventId: "event-1" })).toBe(true);
  });

  it("rejects engagement messages and external notification links", () => {
    expect(validActionablePush({ kind: "come-back", title: "We miss you", body: "Open Waypoint", url: "/Trip-Guides/", eventId: "x" })).toBe(false);
    expect(validActionablePush({ kind: "severe-weather", title: "Warning", body: "Act now", url: "https://evil.example", eventId: "x" })).toBe(false);
  });

  it("offers opt-in only in context after event sources are stable", () => {
    expect(mayOfferPush({ eventSourcesStable: false, inContext: true, permission: "default" })).toBe(false);
    expect(mayOfferPush({ eventSourcesStable: true, inContext: false, permission: "default" })).toBe(false);
    expect(mayOfferPush({ eventSourcesStable: true, inContext: true, permission: "denied" })).toBe(false);
    expect(mayOfferPush({ eventSourcesStable: true, inContext: true, permission: "default" })).toBe(true);
  });
});

