# Zero-click intake proxy (Cloudflare Worker)

A ~one-file Worker that files the `new-guide` issue **for** an anonymous visitor, so the New-Guide
wizard needs no GitHub account and no "Submit new issue" click. **The site stays on GitHub Pages —
this is added beside it, not a migration.** Until you configure it, the wizard behaves exactly as
before (opens a prefilled GitHub issue), so the repo is safe to leave as-is.

## How it fits

```
wizard (POST intake JSON) ──▶ Worker ──(Turnstile ✓ · validate · rate-limit)──▶ files new-guide issue
                                                                                        │
                            existing pipeline (scaffold → research → publish) ◀─────────┘
```

The Worker files the **same** issue body the GitHub form would (rendered from the one intake schema,
`scripts/intake-schema.mjs`), so everything downstream is untouched.

## One-time setup (~5 min of clicking; Claude wrote everything else)

Claude cannot create accounts or handle secret values — these three steps are yours:

1. **Cloudflare account** — create a free one at dash.cloudflare.com.
2. **Cloudflare API token** → add as the GitHub repo secret **`CLOUDFLARE_API_TOKEN`**
   (Settings → Secrets and variables → Actions). Use the "Edit Cloudflare Workers" template.
   This lets `deploy-worker.yml` deploy the Worker automatically on every change.
3. **Fine-grained GitHub PAT** — scope: **Issues → Read and write**, this repo only. Set it as the
   Worker secret: `npx wrangler secret put GH_TOKEN` (run in this `worker/` folder, paste when asked).

Then trigger a deploy (push any change under `worker/`, or Actions → **Deploy intake worker** → Run).
Copy the deployed URL (e.g. `https://waypoint-intake.<you>.workers.dev`) into
`src/features/hub/intake-proxy-config.js` → `url`, and push. Zero-click is now live.

### Recommended: bot protection (Turnstile) + rate limiting

- **Turnstile** (blocks scripted spam): create a Turnstile widget in the Cloudflare dashboard →
  put the **site key** in `intake-proxy-config.js` → `turnstileSiteKey`, and the **secret key** on
  the Worker: `npx wrangler secret put TURNSTILE_SECRET`. Until set, submissions aren't bot-checked.
- **Per-IP weekly cap** (KV): `npx wrangler kv namespace create RATE`, then uncomment the
  `[[kv_namespaces]]` block in `wrangler.toml` with the returned id and redeploy. Under `AUTO_CAP`
  (default 3) per IP per week the issue is auto-labeled (auto-research); over it, the issue is filed
  **without** the label so you approve it manually; well over it, rejected. Without KV, the cap is
  simply skipped.

## Removing it

Delete `worker/`, `.github/workflows/deploy-worker.yml`, and blank `intake-proxy-config.js`. The
wizard falls straight back to the GitHub-issue path. Nothing else depends on it.
