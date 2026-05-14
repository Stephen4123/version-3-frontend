const CACHE_NAME = 'jeevajyothi-cache-v20260430';
const urlsToCache = [
  '/assets/css/styles.css?v=20260430',
  '/assets/js/main.js?v=20260430',
  '/assets/js/loader.js?v=20260430',
  '/assets/images/placeholder.svg?v=20260430',
  '/assets/images/logo.png?v=20260430',
  '/data/posts.json?v=20260430',
  '/data/site.json?v=20260430',
  '/data/navigators.json?v=20260430'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const acceptHeader = request.headers.get('accept') || '';

  if (request.mode === 'navigate' || acceptHeader.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match(request).then((cachedResponse) => cachedResponse || caches.match('/index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((response) => response || fetch(request))
  );
});


