const C='td-v2';
self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(C).then(c=>c.addAll(['./','./index.html'])));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  e.respondWith(
    fetch(e.request).then(n=>{
      const cl=n.clone();
      caches.open(C).then(c=>c.put(e.request,cl));
      return n;
    }).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html')))
  );
});
