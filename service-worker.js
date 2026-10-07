const CACHE_VERSION = "gsr-pwa-v1";

const STATIC_FILES = [
  "./",
  "./index.html",
  "./offline.html",
  "./manifest.json",
  "./logo.png",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then(function (cache) {
        return cache.addAll(STATIC_FILES);
      })
  );

  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheName !== CACHE_VERSION) {
            return caches.delete(cacheName);
          }

          return Promise.resolve();
        })
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(function (response) {
          const responseCopy = response.clone();

          caches
            .open(CACHE_VERSION)
            .then(function (cache) {
              cache.put(event.request, responseCopy);
            });

          return response;
        })
        .catch(function () {
          return caches.match("./offline.html");
        })
    );

    return;
  }

  event.respondWith(
    caches.match(event.request).then(function (cachedResponse) {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then(function (response) {
        if (!response || response.status !== 200) {
          return response;
        }

        const responseCopy = response.clone();

        caches
          .open(CACHE_VERSION)
          .then(function (cache) {
            cache.put(event.request, responseCopy);
          });

        return response;
      });
    })
  );
});