/* ================================================================
   VOTIFY PWA SERVICE WORKER — sw.js
   Version: 6.0
   Created by: Muhammad Zeeshan
   ================================================================
   This file MUST be uploaded alongside votify.html on your hosting
   (GitHub Pages, Netlify, Vercel, or any HTTPS host).
   
   Upload both files to the SAME folder:
   - votify.html  (the app)
   - sw.js        (this file — for PWA install + offline support)
   - manifest.json (optional — the app has an embedded manifest,
                    but a real file works better for some browsers)
   
   After uploading, open the https:// link in Chrome (Android/desktop)
   or Safari (iOS) → tap Install → app lands on home screen.
   ================================================================ */

var CACHE = 'votify-v6';
var START_URL = './';

/* ===== INSTALL: precache the app shell ===== */
self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      /* cache the main app shell + this SW */
      return c.addAll([START_URL, './sw.js']).catch(function(){});
    })
  );
});

/* ===== ACTIVATE: clean old caches, claim clients ===== */
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function(){
      return self.clients.claim();
    })
  );
});

/* ===== FETCH: serve from cache when offline (with network-first for freshness) ===== */
self.addEventListener('fetch', function(e){
  var req = e.request;
  
  /* only handle GET requests */
  if (req.method !== 'GET') return;
  
  var url = new URL(req.url);
  
  /* NEVER cache cross-origin requests (Firebase, WebRTC, external APIs) */
  if (url.origin !== self.location.origin) return;
  
  /* never cache API routes */
  if (url.pathname.indexOf('/api/') === 0) return;
  
  /* For same-origin GET requests: try network first, fall back to cache */
  e.respondWith(
    fetch(req).then(function(resp){
      /* if we got a valid response, cache a copy for offline use */
      if (resp && resp.status === 200 && resp.type === 'basic') {
        var copy = resp.clone();
        caches.open(CACHE).then(function(c){
          c.put(req, copy);
        }).catch(function(){});
      }
      return resp;
    }).catch(function(){
      /* network failed → try cache */
      return caches.match(req).then(function(cached){
        if (cached) return cached;
        /* if nothing in cache and we're offline, return the cached app shell */
        return caches.match(START_URL);
      });
    })
  );
});

/* ===== MESSAGE: allow page to trigger skipWaiting ===== */
self.addEventListener('message', function(e){
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/* ===== PUSH notifications (optional — for future use) ===== */
self.addEventListener('push', function(e){
  if (!e.data) return;
  try {
    var data = e.data.json();
    e.waitUntil(
      self.registration.showNotification(data.title || 'Votify', {
        body: data.body || '',
        icon: data.icon || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" fill="%236366F1"/><text x="96" y="130" font-family="Arial" font-size="110" font-weight="bold" fill="white" text-anchor="middle">V</text></svg>',
        badge: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="%236366F1"/><text x="48" y="65" font-family="Arial" font-size="55" font-weight="bold" fill="white" text-anchor="middle">V</text></svg>',
        vibrate: [80, 60, 80],
        tag: data.tag || 'votify',
        data: data.url || '/'
      })
    );
  } catch (err) {
    /* fallback: plain text payload */
    e.waitUntil(
      self.registration.showNotification('Votify', {
        body: e.data.text(),
        icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" fill="%236366F1"/><text x="96" y="130" font-family="Arial" font-size="110" font-weight="bold" fill="white" text-anchor="middle">V</text></svg>'
      })
    );
  }
});

/* ===== NOTIFICATION CLICK: open the app ===== */
self.addEventListener('notificationclick', function(e){
  e.notification.close();
  var targetUrl = (e.notification && e.notification.data) || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList){
      /* focus existing window if open */
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      /* otherwise open a new window */
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
