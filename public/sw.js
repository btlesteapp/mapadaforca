const CACHE_NAME = 'mapa-da-forca-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/assets/index.js',
  '/assets/index.css',
  '/assets/purify.es.js',
  '/assets/index.es.js',
  '/assets/html2canvas.js'
];

// Install Event - cache core static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Add a cache-busting query parameter so it skips HTTP cache
      const requests = ASSETS_TO_CACHE.map(url => new Request(url + '?v=' + new Date().getTime(), { cache: 'reload' }));
      
      return Promise.all(
        requests.map(req => fetch(req).then(response => {
          if (!response.ok) throw new Error('Fetch failed: ' + req.url);
          // Store it in cache under the ORIGINAL url (without the query string)
          const originalUrl = req.url.split('?')[0];
          return cache.put(originalUrl, response);
        }))
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network first, falling back to cache
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and same-origin or document requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If valid response, clone and cache it
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline: try to serve from cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If a page/document request and not cached, return index.html
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/index.html');
          }
        });
      })
  );
});
