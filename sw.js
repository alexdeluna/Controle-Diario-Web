const CACHE_NAME = 'controle-diario-v7';

const FILES_TO_CACHE = [
  './',
  './index.html',
  './visual.css',
  './app.js',
  './manifest.json'
];

// Instala
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Ativa
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch
self.addEventListener("fetch", (event) => {

  const url = new URL(event.request.url);

  // NÃO interceptar Firebase/Auth/Google
  if (
    url.origin.includes("firebase") ||
    url.origin.includes("googleapis") ||
    url.origin.includes("gstatic")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );

});
