/* The ONE config for the site's backend Worker (worker/). Empty `url` = OFF: every surface that
   would talk to it falls back to its pre-Worker behavior — the New-Guide wizard opens a prefilled
   GitHub issue, the ✎ change request opens a prefilled GitHub issue, the progress page hides the
   answer/approve controls. Nothing breaks, no network call. Same config-gate pattern as
   src/features/firebase/firebase-config.js: committed so the build is inert until configured.
     · url — the deployed Worker URL, e.g. "https://waypoint-intake.<you>.workers.dev"

   WHY src/lib/ and not a feature folder (batch 3): three silos now need this value —
   features/hub (intake), features/change-request (✎), features/pipeline-progress (answers +
   approvals). It lived at features/hub/intake-proxy-config.js while the wizard was its only
   consumer; reaching into hub from the other two would be exactly the deep cross-feature import
   the sealed-silo rule forbids, and re-exporting it through hub's index.ts would drag the whole
   intake flow into the guide-page bundle. src/lib/ is where this repo already puts values both
   node scripts and multiple features share (modify-schema.mjs, countries.mjs). Still ONE file —
   this is a move, not a second config.

   No bot-check key here by design (creator ruling, 2026-08-15): the public intake endpoint is
   protected by the Worker's schema validation, per-IP cap and fixed ALLOWED_ORIGIN, not by a
   challenge widget. The OWNER-only endpoints are protected by a key the creator stores in their
   own browser (src/scripts/owner-key.js) — never committed here. */
export const WAYPOINT_BACKEND = {
  // Deployed 2026-07-24 by .github/workflows/deploy-worker.yml.
  url: "https://waypoint-intake.carlob24r.workers.dev",
};

/** Absolute URL for one of the Worker's routes, or "" when the backend is unconfigured — the
    single place a route name is joined to the base, so no caller hand-builds one (and a caller
    that gets "" back knows to take its fallback path). */
export function backendUrl(route) {
  const base = (WAYPOINT_BACKEND.url || "").replace(/\/+$/, "");
  if (!base) return "";
  return route ? `${base}/${String(route).replace(/^\/+/, "")}` : base;
}
