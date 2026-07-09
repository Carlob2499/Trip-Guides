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
  apiKey: "AIzaSyAc-kkU7g22DVyT3UIyPa3RQGHy3i1o6fw",
  authDomain: "waypoint-v1-2e7ae.firebaseapp.com",
  databaseURL: "https://waypoint-v1-2e7ae-default-rtdb.firebaseio.com",
  projectId: "waypoint-v1-2e7ae",
  storageBucket: "waypoint-v1-2e7ae.firebasestorage.app",
  messagingSenderId: "499891211430",
  appId: "1:499891211430:web:2db52d41c4bc6d3c2c7867",
};
