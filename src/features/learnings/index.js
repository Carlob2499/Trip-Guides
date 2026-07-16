/* Public API of the Trip Learnings feature. Consumers import ONLY from here — the survey
   modal, the tab, and the pure model stay siloed in this folder. Firebase is reached
   through src/features/firebase/index.js, never the SDK directly.

   P1 capture ships the survey; P2 adds the tab (hidden until feedback exists). initLearnings()
   wires both. buildFeedbackRecord()/aggregateVisited() are exported for the tab + tests. */

import { initFeedback } from "./ui/survey.js";
import { initLearningsTab, initDayFlip } from "./ui/tab.js";

export function initLearnings() {
  initFeedback();
  initLearningsTab();
  initDayFlip();
}

export { initFeedback } from "./ui/survey.js";
export { initLearningsTab, initDayFlip } from "./ui/tab.js";
export { buildFeedbackRecord, aggregateVisited } from "./model/feedback";
