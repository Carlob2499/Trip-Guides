/* Public API of the Firebase live-sync feature. Consumers import ONLY from here — the
   SDK-touching internals (client.js, sync.js, firebase-config.js) stay siloed in this
   folder. To add a new synced feature: call hasFirebase() to gate its UI, then
   joinTrip(code) and bind the returned room's collection()/doc() to your state. */

export { hasFirebase } from "./client.js";
export { joinTrip, generateTripCode, normalizeCode } from "./sync.js";

/* The room id for THIS guide's shared sync (Trip Split, feedback, reminders). Single source
   of truth: the salted `roomId` baked into #tgConfig by GuideLayout, falling back to the guide
   slug for legacy guides (which the RTDB rules then freeze read-only). Every consumer joins via
   this instead of computing normalizeCode(storeKey) itself, so room identity lives in one place.
   Kept separate from a feature's localStorage namespace (storeKey) on purpose. */
export function roomId() {
  try {
    var el = document.getElementById("tgConfig");
    var cfg = el ? JSON.parse(el.textContent || "{}") : {};
    return String(cfg.roomId || cfg.storeKey || "guide");
  } catch (e) {
    return "guide";
  }
}
