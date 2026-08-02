/* Public API of the change-request feature — the guided "Request a change" flow on a guide
   page. Consumers import ONLY from here; the UI and the pure model stay siloed in this folder.

   No gateway: this feature deliberately files NOTHING itself. It builds a prefilled GitHub
   issue URL and hands the reporter to GitHub, where they see exactly what will be submitted
   and press the button themselves. That keeps the whole path free of a public write endpoint —
   no Worker route, no token, no rate-limit surface — and filing still does nothing until the
   owner applies `modify-approved`. */

export { initChangeRequest } from "./ui/change-request.js";
export { sectionOptions, validateStep, buildRequestUrl, CHANGE_MAX } from "./model/change-request";
