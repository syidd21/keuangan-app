// =============================================
//   SERVICE WORKER — Keuangan Rumah Tangga
// =============================================

const CACHE_NAME = 'krt-v1.0.0';
const OFFLINE_URL = 'index.html';

const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap'
];

// ===== INSTALL: cache all assets =====
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS.map(url => new Request(url, { cache: 'reload' })))
        .catch(() => cache.addAll(['/index.html', '/style.css', '/script.js']));
    }).then(() => self.skipWaiting())
  );
});

// ===== ACTIVATE: clean old caches =====
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ===== FETCH: cache-first strategy =====
self.addEventListener('fetch', (event) => {
  // Skip non-GET
  if (event.request.method !== 'GET') return;

  // Skip cross-origin (Apps Script etc)
  if (!event.request.url.startsWith(self.location.origin) &&
      !event.request.url.startsWith('https://fonts.')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        // Offline fallback
        return caches.match(OFFLINE_URL);
      });
    })
  );
});
