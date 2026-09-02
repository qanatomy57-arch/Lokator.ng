// ============================================================================
// LOKATOR.NG — SERVICE WORKER (sw.js)
// Progressive Web App Offline Shell & Resilient Runtime Caching Engine
// ============================================================================

const CACHE_VERSION = 'lokator-v10.24';
const STATIC_CACHE = `lokator-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `lokator-runtime-${CACHE_VERSION}`;

// 1. APPLICATION SHELL ASSETS (Essential static bundle)
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/search.html',
  '/profile.html',
  '/register.html',
  '/login.html',
  '/dashboard.html',
  '/offline.html',
  '/manifest.json',
  '/style.css',
  '/search.css',
  '/profile.css',
  '/dashboard.css',
  '/pwa.css',
  '/app.js',
  '/search.js',
  '/profile.js',
  '/dashboard.js',
  '/locations.js',
  '/phone-utils.js',
  '/search-language.js',
  '/ai-service.js',
  '/categories.js',
  '/providers-data.js',
  '/supabase-client.js',
  '/telemetry.js',
  '/pwa-manager.js',
  '/pwa.js',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/hero/poster_01.jpg',
  '/hero/poster_02.jpg',
  '/hero/poster_03.jpg',
  '/hero/poster_04.jpg',
  '/hero/poster_05.jpg',
  '/hero/poster_06.jpg',
  '/hero/poster_07.jpg',
  '/hero/poster_08.jpg',
  '/hero/poster_09.jpg'
];

// 2. LIFECYCLE: INSTALL (Pre-cache static application shell)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(SHELL_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 3. LIFECYCLE: ACTIVATE (Purge obsolete cache versions)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE && key !== RUNTIME_CACHE) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 4. SECURITY & CACHE POLICY HELPERS
function isAuthOrPrivateRequest(url) {
  const urlStr = url.toString().toLowerCase();
  return (
    urlStr.includes('/auth/v1/') ||
    urlStr.includes('supabase.co/auth') ||
    urlStr.includes('verification-docs') ||
    urlStr.includes('mutation_outbox')
  );
}

function isStaticAsset(url) {
  const pathname = url.pathname.toLowerCase();
  return (
    pathname.endsWith('.css') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.ttf') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  );
}

// 5. FETCH INTERCEPTION & ROUTING STRATEGY
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests (mutations handled by IndexedDB outbox)
  if (request.method !== 'GET') {
    return;
  }

  // Strict Security: Never cache authentication or private credentials
  if (isAuthOrPrivateRequest(url)) {
    return;
  }

  // Strategy A: HTML Navigation requests -> Network-first with runtime cache & offline fallback
  if (request.mode === 'navigate' || (request.headers.get('accept') && request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offlinePage = await caches.match('/offline.html');
          return offlinePage || new Response('You are offline. Please reconnect to continue using Lokator.NG.', {
            headers: { 'Content-Type': 'text/plain' }
          });
        })
    );
    return;
  }

  // Strategy B: Static assets (CSS, JS, Icons, Fonts) -> Cache-first with Background Revalidate
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // Revalidate in background if online
          fetch(request).then((response) => {
            if (response && response.status === 200) {
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, response));
            }
          }).catch(() => {});
          return cached;
        }

        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // Strategy C: Public API / Data queries -> Network-first with Runtime cache fallback
  if (url.hostname.includes('supabase.co') && url.pathname.includes('/rest/v1/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(JSON.stringify({ data: [], offline: true, message: 'Offline cache unavailable' }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // Default fallback: Network fetch
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request);
    })
  );
});

// 6. CLIENT MESSAGING (Instant update activation)
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

