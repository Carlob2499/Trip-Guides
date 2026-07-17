# Firebase live-sync feature

Real-time shared state over Firebase Realtime Database. First consumer: the Trip Split
budget calculator (`src/features/trip-split/`) — group-mates who join the same trip code
see the same budget live. The core is feature-agnostic so future features (shared
checklists, live voting, presence) can reuse it.

**Silo rule:** everything that touches the Firebase SDK lives in this folder. Consumers
import only from `./index.js` and never see the SDK. New features go in their own
`src/features/<name>/` folder (see `CLAUDE.md`).

## Files

| File | Role |
|---|---|
| `firebase-config.js` | Public web config (committed — safe; empty = sync OFF) |
| `client.js` | Lazy SDK init + anonymous auth; `hasFirebase()`, `ready()` |
| `sync.js` | `joinTrip(code)` → room `{ collection, doc }`; `generateTripCode()` |
| `index.js` | Public API barrel |
| `rules.json` | Realtime Database security rules (paste into the console) |
| `live.css` | Sync UI (trip-code control + "● Live" indicator) |

## Setup (~10 minutes; a phone browser is fine)

1. **[console.firebase.google.com](https://console.firebase.google.com) → Add project** (any
   name; Analytics off).
2. **Build → Realtime Database → Create Database** → pick a region → start in **locked mode**.
3. **Build → Authentication → Sign-in method → Anonymous → Enable.**
4. **Project settings (gear) → Your apps → Web (`</>`) → register** → copy the `firebaseConfig`
   values into `firebase-config.js` (they're public — safe to commit).
5. **Realtime Database → Rules** → paste the contents of `rules.json` → **Publish**.

Empty config → the calculator runs local-only exactly as before (no network, no errors).

## Add a new synced feature (pattern)

```js
import { hasFirebase, joinTrip } from "../features/firebase/index.js";
if (hasFirebase()) { /* show sync UI */ }
const room = await joinTrip(code);
const items = room.collection("things");
items.onChange((map) => render(Object.values(map)));   // live updates
const id = items.add({ label: "…" });                   // concurrent-safe (push id)
items.update(id, { label: "…" }); items.remove(id);
```

## Security — the honest limit

Writes require an anonymous app identity (`auth != null`), and each trip is gated by an
**unguessable code** (the room key). So anyone with the code can read/write that trip — fine
for a friends' budget, but it is **not** private-by-login. `rules.json` also caps field sizes
to limit abuse. For true privacy, swap anonymous auth for real sign-in and scope rules to
member UIDs (future work).
