const CACHE_VERSION = 'v2';  // ★ cámbialo a v3, v4, etc. en cada deploy importante
const CACHE_NAME = `architablox-${CACHE_VERSION}`;
const OFFLINE_URLS = ['/', '/login'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // ★ Navegación: network-first, fallback a cache si offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches
          .match('/')
          .then((r) => r || new Response('Offline', { status: 503 }))
      )
    );
    return;
  }

  // ★ JS/CSS de Next.js: NETWORK-FIRST (evita servir código viejo)
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icon') ||
    url.pathname.endsWith('.svg')
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }
});