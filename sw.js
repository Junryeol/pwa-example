importScripts("/pwa-example/db.js");
importScripts("/pwa-example/github_back_API.js");

const cache_name = "github-storage";
const cache_version = "v0.2";

const root_directory = "/pwa-example";
const manifest_file_name = "/manifest.json";
const service_worker_file_name = "/sw.js";
const offline_file = "/offline.html";

const static_cache_files = [
  "/",
  "/index.html",
  "/login.html",
  "/index.js",
  "/style.css",
  "/db.js",
  "/github_back_API.js",
  "/github_front_API.js",
  "/icon/fox-icon.png"
]; // TODO: github 에서 목록 끌어오도록 변경

const static_cache_name = "static-" + cache_name;
const dynamic_cache_name = "dynamic-" + cache_name;
const cache_name_with_version = static_cache_name + cache_version;

if (static_cache_files.includes(manifest_file_name)) {
  static_cache_files.splice(static_cache_files.indexOf(manifest_file_name), 1);
}
if (static_cache_files.includes(service_worker_file_name)) {
  static_cache_files.splice(
    static_cache_files.indexOf(service_worker_file_name),
    1
  );
}
if (!static_cache_files.includes(offline_file)) {
  static_cache_files.push(offline_file);
}

for (let [index, value] of static_cache_files.entries()) {
  static_cache_files[index] = root_directory + value;
}

self.addEventListener("install", event => {
  console.log(static_cache_files)
  event.waitUntil(
    caches
      .open(cache_name_with_version)
      .then(cache => {
        return cache.addAll(static_cache_files);
      })
      .then(() => {
        console.log("Install succeded");
      })
      .catch(() => {
        console.log("Install failed");
      })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cache_names => {
      return Promise.all(
        cache_names
          .filter(name => {
            return !(
              cache_name_with_version == name || dynamic_cache_name == name
            );
          })
          .map(name => {
            return caches.delete(name);
          })
      );
    })
  );
});

self.addEventListener("fetch", event => {
  console.log(event.request.url);
  let url_parsed = event.request.url.split("/");
  console.log(url_parsed);
  event.respondWith(
    caches
      .match(event.request)
      .then(response => {
        let url_parsed = event.request.url.split("/");
        console.log(event.request.url);

        if (url_parsed.length > 4 && url_parsed[3] == "github") {
          console.log(22222)
          return githubBackAPI.fetchAPI(event.request);
        } else {
          console.log(33333)
          return response | fetch(event.request);
        }
      })
      .catch(error => {
        console.log(44444)
        return caches.open(cache_name_with_version).then(cache => {
          let accept_header = event.request.headers.get("accept");
          console.log(55555)

          if (accept_header.includes("text/html")) {
            return cache.match(offline_file);
          }
        });
      })
  );
});

self.addEventListener("sync", event => {
  github_back_API.backSync(event.tag).then(() => {
    console.log("notification message");
  });
});

self.addEventListener("message", event => {
  let data = event.data;
  github_back_API.auth(data.user_name,data.authorization);

  event.waitUntil(
    caches.keys().then(cache_names => {
      return Promise.all(
        cache_names
          .filter(name => {
            return !(cache_name_with_version == name);
          })
          .map(name => {
            return caches.delete(name);
          })
      );
    })
  );
});
