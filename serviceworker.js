const CACHE_NAME = 'clock-v1';
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
    // version.json: network-first so live updates are detected
    if (e.request.url.includes('version.json')) {
        e.respondWith(
            fetch(e.request).catch(() => caches.match(e.request))
        );
        return;
    }
    // all other assets: cache-first with network fallback
    e.respondWith(
        caches.match(e.request).then(cached => cached || fetch(e.request))
    );
});
