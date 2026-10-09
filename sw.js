/* Service Worker: hält die App komplett offline verfügbar. */
// Version 1.9.3 – diese Zeile bei jedem Update mit version.js erhöhen (Browser prüfen sw.js immer frisch)
importScripts('version.js');
const CACHE = `karteikarten-ap2-${self.APP_VERSION}`;
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './version.js',
  './manifest.webmanifest',
  './deck/ap2.txt',
  './icons/app-icon-v2-64.png',
  './icons/app-icon-v2-192.png',
  './icons/app-icon-v2-512.png',
  './icons/app-icon-v2-maskable-512.png',
  './icons/app-icon-v2-apple-180.png',
];

self.addEventListener('install', (e) => {
  // cache: 'reload' umgeht den HTTP-Cache – sonst könnten alte Dateien im neuen Cache landen
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache zuerst (sofort & offline), im Hintergrund aktualisieren
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isNav = req.mode === 'navigate';
  const key = isNav ? './index.html' : req;

  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(key, { ignoreSearch: isNav });
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) cache.put(key, res.clone());
          return res;
        })
        .catch(() => null);
      if (cached) {
        e.waitUntil(network);
        return cached;
      }
      const res = await network;
      return res || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    })
  );
});
