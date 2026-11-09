// IAF Tracker - Offline-first Service Worker (v4)
const CACHE = 'iaf-tracker-v4';
const LOCAL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];
const REMOTE = ['https://cdn.tailwindcss.com'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Ek file na mile to bhi install fail na ho
    await Promise.all(LOCAL.map(u => cache.add(u).catch(() => {})));
    await Promise.all(REMOTE.map(u =>
      fetch(new Request(u, { mode: 'no-cors' })).then(r => cache.put(u, r)).catch(() => {})
    ));
  })());
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

function fetchWithTimeout(req, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    fetch(req).then(r => { clearTimeout(t); resolve(r); }, err => { clearTimeout(t); reject(err); });
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'generativelanguage.googleapis.com') return;

  // Page (HTML): pehle internet se fresh lo (4 sec), na mile to offline copy
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const res = await fetchWithTimeout(new Request(req, { cache: 'no-cache' }), 4000);
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      } catch (err) {
        return (await cache.match(req)) || (await cache.match('./index.html')) || (await cache.match('./')) || Response.error();
      }
    })());
    return;
  }

  // Baaki files (icons, tailwind, fonts): cache-first + background update
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(req);
      const network = fetch(req)
        .then(res => { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; })
        .catch(() => null);
      if (cached) { e.waitUntil(network); return cached; }
      return (await network) || Response.error();
    })
  );
});
