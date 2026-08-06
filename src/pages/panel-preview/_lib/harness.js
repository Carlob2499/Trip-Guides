/* Client boot for the Panel design study (PREVIEW ONLY).
   Resolves the scope from the query string — the route is prerendered, so the scope
   cannot be known at build time — then boots the REAL panel silo against it and wires
   the tool bar's own controls. Nothing here reimplements collapse: if this page behaves,
   src/features/panel/ behaves. */
import { initPanelCollapse, initPanelGrid, localStore, scopeKey } from "../../../features/panel/index.js";

function validScopes() {
  try {
    var el = document.getElementById("pvConfig");
    var cfg = el ? JSON.parse(el.textContent || "{}") : {};
    return Array.isArray(cfg.scopes) ? cfg.scopes : [];
  } catch (e) { return []; }
}

export function initPanelPreview() {
  var scopes = validScopes();
  var asked = new URLSearchParams(location.search).get("scope") || "";
  // An unknown scope falls back to the first rather than keying the store under junk.
  var scope = scopes.indexOf(asked) >= 0 ? asked : (scopes[0] || "");

  initPanelCollapse({ scope: scope });
  // After collapse restore, so the initial sort sees the restored state.
  initPanelGrid({});

  var note = document.getElementById("pvNote");
  if (note) note.textContent = "Store key: " + scopeKey(scope);

  var here = document.querySelector('[data-pv-scope="' + scope + '"]');
  if (here) here.classList.add("is-here");

  var bare = document.getElementById("pvBare");
  if (bare) bare.search = "?scope=" + encodeURIComponent(scope) + "&bare=1";

  var reset = document.getElementById("pvReset");
  if (reset) {
    reset.addEventListener("click", function () {
      localStore.write(scopeKey(scope), "{}");
      location.reload();
    });
  }
}
