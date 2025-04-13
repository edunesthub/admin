// sw.js - Updated on 2025-04-13
const CACHE_NAME = 'chawp-admin-v5';
const urlsToCache = [
    '/',
    '/index.html',
    '/login.html',
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=SF+Pro+Display:wght@300;500;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install event - Cache core assets
self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .catch(err => console.error('[SW] Caching failed:', err))
    );
});

// Activate event - Clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames =>
            Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            )
        ).then(() => self.clients.claim())
    );
});

// Fetch event - Serve cache or network, skip Firebase auth
self.addEventListener('fetch', event => {
    const url = event.request.url;
    // Bypass caching for Firebase and Firestore requests
    if (url.includes('firebase') || url.includes('firestore.googleapis.com')) {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then(networkRes => {
                    if (!networkRes.ok) {
                        return networkRes;
                    }
                    if (event.request.method === 'GET') {
                        return caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, networkRes.clone());
                            return networkRes;
                        });
                    }
                    return networkRes;
                });
            })
            .catch(() => caches.match('/index.html'))
    );
});