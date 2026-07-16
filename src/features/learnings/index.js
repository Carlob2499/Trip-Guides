/* Public API of the Trip Learnings feature. Consumers import ONLY from here — the survey
   modal, the (P2) tab, and the pure model stay siloed in this folder. Firebase is reached
   through src/features/firebase/index.js, never the SDK directly.

   P1 (capture) ships initFeedback(); aggregateVisited()/buildFeedbackRecord() are exported
   for the P2 Learnings tab + tests. */

export { initFeedback } from "./ui/survey.js";
export { buildFeedbackRecord, aggregateVisited } from "./model/feedback";
