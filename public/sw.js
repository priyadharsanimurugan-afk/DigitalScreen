self.addEventListener('install', (event) => {
  console.log('Service Worker Installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker Activated');
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // You can add caching logic here if needed
});
