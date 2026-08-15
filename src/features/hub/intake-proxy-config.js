/* Zero-click intake proxy config (W5). Empty = OFF: the New-Guide wizard falls back to opening a
   prefilled GitHub issue (the one-click path), exactly as before — nothing breaks, no network call.
   Fill `url` in AFTER deploying the Cloudflare Worker (worker/) to turn on true one-tap intake for
   anyone, no GitHub account needed:
     · url — the deployed Worker URL, e.g. "https://waypoint-intake.<you>.workers.dev"

   Same config-gate pattern as src/features/firebase/firebase-config.js: committed empty so the build
   is inert until configured. Blank → the wizard behaves exactly as it does today.

   No bot-check key here by design (creator ruling, 2026-08-15): the endpoint is protected by the
   Worker's schema validation, per-IP cap and fixed ALLOWED_ORIGIN, not by a challenge widget. */
export const INTAKE_PROXY = {
  // Deployed 2026-07-24 by .github/workflows/deploy-worker.yml.
  url: "https://waypoint-intake.carlob24r.workers.dev",
};
