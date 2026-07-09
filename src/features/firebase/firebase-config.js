/* Public Firebase web config for live sync.
   ┌─────────────────────────────────────────────────────────────────────────┐
   │ SAFE TO COMMIT. A Firebase web config is an identifier, not a secret —    │
   │ security is enforced by Firebase Auth + Realtime Database Rules, never by │
   │ hiding these values. (This is Firebase's documented, intended usage.)     │
   └─────────────────────────────────────────────────────────────────────────┘

   Empty = live sync is OFF: the Trip Split budget calculator runs exactly as before,
   local-only, with no network and no errors. Fill these in from your project at
   console.firebase.google.com → Project settings (gear) → Your apps → Web app →
   `firebaseConfig`. See README.md in this folder for the ~10-minute setup. */

export const FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  databaseURL: "", // REQUIRED for Realtime Database, e.g. https://<project>-default-rtdb.<region>.firebasedatabase.app
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};
