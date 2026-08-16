/* Data access for the change-request feature — see index.js for the public surface this backs.
   The feature used to have NO gateway on purpose (it only ever built a prefilled URL). Batch 3
   gave it one, because the configured path now POSTs the request to the site's backend Worker
   instead of handing the reporter to GitHub.

   Injectable (`fetchImpl`) so the model tests and any future UI test run zero-network. */

import { postToWorker, failureMessage } from "../../lib/worker-client.js";
import { MODIFY_LABEL } from "../../lib/modify-schema.mjs";

export function createChangeGateway(opts = {}) {
  const { ownerKey = "", fetchImpl } = opts;
  return {
    /** { slug, change, section } → { ok: true } | { ok: false, message } — the message is
        already reader-facing; the Worker's own status/error text never reaches the page. */
    async submitChange(payload) {
      const res = await postToWorker("change", payload, { ownerKey, fetchImpl });
      return res.ok ? { ok: true } : { ok: false, message: failureMessage(res) };
    },
  };
}

/** A slow or unreachable api.github.com must not leave the triage queue spinning — the page
    renders its honest empty state either way, but only once this settles. Same bound the
    pipeline-progress reads use. */
const FETCH_TIMEOUT_MS = 8000;

/** How many open requests are worth showing at once. A queue longer than this is a signal to
    spend an afternoon on it, not a list to scroll. Mirrors PROPOSAL_PAGE next door. */
const REQUEST_PAGE = 20;

/**
 * The triage queue's READ half — open `modify-request` issues, straight from the public issues
 * API. Public and unauthenticated like the progress page's proposal read, and for the same reason
 * kept off any poll loop: api.github.com allows 60 requests per hour per IP.
 *
 * Separate from createChangeGateway because it is a different KIND of thing (a read, addressed by
 * repo, needing no key) — the same split pipeline-progress draws between its two gateways.
 */
export function createTriageGateway(opts = {}) {
  const { owner = "", repo = "", fetchImpl } = opts;
  const doFetch = fetchImpl || (typeof fetch === "function" ? fetch : null);

  return {
    /**
     * Raw issue records for the open change requests — `[]` when there genuinely are none, and
     * `null` when the queue could NOT be read (offline, rate-limited, a 5xx).
     *
     * The distinction is the whole point: an unread queue rendered as "nothing is waiting" is the
     * page telling the owner their inbox is clear on the strength of a failed request.
     */
    async fetchRequests() {
      if (!doFetch || !owner || !repo) return null;
      const url =
        `https://api.github.com/repos/${owner}/${repo}/issues` +
        `?labels=${encodeURIComponent(MODIFY_LABEL)}&state=open&per_page=${REQUEST_PAGE}`;
      const ctrl = typeof AbortController === "function" ? new AbortController() : null;
      const timer = ctrl ? setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS) : null;
      try {
        const res = await doFetch(url, { cache: "no-store", signal: ctrl ? ctrl.signal : undefined });
        if (!res.ok) return null;
        const data = await res.json();
        return Array.isArray(data) ? data : null;
      } catch (_) {
        return null;
      } finally {
        if (timer) clearTimeout(timer);
      }
    },
  };
}
