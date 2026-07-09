/* Public API of the Firebase live-sync feature. Consumers import ONLY from here — the
   SDK-touching internals (client.js, sync.js, firebase-config.js) stay siloed in this
   folder. To add a new synced feature: call hasFirebase() to gate its UI, then
   joinTrip(code) and bind the returned room's collection()/doc() to your state. */

export { hasFirebase } from "./client.js";
export { joinTrip, generateTripCode, normalizeCode } from "./sync.js";
