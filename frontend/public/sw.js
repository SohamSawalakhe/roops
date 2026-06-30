// Simple service worker for PWA installability
self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (e) => {
  // Pass-through fetch requests
  e.respondWith(fetch(e.request));
});
