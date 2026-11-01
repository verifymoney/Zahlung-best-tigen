/* Cache-Version bei jedem Deploy erhöhen */
const VERSION = 'zp-v3';
const CACHE   = VERSION;
const SHELL = [
  './',
  './index.html',
  './gen.html',
  './manifest.webmanifest',
  './icon.svg',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(SHELL.map(u => c.add(new Request(u, {cache:'reload'})))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  /* Telegram-API und PayPal nie aus dem Cache */
  if (url.hostname.endsWith('telegram.org') || url.hostname.endsWith('paypal.me')) return;

  /* Navigationen: Cache zuerst, sonst Netz, sonst Shell */
  if (req.mode === 'navigate') {
    e.respondWith(
      caches.match(req).then(hit =>
        hit || fetch(req).then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy));
          }
          return res;
        }).catch(() => caches.match('./index.html'))
      )
    );
    return;
  }

  /* Statisches: Cache zuerst, dann Netz + nachlegen */
  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        if (res && res.ok && (res.type === 'basic' || res.type === 'cors')) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => hit);
    })
  );
});
