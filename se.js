/* ==================================================================
   sw.js — VOTIFY SERVICE WORKER  (REQUIRED for mobile app install)
   HOW TO ADD: Create a new file named "sw.js" in the SAME folder
   as index.html on GitHub Pages. Paste this code inside it. Save.
   Without this file, Chrome will NOT show the install option.
   ================================================================== */

const CACHE_NAME = 'votify-cache-v1';

/* App root URL (the folder where this sw.js file lives) */
const APP_URL = new URL('./', self.location.href).href;

/* Web app manifest — served automatically by this service worker */
const MANIFEST = {
  name: 'Votify — Opinion Arena',
  short_name: 'Votify',
  description: 'Every opinion starts a war — voting battles, chat & games',
  start_url: APP_URL + '?source=pwa',
  scope: APP_URL,
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

/* Install immediately and take control of open pages */
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(['./']).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

/* ---------- App icon generator (no image files needed) ---------- */
async function makeIcon(size) {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#6366F1');
  grad.addColorStop(1, '#A855F7');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.arc(size * 0.2, size * 0.15, size * 0.5, 0, 7);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold ' + Math.round(size * 0.6) + 'px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('V', size / 2, size * 0.55);
  const blob = await canvas.convertToBlob({ type: 'image/png' });
  return new Response(blob, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'max-age=86400' } });
}

/* ---------- Fetch handler (this is what Chrome requires) ---------- */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  /* 1) Serve the app manifest */
  if (url.pathname.endsWith('manifest.json')) {
    event.respondWith(new Response(JSON.stringify(MANIFEST), {
      headers: { 'Content-Type': 'application/manifest+json' }
    }));
    return;
  }

  /* 2) Serve app icons (generated on the fly — purple V logo) */
  if (url.pathname.endsWith('app-icon-192.png')) { event.respondWith(makeIcon(192)); return; }
  if (url.pathname.endsWith('app-icon-512.png')) { event.respondWith(makeIcon(512)); return; }

  /* 3) Everything else: network first, cache fallback (offline support) */
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
