/* Data access for the change-request feature — see index.js for the public surface this backs.
   The feature used to have NO gateway on purpose (it only ever built a prefilled URL). Batch 3
   gave it one, because the configured path now POSTs the request to the site's backend Worker
   instead of handing the reporter to GitHub.

   Injectable (`fetchImpl`) so the model tests and any future UI test run zero-network. */

import { postToWorker, failureMessage } from "../../lib/worker-client.js";

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
