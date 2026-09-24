/* ==================================================================
   VOTIFY GOLDEN — SERVICE WORKER
   Offline support + installability for GitHub Pages / any static host.
   ================================================================== */
const CACHE = "votify-golden-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./maskable-512.png",
  "./apple-touch-icon.png",
  "./favicon-32.png",
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(ASSETS);
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (k) {
            return k !== CACHE;
          })
          .map(function (k) {
            return caches.delete(k);
          })
      );
    })
  );
});

self.addEventListener("message", function (e) {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);

  /* Firebase + CDNs always go straight to the network (live data) */
  if (
    url.hostname.indexOf("firebaseio") !== -1 ||
    url.hostname.indexOf("firebasedatabase") !== -1 ||
    url.hostname.indexOf("gstatic") !== -1 ||
    url.hostname.indexOf("googleapis") !== -1 ||
    url.hostname.indexOf("somafm") !== -1
  ) {
    return;
  }

  /* App shell: network first, cache fallback (so updates land fast) */
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then(function (res) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) {
            c.put("./index.html", copy);
          });
          return res;
        })
        .catch(function () {
          return caches.match("./index.html");
        })
    );
    return;
  }

  /* Everything else: cache first, network fallback */
  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req)
        .then(function (res) {
          if (res.ok && (url.origin === location.origin || url.hostname.indexOf("fonts") !== -1)) {
            var copy = res.clone();
            caches.open(CACHE).then(function (c) {
              c.put(req, copy);
            });
          }
          return res;
        })
        .catch(function () {
          return hit;
        });
    })
  );
});
