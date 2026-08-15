// Zero-click intake proxy (W5) — a Cloudflare Worker that files the new-guide issue FOR an
// anonymous visitor, so the wizard needs no GitHub account and no "Submit new issue" click. The
// static site can't hold a token; this ~one-file Worker can (a fine-grained PAT scoped to Issues on
// this repo only). The site stays on GitHub Pages untouched — this is added beside it, deployed
// from the repo by .github/workflows/deploy-worker.yml, and removable without trace.
//
// Flow: wizard POSTs the intake JSON → validate with the SAME zod + mapping the scaffolder uses →
// per-IP rate limit → file the issue via the GitHub API, WITH the `new-guide` label under the cap
// (auto-research) or WITHOUT it over the cap (queued for the owner). Returns { slug, issueUrl } so
// the wizard redirects to /progress/.
//
// There is deliberately NO bot challenge (CONTEXT.md 2026-08-15, "The public intake endpoint ships
// with no bot check"). What stands between the open internet and a filed issue: the shared zod
// schema (a malformed body is a 400 and files nothing), the per-IP weekly cap with its owner-
// approval tier, and the fixed ALLOWED_ORIGIN. Adding a challenge is a new decision, not a
// restoration — read that entry first.
//
// All the judgment lives in the tested pure core (scripts/intake-proxy.mjs). This file is I/O only.
//
// Env (wrangler.toml vars + `wrangler secret put`):
//   GH_TOKEN         (secret)  fine-grained PAT, Issues:write on this repo only
//   REPO             (var)     "owner/repo"
//   ALLOWED_ORIGIN   (var)     the site origin allowed to POST here (CORS)
//   AUTO_CAP         (var)     auto-research submissions per IP per week before owner-approval gating
//   RATE             (KV)      optional KV namespace for the per-IP counter (rate limiting off if unbound)

import {
  answersFromForm, validateAnswers, renderIssueBody, intakeRateDecision, rateThresholds, guessSlug,
} from "../scripts/intake-proxy.mjs";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

// The rate limit fails OPEN when unconfigured — the counter reads 0 with no KV binding, so
// `intakeRateDecision` always accepts. That is the correct default (a half-deployed Worker
// must not lock out the owner's own intake), but until 2026-08-02 it was also SILENT: a
// deployed Worker reported nothing about being wide open, and there is no request whose
// response differs. Log it on every unprotected request instead — a protection you cannot
// observe is an assumption, not a feature.
function warnUnprotected(env) {
  const off = [];
  if (!env.RATE) off.push("RATE KV unbound (per-IP limit never counts)");
  if (off.length) console.warn(`[intake] UNPROTECTED public endpoint — ${off.join(" · ")}`);
  return off;
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    // GET /health — is this Worker actually protected? Answerable without filing an issue,
    // so the posture can be checked from a browser or a smoke step instead of inferred.
    // Reports only whether each guard is CONFIGURED; never echoes a secret.
    if (request.method === "GET" && new URL(request.url).pathname === "/health") {
      return json({
        ok: true,
        repo: env.REPO ?? null,
        rateLimit: env.RATE ? "configured" : "OFF",
      }, 200, cors);
    }

    if (request.method !== "POST") return json({ error: "POST only" }, 405, cors);
    warnUnprotected(env);

    let raw;
    try {
      raw = await request.json();
    } catch {
      return json({ error: "invalid JSON" }, 400, cors);
    }
    const ip = request.headers.get("CF-Connecting-IP") || "";

    // Validate with the exact same mapping + schema the scaffolder consumes (no drift).
    const answers = answersFromForm(raw);
    const valid = validateAnswers(answers);
    if (!valid.ok) return json({ error: valid.error }, 400, cors);

    // Per-IP weekly rate limit (skipped if no KV bound). Anonymous intake spends the maker's Claude
    // quota, so a stranger can't trigger unlimited research runs.
    const { cap, hardMax } = rateThresholds(env.AUTO_CAP);
    const week = Math.floor(Date.now() / WEEK_MS);
    const key = `rl:${ip}:${week}`;
    let count = 0;
    if (env.RATE && ip) count = Number(await env.RATE.get(key)) || 0;
    const decision = intakeRateDecision(count, { cap, hardMax });
    if (!decision.accept) {
      return json({ error: "too many requests this week — try later, or file on GitHub" }, 429, cors);
    }

    const country = String(raw.country || "").trim();
    const ghRes = await fetch(`https://api.github.com/repos/${env.REPO}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "waypoint-intake-proxy",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: `New guide: ${country}`,
        body: renderIssueBody(raw),
        labels: decision.withLabel ? ["new-guide"] : [],
      }),
    });
    if (!ghRes.ok) {
      const detail = await ghRes.text().catch(() => "");
      return json({ error: `could not file the issue (github ${ghRes.status})`, detail: detail.slice(0, 200) }, 502, cors);
    }
    const issue = await ghRes.json();

    if (env.RATE && ip) {
      // Best-effort — a lost increment just lets one extra through, never blocks a real user.
      await env.RATE.put(key, String(count + 1), { expirationTtl: 14 * 24 * 60 * 60 });
    }

    return json(
      { ok: true, slug: guessSlug(country), issueUrl: issue.html_url, autoResearch: decision.withLabel },
      200,
      cors,
    );
  },
};
