/* TEST SUBJECT — Service Worker v9.5 */
const CACHE = 'ts-09-v9.5';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './js/units.js',
  './js/minigames.js',
  './js/documents.js',
  './js/questions.js',
  './js/supervisor.js',
  './js/cards.js',
  './js/contingency.js',
  './audio/SUPERVISOR.mp3',
  './audio/SUPERVISORHORROR.mp3',
  './js/app.js',
  './audio/TEST.mp3',
  './audio/TESTHORROR.mp3',
  './icons/favicon-16.png',
  './icons/favicon-32.png',
  './icons/icon-48.png',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-144.png',
  './icons/icon-152.png',
  './icons/icon-192.png',
  './icons/icon-384.png',
  './icons/icon-512.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network-first for HTML/JS (actualizaciones en PC), cache-first para audio/iconos
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isAppShell =
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('manifest.json');

  if (e.request.method !== 'GET') return;

  if (isAppShell) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match('./index.html')))
    );
  }
});
