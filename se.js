/* ==================================================================
   VOTIFY 3.0 — sw.js (Service Worker)
   PWA Install + Offline Support + Push Notifications
   Place this file in the SAME folder as index.html
   ================================================================== */

const CACHE_NAME = 'votify-v3-1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@0.294.0/dist/umd/lucide.min.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js',
  'https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'
];

/* ===== INSTALL — cache all resources ===== */
self.addEventListener('install', function(event) {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[SW] Caching files...');
        return cache.addAll(urlsToCache.map(url => new Request(url, {mode: 'cors'})));
      })
      .catch(function(err) {
        /* if any URL fails, still install with what we have */
        console.log('[SW] Some URLs failed to cache, continuing...', err);
        return caches.open(CACHE_NAME);
      })
  );
  /* activate immediately */
  self.skipWaiting();
});

/* ===== ACTIVATE — clean old caches ===== */
self.addEventListener('activate', function(event) {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

/* ===== FETCH — serve from cache, fallback to network ===== */
self.addEventListener('fetch', function(event) {
  /* skip non-GET requests */
  if (event.request.method !== 'GET') return;
  
  /* Firebase Realtime DB — always go to network */
  if (event.request.url.includes('firebasedatabase.app') || 
      event.request.url.includes('firebaseio.com')) {
    return;
  }
  
  /* DiceBear avatars — network first, cache fallback */
  if (event.request.url.includes('api.dicebear.com')) {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          if (response.ok) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(function() {
          return caches.match(event.request);
        })
    );
    return;
  }

  /* Everything else — cache first, then network */
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        /* found in cache — return instantly */
        if (response) {
          return response;
        }
        
        /* not in cache — fetch from network */
        return fetch(event.request)
          .then(function(response) {
            /* check if valid response */
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            /* clone and cache for next time */
            var responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(function() {
            /* offline and not in cache — serve offline page for HTML */
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
            /* otherwise just fail silently */
            return new Response('', {status: 404, statusText: 'Offline'});
          });
      })
  );
});

/* ===== PUSH NOTIFICATIONS ===== */
self.addEventListener('push', function(event) {
  console.log('[SW] Push received:', event);
  
  var data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch(e) {
    data = { title: 'Votify', body: event.data ? event.data.text() : 'New notification' };
  }
  
  var title = data.title || 'Votify';
  var options = {
    body: data.body || 'You have a new notification!',
    icon: data.icon || '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'votify-' + Date.now(),
    data: data.data || {},
    vibrate: [70, 50, 70],
    requireInteraction: false,
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'close', title: 'Dismiss' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/* ===== NOTIFICATION CLICK — open/focus the app ===== */
self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'close') return;
  
  /* route to specific chat if data.chat is present */
  var chatData = event.notification.data;
  var url = '/';
  
  if (chatData && chatData.chat) {
    if (chatData.chat === 'dm' && chatData.uid) {
      url = '/#chat-dm=' + chatData.uid;
    } else if (chatData.chat === 'wc') {
      url = '/#chat';
    }
  }
  
  event.waitUntil(
    self.clients.matchAll({ 
      type: 'window',
      includeUncontrolled: true 
    })
    .then(function(clientList) {
      /* if app is already open, focus it */
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.includes(self.location.origin)) {
          /* send message to route */
          client.postMessage({ 
            type: 'NAVIGATE',
            chat: chatData ? chatData.chat : null,
            uid: chatData ? chatData.uid : null
          });
          return client.focus();
        }
      }
      /* app not open — open it */
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

/* ===== MESSAGE from main app ===== */
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CACHE_URL') {
    caches.open(CACHE_NAME).then(function(cache) {
      cache.add(event.data.url);
    });
  }
});

/* ===== PERIODIC SYNC (optional) ===== */
self.addEventListener('periodicsync', function(event) {
  if (event.tag === 'votify-sync') {
    event.waitUntil(
      /* refresh cache in background */
      caches.open(CACHE_NAME).then(function(cache) {
        return cache.addAll(urlsToCache);
      })
    );
  }
});
