/* MĀKTĀB habit tracker — service worker (generated at build time). */
const VERSION = '869968921379';
const CACHE = `maktab-${VERSION}`;
const PRECACHE = [
  "./",
  "./index.html",
  "./assets/index-B0nECTG3.js",
  "./assets/ibm-plex-sans-latin-400-normal-CDDApCn2.woff2",
  "./assets/ibm-plex-sans-latin-500-normal-6ng42L7E.woff2",
  "./assets/ibm-plex-sans-latin-600-normal-CuJfVYMP.woff2",
  "./assets/index-mwFzMd0X.css",
  "./assets/mark-color-on-dark-BIREpE4H.svg",
  "./assets/vazirmatn-arabic-400-normal-DMZFCm7K.woff2",
  "./assets/vazirmatn-arabic-500-normal-C_lbnnKa.woff2",
  "./assets/vazirmatn-arabic-700-normal-Dge_DOjm.woff2",
  "./assets/vazirmatn-arabic-900-normal-BVDx3pOU.woff2",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon.svg"
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('maktab-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // App shell: every navigation gets the cached index (works offline).
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html', { cacheName: CACHE }).then((cached) => cached || fetch(request)),
    );
    return;
  }

  // Versioned assets: cache first, then network (and remember the result).
  event.respondWith(
    caches.match(request, { cacheName: CACHE }).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok && response.type === 'basic') {
            const copy = response.clone();
            void caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
