/* ==================================================================
   VOTIFY PWA SERVICE WORKER — sw.js  (Advanced v2.0)
   Features:
     ✓ App shell pre-cache (votify.html, sw.js, manifest.json, icons)
     ✓ Network-first for HTML (always fresh when online)
     ✓ Cache-first for CDN assets (lucide, tailwind, fonts)
     ✓ Stale-while-revalidate for same-origin static
     ✓ Bypass Firebase / WhatsApp / Google APIs entirely
     ✓ Offline fallback page when network fails
     ✓ Auto cleanup of old caches on version bump
     ✓ Skip-waiting for instant updates
     ✓ Push notification handler
     ✓ Notification click handler (opens the app)
     ✓ Background sync stub (for future outgoing queue)
   ================================================================== */

const VERSION    = 'votify-v2.0.0';
const CACHE_APP  = 'votify-app-'  + VERSION;
const CACHE_RT   = 'votify-rt-'   + VERSION;
const CACHE_OFFLINE = 'votify-offline-' + VERSION;

/* App shell — local files only (everything else is CDN/Firebase) */
const APP_SHELL = [
  './',
  './votify.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './favicon-32.png',
  './offline.html'
];

/* External CDN assets we want to cache (best-effort) */
const CDN_ASSETS = [
  'https://unpkg.com/lucide@0.294.0/dist/umd/lucide.min.js',
  'https://cdn.tailwindcss.com'
];

/* Hosts that MUST NEVER be cached (Firebase realtime / auth / storage / WhatsApp) */
const NO_CACHE_HOSTS = [
  'firebaseio.com',
  'firebasedatabase.app',
  'firebase.google.com',
  'firebasestorage.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'wa.me',
  'api.whatsapp.com'
];

/* ---------- INSTALL: pre-cache app shell ---------- */
self.addEventListener('install', function(event){
  self.skipWaiting(); /* activate immediately */
  event.waitUntil(
    caches.open(CACHE_APP).then(function(cache){
      /* addAll tolerates individual failures via Promise.allSettled */
      return Promise.allSettled(
        APP_SHELL.map(function(u){
          return cache.add(u).catch(function(){/* ignore */});
        })
      );
    }).then(function(){
      /* Also pre-cache CDN assets best-effort */
      return caches.open(CACHE_RT).then(function(cache){
        return Promise.allSettled(CDN_ASSETS.map(function(u){
          return cache.add(u).catch(function(){/* ignore */});
        }));
      });
    })
  );
});

/* ---------- ACTIVATE: clean up old caches, take control ---------- */
self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){
          /* Delete any cache that belongs to an older version */
          return k.startsWith('votify-') && k!==CACHE_APP && k!==CACHE_RT && k!==CACHE_OFFLINE;
        }).map(function(k){return caches.delete(k);})
      );
    }).then(function(){
      return self.clients.claim();
    })
  );
});

/* ---------- Helpers ---------- */
function shouldBypass(url){
  if(NO_CACHE_HOSTS.some(function(h){return url.hostname.indexOf(h)>=0;}))return true;
  if(url.protocol==='chrome-extension:'||url.protocol==='blob:')return true;
  return false;
}

/* ---------- FETCH: routing strategies ---------- */
self.addEventListener('fetch', function(event){
  const req = event.request;
  if(req.method !== 'GET')return;
  const url = new URL(req.url);

  /* Bypass Firebase / WhatsApp / APIs entirely */
  if(shouldBypass(url))return;

  /* 1. HTML / Navigation — network-first, fall back to cache + offline page */
  if(req.mode === 'navigate' || req.destination === 'document'){
    event.respondWith(
      fetch(req).then(function(resp){
        if(resp && resp.status === 200){
          var clone = resp.clone();
          caches.open(CACHE_APP).then(function(c){c.put(req, clone);}).catch(function(){});
        }
        return resp;
      }).catch(function(){
        /* Offline — try cache, then offline fallback page */
        return caches.match(req).then(function(cached){
          return cached || caches.match('./votify.html') || caches.match('./') ||
                 caches.match('./offline.html');
        });
      })
    );
    return;
  }

  /* 2. Cross-origin CDN — cache-first, then fetch & cache */
  if(url.origin !== self.location.origin){
    event.respondWith(
      caches.match(req).then(function(cached){
        if(cached)return cached;
        return fetch(req).then(function(resp){
          if(resp && (resp.status === 200) && (resp.type === 'cors' || resp.type === 'basic')){
            var clone = resp.clone();
            caches.open(CACHE_RT).then(function(c){c.put(req, clone);}).catch(function(){});
          }
          return resp;
        }).catch(function(){return caches.match(req);});
      })
    );
    return;
  }

  /* 3. Same-origin static (icons, images, css) — stale-while-revalidate */
  event.respondWith(
    caches.match(req).then(function(cached){
      var fetchPromise = fetch(req).then(function(resp){
        if(resp && resp.status === 200){
          var clone = resp.clone();
          caches.open(CACHE_RT).then(function(c){c.put(req, clone);}).catch(function(){});
        }
        return resp;
      }).catch(function(){return cached;});
      return cached || fetchPromise;
    })
  );
});

/* ---------- MESSAGE: skip waiting + version ping ---------- */
self.addEventListener('message', function(event){
  if(event.data === 'SKIP_WAITING')self.skipWaiting();
  if(event.data === 'GET_VERSION' && event.source){
    event.source.postMessage({type:'VERSION', version:VERSION});
  }
  /* Force refresh all open clients */
  if(event.data === 'FORCE_REFRESH' && event.source){
    self.clients.matchAll({type:'window'}).then(function(clients){
      clients.forEach(function(c){c.postMessage({type:'FORCE_REFRESH'});});
    });
  }
});

/* ---------- PUSH notifications (future use) ---------- */
self.addEventListener('push', function(event){
  var data = {};
  try{data = event.data ? event.data.json() : {};}catch(e){data = {title:event.data&&event.data.text()};}
  var title = data.title || 'Votify';
  var options = {
    body: data.body || 'New update',
    icon: data.icon || 'icon-192.png',
    badge: data.badge || 'icon-192.png',
    tag: data.tag || 'votify-' + Date.now(),
    data: data.data || {url:'./votify.html'},
    vibrate: [80, 40, 80]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

/* ---------- Notification click — focus/open the app ---------- */
self.addEventListener('notificationclick', function(event){
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({type:'window'}).then(function(clientList){
      /* If a client is already open, focus it; otherwise open new */
      for(var i=0; i<clientList.length; i++){
        var c = clientList[i];
        if(c.url.indexOf('votify')>=0 && 'focus' in c){
          return c.focus();
        }
      }
      if(self.clients.openWindow){
        return self.clients.openWindow(event.notification.data && event.notification.data.url || './votify.html');
      }
    })
  );
});

/* ---------- Background Sync (stub — future outgoing message queue) ---------- */
self.addEventListener('sync', function(event){
  if(event.tag === 'votify-outbox'){
    /* Future: flush pending messages from IndexedDB when connection restored */
    event.waitUntil(Promise.resolve());
  }
});

/* ---------- Periodic Sync (rare, experimental — for background polls) ---------- */
self.addEventListener('periodicsync', function(event){
  if(event.tag === 'votify-refresh'){
    event.waitUntil(
      caches.open(CACHE_APP).then(function(c){
        return c.addAll(['./votify.html']).catch(function(){});
      })
    );
  }
});
