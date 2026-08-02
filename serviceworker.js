const CACHE_NAME = 'clock-v3';
const ASSETS = [
    './',
    './index.html',
    './index.js',
    './style.css',
    './jquery.js',
    './icon.png',
    './manifest.json'
];

self.addEventListener("install", e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener("activate", e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", e => {
    // CacheStorage only supports GET requests. Let POST and other methods
    // pass through untouched.
    if (e.request.method !== 'GET') return;

    // Network-first for successful GETs, cache as offline fallback.
    e.respondWith(
        fetch(e.request).then(response => {
            if (response.ok) {
                const clone = response.clone();
                e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone)));
            }
            return response;
        }).catch(() => caches.match(e.request))
    );
});
