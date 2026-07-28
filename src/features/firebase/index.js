/* Public API of the Firebase live-sync feature. Consumers import ONLY from here — the
   SDK-touching internals (client.js, sync.js, firebase-config.js) stay siloed in this
   folder. To add a new synced feature: call hasFirebase() to gate its UI, then
   joinTrip(code) and bind the returned room's collection()/doc() to your state. */

export { hasFirebase } from "./client.js";
export { joinTrip, generateTripCode, normalizeCode, reportError, bumpCounter } from "./sync.js";
export { isValidRoomId, resolveRoomId, parseRoomHash, isPermanentWriteError, isPostTripLocked, POST_TRIP_GRACE_DAYS, ROOM_ID_RE } from "./model/room";

import { resolveRoomId } from "./model/room";

/* The room id for THIS guide's shared sync (Trip Split, feedback, reminders). Single source of
   truth: the `roomId` baked into #tgConfig by GuideLayout. It does NOT fall back to the guide
   slug — that fallback is what silently broke Trip Split, because rules.json requires a 16–40
   char room code and every slug is shorter, so the panel rendered live and editable while the
   server denied every write. No roomId now means "" and local-only, which is what the feature
   already documents for unconfigured sync; see model/room.ts for the full account.
   Kept separate from a feature's localStorage namespace (storeKey) on purpose. */
export function roomId() {
  try {
    var el = document.getElementById("tgConfig");
    // M5: a `#room=<code>` fragment overrides the committed roomId — the opt-in private
    // alternative to the zero-setup default (see model/room.ts). The fragment is never sent
    // to a server by the browser, which is exactly why it is the carrier for a code that
    // must not live in a public repo.
    return resolveRoomId(
      el ? JSON.parse(el.textContent || "{}") : {},
      typeof location !== "undefined" ? location.hash : "",
    );
  } catch (e) {
    return "";
  }
}
