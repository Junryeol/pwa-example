const version = 'v0.1'
const cachename = 'github-storage'; // 업데이트시 변경

console.log(caches);

self.addEventListener('install', function(e) {
 e.waitUntil(
   caches.open(cachename+version).then(function(cache) {
     return cache.addAll([
       '/pwa-example/',
       //'/pwa-example/manifest.wmf', // 있으면 업데이트 안됨
       //'/pwa-example/sw.js', // 있으면 업데이트 안됨
       '/pwa-example/index.html',
       '/pwa-example/index.js',
       '/pwa-example/style.css',
       '/pwa-example/images/fox1.jpg',
       '/pwa-example/images/fox2.jpg',
       '/pwa-example/images/fox3.jpg',
       '/pwa-example/images/fox4.jpg'
     ]);
   })
 );
});

self.addEventListener('fetch', function(e) {
  console.log(e);
  console.log(e.request.url);
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});
