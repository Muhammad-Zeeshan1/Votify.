/* sw.js — Votify PWA service worker v1.0.0 */
const VERSION='votify-v1.0.0';
const CACHE_APP='votify-app-'+VERSION;
const CACHE_RT='votify-runtime-'+VERSION;
const APP_SHELL=['./','./votify.html','https://unpkg.com/lucide@0.294.0/dist/umd/lucide.min.js'];
const NO_CACHE_HOSTS=['firebaseio.com','firebasedatabase.app','firebase.google.com','firebasestorage.googleapis.com','identitytoolkit.googleapis.com','securetoken.googleapis.com','wa.me','api.whatsapp.com'];
self.addEventListener('install',function(e){self.skipWaiting();e.waitUntil(caches.open(CACHE_APP).then(function(c){return Promise.allSettled(APP_SHELL.map(function(u){return c.add(u).catch(function(){});}));}));});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(keys){return Promise.all(keys.filter(function(k){return k.startsWith('votify-')&&k!==CACHE_APP&&k!==CACHE_RT;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));});
function shouldBypass(url){if(NO_CACHE_HOSTS.some(function(h){return url.hostname.indexOf(h)>=0;}))return true;if(url.protocol==='chrome-extension:'||url.protocol==='blob:')return true;return false;}
self.addEventListener('fetch',function(event){const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(shouldBypass(url))return;
  if(req.mode==='navigate'||req.destination==='document'){event.respondWith(fetch(req).then(function(r){if(r&&r.status===200){var c=r.clone();caches.open(CACHE_APP).then(function(c){c.put(req,c);}).catch(function(){});}return r;}).catch(function(){return caches.match(req).then(function(c){return c||caches.match('./votify.html')||caches.match('./');});}));return;}
  if(url.origin!==self.location.origin){event.respondWith(caches.match(req).then(function(c){if(c)return c;return fetch(req).then(function(r){if(r&&r.status===200&&(r.type==='basic'||r.type==='cors')){var cl=r.clone();caches.open(CACHE_RT).then(function(c){c.put(req,cl);}).catch(function(){});}return r;}).catch(function(){return caches.match(req);});}));return;}
  event.respondWith(caches.match(req).then(function(c){var fp=fetch(req).then(function(r){if(r&&r.status===200){var cl=r.clone();caches.open(CACHE_RT).then(function(c){c.put(req,cl);}).catch(function(){});}return r;}).catch(function(){return c;});return c||fp;}));});
self.addEventListener('message',function(e){if(e.data==='SKIP_WAITING')self.skipWaiting();if(e.data==='GET_VERSION'&&e.source)e.source.postMessage({type:'VERSION',version:VERSION});});
