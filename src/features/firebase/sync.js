/* Generic live-sync primitive over Firebase Realtime Database.
   joinTrip(code) → a "room" scoped to trips/<code>, exposing:
     · collection(name) — a set of records keyed by server-generated PUSH IDs, so two
       people adding at the same time MERGE (each gets a unique id) instead of clobbering
       a shared array index. { onChange, add→id, set, update, remove }
     · doc(name)        — a single shared value (e.g. a settings blob). { onChange, set, update }
   Feature-agnostic: Trip Split is the first consumer; shared checklists / voting /
   presence can reuse the same primitive. */

import { ready } from "./client.js";

// Unambiguous alphabet (no 0/o/1/l/i) — codes get read aloud and typed on phones.
const CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

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
      add(value) {
        const r = push(ref(db, path));
        set(r, Object.assign({ createdBy: uid, createdAt: serverTimestamp() }, value));
        return r.key;
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
