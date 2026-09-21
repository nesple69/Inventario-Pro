const CACHE_NAME = 'inventario-pro-v63';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js',
  'https://cdn.sheetjs.com/xlsx-0.19.2/package/dist/xlsx.full.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Caching essential assets');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Network-first for app code to always get immediate live updates
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate' || event.request.url.includes(location.origin)) {
    event.respondWith(
      fetch(event.request).then(fetchResponse => {
        if (fetchResponse && fetchResponse.status === 200) {
          const resClone = fetchResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
        }
        return fetchResponse;
      }).catch(() => caches.match(event.request).then(res => res || caches.match('./index.html')))
    );
    return;
  }

  // Cache-first for CDN/fonts
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(fetchResponse => {
        if (fetchResponse && fetchResponse.status === 200) {
          const resClone = fetchResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
        }
        return fetchResponse;
      });
    })
  );
});
