// ============================================
// SERVICE WORKER - LÍNGYÚN DÀO
// Online-Only PWA (no offline caching)
// ============================================

const CACHE_NAME = 'lingyundao-shell-v1';

// Only cache the absolute minimum for install prompt
const SHELL_CACHE = [
  '/manifest.json',
  '/favicon.png'
];

// Install - cache only shell files for PWA install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - ALWAYS go to network (online-only game)
// Only use cache as absolute fallback for shell files
self.addEventListener('fetch', (event) => {
  // Always fetch from network - this is an online game
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        // Only return cached shell files if network fails completely
        return caches.match(event.request);
      })
  );
});
