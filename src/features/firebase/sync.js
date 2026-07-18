/* Generic live-sync primitive over Firebase Realtime Database.
   joinTrip(code) → a "room" scoped to trips/<code>, exposing:
     · collection(name) — a set of records keyed by server-generated PUSH IDs, so two
       people adding at the same time MERGE (each gets a unique id) instead of clobbering
       a shared array index. { onChange, add→id, set, update, remove }
     · doc(name)        — a single shared value (e.g. a settings blob). { onChange, set, update }
   Feature-agnostic: Trip Split is the first consumer; shared checklists / voting /
   presence can reuse the same primitive. */

import { ready, hasFirebase } from "./client.js";

// Unambiguous alphabet (no 0/o/1/l/i) — codes get read aloud and typed on phones.
const CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

// Best-effort error beacon. A leaf feature that throws used to log ONLY to the traveler's own
// phone console — invisible to the maker. This appends a bounded {guide,feature,message,ua,at}
// record to the write-only `errors/` node (rules: .read false, .write auth). Never throws, never
// blocks, rate-limited to the first few per session so a render loop can't flood the DB, and a
// no-op when Firebase isn't configured. Reuses the SDK the sync features already loaded.
let _errCount = 0;
export function reportError(detail) {
  if (_errCount >= 5 || !hasFirebase()) return;
  _errCount++;
  try {
    ready().then(function (ctx) {
      const { db, mod } = ctx;
      const r = mod.push(mod.ref(db, "errors"));
      mod.set(r, {
        guide: String((detail && detail.guide) || "").slice(0, 60),
        feature: String((detail && detail.feature) || "").slice(0, 60),
        message: String((detail && detail.message) || "").slice(0, 500),
        ua: String((typeof navigator !== "undefined" && navigator.userAgent) || "").slice(0, 200),
        at: mod.serverTimestamp(),
      }).catch(function () {});
    }).catch(function () {});
  } catch (e) { /* beacon must never surface its own failure */ }
}

// A 10-char crypto-random room key — unguessable, so the code itself is the lock.
export function generateTripCode() {
  const rnd = new Uint32Array(10);
  (globalThis.crypto || window.crypto).getRandomValues(rnd);
  let s = "";
  for (let i = 0; i < rnd.length; i++) s += CODE_ALPHABET[rnd[i] % CODE_ALPHABET.length];
  return s;
}

// RTDB keys can't contain . $ # [ ] / — sanitize anything a user types/pastes.
export function normalizeCode(code) {
  return String(code || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
}

export async function joinTrip(code) {
  const clean = normalizeCode(code);
  if (!clean) throw new Error("empty-code");
  const { db, uid, mod } = await ready();
  const { ref, onValue, push, update, remove, set, serverTimestamp } = mod;
  const base = "trips/" + clean;

  function collection(name) {
    const path = base + "/" + name;
    return {
      // onChange(cb) → cb(mapOf {id: value}); returns an unsubscribe fn.
      onChange(cb) { return onValue(ref(db, path), (snap) => cb(snap.val() || {})); },
      // add(value) → new id (optimistic: RTDB fires onChange locally before the round-trip).
      // Fire-and-forget by design: the budget re-renders instantly from the local write and
      // RTDB flushes the queue on reconnect. Use addAsync when the caller must KNOW it landed.
      add(value) {
        const r = push(ref(db, path));
        set(r, Object.assign({ createdBy: uid, createdAt: serverTimestamp() }, value));
        return r.key;
      },
      // addAsync(value) → Promise<id> that settles only when the SERVER acknowledges the write.
      // While the SDK is disconnected RTDB queues the write and this promise stays PENDING (it
      // neither resolves nor rejects) — so callers that report success to a human must race it
      // against a timeout rather than await it forever, and say "queued", not "saved".
      addAsync(value) {
        const r = push(ref(db, path));
        return set(r, Object.assign({ createdBy: uid, createdAt: serverTimestamp() }, value))
          .then(function () { return r.key; });
      },
      set(id, value) { return set(ref(db, path + "/" + id), value); },
      update(id, patch) { return update(ref(db, path + "/" + id), patch); },
      remove(id) { return remove(ref(db, path + "/" + id)); },
    };
  }
  function doc(name) {
    const path = base + "/" + name;
    return {
      onChange(cb) { return onValue(ref(db, path), (snap) => cb(snap.val())); },
      set(value) { return set(ref(db, path), value); },
      update(patch) { return update(ref(db, path), patch); },
    };
  }
  return { code: clean, uid, collection, doc };
}
