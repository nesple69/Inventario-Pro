const CACHE_NAME = 'inventario-pro-v28';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js',
  'https://unpkg.com/xlsx/dist/xlsx.full.min.js'
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

self.addEventListener('fetch', event => {
  // Ignora richieste non-GET (es. PATCH, POST, DELETE verso Supabase)
  if (event.request.method !== 'GET') {
    return;
  }

  // Network-First per codice applicativo (HTML, JS, CSS) per avere sempre gli ultimi aggiornamenti
  const isAppCode = event.request.mode === 'navigate' ||
                    event.request.url.includes('index.html') ||
                    event.request.url.includes('app.js') ||
                    event.request.url.includes('styles.css');

  if (isAppCode) {
    event.respondWith(
      fetch(event.request).then(fetchResponse => {
        if (fetchResponse && fetchResponse.status === 200) {
          const clone = fetchResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return fetchResponse;
      }).catch(() => {
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
    );
    return;
  }

  // Cache-First per librerie CDN e asset pesanti
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(fetchResponse => {
        if (event.request.url.includes(location.origin) ||
          event.request.url.includes('cdnjs.cloudflare.com') ||
          event.request.url.includes('cdn.jsdelivr.net') ||
          event.request.url.includes('fonts.googleapis.com') ||
          event.request.url.includes('unpkg.com')) {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        }
        return fetchResponse;
      });
    })
  );
});
