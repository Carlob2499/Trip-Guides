/* Data gateway for the reminders silo — the ONLY place that knows where reminders live.
   Injected through initReminders() so tests (and a future backend swap) never touch ui/.
   Firebase-backed when configured (via the firebase silo's public surface, never the SDK),
   localStorage otherwise. Anything added before the room finishes connecting — or during an
   earlier offline session — is ADOPTED into the shared room on connect, not stranded in a
   localStorage key that would never be read again. */

import { hasFirebase, joinTrip, roomId } from "../firebase/index.js";

export function createGateway(storeKey) {
  var LS_KEY = "tg-remind-" + (storeKey || "guide");
  var room = null;
  var items = {}; // id -> record (mirror of whichever source is live)
  var listeners = [];

  function readLocal() { try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (e) { return {}; } }
  function writeLocal() { if (room) return; try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch (e) {} }
  function clearLocal() { try { localStorage.removeItem(LS_KEY); } catch (e) {} }
  function emit() { listeners.forEach(function (fn) { fn(items); }); }
  function newId() { return "r" + Math.random().toString(36).slice(2, 9); }

  return {
    /* Whether a shared room is even possible (Firebase configured). */
    hasSync: hasFirebase,

    /* Start the data source. Resolves {live:true} once the shared room is connected,
       {live:false} for the local-only mode; rejects when Firebase is configured but
       unreachable (the caller shows offline — local items still emitted). */
    // TypeScript suggests converting this to an async function. Deliberately NOT done: the .then()
    // chain below is order-sensitive (stranded local items must be adopted BEFORE subscribing, see
    // the comment there), and rewriting control flow to silence a cosmetic hint is exactly the kind
    // of "harmless" change that moves an await by one tick and loses a write.
    connect: function () {
      if (!hasFirebase()) {
        items = readLocal();
        emit();
        return Promise.resolve({ live: false });
      }
      return joinTrip(roomId()).then(function (r) {
        room = r;
        var col = room.collection("reminders");
        // Adopt pre-connect / offline-session items into the room BEFORE subscribing, so
        // the first snapshot (RTDB echoes local writes immediately) already includes them.
        var stranded = readLocal();
        Object.keys(stranded).forEach(function (id) { col.add(stranded[id]); });
        clearLocal();
        col.onChange(function (map) { items = map || {}; emit(); });
        return { live: true };
      }).catch(function (err) {
        items = readLocal();
        emit();
        throw err;
      });
    },

    onChange: function (fn) { listeners.push(fn); },

    add: function (rec) {
      if (room) { room.collection("reminders").add(rec); }
      else { items[newId()] = Object.assign({ createdAt: Date.now() }, rec); writeLocal(); emit(); }
    },
    remove: function (id) {
      if (room) { room.collection("reminders").remove(id); }
      else { delete items[id]; writeLocal(); emit(); }
    },
    setPinned: function (id, pinned) {
      if (room) { room.collection("reminders").update(id, { pinned: pinned }); }
      else if (items[id]) { items[id].pinned = pinned; writeLocal(); emit(); }
    },
  };
}
