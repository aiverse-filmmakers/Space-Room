const scope=self.registration.scope;
const cacheName='scene-room-offline-v1';
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(cacheName);
  const page=await fetch(scope,{cache:'no-store'});
  if(!page.ok)return;
  const html=await page.clone().text();
  const paths=[scope,new URL('manifest.webmanifest',scope).href];
  for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){
   const u=new URL(match[1],scope);
   if(u.origin===location.origin&&u.pathname.startsWith(new URL(scope).pathname)&&/\.(js|css|svg|png)$/.test(u.pathname))paths.push(u.href);
  }
  await cache.addAll([...new Set(paths)]);
 })());
 self.skipWaiting();
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('scene-room-offline-')&&k!==cacheName).map(k=>caches.delete(k)));await self.clients.claim();})());
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==location.origin||!url.pathname.startsWith(new URL(scope).pathname)||url.pathname.includes('/api/'))return;
 event.respondWith((async()=>{
  const cache=await caches.open(cacheName);
  if(event.request.mode==='navigate'){
   try{const response=await fetch(event.request);if(response.ok)await cache.put(scope,response.clone());return response;}
   catch{return (await cache.match(scope))||Response.error();}
  }
  const stored=await cache.match(event.request);if(stored)return stored;
  const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response;
 })());
});