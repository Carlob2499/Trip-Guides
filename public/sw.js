/*
  Offline service worker for Trip Guides.

  What it does:
  - Pre-caches the home page and each guide so they open without a connection
    once you've loaded the site at least once online.
  - Pages (HTML) are network-first: you get fresh content when online, and the
    saved copy when you're offline.
  - Everything else (CSS, JS, fonts, photos) is cache-first: fast, and available
    offline after it's been seen once.

  Known limit: map tiles (OpenStreetMap or Google) come from third-party
  servers and are not precached, so interactive maps need a connection.
  The written "Key transit routes" steps work offline regardless.

  When you publish a big update, bump CACHE below (v1 -> v2) so visitors get the
  new version cleanly.
*/
const CACHE = "tripguides-v20";
const BASE = "/Trip-Guides";
const CORE = [
  BASE + "/",
  BASE + "/guides/denmark/",
  BASE + "/guides/korea/",
  BASE + "/manifest.webmanifest",
  BASE + "/icons/icon-192.png",
  BASE + "/icons/favicon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      // add each URL individually so one failure doesn't abort the whole install
      .then((cache) => Promise.all(CORE.map((u) => cache.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const isHTML =
    req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html");

  if (isHTML) {
    // network-first, fall back to the cached page, then the home page
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((m) => m || caches.match(BASE + "/")))
    );
    return;
  }

  // assets/images/fonts: cache-first, then network (and remember it for next time)
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      });
    })
  );
});
