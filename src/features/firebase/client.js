/* Firebase client — lazy, single-init, anonymous auth.
   The Firebase SDK is heavy, so it is dynamically imported ONLY when live sync is
   actually used (a trip is joined) — the guide bundle stays lean (same idea as the
   lazy gsap / Google-Maps loads). Everything that touches the Firebase SDK lives in
   this folder (the feature silo); consumers import from ./index.js and never see the
   SDK directly. */

import { FIREBASE_CONFIG } from "./firebase-config.js";

// True only when a real config has been filled in. Consumers gate their sync UI on this.
export function hasFirebase() {
  return !!(FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.databaseURL);
}

let _ready = null; // memoized Promise<{ db, uid, mod }> — init + sign-in happen once per page.

// Resolves once the app is initialized, the anonymous session is established, and the
// database module is loaded. Rejects if Firebase isn't configured or sign-in fails.
export function ready() {
  if (_ready) return _ready;
  if (!hasFirebase()) return Promise.reject(new Error("firebase-not-configured"));
  _ready = (async () => {
    const [{ initializeApp }, authMod, dbMod] = await Promise.all([
      import("firebase/app"),
      import("firebase/auth"),
      import("firebase/database"),
    ]);
    const app = initializeApp(FIREBASE_CONFIG);
    const auth = authMod.getAuth(app);
    const db = dbMod.getDatabase(app);
    // Anonymous sign-in: no login screen, but every device gets an app identity so the
    // Database Rules can require `auth != null` (blocks anonymous internet writes).
    const uid = await new Promise((resolve, reject) => {
      const off = authMod.onAuthStateChanged(auth, (user) => {
        if (user) { off(); resolve(user.uid); }
      });
      authMod.signInAnonymously(auth).catch(reject);
    });
    return { db, uid, mod: dbMod };
  })();
  return _ready;
}
