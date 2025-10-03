// service worker — PUSH-81 (app shell)
const CACHE='push81-v2';
const ASSETS=['./','./index.html','./app.js','./readme.html','./README.md','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./audio/move.wav','./audio/push.wav','./audio/win.wav','./audio/undo.wav','./audio/reset.wav'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE&&caches.delete(k))))) });
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))});
