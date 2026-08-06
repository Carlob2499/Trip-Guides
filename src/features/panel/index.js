/** panel — the Atlas container's behaviour: a Panel the reader collapsed stays collapsed.

    The memory is per-DEVICE and per-SCOPE. A scope is whatever page the Panels belong to
    (a guide slug, a hub, a design-study route); its key comes from `scopeKey`, and there
    is deliberately no global fallback key — collapsing a Panel on one guide must never
    collapse anything on another.

    Data access is an injectable gateway (the silo contract): pass your own `store` and a
    test or a future backend swaps the sink without touching ui/. */

import { initPanels } from "./ui/collapse.js";

export {
  parseCollapsed, serializeCollapsed, setCollapsed, toggleCollapsed, isCollapsed, scopeKey,
  MAX_ID_LEN, MAX_PANELS,
} from "./model/collapse";

/** The default gateway — plain localStorage, every access already fail-safe. */
export const localStore = {
  read: function (key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  },
  write: function (key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* private mode / quota */ }
  },
};

/** Boot every Panel in one scope. `cfg` = { scope: string, root?: ParentNode }. */
export function initPanelCollapse(cfg, store) {
  initPanels({
    scope: (cfg && cfg.scope) || "",
    root: (cfg && cfg.root) || document,
    store: store || localStore,
  });
}
