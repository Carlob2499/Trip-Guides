# The site's backend (Cloudflare Worker)

A ~one-file Worker that does everything the creator's UX would otherwise have to reach GitHub for.
It started (W5) as the zero-click intake proxy — file the `new-guide` issue **for** an anonymous
visitor, so the New-Guide wizard needs no GitHub account and no "Submit new issue" click. Batch 3
widened it to the whole front door: change requests, traveler answers and revision approvals all go
through here, so **GitHub never appears in the creator's UX**.

**The site stays on GitHub Pages — this is added beside it, not a migration.** Until you configure
it, every surface falls back to what shipped before (a prefilled GitHub issue, and no owner
controls on the progress page), so the repo is safe to leave as-is.

## How it fits

```
wizard (POST intake JSON) ──▶ Worker ──(validate · rate-limit)──▶ files new-guide issue
✎ change request          ──▶ Worker ──(owner key)────────────▶ files modify-request issue
answers / fork choices    ──▶ Worker ──(owner key)────────────▶ dispatches change.yml
approve a revision        ──▶ Worker ──(owner key)────────────▶ dispatches change.yml
                                                                          │
              existing pipeline (scaffold → research → publish) ◀─────────┘
```

The Worker files the **same** issue bodies the GitHub forms would (rendered from the one intake
schema, `scripts/intake-schema.mjs`, and the one modify schema, `src/lib/modify-schema.mjs`), so
everything downstream is untouched.

## Endpoints

All POST, JSON in and JSON out, except `/health`.

| Route | Auth | Does |
| --- | --- | --- |
| `GET /health` | none | Reports whether the Worker is configured, rate-limited and owner-gated (`ownerEndpoints` is `configured`, `WEAK` or `OFF`). Never echoes a secret. |
| `POST /` · `POST /intake` | per-IP rate limit | Files the `new-guide` issue. Returns `{ok, id, slug}` — the predicted slug lets the wizard go straight to the progress page. |
| `POST /change` | `X-Owner-Key` | `{slug, section, change}` → files a `modify-request` issue. Returns `{ok, id}`. |
| `POST /answer` | `X-Owner-Key` | `{slug, answers:[{id, answer}]}` → dispatches the change workflow with `source: "answers"`. |
| `POST /approve` | `X-Owner-Key` | `{slug, issue}` → dispatches the change workflow with `source: "feedback"`. |
| `POST /runtime/routes` | allowed origin + per-IP cost budget | Bounded Google Routes request; minimal duration/distance/polyline response. |
| `POST /runtime/route-matrix` | allowed origin + per-IP cost budget | Up to eight authored stops; live matrix for unapplied advisories. |
| `POST /runtime/places` | allowed origin + per-IP cost budget | Up to eight reviewed Place IDs; status/current hours only; never cached. |
| `POST /runtime/weather-alerts` | allowed origin + per-IP cost budget | Public alerts from authoritative weather publishers. |

`POST /answer` builds its `plan_json` input as
`{"source":"answers","slug":"<slug>","answers":[{"id":"…","answer":"…"}]}` — one string, exactly
what the workflow's plan parser reads. Answers cover both intake questions and blocking forks: a
fork is a question with named options, so it rides the same endpoint with the fork's own id.

### Auth, and what it replaced

`/intake` is public. Anonymous travelers file guide requests, and there is deliberately **no bot
challenge** (`CONTEXT.md` 2026-08-15). Its protection is the shared zod schema (a malformed body is
a 400 that files nothing), the fixed `ALLOWED_ORIGIN`, and the per-IP cap below.

The three owner endpoints require the header `X-Owner-Key` to match the `OWNER_KEY` secret. **That
header replaces the deleted approval-label gate.** A change run used to be un-startable until the
owner applied `modify-approved` / `revision-approved` in GitHub; with those labels gone, the "the
owner allowed this" check has to live somewhere the site itself can satisfy.

Two failure modes, on purpose in opposite directions:

- **`OWNER_KEY` unset ⇒ 503 on all three (fail CLOSED).** A missing key must never mean "anyone
  may start a run."
- **KV unbound ⇒ the per-IP counter is skipped, and intake files WITHOUT the auto-run label.**
  A half-deployed Worker still can't lock the owner out of their own intake — the issue is filed
  either way — but "nothing is counting" is not the same as "this IP's first request this week",
  so the unmeasured submission waits for the owner to label it rather than spending an agent. It
  logs a warning on every unprotected request, because a protection you can't observe is an
  assumption, not a feature.

**Ten failed owner-key attempts from one IP in an hour ⇒ 429 on the owner routes.** The gate is a
single shared secret on a public URL with no account and no second factor, so the only thing
between a wrong key and the right one is how many wrong ones fit in an hour. The counter lives in
the same `RATE` namespace as the intake limiter; with no KV bound the throttle is skipped but the
key is still checked (never the other way around).

**A key shorter than 32 characters is rejected with 503, and `/health` says `ownerEndpoints: "WEAK"` until it is rotated.**
The server-side minimum is the authority — the site's own paste check is a mis-paste guard, not a
security boundary.

Neither the key nor the token is ever logged, echoed in a response, or rendered back into the page.
GitHub's own error text is returned only on the three authenticated routes; a failure on the public
`/intake` path answers with the generic line and logs the detail.

## One-time setup (~5 min of clicking; Claude wrote everything else)

Claude cannot create accounts or handle secret values — these steps are yours:

