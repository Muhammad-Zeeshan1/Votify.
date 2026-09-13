/* ==================================================================
   VOTIFY PWA SERVICE WORKER — sw.js
   Version: 1.0.0  ·  Cache strategy:
     - HTML (app shell)      → network-first, fall back to cache
     - Static CDN assets     → cache-first (lucide icons, etc.)
     - Firebase / API calls  → network-only (NEVER cache)
     - Images (data:|https:) → runtime cache (lazy)
   ================================================================== */

const VERSION   = 'votify-v1.0.0';
const CACHE_APP = 'votify-app-' + VERSION;
const CACHE_RT  = 'votify-runtime-' + VERSION;

/* App shell — only the local HTML page; everything else is CDN/Firebase */
const APP_SHELL = [
  './',
  './votify.html',
  'https://unpkg.com/lucide@0.294.0/dist/umd/lucide.min.js'
];

/* Hosts that must NEVER be cached — Firebase realtime, auth, storage, etc. */
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

self.addEventListener('install', function(event){
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_APP).then(function(cache){
      /* Use addAll but tolerate failures (CDN may be unreachable offline) */
      return Promise.allSettled(APP_SHELL.map(function(u){
        return cache.add(u).catch(function(){/* ignore individual failures */});
      }));
    })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){
          /* Delete any old cache that doesn't match the current version */
          return k.startsWith('votify-') && k!==CACHE_APP && k!==CACHE_RT;
        }).map(function(k){return caches.delete(k);})
      );
    }).then(function(){
      return self.clients.claim();
    })
  );
});

/* Helper — should we bypass caching entirely for this URL? */
function shouldBypass(url){
  /* Firebase / WhatsApp / API endpoints — never cache */
  if(NO_CACHE_HOSTS.some(function(h){return url.hostname.indexOf(h)>=0;}))return true;
  /* Don't cache non-GET */
  /* Don't cache chrome-extension or blob URLs */
  if(url.protocol==='chrome-extension:'||url.protocol==='blob:')return true;
  return false;
}

self.addEventListener('fetch', function(event){
  const req = event.request;
  /* Only handle GET — let POST/PUT/OPTIONS go straight to network */
  if(req.method !== 'GET')return;

  const url = new URL(req.url);

  /* Bypass: Firebase realtime, auth, storage, WhatsApp, etc. */
  if(shouldBypass(url))return;

  /* ---------- HTML (app shell) — network-first ---------- */
  if(req.mode === 'navigate' || (req.destination === 'document')){
    event.respondWith(
      fetch(req).then(function(resp){
        /* Cache the fresh copy */
        if(resp && resp.status === 200){
          var clone = resp.clone();
          caches.open(CACHE_APP).then(function(c){c.put(req, clone);}).catch(function(){});
        }
        return resp;
      }).catch(function(){
        /* Offline — serve cached app shell */
        return caches.match(req).then(function(cached){
          return cached || caches.match('./votify.html') || caches.match('./');
        });
      })
    );
    return;
  }

  /* ---------- Static CDN assets (lucide, fonts) — cache-first ---------- */
  if(url.origin !== self.location.origin){
    event.respondWith(
      caches.match(req).then(function(cached){
        if(cached)return cached;
        return fetch(req).then(function(resp){
          if(resp && resp.status === 200 && resp.type === 'basic' || (resp && resp.type === 'cors')){
            var clone = resp.clone();
            caches.open(CACHE_RT).then(function(c){c.put(req, clone);}).catch(function(){});
          }
          return resp;
        }).catch(function(){return caches.match(req);});
      })
    );
    return;
  }

  /* ---------- Same-origin static — stale-while-revalidate ---------- */
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

/* ---------- MESSAGE HANDLER — for forced updates from the page ---------- */
self.addEventListener('message', function(event){
  if(event.data === 'SKIP_WAITING')self.skipWaiting();
  if(event.data === 'GET_VERSION'){
    event.source.postMessage({type:'VERSION', version:VERSION});
  }
});
