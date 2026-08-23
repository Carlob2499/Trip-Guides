import baseWorker from "./index.mjs";
import {
  OWNER_FAIL_WINDOW_MS, OWNER_KEY_HEADER, ownerFailKey, ownerGate, ownerThrottled,
} from "../scripts/worker-api.mjs";
import {
  matchesRunNoteTarget, renderRunNoteComment, validateRunNoteRequest,
} from "../scripts/run-note.mjs";

const OWNER_FAIL_TTL_S = Math.round((OWNER_FAIL_WINDOW_MS * 2) / 1000);
const NOTE_PATH = "/note";

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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
    await env.RATE.put(failKey, String(failures + 1), { expirationTtl: OWNER_FAIL_TTL_S });
  }
  return gate;
}

function githubHeaders(env) {
  return {
    Authorization: `Bearer ${env.GH_TOKEN}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "waypoint-intake-proxy",
    "Content-Type": "application/json",
  };
}

function decodeBase64Utf8(content) {
  const binary = atob(String(content || "").replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function fetchRunRecord(env, target, fetchImpl) {
  const filePath = `guides-intake/${target.slug}/run.v2.json`;
  const refs = [`research-v2/${target.slug}`, "main"];

  for (const ref of refs) {
    const url = `https://api.github.com/repos/${env.REPO}/contents/${filePath}?ref=${encodeURIComponent(ref)}`;
    let res;
    try {
      res = await fetchImpl(url, { method: "GET", headers: githubHeaders(env) });
    } catch {
      return { ok: false, status: 502, error: "could not verify the run" };
    }
    if (res.status === 404) continue;
    if (!res.ok) return { ok: false, status: 502, error: "could not verify the run" };

    let envelope;
    try { envelope = await res.json(); } catch { return { ok: false, status: 502, error: "could not verify the run" }; }
    let rawRun;
    try { rawRun = JSON.parse(decodeBase64Utf8(envelope?.content)); }
    catch { return { ok: false, status: 409, error: "run record is malformed; refresh before sending a note" }; }

    // If the active V2 branch exists but belongs to another run, do NOT fall through to main:
    // the browser is stale and choosing an older main record would cross-wire the note.
    if (!matchesRunNoteTarget(rawRun, target)) {
      return { ok: false, status: 409, error: "run changed; refresh before sending a note" };
    }
    return { ok: true, run: rawRun };
  }
  return { ok: false, status: 409, error: "V2 run record not found; refresh before sending a note" };
}

async function handleNote(request, env, fetchImpl = fetch) {
  const cors = corsHeaders(env);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return json({ error: "POST only" }, 405, cors);
  if (env.ALLOWED_ORIGIN && request.headers.get("Origin") !== env.ALLOWED_ORIGIN) {
    return json({ error: "origin not allowed" }, 403, cors);
  }
  if (!env.REPO || !env.GH_TOKEN) return json({ error: "github write path is not configured" }, 503, cors);

  const gate = await ownerGateWithThrottle(request, env);
  if (!gate.ok) return json({ error: gate.error }, gate.status, cors);

  let raw;
  try { raw = await request.json(); }
  catch { return json({ error: "invalid JSON" }, 400, cors); }
  const valid = validateRunNoteRequest(raw);
  if (!valid.ok) return json({ error: valid.error }, valid.status, cors);

  const target = valid.value;
  const verified = await fetchRunRecord(env, target, fetchImpl);
  if (!verified.ok) return json({ error: verified.error }, verified.status, cors);

  const commentUrl = `https://api.github.com/repos/${env.REPO}/issues/${target.issue}/comments`;
  let commentRes;
  try {
    commentRes = await fetchImpl(commentUrl, {
      method: "POST",
      headers: githubHeaders(env),
      body: JSON.stringify({ body: renderRunNoteComment(target) }),
    });
  } catch {
    return json({ error: "could not send the note" }, 502, cors);
  }
  if (!commentRes.ok) return json({ error: "could not send the note" }, 502, cors);
  const comment = await commentRes.json().catch(() => ({}));
  return json({ ok: true, id: comment.id ?? null }, 200, cors);
}

export { handleNote };

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname.replace(/\/+$/, "") || "/";
    if (path !== NOTE_PATH) return baseWorker.fetch(request, env);
    return handleNote(request, env);
  },
};
