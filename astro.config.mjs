import { defineConfig } from 'astro/config';

// ACTION REQUIRED: replace the `site` value with your real Netlify URL.
// Find it at: https://app.netlify.com → your site → Settings → General → Site URL.
// Until this is updated, the og:image URLs in social previews will be broken
// (Twitter/WhatsApp/Facebook will request the image from the wrong domain).
// Example: site: 'https://waypoint-guides.netlify.app',
export default defineConfig({
  site: 'https://your-trip-guides.example', // <-- UPDATE THIS

  // Allow the build to fetch + optimise the Wikimedia photos into fast, modern
  // WebP images served from your own site. This runs on the deploy server
  // (which can reach Wikimedia); if it ever can't, the guide falls back to the
  // plain photo automatically, so the site never breaks.
  image: {
    remotePatterns: [{ protocol: 'https', hostname: '**.wikimedia.org' }],
  },
});