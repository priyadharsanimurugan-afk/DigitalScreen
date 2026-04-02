self.addEventListener('install', (e) => {
  console.log('SW installed');
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  console.log('SW activated');
  return self.clients.claim();
});

// Simple offline cache example
const CACHE_NAME = 'digital-screen-cache-v1';
const urlsToCache = ['/'];

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((resp) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, resp.clone());
          return resp;
        });
      });
    })
  );
});
