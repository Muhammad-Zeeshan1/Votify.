/* ============================================================
   Votify Grand Operation — service worker
   Update-safe strategy:
   - HTML navigation: NETWORK FIRST (a fresh deploy reaches every
     device instantly; cache is only a fallback for offline)
   - Local assets (icons, manifest): cache-first, refreshed in bg
   - CDN libraries (jsdelivr): network-first with cache fallback
   - CACHE_VERSION must be bumped on every deploy if you change
     anything that is cache-first.
   ============================================================ */
var CACHE_VERSION = 'votify-v1.1.0';
var APP_CACHE = 'votify-app-' + CACHE_VERSION;
var CDN_CACHE = 'votify-cdn-' + CACHE_VERSION;

var PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon-32.png',
  './favicon.svg',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './maskable-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(APP_CACHE)
      .then(function (c) { return c.addAll(PRECACHE); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (k) {
          if (k !== APP_CACHE && k !== CDN_CACHE) return caches.delete(k);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);

  // 1) App shell / navigations — network first, cache fallback
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') >= 0) {
    e.respondWith(
      fetch(req)
        .then(function (res) {
          var copy = res.clone();
          caches.open(APP_CACHE).then(function (c) { c.put('./index.html', copy); });
          return res;
        })
        .catch(function () {
          return caches.match(req).then(function (hit) {
            return hit || caches.match('./index.html');
          });
        })
    );
    return;
  }

  // 2) External CDN — network first, cache fallback (offline resilience)
  if (url.origin !== location.origin) {
    if (url.hostname.indexOf('jsdelivr.net') < 0 && url.hostname.indexOf('openai.com') < 0 &&
        url.hostname.indexOf('tmpfiles.org') < 0 && url.hostname.indexOf('catbox.moe') < 0) {
      return; // other third-party calls (APIs) go straight to network
    }
    e.respondWith(
      fetch(req)
        .then(function (res) {
          var copy = res.clone();
          caches.open(CDN_CACHE).then(function (c) { c.put(req, copy); });
          return res;
        })
        .catch(function () { return caches.match(req); })
    );
    return;
  }

  // 3) Same-origin assets — cache first, refresh in background
  e.respondWith(
    caches.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(APP_CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});
