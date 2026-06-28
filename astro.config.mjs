import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://carlob2499.github.io',
  base: '/Trip-Guides',

  // Allow the build to fetch + optimise the Wikimedia photos into fast, modern
  // WebP images served from your own site. This runs on the deploy server
  // (which can reach Wikimedia); if it ever can't, the guide falls back to the
  // plain photo automatically, so the site never breaks.
  image: {
    remotePatterns: [{ protocol: 'https', hostname: '**.wikimedia.org' }],
  },
});
