/* Generic live-sync primitive over Firebase Realtime Database.
   joinTrip(code) → a "room" scoped to trips/<code>, exposing:
     · collection(name) — a set of records keyed by server-generated PUSH IDs, so two
       people adding at the same time MERGE (each gets a unique id) instead of clobbering
       a shared array index. { onChange, add→id, set, update, remove }
     · doc(name)        — a single shared value (e.g. a settings blob). { onChange, set, update }
   Feature-agnostic: Trip Split is the first consumer; shared checklists / voting /
   presence can reuse the same primitive. */

import { ready, hasFirebase } from "./client.js";
import { addEntry, entriesForRoom, removeEntry } from "./model/outbox";
import { isPermanentWriteError } from "./model/room";

// Durable write outbox (see model/outbox.ts). localStorage-backed so an add made offline
// survives a tab close — RTDB's own queue is memory-only.
const OUTBOX_KEY = "tg-outbox";
const REJECTED_OUTBOX_KEY = "tg-outbox-rejected";
const ACKED_OUTBOX_KEY = "tg-outbox-acked";
function readOutbox() {
  try { return JSON.parse(localStorage.getItem(OUTBOX_KEY) || "{}"); } catch (_) { return {}; }
}
function readStoredMap(key) {
  try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch (_) { return {}; }
}
function writeStoredMap(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}
function writeOutbox(o) {
  return writeStoredMap(OUTBOX_KEY, o);
}
function isolateRejectedEntry(fullPath, code) {
  const active = readOutbox();
  if (!(fullPath in active)) return;
  const value = active[fullPath];
  const queuedAt = value && typeof value === "object" && typeof value.createdAt === "number"
    ? value.createdAt
    : Date.now();
  const rejected = readStoredMap(REJECTED_OUTBOX_KEY);
  const result = writeStoredMap(REJECTED_OUTBOX_KEY, Object.assign({}, rejected, {
    [fullPath]: { value, queuedAt, rejectedAt: Date.now(), code },
  }));
  if (!result.ok) return;
  writeOutbox(removeEntry(readOutbox(), fullPath));
}

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

  // Replay any adds a PRIOR session queued but never got the server to ack (the tab closed
  // before RTDB's memory-only queue flushed). Idempotent — each entry's key is stable, so a
  // re-set writes the same record even if RTDB also delivered it; on ack we clear the entry.
  function consumeTerminalEntry(fullPath) {
    const removal = writeOutbox(removeEntry(readOutbox(), fullPath));
    if (!removal.ok) return false;
    const acknowledged = readStoredMap(ACKED_OUTBOX_KEY);
    if (fullPath in acknowledged) {
      writeStoredMap(ACKED_OUTBOX_KEY, removeEntry(acknowledged, fullPath));
    }
    return true;
  }

  entriesForRoom(readOutbox(), base).forEach(function (e) {
    if (e.path in readStoredMap(ACKED_OUTBOX_KEY) || e.path in readStoredMap(REJECTED_OUTBOX_KEY)) {
      consumeTerminalEntry(e.path);
      return;
    }
    set(ref(db, e.path), e.value)
      .then(function () { onWriteAcknowledged(e.path); })
      .catch(function (err) { onWriteFailed(e.path, err); });
  });

  /* A rejected write used to be swallowed, making an optimistic row vanish without explanation.
     Transient failures remain active for replay. Permanent failures move to separate durable
     storage so they neither consume active capacity nor retry on every room join. */
  function onWriteFailed(fullPath, err) {
    const code = String((err && (err.code || err.message)) || "unknown");
    const permanent = isPermanentWriteError(err);
    if (permanent) isolateRejectedEntry(fullPath, code);
    try {
      console.error("[waypoint sync] write to " + fullPath + (permanent ? " REJECTED (permanent): " : " failed, will retry: ") + code);
      document.dispatchEvent(new CustomEvent("tg:sync-error", { detail: { path: fullPath, permanent, code } }));
    } catch { /* no DOM (tests / SSR) — the console line above is the record */ }
    return permanent;
  }

  function durabilityError(fullPath, code, message, cause) {
    const error = new Error(message, { cause });
    error.name = "WaypointSyncDurabilityError";
    error.code = code;
    try {
      console.error("[waypoint sync] " + message + ": " + code);
      document.dispatchEvent(new CustomEvent("tg:sync-error", {
        detail: { path: fullPath, permanent: true, code },
      }));
    } catch { /* no DOM (tests / SSR) — the console line above is the record */ }
    return error;
  }

  function onWriteAcknowledged(fullPath) {
    const acknowledged = readStoredMap(ACKED_OUTBOX_KEY);
    const marker = writeStoredMap(ACKED_OUTBOX_KEY, Object.assign({}, acknowledged, { [fullPath]: true }));
    const removal = writeOutbox(removeEntry(readOutbox(), fullPath));
    if (!removal.ok) {
      return durabilityError(
        fullPath,
        "outbox-ack-cleanup-failed",
        "Server acknowledged " + fullPath + ", but its active retry entry could not be removed",
        removal.error,
      );
    }
    if (marker.ok) writeStoredMap(ACKED_OUTBOX_KEY, removeEntry(readStoredMap(ACKED_OUTBOX_KEY), fullPath));
    return null;
  }

  function persistActiveEntry(fullPath, value) {
    const terminal = Object.assign(
      {},
      readStoredMap(ACKED_OUTBOX_KEY),
      readStoredMap(REJECTED_OUTBOX_KEY),
    );
    const active = Object.fromEntries(
      Object.entries(readOutbox()).filter(([path]) => !(path in terminal)),
    );
    const result = writeOutbox(addEntry(active, fullPath, value));
    if (result.ok) return null;
    return durabilityError(
      fullPath,
      "outbox-write-failed",
      "Could not persist " + fullPath + " before sending",
      result.error,
    );
  }

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
        const fullPath = path + "/" + r.key;
        // Persist to the outbox BEFORE the network call so an offline add survives a tab close.
        // The durable copy uses a client createdAt (Date.now) rather than the serverTimestamp
        // sentinel — a replayed offline write can't resolve a server clock, and it's a fallback.
        const persistenceError = persistActiveEntry(
          fullPath,
          Object.assign({ createdBy: uid, createdAt: Date.now() }, value),
        );
        if (persistenceError) throw persistenceError;
        set(r, Object.assign({ createdBy: uid, createdAt: serverTimestamp() }, value))
          .then(function () { onWriteAcknowledged(fullPath); })
          .catch(function (err) { onWriteFailed(fullPath, err); });
        return r.key;
      },
      // addAsync(value) → Promise<id> that settles only when the SERVER acknowledges the write.
      // While the SDK is disconnected RTDB queues the write and this promise stays PENDING (it
      // neither resolves nor rejects) — so callers that report success to a human must race it
      // against a timeout rather than await it forever, and say "queued", not "saved". A reported
      // transient transport rejection remains pending; a permanent rejection surfaces to caller.
      addAsync(value) {
        const r = push(ref(db, path));
        const fullPath = path + "/" + r.key;
        // addAsync has the same offline durability contract as add: the Promise being pending
        // is precisely when a closed tab would otherwise lose the SDK's memory-only queue.
        const persistenceError = persistActiveEntry(
          fullPath,
          Object.assign({ createdBy: uid, createdAt: Date.now() }, value),
        );
        if (persistenceError) return Promise.reject(persistenceError);
        return set(r, Object.assign({ createdBy: uid, createdAt: serverTimestamp() }, value))
          .then(function () {
            const cleanupError = onWriteAcknowledged(fullPath);
            if (cleanupError) throw cleanupError;
            return r.key;
          })
          .catch(function (err) {
            if (err && err.code === "outbox-ack-cleanup-failed") throw err;
            if (onWriteFailed(fullPath, err)) throw err;
            return new Promise(function () {});
          });
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
