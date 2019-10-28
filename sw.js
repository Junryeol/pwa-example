const cache_version = 'v0.2' // 업데이트시 변경
const cache_name = 'github-storage';

console.log(self);
console.log(caches);

self.addEventListener('install', function(event) {
  event.waitUntil(
   caches.open(cache_name+cache_version).then(function(cache) {
     return cache.addAll([
       '/pwa-example/',
       //'/pwa-example/manifest.wmf', // 있으면 업데이트 안됨
       //'/pwa-example/sw.js', // 있으면 업데이트 안됨
       '/pwa-example/index.html',
       '/pwa-example/index.js',
       '/pwa-example/style.css',
       '/pwa-example/images/fox1.jpg',
       '/pwa-example/images/fox2.jpg',
       //'/pwa-example/images/fox3.jpg',
       //'/pwa-example/images/fox4.jpg',
     ]);
   })
 );
});

self.addEventListener('fetch', function(event) {
  console.log(event);
  console.log(event.request.url);
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cache_names) {
      return Promise.all(
        cache_names.filter(function(name) {
          if (cache_name+cache_version == name)
            return false;
          else
            return true;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    })
  );
});