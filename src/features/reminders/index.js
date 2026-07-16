/* Public API of the Reminders / Notable Items feature. Consumers import ONLY from here —
   the UI, gateway and pure model stay siloed in this folder, and Firebase is reached
   through src/features/firebase/index.js, never the SDK directly.

   Data access sits behind the injectable gateway: initReminders({ gateway }) accepts any
   object with the createGateway() shape, so tests run zero-network and a backend swap
   never touches ui/. */

export { initReminders } from "./ui/reminders.js";
export { createGateway } from "./gateway.js";
