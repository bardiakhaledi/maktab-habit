/* MĀKTĀB habit tracker — service worker (generated at build time). */
const VERSION = '4263a5a217ce';
const CACHE = `maktab-${VERSION}`;
const PRECACHE = [
  "./",
  "./index.html",
  "./assets/index-C-9QhxQB.js",
  "./assets/ibm-plex-sans-latin-400-normal-CDDApCn2.woff2",
  "./assets/ibm-plex-sans-latin-500-normal-6ng42L7E.woff2",
  "./assets/ibm-plex-sans-latin-600-normal-CuJfVYMP.woff2",
  "./assets/index-Bwkv6DWY.css",
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
  // Server routes are always live: account data and the admin page are never cached.
  const scopePath = new URL(self.registration.scope).pathname;
  const rel = url.pathname.startsWith(scopePath) ? url.pathname.slice(scopePath.length) : url.pathname;
  if (rel.startsWith('api/') || rel === 'admin' || rel.startsWith('admin/')) return;

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

// ---------------------------------------------------------------- nightly reminder

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : '' };
  }
  const title = payload.title || 'مکتب';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || 'کارهای امروزت را کامل کن.',
      tag: payload.tag || 'maktab',
      renotify: true,
      lang: 'fa',
      dir: 'rtl',
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
      data: { url: payload.url || './' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || './', self.registration.scope).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.startsWith(self.registration.scope) && 'focus' in client) return client.focus();
      }
      return self.clients.openWindow(target);
    }),
  );
});
