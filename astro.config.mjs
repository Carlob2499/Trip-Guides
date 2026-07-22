import { defineConfig } from 'astro/config';
import { SITE_ORIGIN, SITE_BASE_PATH } from './scripts/site-config.mjs';

export default defineConfig({
  site: SITE_ORIGIN,
  base: SITE_BASE_PATH,

  // Allow the build to fetch + optimise the Wikimedia photos into fast, modern
  // WebP images served from your own site. This runs on the deploy server
  // (which can reach Wikimedia); if it ever can't, the guide falls back to the
  // plain photo automatically, so the site never breaks.
  image: {
    remotePatterns: [{ protocol: 'https', hostname: '**.wikimedia.org' }],
  },
});
