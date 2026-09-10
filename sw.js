/* ================================================================
   VOTIFY PWA SERVICE WORKER — sw.js (V7 — PWA-optimized)
   Strategy: network-first for HTML (always fresh app),
             cache-first for static assets (fast load),
             no caching for Firebase/WebRTC (real-time data).
   This prevents the "slow installed app" problem by ensuring
   the main HTML always loads from network (not stale cache).
   ================================================================ */

var CACHE = 'votify-v7';
var START_URL = './';

/* ===== INSTALL: precache app shell ===== */
self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return c.addAll([START_URL]).catch(function(){});
    })
  );
});

/* ===== ACTIVATE: clean old caches ===== */
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

/* ===== FETCH: smart routing ===== */
self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);

  /* NEVER intercept cross-origin (Firebase, WebRTC, CDN) — let browser handle */
  if (url.origin !== self.location.origin) return;

  /* For the main HTML page: network-first (always get fresh app code).
     This is the key fix for PWA slowness — installed app always loads latest HTML. */
  if (req.mode === 'navigate' || (req.headers.get('accept') && req.headers.get('accept').indexOf('text/html') >= 0)) {
    e.respondWith(
      fetch(req).then(function(resp){
        if (resp && resp.status === 200) {
          var copy = resp.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); }).catch(function(){});
        }
        return resp;
      }).catch(function(){
        /* offline → serve cached HTML */
        return caches.match(req).then(function(cached){
          return cached || caches.match(START_URL);
        });
      })
    );
    return;
  }

  /* For same-origin static assets (JS, CSS, images): cache-first (fast) */
  e.respondWith(
    caches.match(req).then(function(cached){
      if (cached) return cached;
      return fetch(req).then(function(resp){
        if (resp && resp.status === 200 && resp.type === 'basic') {
          var copy = resp.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); }).catch(function(){});
        }
        return resp;
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
