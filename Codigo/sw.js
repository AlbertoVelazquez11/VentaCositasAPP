// sw.js — Service Worker cache-first (offline-first) para el shell de VentaCositas.
const CACHE = 'ventacositas-v3';

const CORE = [
  './',
  './index.html',
  './manifest.json',
  './css/variables.css',
  './css/base.css',
  './js/app.js',
  './js/router.js',
  './js/store.js',
  './js/db.js',
  './js/negocio.js',
  './js/views/home.js',
  './js/views/articulos.js',
  './js/views/historial.js',
  './js/views/config.js',
  './js/components/modal.js',
  './js/components/toast.js',
  './js/components/swipe-item.js',
  './js/utils/imagen.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then((hit) => {
      if (hit) return hit;
      return fetch(e.request)
        .then((res) => {
          // Cache-first: al volver de red se actualiza la caché (stale-while-revalidate).
          if (res.ok && e.request.url.startsWith(self.location.origin)) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
