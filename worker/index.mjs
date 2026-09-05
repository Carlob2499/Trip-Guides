// The site's backend — a Cloudflare Worker that does everything the creator's UX would
// otherwise have to reach GitHub for. Started life (W5) as the zero-click intake proxy: file the
// new-guide issue FOR an anonymous visitor, so the wizard needs no GitHub account and no "Submit
// new issue" click. Batch 3 widened it to the whole front door — the site now files change
// requests, sends traveler answers and approves revision proposals through here, so GitHub never
// appears in the creator's UX. The static site can't hold a token; this one small Worker can.
// The site stays on GitHub Pages untouched — this is beside it, deployed from the repo by
// .github/workflows/deploy-worker.yml, and removable without trace.
//
// Endpoints (all POST unless noted; JSON in, JSON out):
//   GET  /health   — is this Worker configured/protected? Never echoes a secret.
//   POST /  , /intake  — public. Validate with the SAME zod + mapping the scaffolder uses →
//                  per-IP rate limit → file the new-guide issue. Returns the predicted slug so
//                  the wizard can go straight to the progress page.
//   POST /change   — owner. Files a `modify-request` issue; change.yml auto-runs on that label.
//   POST /answer   — owner. Dispatches change.yml {source:"answers", plan_json:<answers JSON>}.
//   POST /approve  — owner. Dispatches change.yml {source:"feedback", issue:<n>}.
//
// AUTH: /intake keeps the per-IP rate limit as its only guard (anonymous travelers file guide
// requests; there is deliberately NO bot challenge — CONTEXT.md 2026-08-15, "The public intake
// endpoint ships with no bot check"; adding one is a new decision, not a restoration). The three
// owner endpoints additionally require `X-Owner-Key` matching the OWNER_KEY secret. That header
// REPLACES the deleted approval-label gate: a change run used to be un-startable until the owner
// applied `modify-approved`/`revision-approved` in GitHub, and with those labels gone the check
// has to live somewhere the site can satisfy. Unset OWNER_KEY ⇒ those three 503 (fail CLOSED),
// while the rate limit still fails OPEN by design — see warnUnprotected. Ten failed owner-key
// attempts from one IP in an hour ⇒ 429 on the owner routes, so a shared secret on a public URL
// cannot be guessed at request speed.
//
// Where a guard cannot RUN, the answer is the safe half of it, never the permissive half: with no
// KV bound, intake still files the issue but WITHOUT the auto-run label (manual approval), and the
// owner gate still checks the key, just without the throttle.
//
// All the judgment lives in the tested pure cores (scripts/intake-proxy.mjs, scripts/worker-api.mjs).
// This file is I/O only.
//
// Env (wrangler.toml vars + `wrangler secret put`):
//   GH_TOKEN         (secret)  fine-grained PAT — Issues:write AND Actions:write on this repo only
//   OWNER_KEY        (secret)  shared secret for /change, /answer, /approve (unset ⇒ 503)
//   REPO             (var)     "owner/repo"
//   ALLOWED_ORIGIN   (var)     the site origin allowed to POST here (CORS)
//   AUTO_CAP         (var)     auto-research submissions per IP per week before owner-approval gating
//   DISPATCH_REF     (var)     git ref the dispatched workflow runs on (default "main")
//   CHANGE_WORKFLOW  (var)     workflow file the change lifecycle lives in (default "change.yml")
//   RATE             (KV)      optional KV namespace for the per-IP counter (rate limiting off if unbound)

import {
  answersFromForm, validateAnswers, renderIssueBody, intakeRateDecision, rateThresholds, guessSlug,
} from "../scripts/intake-proxy.mjs";
import {
  OWNER_KEY_HEADER, ownerGate, validateChangeRequest, validateAnswersRequest,
  validateApproveRequest, answersPlanJson, changeDispatchInputs,
  ownerFailKey, ownerThrottled, ownerKeyHealth, OWNER_FAIL_WINDOW_MS,
} from "../scripts/worker-api.mjs";
import { MODIFY_LABEL, modifyIssueTitle, renderModifyIssueBody } from "../src/lib/modify-schema.mjs";
import { handleRuntimeRequest } from "./runtime-api.mjs";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_DISPATCH_REF = "main";
const DEFAULT_CHANGE_WORKFLOW = "change.yml";
// Twice the failure window, so a counter written just before an hour boundary still expires well
// after that bucket stops being read. Same "outlive the bucket" rule the intake counter uses.
const OWNER_FAIL_TTL_S = Math.round((OWNER_FAIL_WINDOW_MS * 2) / 1000);

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    // X-Owner-Key must be listed or the browser's preflight rejects every owner request before
    // it is ever sent — the auth header has to be allowed, not just accepted.
    "Access-Control-Allow-Headers": `Content-Type, ${OWNER_KEY_HEADER}`,
    Vary: "Origin",
  };
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

