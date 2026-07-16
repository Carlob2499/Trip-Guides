/* Public API of the Reminders / Notable Items feature. Consumers import ONLY from here —
   the UI and the pure model stay siloed in this folder, and Firebase is reached through
   src/features/firebase/index.js, never the SDK directly. */

export { initReminders } from "./ui/reminders.js";
export { buildReminder, inferKind, sortReminders } from "./model/reminders";
