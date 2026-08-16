/* Public API of the change-request feature — "Request a change", now a PAGE (/change/) rather
   than a modal on a guide. Consumers import ONLY from here; the UI and the pure model stay
   siloed in this folder.

   The surface moved because the plan's requester view needs a guide picker, a live advisory and
   a whole-guide section map, and none of those fit in a 420px dialog. The guide page keeps a
   real link (initChangeLink keeps its `tab` current); the page does the rest.

   TWO submit paths, unchanged, chosen by `submitMode`:
     · WORKER — backend configured AND an owner key stored in this browser: the request is
       POSTed to the Worker, which files and starts it. The reporter never sees GitHub. POST
       /change is owner-gated because that key replaced the deleted `modify-approved` label.
     · GITHUB — everyone else, unchanged from before: a prefilled issue URL the reporter submits
       themselves, seeing exactly what will be filed. No public write endpoint, no token, and
       the owner stays in the loop where a stranger's request genuinely needs them. */

export { initChangePage } from "./ui/change-page.js";
export { initChangeLink } from "./ui/change-link.js";
export {
  sectionOptions, validateStep, buildRequestUrl, buildRequestPayload,
  submitMode, MODE_COPY, SENT_COPY, CHANGE_MAX,
} from "./model/change-request";
export {
  affectedGroups, matchedCategories, deriveWeight, sectionTouches, advisoryEmptyLine,
  CATEGORY_LABEL, CATEGORY_TONE, WEIGHT_NOTE, TOUCH_LEGEND, ADVISORY_EMPTY, ADVISORY_MIN,
} from "./model/advisory";
export { createChangeGateway } from "./gateway.js";