// The intake rate limit still fails OPEN when unconfigured — the counter reads 0 with no KV
// binding, so `intakeRateDecision` always accepts, and a half-deployed Worker must not lock the
// owner out of their own intake. What it no longer does is fail open SILENTLY, and it no longer
// hands out the auto-run label it cannot justify (see handleIntake): an unmeasured submission is
// filed for manual approval, not auto-researched. Log it on every unprotected request — a
// protection you cannot observe is an assumption, not a feature.
//
// OWNER_KEY is the opposite case and is logged for the opposite reason: unset means the owner
// endpoints are DISABLED, so the creator's site silently falls back to the GitHub path and
// nothing explains why. A key that is set but short is logged and fails closed until the owner
// rotates it.
function warnUnprotected(env) {
  const off = [];
  if (!env.RATE) off.push("RATE KV unbound (per-IP limit never counts; intake files WITHOUT the auto-run label)");
  if (off.length) console.warn(`[intake] UNPROTECTED public endpoint — ${off.join(" · ")}`);
  if (!env.OWNER_KEY) console.warn("[worker] OWNER_KEY unset — /change, /answer, /approve are disabled (503)");
  else if (ownerKeyHealth(env.OWNER_KEY) === "WEAK") console.warn("[worker] OWNER_KEY is shorter than the 32-character minimum — rotate it (worker/README.md)");
  return off;
}

