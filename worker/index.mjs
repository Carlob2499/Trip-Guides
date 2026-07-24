// Zero-click intake proxy (W5) — a Cloudflare Worker that files the new-guide issue FOR an
// anonymous visitor, so the wizard needs no GitHub account and no "Submit new issue" click. The
// static site can't hold a token; this ~one-file Worker can (a fine-grained PAT scoped to Issues on
// this repo only). The site stays on GitHub Pages untouched — this is added beside it, deployed
// from the repo by .github/workflows/deploy-worker.yml, and removable without trace.
//
// Flow: wizard POSTs the intake JSON (+ a Turnstile token) → verify Turnstile → validate with the
// SAME zod + mapping the scaffolder uses → per-IP rate limit → file the issue via the GitHub API,
// WITH the `new-guide` label under the cap (auto-research) or WITHOUT it over the cap (queued for
// the owner). Returns { slug, issueUrl } so the wizard redirects to /progress/.
//
// All the judgment lives in the tested pure core (scripts/intake-proxy.mjs). This file is I/O only.
//
// Env (wrangler.toml vars + `wrangler secret put`):
//   GH_TOKEN         (secret)  fine-grained PAT, Issues:write on this repo only
//   TURNSTILE_SECRET (secret)  Cloudflare Turnstile secret key (optional; if unset, verify skipped)
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

async function verifyTurnstile(secret, token, ip) {
  if (!secret) return true; // not configured — the owner hasn't enabled bot protection yet
  const form = new URLSearchParams({ secret, response: token || "" });
  if (ip) form.set("remoteip", ip);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
    });
    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return json({ error: "POST only" }, 405, cors);

    let raw;
    try {
      raw = await request.json();
    } catch {
      return json({ error: "invalid JSON" }, 400, cors);
    }
    const turnstileToken = raw.turnstileToken;
    delete raw.turnstileToken;

    const ip = request.headers.get("CF-Connecting-IP") || "";

    if (!(await verifyTurnstile(env.TURNSTILE_SECRET, turnstileToken, ip))) {
      return json({ error: "bot check failed — reload and try again, or file on GitHub instead" }, 403, cors);
    }

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
