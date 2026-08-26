import { build, type Plugin } from "vite";
import { fileURLToPath } from "node:url";

const CLIENT_ID = "\0waypoint-sync-proof-client";
const FIREBASE_INDEX_ID = "\0waypoint-survey-proof-firebase";
const syncEntry = fileURLToPath(new URL("../../../src/features/firebase/sync.js", import.meta.url));
const surveyEntry = fileURLToPath(new URL("../../../src/features/learnings/ui/survey.js", import.meta.url));

const fakeClientSource = String.raw`
const listeners = new Map();
const localValues = new Map();

function transport(request) {
  return globalThis.__waypointProofTransport(request);
}

function clone(value) {
  return value == null ? value : structuredClone(value);
}

function valueAt(path) {
  if (localValues.has(path)) return clone(localValues.get(path));
  const prefix = path + "/";
  const children = {};
  for (const [candidate, value] of localValues) {
    if (!candidate.startsWith(prefix)) continue;
    const child = candidate.slice(prefix.length);
    if (!child || child.includes("/")) continue;
    children[child] = clone(value);
  }
  return children;
}

function emit(path) {
  for (const [watchedPath, callbacks] of listeners) {
    if (path !== watchedPath && !path.startsWith(watchedPath + "/")) continue;
    const value = valueAt(watchedPath);
    for (const callback of callbacks) callback({ val: () => clone(value) });
  }
}

function writeLocal(path, value) {
  const hadPrevious = localValues.has(path);
  const previous = localValues.get(path);
  if (value === null) localValues.delete(path);
  else localValues.set(path, clone(value));
  emit(path);
  return function rollback() {
    if (hadPrevious) localValues.set(path, previous);
    else localValues.delete(path);
    emit(path);
  };
}

function ref(_db, path) {
  return { path };
}

function push(parent) {
  const next = Number(localStorage.getItem("tg-proof-push-seq") || "0") + 1;
  localStorage.setItem("tg-proof-push-seq", String(next));
  const key = "proof-key-" + String(next).padStart(4, "0");
  return { path: parent.path + "/" + key, key };
}

function set(target, value) {
  const rollback = writeLocal(target.path, value);
  return transport({ op: "set", path: target.path, value: clone(value) })
    .catch((error) => {
      rollback();
      throw error;
    });
}

function update(target, patch) {
  const previous = valueAt(target.path);
  const next = Object.assign({}, previous && typeof previous === "object" ? previous : {}, patch);
  return set(target, next);
}

function remove(target) {
  return set(target, null);
}

function onValue(target, callback) {
  const callbacks = listeners.get(target.path) || new Set();
  callbacks.add(callback);
  listeners.set(target.path, callbacks);

  queueMicrotask(() => callback({ val: () => valueAt(target.path) }));
  transport({ op: "read", path: target.path })
    .then((canonical) => {
      if (canonical && typeof canonical === "object") {
        for (const [key, value] of Object.entries(canonical)) {
          localValues.set(target.path + "/" + key, clone(value));
        }
      } else if (canonical !== undefined) {
        localValues.set(target.path, clone(canonical));
      }
      callback({ val: () => valueAt(target.path) });
    })
    .catch(() => {});

  return () => {
    callbacks.delete(callback);
    if (!callbacks.size) listeners.delete(target.path);
  };
}

const mod = {
  ref,
  push,
  set,
  update,
  remove,
  onValue,
  serverTimestamp: () => ({ ".sv": "timestamp" }),
};

export function hasFirebase() {
  return true;
}

export async function ready() {
  return { db: {}, uid: "proof-browser-user", mod };
}
`;

function fakeFirebaseClient(): Plugin {
  return {
    name: "waypoint-sync-proof-client-boundary",
    enforce: "pre",
    resolveId(source, importer) {
      if (source === "waypoint-survey-proof-source") return surveyEntry;
      if (source === "./client.js" && importer?.replaceAll("\\", "/").endsWith("/src/features/firebase/sync.js")) {
        return CLIENT_ID;
      }
      if (source === "../../firebase/index.js" && importer?.replaceAll("\\", "/").endsWith("/src/features/learnings/ui/survey.js")) {
        return FIREBASE_INDEX_ID;
      }
      return null;
    },
    transform(code, id) {
      if (id.replaceAll("\\", "/") === syncEntry.replaceAll("\\", "/")) {
        return code + '\nexport { initFeedback } from "waypoint-survey-proof-source";';
      }
      return null;
    },
    load(id) {
      if (id === CLIENT_ID) return fakeClientSource;
      if (id === FIREBASE_INDEX_ID) {
        return `
          export function hasFirebase() { return true; }
          export function roomId() { return "surveyproofroom001"; }
          export function joinTrip() { return Promise.resolve(globalThis.__proofSurveyRoom); }
        `;
      }
      return null;
    },
  };
}

export async function buildSyncProofBundle(): Promise<string> {
  const result = await build({
    logLevel: "silent",
    plugins: [fakeFirebaseClient()],
    build: {
      write: false,
      target: "es2022",
      minify: false,
      lib: { entry: syncEntry, formats: ["es"] },
      rollupOptions: { output: { entryFileNames: "sync-proof.js", inlineDynamicImports: true } },
    },
  });
  const builds = Array.isArray(result) ? result : [result];
  const entry = builds
    .flatMap((item) => "output" in item ? item.output : [])
    .find((item) => item.type === "chunk" && item.isEntry);
  if (!entry || entry.type !== "chunk") throw new Error("sync proof bundle did not emit an entry chunk");
  return entry.code;
}
