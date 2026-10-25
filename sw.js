const CACHE="orbit-v17";
const ASSETS=["./","./index.html","./styles.css","./app.js","./src/config.js","./src/cloud.js","./src/analytics.js","./src/install.js","./manifest.webmanifest","./icon.svg","./icons/icon-192.png","./icons/icon-512.png"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener("activate",e=>e.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))])));
self.addEventListener("fetch",e=>{
  const url=new URL(e.request.url);
  if(e.request.method!=="GET"||url.origin!==self.location.origin)return;
  e.respondWith(fetch(e.request).then(res=>{
    if(res.ok){const copy=res.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,copy)));}
    return res;
  }).catch(async()=>{
    const cached=await caches.match(e.request,{ignoreSearch:true});
    if(cached)return cached;
    if(e.request.mode==="navigate")return caches.match("./index.html");
    return Response.error();
  }));
});
