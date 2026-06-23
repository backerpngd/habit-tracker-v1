const CACHE_NAME = 'habit-tracker-v1';

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];


// INSTALL
// Save core app files for offline use
self.addEventListener('install', (event) => {

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );

  // Activate new service worker immediately
  self.skipWaiting();
});


// ACTIVATE
// Remove old cache versions
self.addEventListener('activate', (event) => {

  event.waitUntil(
    caches.keys().then((keys) => {

      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );

    })
  );

  // Take control immediately
  self.clients.claim();
});


// FETCH
self.addEventListener('fetch', (event) => {

  // Ignore non-http requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(event.request.url);


  // -----------------------------
  // HTML PAGES → NETWORK FIRST
  // -----------------------------
  if (
    event.request.destination === 'document' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('/')
  ) {

    event.respondWith(

      fetch(event.request)

        .then((networkResponse) => {

          // Save fresh version to cache
          const responseClone = networkResponse.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });

          return networkResponse;
        })

        .catch(() => {

          // Offline fallback
          return caches.match(event.request);

        })

    );

    return;
  }


  // -----------------------------
  // STATIC FILES → CACHE FIRST
  // -----------------------------
  event.respondWith(

    caches.match(event.request)

      .then((cachedResponse) => {

        // Return cached version if available
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise fetch from network
        return fetch(event.request)

          .then((networkResponse) => {

            // Save fetched file
            const responseClone = networkResponse.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });

            return networkResponse;

          });

      })

  );

});