1. **Cloudflare account** — create a free one at dash.cloudflare.com.
2. **Cloudflare API token** → add as the GitHub repo secret **`CLOUDFLARE_API_TOKEN`**
   (Settings → Secrets and variables → Actions). Use the "Edit Cloudflare Workers" template.
   This lets `deploy-worker.yml` deploy the Worker automatically on every change.
3. **Fine-grained GitHub PAT** — scopes: **Issues → Read and write** *and* **Actions → Read and
   write**, this repo only. Actions is new in batch 3: `/answer` and `/approve` dispatch a
   workflow, and a token with only Issues access will file fine and then 403 on every dispatch.
   Set it as the Worker secret: `npx wrangler secret put GH_TOKEN` (run in this `worker/` folder,
   paste when asked).
4. **Owner key** — generate one and store it as a Worker secret:

   ```sh
   openssl rand -hex 32                 # 64 hex characters; 32 is the enforced minimum
   npx wrangler secret put OWNER_KEY    # paste the same value when asked
   ```

   Then open the progress page on the live site → **Maker controls** → paste the same value →
   Save. It is stored in that browser's `localStorage` only, is never rendered back, and is never
   committed. Repeat per browser; **Forget** removes it.

   **The browser copy expires after 30 days**, then the owner controls disappear until you paste
   it again — see "Rotating the key" below for why that isn't just ceremony.

Then trigger a deploy (any push to `main`, or Actions → **Deploy intake worker** → Run — the
workflow has no path filter, so a fix to anything the Worker bundles always redeploys). Copy the
deployed URL (e.g. `https://waypoint-intake.<you>.workers.dev`) into
`src/lib/backend-config.js` → `url`, and push. The backend is now live.

Check it with `curl https://<your-worker>/health` — the response says whether the repo, token,
rate limit and owner endpoints are each configured, without revealing any of them.

### Runtime provider setup

The paid runtime routes are disabled unless both a server key and the existing KV cost guard are
configured. Enable Google Routes API, Places API (New), and Weather API, restrict one server key to
only those APIs, set cloud budgets/quotas, then store it without printing or committing it:

```sh
npx wrangler secret put GOOGLE_SERVER_KEY
```

Runtime traffic requires a Cloudflare Rate Limiting binding named `RUNTIME_LIMITER` and fails
closed if it is absent. Google Cloud per-API quotas and budgets remain the hard paid-usage ceiling;
the Worker additionally caps matrices and Place batches at eight items. `LIVE_CACHE` is optional
for authored-stop matrices and alert responses. Current-position routes and Place Details are
explicitly excluded from KV caching; reviewed Place IDs remain in canonical guide data. Finally set the repository Actions variable
`PUBLIC_WAYPOINT_RUNTIME_ENABLED=1` so the static build exposes the capability.

Add a unique positive-integer namespace for the binding (do not reuse this example identifier):

```toml
[[ratelimits]]
name = "RUNTIME_LIMITER"
namespace_id = "<YOUR_UNIQUE_INTEGER>"

  [ratelimits.simple]
  limit = 30
  period = 60
```

Cloudflare documents this limiter as permissive and eventually consistent. Treat it as abuse
reduction; Google Cloud API quotas and billing budgets are the hard cost boundary.

### Rotating the key (and why the browser copy expires)

`localStorage` has no expiry and is scoped to an ORIGIN, not a page — and on GitHub Pages the
origin is `<you>.github.io`, which is the same origin as **every other project site on that
account**, and shared with every other user's site on `*.github.io` for cookie purposes. A key left
there is a live credential sitting on a shared origin, on a laptop that can be lent, sold, or
handed to a repair shop. So the browser copy carries a 30-day expiry and then reads as "no key":
the site quietly falls back to the public experience and you paste it again.

That bounds an old copy; it does not replace the key. To rotate:

```sh
openssl rand -hex 32                 # new value
npx wrangler secret put OWNER_KEY    # paste it — this replaces the old secret immediately
```

Every browser holding the previous key starts getting 401s from that moment, so re-paste the new
one on each machine you use (progress page → **Maker controls**). Rotate after any of: pasting the
key on a machine you don't control, a screen share or screenshot that showed the paste box, or
someone else gaining access to a browser where it was stored. There is nothing to revoke elsewhere
— the secret is the only copy that matters, and `/health` will tell you whether the new one meets
the 32-character minimum.

### Recommended: rate limiting

- **Per-IP weekly cap** (KV): `npx wrangler kv namespace create RATE`, then uncomment the
  `[[kv_namespaces]]` block in `wrangler.toml` with the returned id and redeploy. Under `AUTO_CAP`
  (default 3) per IP per week the issue is auto-labeled (auto-research); over it, the issue is filed
  **without** the label so you approve it manually; well over it, rejected. **Without KV every
  submission is filed without the label** (nothing auto-researches until you say so), and the
  owner-route throttle is skipped — so this is recommended, not optional, if you want the wizard to
  be hands-off.

### Config that isn't a secret

`wrangler.toml` names the rest explicitly rather than letting it resolve from the environment:
`REPO`, `ALLOWED_ORIGIN`, `AUTO_CAP`, `DISPATCH_REF` (the ref dispatched runs use, default `main`)
and `CHANGE_WORKFLOW` (the workflow file the change lifecycle lives in, default `change.yml`).
Rename or move that workflow and this is the one line to update.

## Removing it

Delete `worker/`, `.github/workflows/deploy-worker.yml`, and blank `url` in
`src/lib/backend-config.js`. Every surface falls back to its pre-Worker path: the wizard and the ✎
change request open prefilled GitHub issues, and the progress page hides the owner controls.
Nothing else depends on it.
