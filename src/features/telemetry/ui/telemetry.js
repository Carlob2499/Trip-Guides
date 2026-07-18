/* Telemetry client — increments an anonymous open-counter when a tab is opened. Best-effort
   and always-on (a footer line discloses it): no ids, no timings, just "this tab was opened."
   All decisions (path, sanitizing) live in ../model/telemetry.ts; data access is injected as a
   gateway so tests run with a fake and never touch Firebase. */

import { counterPath } from "../model/telemetry";

/**
 * Wire the guide tab bar so each tab open bumps its counter. `guide` is the guide's storeKey
 * (stable, human-readable — the summary reads by it). `gateway.bump(path)` performs the write.
 * Content tabs (data-tab is a number) count under "tabs" by their group name; the four tool
 * tabs (split/vote/remind/learn) count under "tools" by that key.
 */
export function initTelemetry(guide, gateway) {
  var tabs = document.getElementById("guideTabs");
  if (!tabs || !guide || !gateway || typeof gateway.bump !== "function") return;

  tabs.addEventListener("click", function (e) {
    var btn = e.target && e.target.closest ? e.target.closest(".gtab") : null;
    if (!btn) return;
    var dataTab = btn.getAttribute("data-tab");
    if (dataTab == null) return;
    var numbered = /^\d+$/.test(dataTab);
    var kind = numbered ? "tabs" : "tools";
    var name = numbered ? (btn.getAttribute("data-full") || dataTab) : dataTab;
    var path = counterPath(guide, kind, name);
    if (path) gateway.bump(path);
  }, { passive: true });
}
