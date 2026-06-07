const CACHE_NAME = "rozananews-v1";

// Only cache actual static assets - NOT navigation requests
// Angular handles all routing client-side via the router
const PRECACHE_ASSETS = [
  "/assets/googleNews.png",
  "/assets/icon-192x192.png",
  "/assets/icon-512x512.png",
];

// Install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Pre-caching static assets");
      // addAll fails silently if any asset 404s - use individual adds
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache
            .add(url)
            .catch((err) => console.warn("[SW] Could not cache:", url, err)),
        ),
      );
    }),
  );
  self.skipWaiting();
});

// Activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

// Fetch
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // NEVER intercept navigation requests
  // Angular Router handles all client-side navigation
  // Intercepting these was causing the infinite reload loop
  if (request.mode === "navigate") return;

  // Never intercept API calls
  if (url.pathname.startsWith("/api/")) return;

  // Never intercept non-GET requests
  if (request.method !== "GET") return;

  // Never intercept cross-origin requests
  if (url.origin !== location.origin) return;

  // Cache-first for static assets only (images, icons)
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|ico|woff|woff2|ttf)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches
                .open(CACHE_NAME)
                .then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached);
      }),
    );
  }
});

// Push Notifications (future)
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  self.registration.showNotification(data.title || "RozanaNews", {
    body: data.body || "Breaking news - tap to read",
    icon: "/assets/icon-192x192.png",
    badge: "/assets/icon-72x72.png",
    data: { url: data.url || "/" },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || "/"));
});
