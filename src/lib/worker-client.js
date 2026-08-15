/* Transport for the site → Worker calls. One place holds the auth header name, the timeout and
   the error mapping, so the three feature gateways that POST to the backend (change-request,
   pipeline-progress, hub) can't drift on any of them.

   Deliberately NOT a gateway itself: it knows nothing about routes or payload shapes. Each
   feature keeps its own injectable gateway (the sealed-silo contract) and calls this for the
   bytes on the wire.

   `fetchImpl` is injectable so every caller's tests run zero-network. */

import { backendUrl } from "./backend-config.js";

/** Must match scripts/worker-api.mjs's OWNER_KEY_HEADER — the Worker rejects anything else, and
    its CORS preflight only allows this one. */
export const OWNER_KEY_HEADER = "X-Owner-Key";

/** A person is waiting on a button they just pressed; a request that hasn't answered by now has
    failed as far as they're concerned, and the caller needs to say so rather than spin. */
export const POST_TIMEOUT_MS = 12000;

/**
 * POST JSON to a Worker route.
 *
 * Always resolves — never throws — with a discriminated result, because every caller has a real
 * fallback (the prefilled GitHub path, or an honest error line) and none of them can afford an
 * unhandled rejection inside a click handler:
 *   { ok: true,  data }
 *   { ok: false, status, error }   status 0 = never reached the Worker (offline, blocked, timeout)
 */
export async function postToWorker(route, body, opts = {}) {
  const { ownerKey = "", fetchImpl, timeoutMs = POST_TIMEOUT_MS } = opts;
  const url = backendUrl(route);
  if (!url) return { ok: false, status: 0, error: "backend not configured" };

  const doFetch = fetchImpl || (typeof fetch === "function" ? fetch : null);
  if (!doFetch) return { ok: false, status: 0, error: "no fetch available" };

  const headers = { "Content-Type": "application/json" };
  if (ownerKey) headers[OWNER_KEY_HEADER] = ownerKey;

  const ctrl = typeof AbortController === "function" ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
  try {
    const res = await doFetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body ?? {}),
      signal: ctrl ? ctrl.signal : undefined,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return { ok: false, status: res.status, error: (data && data.error) || `request failed (${res.status})` };
    }
    return { ok: true, data: data || {} };
  } catch {
    return { ok: false, status: 0, error: "could not reach the backend" };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * One reader-facing sentence per failure mode. Kept here rather than in each UI so the three
 * surfaces say the same thing about the same failure — and so none of them ever prints the raw
 * status or the Worker's own error text at a traveler.
 */
export function failureMessage(result) {
  if (!result || result.ok) return "";
  if (result.status === 503) return "This isn't set up yet.";
  if (result.status === 401) return "That key wasn't accepted — check it in settings.";
  if (result.status === 0) return "Couldn't reach the server. Try again in a moment.";
  return "That didn't go through. Try again in a moment.";
}
