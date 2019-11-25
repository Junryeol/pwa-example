
//importScripts("./githubAPIadvance.js");
//importScripts("./fs.js");
//importScripts("./db.js");
//importScripts("./crypto.js");


const cache_name = 'github-storage';
const cache_version = 'v0.2';

const root_directory = '/pwa-example';
const manifest_file_name = '/manifest.json';
const service_worker_file_name = '/sw.json';

const offline_files = {
  html: '/offline.html',
  json: '/offline.json',
  txt: '/offline.txt',
  img: '/offline.png',
}

const static_cache_files = ['/',
'/index.html',
'/index.js',
'/github/auth',
'/style.css',
'/db.js',
'/githubAPIadvance.js',
'/icon/fox-icon.png',
]; // TODO: github 에서 목록 끌어오도록 변경

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

self.addEventListener('install', (event) =>{
  event.waitUntil(
    caches.open(cache_name_with_version).then((cache) =>{
      return cache.addAll(static_cache_files);
    }).then(()=>{
      console.log('Install succeded');
    }).catch(()=>{
      console.log('Install failed');
    })
  );
});

self.addEventListener('activate', (event) =>{
  event.waitUntil(
    caches.keys().then((cache_names)=> {
      return Promise.all(
        cache_names.filter((name)=> {
          return !(cache_name_with_version == name || dynamic_cache_name == name);
        }).map((name) =>{
          return caches.delete(name);
        })
      );
    })
  );
});

self.addEventListener('fetch', (event)=> {
  console.log(event.request.url);
  let url_parsed = event.request.url.split('/');
  console.log(url_parsed);
  event.respondWith(
    caches.match(event.request)
      .then((response)=> {
        let url_parsed = event.request.url.split('/');
        console.log(event.request.url)
        
        if (response){
          return response;
        } else if (url_parsed[1]=='github'){
          if (url_parsed[2]=='auth') {
            event.request.url = "https://api.github.com/user";
            return fetch(e.request);
          } else if (url_parsed[2]=='repos'){
            event.request.url = github.get(event.request.url);

            return caches.open(dynamic_cache_name)
              .then(cache => {
                cache.put(event.request.url, res.clone());
                return res;
              });
          }
        } else {
          return fetch(e.request);
        }
      }).catch(offline)
  );
});

self.addEventListener('sync', (event)=> {
  let argv = JSON.parse(event.tag);
  let [method, key] = argv;
  
  switch (method) {
    case 'syncTest':
      console.log('syncTest syncTest');
      event.waitUntil(()=>{});
      break;
  }
});

self.addEventListener('message', (event) => {
  switch (event.data.message){
    case 'AuthOut':
      event.waitUntil(
        caches.keys().then((cache_names)=> {
          return Promise.all(
            cache_names.filter((name)=> {
              return !(cache_name_with_version == name);
            }).map((name) =>{
              return caches.delete(name);
            })
          );
        })
      );      
      break;
  }
  console.log(`The client sent me a message: ${event.data}`);
});

function offline(error){
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
  });        
}