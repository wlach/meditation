const CACHE_NAME = "meditation-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/index.js",
  "./sounds/bell.opus",
  "./img/bell-32.png",
  "./img/bell-48.png",
  "./img/bell-128.png",
  "./img/bell-192.png",
  "./img/bell-512.png",
  "./img/bell-icon.svg",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((cached) => cached || fetch(event.request)),
  );
});
