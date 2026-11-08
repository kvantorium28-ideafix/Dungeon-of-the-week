// чтобы сайт открывался без интернета
// после изменений поменять v= тут, в index.html и в импортах
const CACHE = 'danzh-v9';
const ASSETS = [
  '/', '/index.html', '/manifest.webmanifest',
  '/css/style.css?v=9', '/css/fonts.css',
  '/js/app.js?v=9', '/js/api.js?v=9', '/js/sprites.js?v=9', '/js/hero.js?v=9', '/js/scenery.js?v=9',
  '/js/trail.js?v=9', '/js/sound.js?v=9',
  '/icons/icon-192.png', '/icons/icon-512.png',
  '/fonts/tiny5-cyrillic-400-normal.woff2', '/fonts/tiny5-latin-400-normal.woff2',
  '/fonts/pt-sans-cyrillic-400-normal.woff2', '/fonts/pt-sans-cyrillic-700-normal.woff2',
  '/fonts/pt-sans-cyrillic-400-italic.woff2', '/fonts/pt-sans-latin-400-normal.woff2',
  '/fonts/pt-sans-latin-700-normal.woff2', '/fonts/pt-sans-latin-400-italic.woff2',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// сначала пробуем интернет, если его нет - берём из кэша
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.pathname.startsWith('/api/') || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('/index.html'))),
  );
});
