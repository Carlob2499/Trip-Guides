/* Public API of the trip-kit feature — focused, on-the-ground tools (docs/FEATURES.md
   #5 arrival autopilot, #6 phrase cards, #7 entry-requirements — the latter two land
   here in later commits). Consumers import ONLY from here, never model/ or ui/ directly. */

export { deriveArrivalPlan } from "./model/arrival";
export { initSpeak } from "./ui/speak.js";
export { initEntrySelect } from "./ui/entry-select.js";
