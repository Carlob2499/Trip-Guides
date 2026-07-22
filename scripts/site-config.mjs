// A4: single source of the deployed site's base URL — was hardcoded identically six times
// (astro.config.mjs, scripts/verify-live.mjs, and three GitHub workflow YAML files:
// graduate-guide.yml, new-guide.yml, research-pass.yml). An env override lets any consumer
// swap targets (e.g. verifying against a staging deploy) without editing source.
export const SITE_ORIGIN = process.env.SITE_ORIGIN || "https://carlob2499.github.io";
export const SITE_BASE_PATH = process.env.SITE_BASE_PATH || "/Trip-Guides";
export const SITE_BASE_URL = process.env.SITE_BASE_URL || `${SITE_ORIGIN}${SITE_BASE_PATH}`;
