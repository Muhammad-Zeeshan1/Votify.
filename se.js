/* ==================================================================
   VOTIFY 3.0 — sw.js (SERVICE WORKER)
   ------------------------------------------------------------------
   HOW TO ADD:
   1. In your GitHub repo, create a file named "sw.js" in the SAME
      folder as index.html (the repo root).
   2. Paste this entire code inside it. Commit changes.

   WHAT THIS FILE DOES:
   - Makes the app installable (home-screen icon on any Android)
   - Generates the app icon + manifest automatically (no image files)
   - Enables offline caching (app shell loads without internet)
   - Handles notification taps (opens the app at the right chat)
   - Lets the app show system notifications while in background
   ================================================================== */

const CACHE_NAME = 'votify-v3';

/* The app root URL (the folder where this sw.js file lives) */
const APP_ROOT = new URL('./', self.location.href).href;

/* ---------- WEB APP MANIFEST (auto-served by this worker) ---------- */
const MANIFEST = {
  name: 'Votify — Opinion Arena',
  short_name: 'Votify',
  description: 'Every opinion starts a war — voting battles, chat & games',
  start_url: APP_ROOT + '?source=pwa',
  scope: APP_ROOT,
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#06070D',
  theme_color: '#6366F1',
  icons: [
    { src: new URL('app-icon-192.png', self.location.href).pathname, sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: new URL('app-icon-512.png', self.location.href).pathname, sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: new URL('app-icon-512.png', self.location.href).pathname, sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ]
};

/* ---------- APP ICON GENERATOR (purple V logo — no files needed) ---------- */
async function makeIcon(size) {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d');
  /* purple gradient background */
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#6366F1');
  grad.addColorStop(1, '#A855F7');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  /* soft highlight circle */
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.arc(size * 0.22, size * 0.16, size * 0.55, 0, 7);
  ctx.fill();
  /* white "V" */
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold ' + Math.round(size * 0.6) + 'px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('V', size / 2, size * 0.55);
  const blob = await canvas.convertToBlob({ type: 'image/png' });
  return new Response(blob, {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'max-age=86400' }
  });
}

/* ---------- INSTALL / ACTIVATE ---------- */
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add('./').catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ---------- FETCH HANDLER (required for install eligibility) ---------- */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; /* never touch writes — Firebase goes direct */

  const url = new URL(req.url);

  /* 1) Serve the app manifest */
  if (url.pathname.endsWith('manifest.json')) {
    event.respondWith(new Response(JSON.stringify(MANIFEST), {
      headers: { 'Content-Type': 'application/manifest+json' }
    }));
    return;
  }

  /* 2) Serve generated icons */
  if (url.pathname.endsWith('app-icon-192.png')) { event.respondWith(makeIcon(192)); return; }
  if (url.pathname.endsWith('app-icon-512.png')) { event.respondWith(makeIcon(512)); return; }

  /* 3) Firebase / APIs → network only (realtime data must stay fresh) */
  if (url.hostname.indexOf('firebasedatabase.app') >= 0 ||
      url.hostname.indexOf('firebaseio.com') >= 0 ||
      url.hostname.indexOf('googleapis.com') >= 0) {
    return;
  }

  /* 4) Everything else → network first, cache fallback (offline app shell) */
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok && url.origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((m) => m || caches.match('./')))
  );
});

/* ---------- NOTIFICATIONS ---------- */

/* The page asks this worker to show a notification (app in background) */
self.addEventListener('message', (event) => {
  const d = event.data || {};
  if (d.type === 'SHOW_NOTIFICATION' && d.title) {
    const opt = {
      body: d.body || '',
      tag: d.tag || 'votify',
      data: d.data || {}
    };
    if (d.icon) opt.icon = d.icon;
    self.registration.showNotification(d.title, opt);
  }
  if (d.type === 'SKIP_WAITING') self.skipWaiting();
});

/* Notification tap → focus the app and route to the right chat */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      /* find an already-open Votify window */
      for (let i = 0; i < list.length; i++) {
        const win = list[i];
        if (win.url && win.url.indexOf(self.registration.scope) === 0) {
          win.focus();
          /* tell the app which chat to open */
          if (data.chat) win.postMessage({ chat: data.chat, uid: data.uid || null });
          return;
        }
      }
      /* no window open → launch the app */
      return self.clients.openWindow(self.registration.scope);
    })
  );
});
