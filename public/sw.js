// HRM Pro — Service Worker (Offline Shell & Asset Caching)
const CACHE_NAME = 'hrm-pro-cache-v2.0.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/landing-theme.css',
  './js/security.js',
  './js/api.js',
  './js/i18n.js',
  './js/data.js',
  './js/taxEngine.js',
  './js/bankFormats.js',
  './js/notifications.js',
  './js/auth.js',
  './js/workflow.js',
  './js/workflow-engine.js',
  './js/websocket.js',
  './js/chat.js',
  './js/landing.js',
  './js/landingAgent.js',
  './js/trial.js',
  './js/app.js',
  './js/dashboard.js',
  './js/employees.js',
  './js/attendance.js',
  './js/leaves.js',
  './js/emailNotifier.js',
  './js/payroll.js',
  './js/company.js',
  './js/settlement.js',
  './js/performance.js',
  './js/recruitment.js',
  './js/events.js',
  './js/assets.js',
  './js/expenses.js',
  './js/helpdesk.js',
  './js/reports.js',
  './js/administration.js',
  './js/settings.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline shell assets');
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Purging legacy cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;
  // Don't intercept live API calls
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version but fetch update in background
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // Fallback to offline index.html if navigating
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
