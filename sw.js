// Mis entrenos · service worker
const VERSION = 'v8';
const PREFIX = 'misentrenos-';            // prefijo propio: no toca la caché de otras apps del mismo github.io
const CACHE = PREFIX + VERSION, IMGC = PREFIX + 'fotos';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icono-32.png', 'icono-192.png', 'icono-512.png', 'icono-180.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith(PREFIX) && k !== CACHE && k !== IMGC).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  // Fotos de ejercicios: se guardan la primera vez que se ven y luego funcionan sin conexión
  if (u.hostname === 'raw.githubusercontent.com') {
    e.respondWith(caches.open(IMGC).then(async c => {
      const hit = await c.match(e.request);
      if (hit) return hit;
      const r = await fetch(e.request);
      if (r.ok || r.type === 'opaque') c.put(e.request, r.clone());
      return r;
    }));
    return;
  }
  if (u.origin !== location.origin) return;
  // App: primero la red (para coger la última versión) y, si no hay conexión, la copia guardada
  e.respondWith(
    fetch(u.href, { cache:'no-cache' }).then(r => {
      if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch:true }).then(r => r || caches.match('index.html')))
  );
});
