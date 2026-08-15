/* Public API of the change-request feature — the guided "Request a change" flow on a guide
   page. Consumers import ONLY from here; the UI and the pure model stay siloed in this folder.

   TWO paths (batch 3), chosen by `submitMode`:
     · WORKER — backend configured AND an owner key stored in this browser: the request is
       POSTed to the Worker, which files and starts it. The reporter never sees GitHub. POST
       /change is owner-gated because that key replaced the deleted `modify-approved` label.
     · GITHUB — everyone else, unchanged from before: a prefilled issue URL the reporter submits
       themselves, seeing exactly what will be filed. No public write endpoint, no token, and
       the owner stays in the loop where a stranger's request genuinely needs them. */

export { initChangeRequest } from "./ui/change-request.js";
export {
  sectionOptions, validateStep, buildRequestUrl, buildRequestPayload,
  submitMode, MODE_COPY, SENT_COPY, CHANGE_MAX,
} from "./model/change-request";
export { createChangeGateway } from "./gateway.js";
