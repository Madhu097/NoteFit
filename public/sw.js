const CACHE_NAME = "notfit-cache-v3";
const OFFLINE_URL = "/offline/";

const CORE_ASSETS = [
  "/",
  OFFLINE_URL,
  "/manifest.json",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-apple.png",
  "/icon-favicon.png"
];

// Install Event - Pre-cache core shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Pre-caching offline shell and assets");
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up stale caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("[Service Worker] Removing old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch Event - Intercept requests for offline caching
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Skip chrome-extension scheme and external APIs (Firebase Auth, Firestore writes, Webpack HMR)
  if (!url.protocol.startsWith("http")) return;
  if (
    url.hostname.includes("firestore.googleapis.com") ||
    url.hostname.includes("identitytoolkit.googleapis.com") ||
    url.hostname.includes("firebase") ||
    url.pathname.includes("/_next/webpack-hmr")
  ) {
    return;
  }

  // Navigation requests (HTML pages) - Network-first with cache/offline fallback
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If valid response, clone it and put in cache
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache, then to offline page
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            
            // Try matching offline page
            return caches.match(OFFLINE_URL).then((offlineResponse) => {
              if (offlineResponse) return offlineResponse;
              
              // Direct fallback if all else fails
              return new Response("Offline. Connection lost.", {
                status: 503,
                statusText: "Service Unavailable",
                headers: new Headers({ "Content-Type": "text/plain" })
              });
            });
          });
        })
    );
    return;
  }

  // Static assets (Next.js compiled assets, images, web fonts, CSS/JS files) - Cache-first with network fallback
  const isStaticAsset =
    url.pathname.includes("/_next/static/") ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff2?)$/);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Fallback generic cache-first/network-update strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return networkResponse;
      });

      if (cachedResponse) {
        // Return cached response immediately, update cache in the background.
        // Catch network errors to avoid unhandled rejection in console when offline.
        fetchPromise.catch(() => {});
        return cachedResponse;
      }

      // Return network fetch promise. If it fails, it rejects normally (network error).
      return fetchPromise;
    })
  );
});