// ── GitHub I/O ─────────────────────────────────────────────────────────────────────────────
// One place that holds the token, so no route can forget a header. Never logs the token, and
// never returns GitHub's own error body beyond a short truncation (it can carry request detail,
// but never this Worker's secrets).
function ghFetch(env, path, body) {
  return fetch(`https://api.github.com${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GH_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "waypoint-intake-proxy",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

// GitHub's own error body is useful to the OWNER ("Actions: write is missing from the token") and
// is nothing but upstream text this Worker did not write. On the three authenticated routes that
// trade is worth it; on the PUBLIC /intake path it is unfiltered third-party content echoed to an
// anonymous caller, and it can name repo internals a stranger has no business reading. So the
// detail is returned only where the caller proved they are the owner — everywhere else it goes to
// the log, where the owner can still find it.
async function ghError(res, what, { expose = true } = {}) {
  const detail = (await res.text().catch(() => "")).slice(0, 200);
  const error = `could not ${what} (github ${res.status})`;
  if (expose) return { error, detail };
  console.warn(`[intake] github ${res.status} — ${detail}`);
  return { error };
}

function createIssue(env, { title, body, labels }) {
  return ghFetch(env, `/repos/${env.REPO}/issues`, { title, body, labels });
}

// workflow_dispatch: POST …/actions/workflows/<file>/dispatches with {ref, inputs}. Success is
// an empty 2xx (204), so this checks res.ok rather than pinning a status code. Needs Actions:
// write on the PAT — Issues:write alone 403s here, which is the one upgrade batch 3 asks of the
// existing token (worker/README.md).
function dispatchWorkflow(env, inputs) {
  const workflow = env.CHANGE_WORKFLOW || DEFAULT_CHANGE_WORKFLOW;
  return ghFetch(env, `/repos/${env.REPO}/actions/workflows/${workflow}/dispatches`, {
    ref: env.DISPATCH_REF || DEFAULT_DISPATCH_REF,
    inputs,
  });
}

// ── Routes ─────────────────────────────────────────────────────────────────────────────────

async function handleIntake(request, env, raw, cors) {
  // Validate with the exact same mapping + schema the scaffolder consumes (no drift).
  const answers = answersFromForm(raw);
  const valid = validateAnswers(answers);
  if (!valid.ok) return json({ error: valid.error }, 400, cors);

  // Per-IP weekly rate limit (skipped if no KV bound). Anonymous intake spends the maker's Claude
  // quota, so a stranger can't trigger unlimited research runs.
  const ip = request.headers.get("CF-Connecting-IP") || "";
  const { cap, hardMax } = rateThresholds(env.AUTO_CAP);
  const week = Math.floor(Date.now() / WEEK_MS);
  const key = `rl:${ip}:${week}`;
  // Whether the counter was actually READ, not whether one exists. With no KV binding (or no
  // client IP) `count` is a constant 0, which is a very different thing from "this IP's first
  // submission this week".
  const measured = !!(env.RATE && ip);
  let count = 0;
  if (measured) count = Number(await env.RATE.get(key)) || 0;
  const decision = intakeRateDecision(count, { cap, hardMax });
  if (!decision.accept) {
    return json({ error: "too many requests this week — try later, or file on GitHub" }, 429, cors);
  }

  // FAIL SAFE on an unmeasured request. The `new-guide` label is not decoration — new-guide.yml
  // fires on it and spends an agent — so handing it out on a counter that reads 0 because nothing
  // is counting turns an unbound KV namespace into unlimited auto-research for whoever finds the
  // URL. Unmeasured is NOT "under the cap": the issue is still filed (nothing a traveler wrote is
  // lost, and the owner can label it by hand) — it just does not auto-run. Same posture as the
  // over-cap branch of intakeRateDecision, reached for a different reason.
  const withLabel = decision.withLabel && measured;

  const country = String(raw.country || "").trim();
  const ghRes = await createIssue(env, {
    title: `New guide: ${country}`,
    body: renderIssueBody(raw),
    labels: withLabel ? ["new-guide"] : [],
  });
  // Public endpoint: the caller gets the generic line, the log gets GitHub's own words.
  if (!ghRes.ok) return json(await ghError(ghRes, "file the issue", { expose: false }), 502, cors);
  const issue = await ghRes.json();

  if (measured) {
    // Best-effort — a lost increment just lets one extra through, never blocks a real user.
    await env.RATE.put(key, String(count + 1), { expirationTtl: 14 * 24 * 60 * 60 });
  }

  return json(
    { ok: true, slug: guessSlug(country), issueUrl: issue.html_url, autoResearch: withLabel },
    200,
    cors,
  );
}

// Files the `modify-request` issue the site's ✎ flow used to hand the reporter as a prefilled
// URL. change.yml auto-runs on that label, so filing IS the dispatch — there is no second call
// and no approval step. The body is rendered from MODIFY_FIELDS (src/lib/modify-schema.mjs), so
// it round-trips through the same parser a hand-filed issue does.
async function handleChange(env, raw, cors) {
  const v = validateChangeRequest(raw);
  if (!v.ok) return json({ error: v.error }, v.status, cors);
  const { slug, change, section } = v.value;

  const ghRes = await createIssue(env, {
    title: modifyIssueTitle(slug),
    body: renderModifyIssueBody({ slug, change, section }),
    labels: [MODIFY_LABEL],
  });
  if (!ghRes.ok) return json(await ghError(ghRes, "queue the change"), 502, cors);
  const issue = await ghRes.json();
  // Deliberately no html_url: the site must not learn a github.com link it could render. The
  // number is an opaque tracking id from the page's point of view.
  return json({ ok: true, id: issue.number }, 200, cors);
}

async function handleAnswer(env, raw, cors) {
  const v = validateAnswersRequest(raw);
  if (!v.ok) return json({ error: v.error }, v.status, cors);
  const { slug, answers } = v.value;

  const ghRes = await dispatchWorkflow(env, changeDispatchInputs({
    source: "answers", slug, planJson: answersPlanJson({ slug, answers }),
  }));
  if (!ghRes.ok) return json(await ghError(ghRes, "send the answers"), 502, cors);
  return json({ ok: true, absorbed: answers.length }, 200, cors);
}

async function handleApprove(env, raw, cors) {
  const v = validateApproveRequest(raw);
  if (!v.ok) return json({ error: v.error }, v.status, cors);
  const { slug, issue } = v.value;

  const ghRes = await dispatchWorkflow(env, changeDispatchInputs({ source: "feedback", slug, issue }));
  if (!ghRes.ok) return json(await ghError(ghRes, "approve the revision"), 502, cors);
  return json({ ok: true }, 200, cors);
}

const OWNER_ROUTES = { "/change": handleChange, "/answer": handleAnswer, "/approve": handleApprove };

/**
 * Throttle the owner gate by failed attempts per IP, on the SAME KV namespace as the intake
 * counter. The gate itself is one shared secret with no account behind it, so "how many wrong
 * guesses per hour" is the entire difference between a strong key and a guessable one.
 *
 * Only a 401 counts. A 503 means OWNER_KEY is unset — there is no secret to guess, and counting
 * those would let a scan lock out a Worker that is merely half-configured.
 *
 * With no KV bound the throttle is SKIPPED, never the gate: an unbound namespace must not turn
 * into "everyone is throttled" (the owner's own site would stop working) and must not turn into
 * "the key is optional" either. Unthrottled-but-checked is the honest degradation; it is logged
 * by warnUnprotected on every request.
 */
async function ownerGateWithThrottle(request, env) {
  const ip = request.headers.get("CF-Connecting-IP") || "";
  const counting = !!(env.RATE && ip);
  const failKey = ownerFailKey(ip);

  if (counting && ownerThrottled(await env.RATE.get(failKey))) {
    return { ok: false, status: 429, error: "too many failed attempts — try again later" };
  }

  const gate = ownerGate(env.OWNER_KEY, request.headers.get(OWNER_KEY_HEADER));
  if (!gate.ok && gate.status === 401 && counting) {
    const failures = Number(await env.RATE.get(failKey)) || 0;
    // Best-effort, like the intake increment: a lost write costs one extra guess, never a lockout.
    await env.RATE.put(failKey, String(failures + 1), { expirationTtl: OWNER_FAIL_TTL_S });
  }
  return gate;
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    // Trailing slashes are the caller's business, not the router's.
    const path = new URL(request.url).pathname.replace(/\/+$/, "") || "/";

    // GET /health — is this Worker actually protected? Answerable without filing an issue,
    // so the posture can be checked from a browser or a smoke step instead of inferred.
    // Reports only whether each guard is CONFIGURED; never echoes a secret.
    if (request.method === "GET" && path === "/health") {
      return json({
        ok: true,
        repo: env.REPO ?? null,
        rateLimit: env.RATE ? "configured" : "OFF",
        // "OFF" · "WEAK" · "configured" — a length verdict, never the key or its length.
        ownerEndpoints: ownerKeyHealth(env.OWNER_KEY),
        runtimeProviders: env.GOOGLE_SERVER_KEY ? "configured" : "OFF",
        runtimeCostGuard: env.RUNTIME_LIMITER ? "configured" : "OFF",
      }, 200, cors);
    }

    if (request.method !== "POST") return json({ error: "POST only" }, 405, cors);

    // Enforce ALLOWED_ORIGIN server-side, not just in the CORS response header. A live smoke
    // test (2026-08-15) filed a real intake issue from `Origin: https://evil.example`: CORS is
    // enforced by the BROWSER on the response, so it never stopped a direct POST from curl or a
    // script. The header alone is not an access control. Browsers always send Origin on a
    // cross-origin POST, so the site's own fetches are unaffected; a missing Origin means a
    // non-browser caller and is refused for the same reason.
    if (env.ALLOWED_ORIGIN && request.headers.get("Origin") !== env.ALLOWED_ORIGIN) {
      return json({ error: "origin not allowed" }, 403, cors);
    }

    warnUnprotected(env);

    let raw;
    try {
      raw = await request.json();
    } catch {
      return json({ error: "invalid JSON" }, 400, cors);
    }

    const runtimeResponse = await handleRuntimeRequest(path, request, env, raw, cors);
    if (runtimeResponse) return runtimeResponse;

    const ownerRoute = OWNER_ROUTES[path];
    if (ownerRoute) {
      // The key is read straight from the header into the comparison and never logged, echoed,
      // or included in an error body. Repeated wrong keys from one IP stop being answered.
      const gate = await ownerGateWithThrottle(request, env);
      if (!gate.ok) return json({ error: gate.error }, gate.status, cors);
      return ownerRoute(env, raw, cors);
    }

    // "/" is the original intake path — the deployed wizard POSTs to the Worker root and must
    // keep working byte-for-byte; "/intake" is the same route under its own name.
    if (path === "/" || path === "/intake") return handleIntake(request, env, raw, cors);

    return json({ error: "not found" }, 404, cors);
  },
};
