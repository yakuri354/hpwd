const CACHE_NAME = 'hpwd-cache';

// Add whichever assets you want to pre-cache here:
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/index.css',
  '/index.js',
  '/dist/fonts/opensans.ttf',
  '/dist/fonts/ptmono.ttf',
  '/dist/fonts/spacemono.ttf',
  '/dist/copy.svg',
  '/dist/done.svg',
  '/dist/favicon.ico',
  '/dist/fonts.css',
  '/dist/hide.svg',
  '/dist/show.svg',
  '/dist/output.css',
  '/dist/android-chrome-192x192.png',
  '/dist/android-chrome-512x512.png',
  '/dist/apple-touch-icon.png',
  '/dist/favicon-16x16.png',
  '/dist/favicon-32x32.png',
  '/site.webmanifest',
  '/dist/argon2.js',
  '/dist/argon2mod.js',
  '/dist/argon2.wasm',
]

// Listener for the install event - pre-caches our assets list on service worker install.
self.addEventListener('install', event => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        cache.addAll(PRECACHE_ASSETS);
    })());
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Prevent the default, and handle the request ourselves.
  if (!(
     event.request.url.startsWith('http:') || event.request.url.startsWith('https:')
  )) {
      return; 
  }
  event.respondWith(
    (async () => {
      // Try to get the response from a cache.
      const cachedResponse = await caches.match(event.request);
      // Return it if we found one.
      if (cachedResponse) return cachedResponse;
      // If we didn't find a match in the cache, use the network.
      console.log("Fetching " + event.request.url);
      return fetch(event.request);
    })()
  );
});

