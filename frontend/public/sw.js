/* Adawwa PWA service worker */
const CACHE = 'adawwa-shell-v2';
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './pwa-192x192.png',
  './pwa-512x512.png',
  './favicon-192x192.png',
  './apple-touch-icon.png',
];

async function precache() {
  const cache = await caches.open(CACHE);
  await Promise.all(
    PRECACHE.map(async (url) => {
      try {
        const res = await fetch(url, { cache: 'reload' });
        if (res.ok) await cache.put(url, res.clone());
      } catch {
        // skip failed assets — SW must still activate for installability
      }
    })
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          void caches.open(CACHE).then((cache) => cache.put('./index.html', copy));
          return res;
        })
        .catch(async () => {
          const cached = await caches.match('./index.html');
          return cached || Response.error();
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((res) => {
          if (
            res.ok &&
            (url.pathname.startsWith('/assets/') ||
              /\.(png|svg|ico|css|js|woff2|webmanifest)$/i.test(url.pathname))
          ) {
            const copy = res.clone();
            void caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return res;
        })
        .catch(() => cached || Response.error());
    })
  );
});
