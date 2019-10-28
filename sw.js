const cache_name = 'github-storage';
const cache_version = 'v0.2'; // 업데이트시 변경

const root_directory = '/pwa-example';
const manifest_file_name = '/manifest.json';
const service_worker_file_name = '/sw.json';

const static_cache_files = [
  '/',
  '/index.html',
  '/index.js',
  '/style.css',
  '/icon/fox-icon.png',
  '/images/fox1.jpg',
  '/images/fox2.jpg',
  //'/images/fox3.jpg',
  //'/images/fox4.jpg',
];

const offline_files = {
  html: '/offline.html',
  json: '/offline.json',
  txt: '/offline.txt',
  img: '/offline.png',
}

const static_cache_name = 'static-' + cache_name;
const dynamic_cache_name = 'dynamic-' + cache_name;
const cache_name_with_version = static_cache_name + cache_version;

if(static_cache_files.includes(manifest_file_name)){
  static_cache_files.splice(static_cache_files.indexOf(manifest_file_name), 1);
}
if(static_cache_files.includes(service_worker_file_name)){
  static_cache_files.splice(static_cache_files.indexOf(service_worker_file_name), 1);
}

for (let [index, value] of static_cache_files.entries()){
  static_cache_files[index] = root_directory + value
}
for (let key in offline_files) {
  offline_files[key] = root_directory + offline_files[key];
}

self.addEventListener('install', function(event) {
  event.waitUntil(
   caches.open(cache_name_with_version).then(function(cache) {
     return cache.addAll(static_cache_files);
   })
 );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cache_names) {
      return Promise.all(
        cache_names.filter(function(name) {
          if (cache_name_with_version == name)
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

self.addEventListener('fetch', function(event) {
  console.log(event.request.url);
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        } else {
          return fetch(event.request.clone())
            .then(response => {
              if (response) {
                caches.open(dynamic_cache_name)
                  .then(cache => {
                    cache.put(event.request, response.clone());
                  });
              }
              return response;
            });  
        }
      })
      .catch(error => { // cache fetch 에러 발생시
        return caches.open(cache_name_with_version)
          .then(cache => {            
            // 들어온 요청의 Accept 헤더
            let accept_header = event.request.headers.get('accept');

            //Accept 헤더가 text/html 을 포함하고 있다면 (페이지 요청이라면)
            if (accept_header.includes('text/html')) {
              return cache.match(offline_files.html);
            } else if (accept_header.includes('application/json')) {
              return cache.match(offline_files.json);
            } else if (accept_header.includes('image/png') || accept_header.includes('image/jpeg')) {
              return cache.match(offline_files.img);
            } else {
              return cache.match(offline_files.txt);
            }
          })          
      })
  );
});