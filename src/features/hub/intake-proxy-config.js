/* Zero-click intake proxy config (W5). Empty = OFF: the New-Guide wizard falls back to opening a
   prefilled GitHub issue (the one-click path), exactly as before — nothing breaks, no network call.
   Fill these in AFTER deploying the Cloudflare Worker (worker/) to turn on true one-tap intake for
   anyone, no GitHub account needed:
     · url              — the deployed Worker URL, e.g. "https://waypoint-intake.<you>.workers.dev"
     · turnstileSiteKey — the PUBLIC Cloudflare Turnstile site key (safe to commit; the SECRET key is
                          a Worker secret set with `wrangler secret put TURNSTILE_SECRET`, never here)

   Same config-gate pattern as src/features/firebase/firebase-config.js: committed empty so the build
   is inert until configured. Both stay blank → the wizard behaves exactly as it does today. */
export const INTAKE_PROXY = {
  // Deployed 2026-07-24 by .github/workflows/deploy-worker.yml.
  url: "https://waypoint-intake.carlob24r.workers.dev",
  // Still blank → no bot check yet. Set the PUBLIC Turnstile site key here and the secret key on
  // the Worker (`wrangler secret put TURNSTILE_SECRET`) to switch spam protection on.
  turnstileSiteKey: "",
};
