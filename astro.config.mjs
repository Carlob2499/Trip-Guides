import { defineConfig } from 'astro/config';

// The only line you might ever change here is `site` — set it to your real
// web address once you have one (it's used for sitemaps / absolute links).
export default defineConfig({
  site: 'https://your-trip-guides.example',

  // Allow the build to fetch + optimise the Wikimedia photos into fast, modern
  // WebP images served from your own site. This runs on the deploy server
  // (which can reach Wikimedia); if it ever can't, the guide falls back to the
  // plain photo automatically, so the site never breaks.
  image: {
    remotePatterns: [{ protocol: 'https', hostname: '**.wikimedia.org' }],
  },
});
