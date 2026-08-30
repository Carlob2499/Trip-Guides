import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const layoutSource = readFileSync(
  fileURLToPath(new URL("../../../layouts/GuideLayout.astro", import.meta.url)),
  "utf8",
);
const guideUiSource = readFileSync(
  fileURLToPath(new URL("../../../scripts/guide-ui.js", import.meta.url)),
  "utf8",
);

describe("U01 traveler-first runtime migration contract", () => {
  it("switches GuideLayout to the canonical traveler projection and station model", () => {
    expect(layoutSource).toContain("projectTravelerDestinations");
    expect(layoutSource).toContain("buildTravelerStations");
    expect(layoutSource).toContain('data-primary="true"');
    expect(layoutSource).toContain('data-route={s.key}');
  });

  it("keeps evidence, recap, and utilities secondary but named and routable", () => {
    expect(layoutSource).toContain('data-route="sources"');
    expect(layoutSource).toContain('data-route="recap"');
    expect(layoutSource).toContain('data-route="tools"');
    expect(layoutSource).toContain("More for this trip");
  });

  it("preserves legacy deep-link anchors while moving canonical panels to named routes", () => {
    expect(layoutSource).toContain("legacyRouteAnchors");
    expect(layoutSource).toContain('id={`dest-${primaryStations[ci].key}`}');
    expect(layoutSource).toContain("legacyAnchorsFor");
  });

  it("uses one named-route router for desktop, mobile, share, and session restore", () => {
    expect(guideUiSource).toContain("function showRoute(route)");
    expect(guideUiSource).toContain('[data-action="guide-route"]');
    expect(guideUiSource).toContain("sessionStorage.setItem(TAB_KEY, activePanel.dataset.route)");
    expect(guideUiSource).toContain("if (!showRoute(savedRoute)) showTab(0)");
  });

  it("exposes Today as the shared contextual action instead of a utility station", () => {
    expect(layoutSource).toContain("data-today-action");
    expect(guideUiSource).toContain('document.querySelectorAll("[data-today-action]")');
  });
});
