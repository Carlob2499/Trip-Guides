/* Public surface of the telemetry feature. Consumers import ONLY from here.

   Anonymous, PII-free usage counting: how often each tab is opened, per guide, so the maker
   learns what travelers actually use (goal 6) and tab-budget calls cite evidence, not doctrine.
   A footer line discloses it; there is no per-device opt-out by decision (small trusted circle).

   Data access is an injectable gateway (the silo contract): the default writes through the
   firebase silo's atomic counter, but a test or a future backend can pass its own. */

import { initTelemetry as bindTabBar } from "./ui/telemetry.js";
import { bumpCounter } from "../firebase/index.js";

export { counterPath, sanitizeName, summarize } from "./model/telemetry";

/** The default gateway — a thin wrapper over the firebase silo's best-effort counter. */
export const firebaseGateway = { bump: function (path) { bumpCounter(path); } };

/** Boot telemetry for this guide (storeKey). Pass a custom gateway to swap the data sink. */
export function initTelemetry(guide, gateway) {
  bindTabBar(guide, gateway || firebaseGateway);
}

// Self-boot on a guide page: read the guide's storeKey from #tgConfig and start counting
// (matches the field-tools / maps import-to-boot convention). Guarded for non-browser so the
// model tests, which import ./model directly, never touch this.
if (typeof document !== "undefined") {
  try {
    var _cfgEl = document.getElementById("tgConfig");
    var _cfg = _cfgEl ? JSON.parse(_cfgEl.textContent || "{}") : {};
    if (_cfg.storeKey) initTelemetry(_cfg.storeKey);
  } catch (e) { /* telemetry never breaks the page */ }
}
