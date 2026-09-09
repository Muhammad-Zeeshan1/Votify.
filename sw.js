/* ================================================================
   VOTIFY — sw.js (WORKING VERSION)
   Ye file index.html ke SAATH same folder me rakho
   ================================================================ */

const CACHE_NAME = 'votify-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

/* ===== INSTALL ===== */
self.addEventListener('install', function(event) {
  console.log('[SW] Install start...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[SW] Caching app shell...');
        return cache.addAll(APP_SHELL);
      })
      .then(function() {
        console.log('[SW] Cached OK');
        return self.skipWaiting();
      })
  );
});

/* ===== ACTIVATE ===== */
self.addEventListener('activate', function(event) {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(name) {
          if (name !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* ===== FETCH — Cache First, Network Fallback ===== */
self.addEventListener('fetch', function(event) {
  /* Skip non-GET */
  if (event.request.method !== 'GET') return;
  
  /* Firebase Realtime Database — always go to network */
  if (event.request.url.indexOf('firebasedatabase.app') !== -1) return;
  if (event.request.url.indexOf('firebaseio.com') !== -1) return;
  
  /* Everything else: Cache First → Network → Cache for next time */
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      /* Found in cache? Return instantly */
      if (cached) {
        return cached;
      }
      
      /* Not cached? Fetch from network */
      return fetch(event.request).then(function(response) {
        /* Invalid response? Just return it */
        if (!response || response.status !== 200) {
          return response;
        }
        
        /* Clone and save to cache */
        var responseClone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseClone);
        });
        
        return response;
      }).catch(function() {
        /* Offline + not cached = serve main page */
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
        return new Response('Offline', {status: 503});
      });
    })
  );
});

/* ===== PUSH NOTIFICATIONS ===== */
self.addEventListener('push', function(event) {
  var data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch(e) {
    data = {
      title: 'Votify',
      body: 'New notification!'
    };
  }
  
  var title = data.title || 'Votify';
  var options = {
    body: data.body || 'You have a new message!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'votify-' + Date.now(),
    vibrate: [70, 50, 70]
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/* ===== NOTIFICATION CLICK ===== */
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.indexOf(self.location.origin) !== -1) {
          return client.focus();
        }
      }
      return self.clients.openWindow('/');
    })
  );
});
