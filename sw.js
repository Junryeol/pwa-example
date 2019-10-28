const cache_name = 'github-storage';
const cache_version = 'v0.2'; // NOTE: 업데이트시 변경

const root_directory = '/pwa-example';
const manifest_file_name = '/manifest.json';
const service_worker_file_name = '/sw.json';

const static_cache_files = [ // TODO: github 에서 목록 끌어오도록 변경
  '/',
  '/index.html',
  '/index.js',
  '/style.css',
  '/icon/fox-icon.png',
  '/images/fox1.jpg',
  '/images/fox2.jpg',
  '/images/fox3.jpg',
  '/images/fox4.jpg',
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
    }).then(function(){
      console.log('Install succeded');
    }).catch(function(){
      console.log('Install failed');
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
        return response || fetch(e.request); // NOTE: 다이나믹 캐싱 보안 이슈 존재 
      })
      .catch(error => {
        return caches.open(cache_name_with_version)
          .then(cache => {            
            let accept_header = event.request.headers.get('accept');

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

self.addEventListener('sync', function(event) {
  switch (event.tag) {
    case 'syncTest':
      console.log('syncTest syncTest');
      event.waitUntil(()=>{});
      break;
  }
  setTimeout(function(){
    self.registration.showNotification("Sync event fired!");  
  }, 3000);
});

addEventListener('message', (event) => {
  console.log(`The client sent me a message: ${event.data}`);
});