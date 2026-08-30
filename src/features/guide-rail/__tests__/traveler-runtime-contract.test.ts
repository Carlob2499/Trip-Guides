import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(path: string): string {
  return readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");
}

const layout = source("../../../layouts/GuideLayout.astro");
const guideUi = source("../../../scripts/guide-ui.js");
const scrollMemory = source("../../../scripts/scroll-memory.js");
const botbar = source("../../mobile-nav/ui/botbar.js");
const spine = source("../../itinerary/ui/spine.js");
const fieldTools = source("../../field-tools/ui/field-tools.js");

describe("traveler-first runtime migration", () => {
  it("projects authored sections into canonical destinations at the live layout boundary", () => {
    expect(layout).toContain("projectTravelerDestinations(guide.sections)");
    expect(layout).toContain("buildTravelerStations({");
    expect(layout).toContain('data-primary="true"');
    expect(layout).toContain('data-primary="false"');
    expect(layout).toContain("legacyRouteAnchors(guide.sections");
    expect(layout).toContain('id="dest-sources"');
    expect(layout).toContain('id="dest-recap"');
    expect(layout).toContain('id="dest-tools"');
    expect(layout).not.toContain("bucket(guide.sections)");
  });

  it("persists stable named routes instead of reusing old raw-group numeric state", () => {
    expect(guideUi).toContain('var TAB_KEY = "tg-r6-tab-" + STORE_KEY');
    expect(guideUi).toContain("function showRoute(route)");
    expect(guideUi).toContain('candidate.dataset.route === route');
    expect(guideUi).toContain('.gtab[data-primary="true"]:not([hidden])');
    expect(scrollMemory).toContain('var KEY = "tg-r6-scrollmem-" + storeKey');
    expect(scrollMemory).toContain('a.getAttribute("data-route") || a.getAttribute("data-tab")');
  });

  it("keeps progress geometry and mobile ranking on primary destinations while utilities stay reachable", () => {
    expect(spine).toContain('t.getAttribute("data-primary") === "true"');
    expect(fieldTools).toContain('.gtab[data-primary="true"]:not([hidden])');
    expect(botbar).toContain('.gtab[data-kind="tools"]');
    expect(botbar).toContain("return b || null");
    expect(layout).toContain('data-route="tools"');
  });
});
