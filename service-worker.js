// service worker — PUSH-81 v6
const VERSION = 'v6';
const CACHE = `push81-${VERSION}`;

// App shell: i file indispensabili
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './readme.html',
  './README.md',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './audio/move.wav',
  './audio/push.wav',
  './audio/win.wav',
  './audio/undo.wav',
  './audio/reset.wav'
];

// Install → precache + skipWaiting
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate → pulizia cache vecchie + clients.claim
self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k !== CACHE ? caches.delete(k) : null)));
      await self.clients.claim();
    })()
  );
});

// Fetch → navigazioni con fallback offline + SWR per asset
self.addEventListener('fetch', (e) => {
  const req = e.request;

  // Navigazioni (offline → index.html)
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Per altri asset → stale-while-revalidate
  e.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((res) => {
        if (res && res.status === 200) {
          caches.open(CACHE).then((c) => c.put(req, res.clone()));
        }
        return res;
      }).catch(() => cached); // se offline torna cache
      return cached || fetchPromise;
    })
  );
});
